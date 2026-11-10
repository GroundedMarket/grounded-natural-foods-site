/* Portal and public UI for deli counter ordering.
   The case grid stays in app.js. This file fills the public grouped list,
   the Manage catalog, Toast import, and the pickup order saved in `orders`. */
var deliSlip = [];
var deliDraft = null;
var deliCheckout = null;
var deliImportPending = null;
var deliManageSearch = "";
var deliSeedInFlight = false;
var deliSeedFailed = false;
var deliLoadGaveUp = false;
var deliLoadTimer = null;

function deliPreviewEnabled() {
  var host = location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return false;
  return /(?:^|[?&])deliPreview=1(?:&|$)/.test(location.search);
}

function deliThreshold() {
  var raw = db.deliCounter && db.deliCounter.outOfStockAtLbs;
  if (raw == null || raw === "") return DeliCounter.DEFAULT_THRESHOLD;
  return DeliCounter.normalizeLbs(raw);
}

function deliItemsById() {
  var map = {};
  (db.meatCheeseItems || []).forEach(function (item) {
    map[item.id] = item;
  });
  return map;
}

function deliFind(id) {
  return (db.meatCheeseItems || []).filter(function (item) { return item.id === id; })[0] || null;
}

function deliOnlineLabel(item) {
  if (!item || item.catalog !== "counter") return "";
  if (item.discontinued || DeliCounter.availabilityOf(item) === "discontinued") return "discontinued";
  if (DeliCounter.isOrderable(item, deliThreshold())) {
    return "online " + DeliCounter.formatWeight(item.lbsOnHand) + " lb";
  }
  return "online out";
}

function deliPublicPhase() {
  if (window.__deliPreview) return "ready";
  if (typeof publicSectionStatus !== "function") return "loading";
  var status = publicSectionStatus(["meatCheeseItems"]);
  if (status === "loading" && deliLoadGaveUp) return "error";
  return status;
}

function deliWatchLoad() {
  if (deliLoadTimer || deliLoadGaveUp || window.__deliPreview) return;
  deliLoadTimer = setTimeout(function () {
    if (deliPublicPhase() === "loading") {
      deliLoadGaveUp = true;
      if (typeof renderMeatCheesePublic === "function") renderMeatCheesePublic();
    }
  }, 12000);
}

function deliPriceLabel(item) {
  var price = item.pricePerLb != null && item.pricePerLb !== "" ? item.pricePerLb : item.price;
  if (price == null || price === "") return "In stock";
  var amount = typeof price === "number" ? price.toFixed(2) : String(price).replace(/^\$/, "");
  return "$" + amount + "/lb · In stock";
}

function deliTileHTML(item) {
  var open = item.catalog === "counter"
    ? "deliOpenItem('" + item.id + "')"
    : "openMeatCheeseOrderModal('" + item.id + "')";
  var selected = deliDraft && deliDraft.itemId === item.id ? " is-on" : "";
  return '<button type="button" class="mc-public-tile mc-cat-' + item.category + selected + '" onclick="' + open + '">' +
    '<span class="mc-tile-emoji">' + escHtml(item.emoji || (item.category === "meat" ? "🥩" : "🧀")) + "</span>" +
    '<span class="mc-public-tile-info"><strong>' + escHtml(item.displayName || item.name) + "</strong>" +
    '<span class="mc-public-tile-sub">' + escHtml(deliPriceLabel(item)) + "</span></span></button>";
}

function deliGroupBlockHTML(label, items) {
  if (!items.length) return "";
  var head = label ? '<h3 class="mc-group-head">' + escHtml(label) + "</h3>" : "";
  return head + items.map(deliTileHTML).join("");
}

function deliRenderSlip() {
  var el = document.getElementById("deli-slip");
  if (!el) return;
  if (!deliSlip.length) {
    el.innerHTML = "";
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  el.innerHTML = '<div class="deli-slip"><h3 class="mc-group-head">Your slip</h3>' +
    deliSlip.map(function (line, index) {
      var item = deliFind(line.itemId);
      var name = item ? item.displayName || item.name : "Item";
      var style = (DeliCounter.SLICE_STYLES.filter(function (s) { return s.id === line.sliceStyle; })[0] || {}).label || "";
      return '<div class="deli-slip-line"><span>' + escHtml(DeliCounter.formatWeight(line.weightLbs) + " lb " + style + " — " + name) +
        "</span><button type=\"button\" class=\"btn small danger\" onclick=\"deliRemoveSlip(" + index + ")\">✕</button></div>";
    }).join("") +
    '<button type="button" class="btn" onclick="deliOpenCheckout()">Checkout · pay at pickup</button></div>';
}

function deliRenderPublicLists() {
  var phase = deliPublicPhase();
  if (phase === "loading") deliWatchLoad();
  ["meats", "cheeses"].forEach(function (plural) {
    var el = document.getElementById("mc-public-" + plural);
    if (!el) return;
    if (phase === "loading") {
      el.innerHTML = marketLoadingHTML("Loading Meats & Cheese");
      return;
    }
    if (phase === "error") {
      el.innerHTML = marketErrorHTML("Couldn't load meats and cheese. Check your connection and refresh.");
      return;
    }
    var grouped = DeliCounter.groupCatalog(db.meatCheeseItems || [], deliThreshold(), { publicOnly: true });
    var html = plural === "meats"
      ? grouped.meats.map(function (group) { return deliGroupBlockHTML(group.label, group.items); }).join("")
      : grouped.cheeses.map(deliTileHTML).join("");
    el.innerHTML = html || '<p class="empty-note">Nothing available right now.</p>';
  });
  deliRenderSlip();
}

function deliRemoveSlip(index) {
  deliCaptureDialog();
  deliSlip.splice(index, 1);
  deliRenderSlip();
  if (document.getElementById("deli-editor") || document.querySelector(".deli-order-list")) deliRenderOrderDialog();
}

function deliRequestedFor(itemId, extra) {
  var total = Number(extra) || 0;
  deliSlip.forEach(function (line) {
    if (line.itemId === itemId) total += Number(line.weightLbs) || 0;
  });
  return DeliCounter.normalizeLbs(total);
}

function deliSlipProblems() {
  var totals = {};
  deliSlip.forEach(function (line) {
    totals[line.itemId] = DeliCounter.normalizeLbs((totals[line.itemId] || 0) + (Number(line.weightLbs) || 0));
  });
  var problems = [];
  Object.keys(totals).forEach(function (id) {
    var item = deliFind(id);
    if (!item) return;
    var message = DeliCounter.stockMessage(item.lbsOnHand, totals[id]);
    if (message) problems.push({ id: id, name: item.displayName || item.name, message: message });
  });
  return problems;
}

function deliEnsureCheckout() {
  if (deliCheckout) return;
  var account = null;
  if (typeof localCustomerSession !== "undefined" && localCustomerSession && typeof loadCustomerAccounts === "function") {
    account = loadCustomerAccounts()[localCustomerSession.phone] || null;
  }
  var dates = DeliCounter.pickupDates(new Date(), db.closedDates || [], 21);
  deliCheckout = {
    name: account && account.name ? account.name : "",
    phone: typeof localCustomerSession !== "undefined" && localCustomerSession ? localCustomerSession.phone : "",
    date: dates[0] || "",
    time: "",
    notes: "",
  };
}

function deliCaptureDialog() {
  if (document.getElementById("deli-name")) deliReadCheckout();
  var weight = document.getElementById("deli-weight-input");
  var note = document.getElementById("deli-line-note");
  if (deliDraft && weight) deliDraft.weightLbs = weight.value;
  if (deliDraft && note) deliDraft.note = note.value;
}

function deliDraftMessage() {
  if (!deliDraft) return "";
  var item = deliFind(deliDraft.itemId);
  if (!item) return "";
  var weight = Number(deliDraft.weightLbs);
  if (!isFinite(weight) || weight <= 0) return "";
  return DeliCounter.stockMessage(item.lbsOnHand, deliRequestedFor(item.id, weight));
}

function deliDraftCanAdd() {
  if (!deliDraft) return false;
  var weight = Number(deliDraft.weightLbs);
  if (!isFinite(weight) || weight <= 0) return false;
  return !deliDraftMessage();
}

function deliEditorHTML() {
  var draft = deliDraft;
  if (!draft) return "";
  var item = deliFind(draft.itemId);
  if (!item) return "";
  var message = deliDraftMessage();
  var catClass = "mc-cat-" + item.category;
  var quick = [0.25, 0.5, 0.75, 1];
  var remainder = DeliCounter.normalizeLbs(item.lbsOnHand);
  if (remainder > 0 && remainder < 0.25 && quick.indexOf(remainder) === -1) quick.unshift(remainder);
  return '<div class="deli-editor" id="deli-editor">' +
    "<h3>" + escHtml(item.displayName || item.name) + "</h3>" +
    '<p class="mc-public-tile-sub">' + escHtml(deliPriceLabel(item)) + "</p>" +
    '<div class="field"><label>Amount (lb)</label><div class="deli-weight-row">' +
    quick.map(function (weight) {
      var on = Math.abs(Number(draft.weightLbs) - weight) < 1e-9 ? " is-on" : "";
      return '<button type="button" class="deli-weight-chip' + on + '" onclick="deliPickWeight(' + weight + ')">' +
        escHtml(DeliCounter.formatWeight(weight)) + " lb</button>";
    }).join("") +
    '</div><input type="number" id="deli-weight-input" min="0" step="0.25" value="' +
    escHtmlAttr(draft.weightLbs === "" || draft.weightLbs == null ? "" : String(draft.weightLbs)) +
    '" oninput="deliWeightTyped(this.value)"></div>' +
    (message ? '<p class="deli-stock-error" id="deli-stock-error">' + escHtml(message) + "</p>" : '<p class="deli-stock-error" id="deli-stock-error" hidden></p>') +
    '<div class="field"><label>Slice</label><div class="mc-slice-grid">' +
    DeliCounter.SLICE_STYLES.map(function (style) {
      var on = draft.sliceStyle === style.id ? " is-on" : "";
      return '<button type="button" class="mc-slice-btn' + on + '" onclick="deliPickSlice(\'' + style.id + '\')">' +
        mcSliceIconHTML(style.id, catClass) + "<span>" + escHtml(style.label) + "</span></button>";
    }).join("") + "</div></div>" +
    '<div class="field"><label>Note for this item</label><input type="text" id="deli-line-note" maxlength="140" value="' +
    escHtmlAttr(draft.note || "") + '" placeholder="Optional"></div>' +
    '<button type="button" class="btn" id="deli-add-line" onclick="deliAddDraft()"' + (deliDraftCanAdd() ? "" : " disabled") + ">Add to order</button></div>";
}

function deliSummaryHTML() {
  if (!deliSlip.length) return "";
  var problems = deliSlipProblems();
  var problemById = {};
  problems.forEach(function (problem) { problemById[problem.id] = problem.message; });
  return '<div class="deli-slip"><h3 class="mc-group-head">Your order</h3>' +
    deliSlip.map(function (line, index) {
      var item = deliFind(line.itemId);
      var name = item ? item.displayName || item.name : "Item";
      var style = (DeliCounter.SLICE_STYLES.filter(function (s) { return s.id === line.sliceStyle; })[0] || {}).label || "";
      var error = problemById[line.itemId]
        ? '<p class="deli-stock-error">' + escHtml(problemById[line.itemId]) + "</p>"
        : "";
      return '<div class="deli-slip-line"><span>' + escHtml(DeliCounter.formatWeight(line.weightLbs) + " lb " + style + " — " + name) +
        '</span><button type="button" class="btn small danger" onclick="deliRemoveSlip(' + index + ')">✕</button></div>' + error;
    }).join("") + "</div>";
}

function deliCheckoutHTML() {
  if (!deliSlip.length) return "";
  deliEnsureCheckout();
  var state = deliCheckout;
  var now = new Date();
  var closed = db.closedDates || [];
  var dates = DeliCounter.pickupDates(now, closed, 21);
  if (state.date && dates.indexOf(state.date) === -1) state.date = dates[0] || "";
  var times = state.date ? DeliCounter.pickupTimes(state.date, now, closed) : [];
  if (state.time && times.indexOf(state.time) === -1) state.time = times[0] || "";
  var blocked = deliSlipProblems().length > 0;
  return '<div class="deli-checkout"><h3 class="mc-group-head">Pickup details</h3>' +
    '<p class="mc-public-intro">No payment here. You pay at the counter. Hours are Mon–Fri 9–4 and Sat 9–2.</p>' +
    '<div class="field"><label>Name</label><input type="text" id="deli-name" value="' + escHtmlAttr(state.name) + '" oninput="deliCheckout.name=this.value"></div>' +
    '<div class="field"><label>Phone</label><input type="tel" id="deli-phone" value="' + escHtmlAttr(state.phone) + '" oninput="deliCheckout.phone=this.value"></div>' +
    '<div class="field"><label>Pickup date</label><select id="deli-date" onchange="deliCheckoutDate(this.value)">' +
    (dates.length ? dates.map(function (iso) {
      return '<option value="' + iso + '"' + (iso === state.date ? " selected" : "") + ">" + iso + "</option>";
    }).join("") : '<option value="">No open days</option>') + "</select></div>" +
    '<div class="field"><label>Pickup time</label><select id="deli-time" onchange="deliCheckout.time=this.value">' +
    times.map(function (time) {
      return '<option value="' + time + '"' + (time === state.time ? " selected" : "") + ">" +
        escHtml(formatTime12hr(time)) + "</option>";
    }).join("") + "</select></div>" +
    '<div class="field"><label>Note for the counter</label><textarea id="deli-order-note" maxlength="300" oninput="deliCheckout.notes=this.value">' +
    escHtml(state.notes || "") + "</textarea></div>" +
    '<button type="button" class="btn" id="deli-place-btn" onclick="deliSubmitOrder()"' + (blocked ? " disabled" : "") + ">Place pickup order</button></div>";
}

function deliRenderOrderDialog() {
  var phase = deliPublicPhase();
  if (phase === "loading") {
    openModal("<h3>Order Meat &amp; Cheese</h3>" + marketLoadingHTML("Loading Meats & Cheese") +
      '<div class="modal-actions"><button class="btn outline" onclick="closeModal()">Close</button></div>');
    return;
  }
  if (phase === "error") {
    openModal("<h3>Order Meat &amp; Cheese</h3>" + marketErrorHTML("Couldn't load meats and cheese. Check your connection and refresh.") +
      '<div class="modal-actions"><button class="btn outline" onclick="closeModal()">Close</button></div>');
    return;
  }
  deliEnsureCheckout();
  var grouped = DeliCounter.groupCatalog(db.meatCheeseItems || [], deliThreshold(), { publicOnly: true });
  var meatHtml = grouped.meats.map(function (group) {
    return deliGroupBlockHTML(group.label, group.items);
  }).join("");
  var cheeseHtml = grouped.cheeses.length
    ? '<h3 class="mc-group-head">Cheese</h3>' + grouped.cheeses.map(deliTileHTML).join("")
    : "";
  openModal('<h3>Order Meat &amp; Cheese</h3>' +
    '<p class="deli-next-hint">Tap an item to add it. Then enter a weight, and your name and pickup time.</p>' +
    deliEditorHTML() +
    deliSummaryHTML() +
    deliCheckoutHTML() +
    '<div class="mc-public-list deli-order-list">' + (meatHtml + cheeseHtml || '<p class="empty-note">Nothing available right now.</p>') + "</div>" +
    '<div class="modal-actions"><button class="btn outline" onclick="deliDraft=null;closeModal()">Close</button></div>');
  var editor = document.getElementById("deli-editor");
  if (editor && editor.scrollIntoView) editor.scrollIntoView({ block: "nearest" });
}

function deliOpenGroupedPicker() {
  deliDraft = null;
  deliEnsureCheckout();
  deliRenderOrderDialog();
}

function deliOpenItem(id) {
  var item = deliFind(id);
  if (!item) return;
  deliCaptureDialog();
  deliEnsureCheckout();
  var sameItem = deliDraft && deliDraft.itemId === id;
  var starting = DeliCounter.defaultOrderWeight(item.lbsOnHand, deliRequestedFor(id, 0));
  deliDraft = {
    itemId: id,
    weightLbs: starting == null ? "" : starting,
    sliceStyle: sameItem ? deliDraft.sliceStyle : "medium",
    note: sameItem ? deliDraft.note : "",
  };
  deliRenderOrderDialog();
}

function deliPickWeight(weight) {
  if (!deliDraft) return;
  deliCaptureDialog();
  deliDraft.weightLbs = weight;
  deliRenderOrderDialog();
}

function deliWeightTyped(value) {
  if (!deliDraft) return;
  deliDraft.weightLbs = value;
  var message = deliDraftMessage();
  var el = document.getElementById("deli-stock-error");
  if (el) {
    el.hidden = !message;
    el.textContent = message;
  }
  var add = document.getElementById("deli-add-line");
  if (add) add.disabled = !deliDraftCanAdd();
}

function deliPickSlice(styleId) {
  if (!deliDraft) return;
  deliCaptureDialog();
  deliDraft.sliceStyle = styleId;
  deliRenderOrderDialog();
}

function deliAddDraft() {
  deliCaptureDialog();
  if (!deliDraft) return;
  if (!deliDraftCanAdd()) return;
  if (deliSlip.length >= 8) {
    alert("An online deli order can have up to 8 items. Call the store for a larger order.");
    return;
  }
  deliSlip.push({
    itemId: deliDraft.itemId,
    weightLbs: Number(deliDraft.weightLbs),
    sliceStyle: deliDraft.sliceStyle,
    note: deliDraft.note || "",
  });
  deliDraft = null;
  deliRenderOrderDialog();
  deliRenderSlip();
}

function deliReadCheckout() {
  if (!deliCheckout) deliCheckout = {};
  var name = document.getElementById("deli-name");
  var phone = document.getElementById("deli-phone");
  var date = document.getElementById("deli-date");
  var time = document.getElementById("deli-time");
  var notes = document.getElementById("deli-order-note");
  if (name) deliCheckout.name = name.value;
  if (phone) deliCheckout.phone = phone.value;
  if (date) deliCheckout.date = date.value;
  if (time) deliCheckout.time = time.value;
  if (notes) deliCheckout.notes = notes.value;
}

function deliCheckoutDate(iso) {
  deliCaptureDialog();
  deliCheckout.date = iso;
  deliCheckout.time = "";
  deliRenderOrderDialog();
}

function deliOpenCheckout() {
  if (!deliSlip.length) return;
  deliEnsureCheckout();
  deliRenderOrderDialog();
}

function deliShowConfirmation(order) {
  openModal('<div style="text-align:center;padding:8px 0"><h3>You\'re on the list</h3>' +
    "<p>We'll have " + escHtml(order.customerName) + "'s order ready " + escHtml(order.pickupDate) +
    " at " + escHtml(formatTime12hr(order.pickupTime)) + ". Pay at the counter when you pick it up.</p>" +
    '<div class="modal-actions" style="justify-content:center"><button class="btn" onclick="closeModal()">Sounds good</button></div></div>');
}

function deliSubmitOrder() {
  deliReadCheckout();
  var built = DeliCounter.buildOrder({
    customerName: deliCheckout.name,
    customerPhone: deliCheckout.phone,
    pickupDate: deliCheckout.date,
    pickupTime: deliCheckout.time,
    notes: deliCheckout.notes,
    now: new Date(),
    closedDates: db.closedDates || [],
    threshold: deliThreshold(),
    itemsById: deliItemsById(),
    lines: deliSlip.map(function (line) {
      return {
        itemId: line.itemId,
        weightLbs: line.weightLbs,
        sliceStyle: line.sliceStyle,
        note: line.note,
        lineId: newId("li"),
      };
    }),
  });
  if (!built.ok) {
    var stockText = deliSlipProblems().map(function (problem) { return problem.message; }).join(" ");
    alert(stockText || built.error);
    deliRenderOrderDialog();
    return;
  }
  var closureMessage = "";
  if (typeof StoreClosures !== "undefined" && typeof storeClosureRecords === "function") {
    closureMessage = StoreClosures.closurePickupMessage(built.order.pickupDate, storeClosureRecords());
  }
  if (closureMessage) {
    alert(closureMessage);
    return;
  }
  if (window.__deliPreview) {
    built.order.id = "preview-" + Date.now();
    db.orders.push(built.order);
    deliSlip = [];
    deliShowConfirmation(built.order);
    deliRenderSlip();
    return;
  }
  var id = newId("o");
  var btn = document.getElementById("deli-place-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Placing order…";
  }
  fsdb.collection("orders").doc(id).set(built.order).then(function () {
    if (typeof recordOrderLocally === "function") {
      recordOrderLocally(built.order.customerName, built.order.customerPhone, Object.assign({ id: id }, built.order));
    }
    deliSlip = [];
    deliShowConfirmation(built.order);
    deliRenderSlip();
  }).catch(function (err) {
    console.error("Save deli order failed:", err);
    var denied = err && (err.code === "permission-denied" || /permission-denied/i.test(String(err.message || err)));
    var stockText = deliSlipProblems().map(function (problem) { return problem.name + ": " + problem.message; }).join(" ");
    alert(denied
      ? (stockText || "Sorry, we don't have enough to fill this order. Please lower a weight and try again.")
      : "Something went wrong submitting your order — please check your connection and try again.");
    deliRenderOrderDialog();
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Place pickup order";
    }
  });
}

function deliCounterToolbarHTML() {
  var threshold = deliThreshold();
  var hasCounter = (db.meatCheeseItems || []).some(function (item) { return item.catalog === "counter"; });
  return '<div class="mc-counter-tools"><p class="mc-case-note">The tiles are the physical case. Online pickup uses each item\'s on-hand pounds, edited under Manage or by a Toast import. Import does not rearrange these slots — the full catalog does not fit in 12 tiles. The website lists in-stock meats by chicken, turkey, ham, and beef, which is separate from this slot order. Pounds come off on-hand when an order is marked Picked Up. The order stays on record.</p>' +
    '<div class="mc-counter-actions"><label>Out at or under <input id="deli-threshold" type="number" min="0" max="5" step="0.05" value="' +
    threshold + '" onchange="deliSaveThreshold(this.value)"> lb</label>' +
    '<button type="button" class="btn small outline" onclick="deliPickCsv()">Import Toast CSV</button>' +
    (hasCounter ? "" : '<button type="button" class="btn small outline" onclick="deliLoadStarter()">Load starter stock</button>') +
    '<input type="file" id="deli-csv-input" accept=".csv,text/csv" hidden></div></div>';
}

function deliSaveThreshold(value) {
  var n = Number(value);
  if (!isFinite(n) || n < 0 || n > 5) {
    alert("Enter a threshold between 0 and 5 pounds.");
    return;
  }
  n = DeliCounter.normalizeLbs(n);
  db.deliCounter = Object.assign({}, db.deliCounter, { outOfStockAtLbs: n });
  var updates = DeliCounter.recomputeAutoStock(db.meatCheeseItems || [], n).map(function (update) {
    var item = deliFind(update.id);
    return Object.assign({}, item, { inStock: update.inStock });
  });
  var settingsWrite = window.__deliPreview
    ? Promise.resolve()
    : fsdb.collection("store").doc("deliCounter").set({ outOfStockAtLbs: n }, { merge: true });
  settingsWrite.then(function () {
    return updates.length ? deliPersistItems(updates) : null;
  }).then(function () {
    if (typeof renderMeatCheesePublic === "function") renderMeatCheesePublic();
    if (typeof renderPortalBody === "function" && session) renderPortalBody();
  }).catch(function (err) {
    console.error("Save deli threshold failed:", err);
    alert("Couldn't save that threshold.");
  });
}

function deliCopyForWrite(item) {
  var data = Object.assign({}, item);
  delete data.id;
  return data;
}

function deliPersistItems(items) {
  items.forEach(function (item) {
    var index = (db.meatCheeseItems || []).findIndex(function (entry) { return entry.id === item.id; });
    if (index === -1) db.meatCheeseItems.push(Object.assign({}, item));
    else db.meatCheeseItems[index] = Object.assign({}, db.meatCheeseItems[index], item);
  });
  if (window.__deliPreview) return Promise.resolve();
  var batches = [];
  var batch = fsdb.batch();
  var count = 0;
  items.forEach(function (item) {
    batch.set(fsdb.collection("meatCheeseItems").doc(item.id), deliCopyForWrite(item), { merge: true });
    count++;
    if (count === 400) {
      batches.push(batch.commit());
      batch = fsdb.batch();
      count = 0;
    }
  });
  if (count) batches.push(batch.commit());
  return Promise.all(batches);
}

function deliStatusLabel(item) {
  var availability = DeliCounter.availabilityOf(item);
  if (availability === "discontinued") return "Discontinued";
  if (DeliCounter.isOrderable(item, deliThreshold())) return "In stock";
  if (availability === "out") return "Out of stock";
  return "Out of stock";
}

function deliManageRows(items) {
  var term = deliManageSearch.trim().toLowerCase();
  return items.filter(function (item) {
    if (!term) return true;
    return ((item.displayName || "") + " " + (item.name || "") + " " + (item.toastName || "")).toLowerCase().indexOf(term) !== -1;
  });
}

function deliManageRowHTML(item) {
  return '<div class="search-panel-row deli-manage-row"><span><strong>' + escHtml(item.displayName || item.name) + "</strong>" +
    "<br><span class=\"mc-public-tile-sub\">" + escHtml(DeliCounter.formatWeight(item.lbsOnHand || 0)) + " lb · $" +
    Number(item.pricePerLb || item.price || 0).toFixed(2) + "/lb · " + escHtml(deliStatusLabel(item)) +
    (item.category === "meat" ? " · " + escHtml(DeliCounter.MEAT_LABELS[DeliCounter.meatTypeOf ? DeliCounter.meatTypeOf(item) : item.meatType] || item.meatType || "") : "") +
    "</span></span><button type=\"button\" class=\"btn small outline\" onclick=\"deliEditItem('" + item.id + "')\">Edit</button></div>";
}

function deliManageCatalog(cat) {
  var items = (db.meatCheeseItems || []).filter(function (item) { return item.category === cat; });
  var body;
  if (cat === "cheese") {
    body = deliManageRows(items).slice().sort(function (a, b) {
      return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
    }).map(deliManageRowHTML).join("") || '<div class="search-panel-row">No cheeses yet.</div>';
  } else {
    var grouped = DeliCounter.groupCatalog(deliManageRows(items), deliThreshold(), { publicOnly: false });
    body = grouped.meats.map(function (group) {
      return '<h3 class="mc-group-head">' + escHtml(group.label) + "</h3>" + group.items.map(deliManageRowHTML).join("");
    }).join("") || '<div class="search-panel-row">No meats yet.</div>';
  }
  openModal("<h3>" + (cat === "meat" ? "Meats" : "Cheeses") + " catalog</h3>" +
    '<p class="mc-public-intro">This is what customers can order. The case grid is only the shelf. Display names and meat type stay put when you import again.</p>' +
    '<div class="field"><input type="search" id="deli-manage-search" placeholder="Search" value="' + escHtmlAttr(deliManageSearch) +
    '" oninput="deliManageSearch=this.value; deliManageCatalog(\'' + cat + '\')"></div>' +
    '<div class="search-panel-list" style="max-height:420px">' + body + "</div>" +
    '<div class="modal-actions"><button class="btn outline" onclick="closeModal()">Close</button>' +
    (session && session.isMaster ? '<button class="btn" onclick="newMeatCheeseItemFlow(\'' + cat + '\', false)">+ New item</button>' : "") +
    "</div>");
  var search = document.getElementById("deli-manage-search");
  if (search && deliManageSearch) {
    search.focus();
    var pos = search.value.length;
    search.setSelectionRange(pos, pos);
  }
}

function deliEditItem(id) {
  var item = deliFind(id);
  if (!item) return;
  var availability = DeliCounter.availabilityOf(item);
  var meatType = item.meatType || (item.category === "meat" ? DeliCounter.detectMeatType(item.toastName || item.name) : "");
  openModal("<h3>Edit " + escHtml(item.displayName || item.name) + "</h3>" +
    (item.toastName ? '<p class="mc-public-intro">Toast name: ' + escHtml(item.toastName) + "</p>" : "") +
    '<div class="field"><label>Display name</label><input id="deli-edit-name" type="text" value="' + escHtmlAttr(item.displayName || item.name || "") + '"></div>' +
    (item.category === "meat"
      ? '<div class="field"><label>Meat type</label><select id="deli-edit-type">' +
        DeliCounter.MEAT_TYPES.map(function (type) {
          return '<option value="' + type + '"' + (type === meatType ? " selected" : "") + ">" + escHtml(DeliCounter.MEAT_LABELS[type]) + "</option>";
        }).join("") + "</select></div>"
      : "") +
    '<div class="field"><label>On hand (lb)</label><input id="deli-edit-lbs" type="number" min="0" step="0.01" value="' +
    (item.lbsOnHand != null ? item.lbsOnHand : 0) + '"></div>' +
    '<div class="field"><label>Price per lb</label><input id="deli-edit-price" type="number" min="0" step="0.01" value="' +
    (item.pricePerLb != null ? item.pricePerLb : item.price || "") + '"></div>' +
    '<div class="field"><label>Online availability</label><select id="deli-edit-availability">' +
    '<option value="auto"' + (availability === "auto" ? " selected" : "") + ">Use the threshold</option>" +
    '<option value="in"' + (availability === "in" ? " selected" : "") + ">In stock while any weight remains</option>" +
    '<option value="out"' + (availability === "out" ? " selected" : "") + ">Out of stock</option>" +
    '<option value="discontinued"' + (availability === "discontinued" ? " selected" : "") + ">Discontinued — hide, and keep hidden on import</option>" +
    "</select></div>" +
    '<div class="field"><label>Notes</label><textarea id="deli-edit-notes">' + escHtml(item.notes || "") + "</textarea></div>" +
    '<div class="modal-actions"><button class="btn outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn" onclick="deliSaveEdited(\'' + id + '\')">Save</button></div>');
}

function deliSaveEdited(id) {
  var item = deliFind(id);
  if (!item) return;
  var displayName = document.getElementById("deli-edit-name").value.trim();
  if (!displayName) {
    alert("Enter a display name.");
    return;
  }
  var lbs = DeliCounter.normalizeLbs(document.getElementById("deli-edit-lbs").value);
  var price = Number(document.getElementById("deli-edit-price").value);
  if (!isFinite(price) || price < 0) {
    alert("Enter a price per pound.");
    return;
  }
  price = Math.round(price * 100) / 100;
  var availability = document.getElementById("deli-edit-availability").value;
  if (["auto", "in", "out", "discontinued"].indexOf(availability) === -1) return;
  var meatType = item.meatType || "";
  var meatTypeEdited = !!item.meatTypeEdited;
  if (item.category === "meat") {
    var selected = document.getElementById("deli-edit-type").value;
    if (DeliCounter.MEAT_TYPES.indexOf(selected) === -1) return;
    meatTypeEdited = meatTypeEdited || selected !== (item.meatType || DeliCounter.detectMeatType(item.toastName || item.name));
    meatType = selected;
  }
  var next = Object.assign({}, item, {
    catalog: "counter",
    name: displayName,
    displayName: displayName,
    displayNameCustom: item.displayNameCustom || displayName !== (item.displayName || item.name),
    meatType: item.category === "cheese" ? "" : meatType,
    meatTypeEdited: item.category === "cheese" ? false : meatTypeEdited,
    lbsOnHand: lbs,
    pricePerLb: price,
    price: price.toFixed(2),
    availability: availability,
    discontinued: availability === "discontinued",
    inStock: DeliCounter.effectiveInStock(availability, lbs, deliThreshold()),
    notes: document.getElementById("deli-edit-notes").value.trim(),
    posSource: item.posSource || "manual",
    toastItemId: item.toastItemId || "",
    sku: item.sku || "",
    toastName: item.toastName || "",
  });
  deliPersistItems([next]).then(function () {
    closeModal();
    if (typeof renderPortalBody === "function") renderPortalBody();
    if (typeof renderMeatCheesePublic === "function") renderMeatCheesePublic();
  }).catch(function (err) {
    console.error("Save deli item failed:", err);
    alert("Couldn't save that item.");
  });
}

function deliPickCsv() {
  var input = document.getElementById("deli-csv-input");
  if (input) input.click();
}

function deliCsvChosen(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function () {
    var parsed;
    try {
      parsed = DeliCounter.getPosAdapter("toast-csv").parse(String(reader.result || ""));
    } catch (err) {
      console.error(err);
      alert("That file could not be read as a Toast item export.");
      return;
    }
    var merged = DeliCounter.applyPosRows(db.meatCheeseItems || [], parsed.accepted, { threshold: deliThreshold(), seed: false });
    deliImportPending = { parsed: parsed, merged: merged };
    var skipped = { category: 0, jerky: 0, price: 0, id: 0 };
    parsed.skipped.forEach(function (row) {
      if (skipped[row.reason] != null) skipped[row.reason]++;
    });
    var created = merged.filter(function (row) { return row.action === "create"; }).length;
    var updated = merged.length - created;
    var stayed = merged.filter(function (row) { return row.stayedDiscontinued; }).length;
    openModal("<h3>Import Toast items</h3>" +
      "<p>" + created + " new, " + updated + " updated. " + stayed + " stay discontinued and off the website.</p>" +
      "<p class=\"mc-public-intro\">Skipped " + skipped.category + " rows that are not Deli Meat or Deli Cheese (trays and the Deli category), and " +
      skipped.jerky + " jerky. Negative counts are saved as 0 lb. Display names you edited are kept. Meat type is detected again unless you changed it. Items you marked out of stock are refreshed from this file.</p>" +
      '<div class="modal-actions"><button class="btn outline" onclick="deliImportPending=null;closeModal()">Cancel</button>' +
      '<button class="btn" onclick="deliCommitImport()">Update stock</button></div>');
  };
  reader.readAsText(file);
}

function deliCommitImport() {
  if (!deliImportPending) return;
  var items = deliImportPending.merged.map(function (row) { return row.item; });
  deliImportPending = null;
  deliPersistItems(items).then(function () {
    closeModal();
    if (typeof renderPortalBody === "function") renderPortalBody();
    if (typeof renderMeatCheesePublic === "function") renderMeatCheesePublic();
    alert("Imported " + items.length + " deli items.");
  }).catch(function (err) {
    console.error("Deli import failed:", err);
    alert("The import didn't save. If you just updated the site, the Firestore rules may still need to be deployed.");
  });
}

function deliApplyStarter(silent) {
  deliSeedInFlight = true;
  var results = DeliCounter.applyPosRows(db.meatCheeseItems || [], typeof DELI_COUNTER_SEED_ROWS !== "undefined" ? DELI_COUNTER_SEED_ROWS : [], {
    threshold: deliThreshold(),
    seed: true,
  });
  deliPersistItems(results.map(function (row) { return row.item; })).then(function () {
    if (typeof renderPortalBody === "function") renderPortalBody();
    if (typeof renderMeatCheesePublic === "function") renderMeatCheesePublic();
  }).catch(function (err) {
    deliSeedInFlight = false;
    if (silent) deliSeedFailed = true;
    console.error(err);
    if (!silent) alert("Couldn't load the starter stock.");
  });
}

function deliLoadStarter() {
  if (!confirm("Load the starter deli list from the last Toast export? Existing case items with the same name are updated in place. Slots are not moved.")) return;
  deliSeedFailed = false;
  deliSeedInFlight = false;
  deliApplyStarter(false);
}

function deliMaybeSeed() {
  if (window.__deliPreview || deliSeedInFlight || deliSeedFailed) return;
  if (typeof activeTab === "undefined" || activeTab !== "Meats & Cheese") return;
  if (!session || typeof hasMeatCheeseAccess !== "function" || !hasMeatCheeseAccess()) return;
  if (!loadedRecordCollections.has("meatCheeseItems")) return;
  if ((db.meatCheeseItems || []).some(function (item) { return item.catalog === "counter"; })) return;
  if (typeof DELI_COUNTER_SEED_ROWS === "undefined" || !DELI_COUNTER_SEED_ROWS.length) return;
  deliApplyStarter(true);
}

function deliBindSettings() {
  if (window.__deliPreview) return;
  fsdb.collection("store").doc("deliCounter").onSnapshot(function (snap) {
    db.deliCounter = snap.exists ? snap.data() : { outOfStockAtLbs: DeliCounter.DEFAULT_THRESHOLD };
    if (typeof renderMeatCheesePublic === "function" && !document.getElementById("view-public").classList.contains("hidden")) {
      renderMeatCheesePublic();
    }
  }, function (err) {
    console.error("Deli counter settings listener failed:", err);
    if (!db.deliCounter) db.deliCounter = { outOfStockAtLbs: DeliCounter.DEFAULT_THRESHOLD };
  });
}

function deliOpenStaffOrder(order) {
  var status = order.deliStatus || "new";
  var locked = status === "pickedUp";
  function btn(next, label) {
    var on = status === next ? " outline" : "";
    var disabled = locked ? " disabled" : "";
    return '<button type="button" class="btn' + on + '"' + disabled + ' onclick="deliSetStatus(\'' + order.id + '\',\'' + next + '\')">' + label + "</button>";
  }
  var lines = (order.items || []).map(function (item) {
    return "<div>" + escHtml(DeliCounter.formatWeight(item.weightLbs) + " lb " + (item.sliceStyleLabel || "") + " — " + item.name) +
      (item.note ? '<br><span class="mc-public-tile-sub">Note: ' + escHtml(item.note) + "</span>" : "") +
      (item.pricePerLb ? ' <span class="mc-public-tile-sub">$' + Number(item.pricePerLb).toFixed(2) + "/lb</span>" : "") +
      "</div>";
  }).join("");
  openModal("<h3>Deli pickup — " + escHtml(order.customerName) + "</h3>" +
    "<p>" + escHtml(order.customerPhone) + "<br>Pickup " + escHtml(order.pickupDate) + " " + escHtml(formatTime12hr(order.pickupTime)) +
    "<br>Pay at pickup · " + escHtml(status === "pickedUp" ? "Picked Up" : status === "ready" ? "Ready" : "New") + "</p>" +
    (order.notes ? "<p><strong>Note:</strong> " + escHtml(order.notes) + "</p>" : "") +
    '<div class="search-panel-list" style="max-height:240px">' + lines + "</div>" +
    '<p class="mc-public-intro">Pounds come off on-hand when you mark this Picked Up. The order stays on record. If the case pieces also need weighing, update those tiles by hand — they are a separate count.</p>' +
    '<div class="modal-actions">' + btn("new", "New") + btn("ready", "Ready") + btn("pickedUp", "Picked Up") +
    '<button type="button" class="btn outline" onclick="manualPrintOrder(\'' + order.id + '\')">Print</button></div>');
}

function deliSetStatus(id, next) {
  var order = (db.orders || []).filter(function (entry) { return entry.id === id; })[0];
  if (!order || order.channel !== "deliCounter") return;
  if (order.deliStatus === "pickedUp") return;
  if (next !== "new" && next !== "ready" && next !== "pickedUp") return;
  var patch = { deliStatus: next, status: next === "pickedUp" ? "completed" : "incomplete" };
  var itemWrites = [];
  if (next === "pickedUp" && !order.stockDecremented) {
    var plan = DeliCounter.planPickupDecrement(db.meatCheeseItems || [], order, deliThreshold());
    plan.updates.forEach(function (update) {
      var item = deliFind(update.id);
      if (!item) return;
      itemWrites.push(Object.assign({}, item, {
        lbsOnHand: update.lbsOnHand,
        inStock: update.inStock,
        availability: update.availability,
        discontinued: update.discontinued,
      }));
    });
    patch.stockDecremented = true;
    if (plan.short.length) {
      alert("Marked picked up. At least one item didn't have enough on hand, so its count was set to 0. Adjust the catalog if the scale says otherwise.");
    }
  }
  order.deliStatus = next;
  order.status = patch.status;
  if (patch.stockDecremented) order.stockDecremented = true;
  var itemsDone = itemWrites.length ? deliPersistItems(itemWrites) : Promise.resolve();
  var orderDone = window.__deliPreview
    ? Promise.resolve()
    : fsdb.collection("orders").doc(id).update(patch);
  itemsDone.then(function () { return orderDone; }).then(function () {
    deliOpenStaffOrder(order);
    if (typeof renderPortalBody === "function") renderPortalBody();
  }).catch(function (err) {
    console.error("Update deli order failed:", err);
    alert("Couldn't update that order.");
  });
}

function deliBootPreview() {
  window.__deliPreview = true;
  db.meatCheeseItems = DeliCounter.starterCatalog(0.25);
  db.meatCheeseSlots = [
    { id: "slot-teri", category: "meat", itemId: "preview-teri", order: 0 },
    { id: "slot-chip", category: "meat", itemId: "preview-chip", order: 1 },
  ];
  var teri = db.meatCheeseItems.filter(function (item) { return item.displayName === "Ichiban Teriyaki"; })[0];
  var chip = db.meatCheeseItems.filter(function (item) { return item.displayName === "Chicken Chipotle"; })[0];
  if (teri) db.meatCheeseSlots[0].itemId = teri.id;
  if (chip) db.meatCheeseSlots[1].itemId = chip.id;
  db.meatCheeseBlocks = [];
  db.closedDates = ["2026-11-26"];
  db.closedDateRecords = [{ id: "2026-11-26", name: "Thanksgiving" }];
  db.deliCounter = { outOfStockAtLbs: 0.25 };
  db.orders = [];
  if (teri) {
    db.orders.push({
      id: "preview-new",
      channel: "deliCounter",
      customerName: "Jamie Ellis",
      customerPhone: "(812) 555-0142",
      pickupDate: "2026-11-10",
      pickupTime: "11:30",
      notes: "Please slice the turkey thin.",
      items: [{
        kind: "meatcheese",
        catalog: "counter",
        itemId: teri.id,
        name: teri.displayName,
        weightLbs: 0.5,
        sliceStyle: "thin",
        sliceStyleLabel: "Thin",
        pricePerLb: teri.pricePerLb,
        note: "",
        lineId: "li1",
        qty: 1,
      }],
      deliStatus: "new",
      status: "incomplete",
      payAtPickup: true,
      stockDecremented: false,
      submittedAt: new Date().toISOString(),
      autoprinted: false,
      weekKey: "",
    });
  }
  ["meatCheeseItems", "meatCheeseSlots", "meatCheeseBlocks", "closedDates", "produce", "soups", "deliBoxes", "deliItems", "employees"].forEach(function (name) {
    loadedRecordCollections.add(name);
  });
  ["soupMenuDays", "deliWeeklyMenus", "scheduleShifts"].forEach(function (name) {
    loadedCompositeCollections.add(name);
  });
  loadedCollections.add("settings");
  renderPublic();
  var banner = document.createElement("div");
  banner.className = "deli-preview-banner";
  banner.innerHTML = "Local preview — nothing is saved. " +
    '<button type="button" class="btn small" onclick="deliPreviewPortal(\'Meats & Cheese\')">Counter &amp; case</button> ' +
    '<button type="button" class="btn small" onclick="deliPreviewPortal(\'Orders\')">Deli orders</button> ' +
    '<button type="button" class="btn small outline" onclick="showView(\'view-public\'); renderPublic();">Public site</button>';
  document.body.appendChild(banner);
}

function deliPreviewPortal(tab) {
  session = { isMaster: true, name: "Preview" };
  activeTab = tab || "Meats & Cheese";
  var user = document.getElementById("portal-user");
  if (user) user.textContent = session.name;
  renderPortalTabs();
  if (tab === "Orders") ordersViewMode = "deli";
  renderPortalBody();
  showView("view-portal");
}

document.addEventListener("change", function (event) {
  if (event.target && event.target.id === "deli-csv-input") {
    deliCsvChosen(event.target.files && event.target.files[0]);
    event.target.value = "";
  }
});
