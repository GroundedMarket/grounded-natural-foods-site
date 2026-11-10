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

function deliRuntimeSettings() {
  return (db && db.deliCounter) || {};
}

function deliHoursCopy() {
  return deliRuntimeSettings().hoursCopy || DeliCounter.HOURS_COPY;
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
  if (item.removed) return "removed";
  if (item.hiddenOnline) return "hidden from site";
  if (item.notOfferedOnline || (typeof DeliCounter.isChippedMeat === "function" && DeliCounter.isChippedMeat(item))) return "not on site";
  if (item.discontinued || DeliCounter.availabilityOf(item) === "discontinued") return "discontinued";
  if (DeliCounter.isOrderable(item, deliThreshold(), deliRuntimeSettings())) {
    return "on the site";
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

function deliPriceAmount(item) {
  var price = item.pricePerLb != null && item.pricePerLb !== "" ? item.pricePerLb : item.price;
  if (price == null || price === "") return "";
  var amount = typeof price === "number" ? price.toFixed(2) : String(price).replace(/^\$/, "");
  if (!amount) return "";
  return "$" + amount + "/lb";
}

function deliPriceLabel(item) {
  var amount = deliPriceAmount(item);
  return amount ? amount + " · In stock" : "In stock";
}

function deliCaseCardHTML(item) {
  var open = item.catalog === "counter"
    ? "deliOpenItem('" + item.id + "')"
    : "openMeatCheeseOrderModal('" + item.id + "')";
  var name = item.displayName || item.name;
  var price = deliPriceAmount(item);
  var icon = typeof DeliIcons !== "undefined" ? DeliIcons.iconFor(item) : "";
  return '<button type="button" class="deli-case-card mc-cat-' + item.category + '" onclick="' + open + '" aria-label="' +
    escHtmlAttr(name + (price ? ", " + price : "") + ". Opens the order dialog.") + '">' +
    (icon || '<span class="mc-tile-emoji">' + escHtml(item.emoji || (item.category === "meat" ? "🥩" : "🧀")) + "</span>") +
    '<span class="deli-case-name">' + escHtml(name) + "</span>" +
    (price ? '<span class="deli-case-price">' + escHtml(price) + "</span>" : "") +
    "</button>";
}

function deliShelfHTML(label, items) {
  if (!items.length) return "";
  var id = "deli-shelf-" + String(label).toLowerCase().replace(/[^a-z]+/g, "");
  return '<section class="deli-shelf" aria-labelledby="' + id + '"><h3 class="deli-shelf-label" id="' + id + '">' +
    escHtml(label) + '</h3><div class="deli-shelf-row">' + items.map(deliCaseCardHTML).join("") +
    '</div><div class="deli-shelf-edge" aria-hidden="true"></div></section>';
}

function deliTileHTML(item) {
  var open = item.catalog === "counter"
    ? "deliOpenItem('" + item.id + "')"
    : "openMeatCheeseOrderModal('" + item.id + "')";
  var selected = deliDraft && deliDraft.itemId === item.id ? " is-on" : "";
  var icon = typeof DeliIcons !== "undefined" ? DeliIcons.iconFor(item) : "";
  return '<button type="button" class="mc-public-tile mc-cat-' + item.category + selected + '" onclick="' + open + '">' +
    (icon || '<span class="mc-tile-emoji">' + escHtml(item.emoji || (item.category === "meat" ? "🥩" : "🧀")) + "</span>") +
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
  var el = document.getElementById("mc-public-case");
  if (!el) return;
  if (phase === "loading") {
    el.innerHTML = marketLoadingHTML("Loading Meats & Cheese");
    deliRenderSlip();
    return;
  }
  if (phase === "error") {
    el.innerHTML = marketErrorHTML("Couldn't load meats and cheese. Check your connection and refresh.");
    deliRenderSlip();
    return;
  }
  var grouped = DeliCounter.groupCatalog(db.meatCheeseItems || [], deliThreshold(), { publicOnly: true, settings: deliRuntimeSettings() });
  var html = grouped.meats.map(function (group) {
    return deliShelfHTML(group.label, group.items);
  }).join("") + deliShelfHTML("Cheeses", grouped.cheeses);
  el.innerHTML = html || '<p class="empty-note">Nothing available right now.</p>';
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
  var dates = DeliCounter.pickupDates(new Date(), db.closedDates || [], 21, deliRuntimeSettings());
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
  var tooSmall = DeliCounter.minimumMessage(item.category, weight, deliRuntimeSettings().meatMinLbs);
  if (tooSmall) return tooSmall;
  return DeliCounter.stockMessage(item.lbsOnHand, deliRequestedFor(item.id, weight));
}

function deliDraftCanAdd() {
  if (!deliDraft) return false;
  var weight = Number(deliDraft.weightLbs);
  if (!isFinite(weight) || weight <= 0) return false;
  return !deliDraftMessage();
}

function deliPresetLabel(weight) {
  var labels = { 0.25: "1/4 lb", 0.5: "1/2 lb", 0.75: "3/4 lb", 1: "1 lb" };
  var key = Math.round(Number(weight) * 100) / 100;
  if (labels[key]) return labels[key];
  return DeliCounter.formatWeight(weight) + " lb";
}

function deliEditorHTML() {
  var draft = deliDraft;
  if (!draft) return "";
  var item = deliFind(draft.itemId);
  if (!item) return "";
  var message = deliDraftMessage();
  var catClass = "mc-cat-" + item.category;
  var quick = [0.25, 0.5, 0.75, 1];
  if (item.category !== "meat") {
    var remainder = DeliCounter.normalizeLbs(item.lbsOnHand);
    if (remainder > 0 && remainder < 0.25) quick.unshift(remainder);
  }
  return '<div class="deli-editor" id="deli-editor">' +
    "<h3>" + escHtml(item.displayName || item.name) + "</h3>" +
    '<p class="mc-public-tile-sub">' + escHtml(deliPriceLabel(item)) + "</p>" +
    '<div class="field deli-amount-field"><label>Amount (lb)</label><div class="deli-weight-row">' +
    quick.map(function (weight) {
      var on = Math.abs(Number(draft.weightLbs) - weight) < 1e-9 ? " is-on" : "";
      return '<button type="button" class="deli-weight-chip' + on + '" onclick="deliPickWeight(' + weight + ')">' +
        escHtml(deliPresetLabel(weight)) + "</button>";
    }).join("") +
    '</div><div class="deli-weight-entry"><input type="number" id="deli-weight-input" min="0" step="0.25" value="' +
    escHtmlAttr(draft.weightLbs === "" || draft.weightLbs == null ? "" : String(draft.weightLbs)) +
    '" oninput="deliWeightTyped(this.value)"><span class="deli-lb-suffix">lb</span></div></div>' +
    (message ? '<p class="deli-stock-error" id="deli-stock-error">' + escHtml(message) + "</p>" : '<p class="deli-stock-error" id="deli-stock-error" hidden></p>') +
    '<div class="field deli-slice-field"><label>Slice</label><div class="mc-slice-grid">' +
    DeliCounter.sliceStylesFor(item).map(function (style) {
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
  var dates = DeliCounter.pickupDates(now, closed, 21, deliRuntimeSettings());
  if (state.date && dates.indexOf(state.date) === -1) state.date = dates[0] || "";
  var times = state.date ? DeliCounter.pickupTimes(state.date, now, closed, deliRuntimeSettings()) : [];
  if (state.time && times.indexOf(state.time) === -1) state.time = times[0] || "";
  var blocked = deliSlipProblems().length > 0;
  return '<div class="deli-checkout"><h3 class="mc-group-head">Pickup details</h3>' +
    '<p class="mc-public-intro">No payment here. You pay at the counter. ' + escHtml(deliHoursCopy()) + "</p>" +
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
  var grouped = DeliCounter.groupCatalog(db.meatCheeseItems || [], deliThreshold(), { publicOnly: true, settings: deliRuntimeSettings() });
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
  var starting = DeliCounter.defaultOrderWeight(
    item.lbsOnHand,
    deliRequestedFor(id, 0),
    item.category === "meat" ? DeliCounter.MEAT_MIN_LB : 0
  );
  var incoming = (deliDraft && deliDraft.sliceStyle) || "medium";
  deliDraft = {
    itemId: id,
    weightLbs: starting == null ? "" : starting,
    sliceStyle: DeliCounter.coerceSlice(item, incoming),
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
  var item = deliFind(deliDraft.itemId);
  if (!item) return;
  if (!DeliCounter.sliceStylesFor(item).some(function (style) { return style.id === styleId; })) return;
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
    settings: deliRuntimeSettings(),
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
  var hasCounter = (db.meatCheeseItems || []).some(function (item) { return item.catalog === "counter"; });
  var canEdit = typeof canManageOnlineDeli === "function" ? canManageOnlineDeli() : !!(session && session.isMaster);
  return '<div class="mc-counter-tools"><p class="mc-case-note">Tap a filled tile to weigh the pieces, or to take that item off the customer website. Manage online deli is the full list. Import does not rearrange these slots.</p>' +
    '<div class="mc-counter-actions">' +
    '<button type="button" class="btn" onclick="deliManageOnline()">Manage online deli</button>' +
    (canEdit ? '<button type="button" class="btn small outline" onclick="deliPickCsv()">Import Toast CSV</button>' +
      (hasCounter ? "" : '<button type="button" class="btn small outline" onclick="deliLoadStarter()">Load starter stock</button>') : "") +
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
  if (item.removed) return "Removed";
  if (item.notOfferedOnline || (typeof DeliCounter.isChippedMeat === "function" && DeliCounter.isChippedMeat(item))) return "Not offered online";
  var availability = DeliCounter.availabilityOf(item);
  if (availability === "discontinued") return "Discontinued";
  if (item.hiddenOnline) return "Hidden online";
  if (DeliCounter.isOrderable(item, deliThreshold(), deliRuntimeSettings())) return "In stock";
  if (availability === "out") return "Out of stock";
  return "Out of stock";
}

function canEditOnlineDeli() {
  if (typeof canManageOnlineDeli === "function") return canManageOnlineDeli();
  return !!(session && session.isMaster);
}

function deliManageRows(items) {
  var term = deliManageSearch.trim().toLowerCase();
  return items.filter(function (item) {
    if (!term) return true;
    return ((item.displayName || "") + " " + (item.name || "") + " " + (item.toastName || "")).toLowerCase().indexOf(term) !== -1;
  });
}

function deliManageRowHTML(item) {
  var icon = typeof DeliIcons !== "undefined" ? DeliIcons.iconFor(item) : "";
  var action = canEditOnlineDeli()
    ? '<button type="button" class="btn small outline" onclick="deliEditItem(\'' + item.id + "')\">Edit</button>"
    : "";
  return '<div class="search-panel-row deli-manage-row"><span class="deli-manage-name">' + icon +
    "<span><strong>" + escHtml(item.displayName || item.name) + "</strong>" +
    "<br><span class=\"mc-public-tile-sub\">" + escHtml(DeliCounter.formatWeight(item.lbsOnHand || 0)) + " lb · $" +
    Number(item.pricePerLb || item.price || 0).toFixed(2) + "/lb · " + escHtml(deliStatusLabel(item)) +
    (item.category === "meat" ? " · " + escHtml(DeliCounter.MEAT_LABELS[DeliCounter.meatTypeOf ? DeliCounter.meatTypeOf(item) : item.meatType] || item.meatType || "") : "") +
    "</span></span></span>" + action + "</div>";
}

var deliManageFilter = "";
var deliManageNotice = "";

function deliManageCatalog(cat) {
  deliManageFilter = cat || "";
  deliManageOnline();
}

function deliTimeValue(value, fallback) {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function deliWidenModal() {
  var box = document.querySelector("#modal-root .modal-box");
  if (box) box.classList.add("deli-manage-modal");
}

function deliManageOnline() {
  if (deliPublicPhase() === "loading") {
    openModal('<h3>Manage online deli</h3><div id="deli-manage-loading">' +
      (typeof marketLoadingHTML === "function" ? marketLoadingHTML("Loading the online menu") : '<p class="empty-note">Loading the online menu</p>') +
      "</div>");
    deliWidenModal();
    return;
  }
  if (deliPublicPhase() === "error") {
    openModal('<h3>Manage online deli</h3>' +
      (typeof marketErrorHTML === "function" ? marketErrorHTML("Couldn't load the online menu. Check your connection and refresh.") : '<p class="empty-note">Couldn\'t load the online menu.</p>'));
    deliWidenModal();
    return;
  }
  var canEdit = canEditOnlineDeli();
  var settings = deliRuntimeSettings();
  var items = deliManageRows((db.meatCheeseItems || []).filter(function (item) {
    if (deliManageFilter === "meat" || deliManageFilter === "cheese") return item.category === deliManageFilter;
    return item.catalog === "counter" || item.category === "meat" || item.category === "cheese";
  }));
  function byName(a, b) {
    return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
  }
  var active = items.filter(function (item) {
    return !item.removed && DeliCounter.availabilityOf(item) !== "discontinued";
  });
  var discontinued = items.filter(function (item) {
    return !item.removed && DeliCounter.availabilityOf(item) === "discontinued";
  }).sort(byName);
  var removed = items.filter(function (item) { return !!item.removed; }).sort(byName);
  var meats = DeliCounter.groupCatalog(active.filter(function (item) { return item.category === "meat"; }), deliThreshold(), {
    publicOnly: false,
    settings: settings,
  });
  var cheeses = active.filter(function (item) { return item.category === "cheese"; }).sort(byName);
  var list = "";
  if (deliManageFilter !== "cheese") {
    list += meats.meats.map(function (group) {
      return '<h3 class="mc-group-head">' + escHtml(group.label) + "</h3>" + group.items.map(deliManageRowHTML).join("");
    }).join("");
  }
  if (deliManageFilter !== "meat" && cheeses.length) {
    list += '<h3 class="mc-group-head">Cheese</h3>' + cheeses.map(deliManageRowHTML).join("");
  }
  if (!list) {
    list = deliManageSearch.trim()
      ? '<p class="empty-note">Nothing matches that search.</p>'
      : '<p class="empty-note">Nothing on the online menu yet.</p>';
  }
  openModal('<h3>Manage online deli</h3>' +
    (deliManageNotice ? '<p class="deli-saved">' + escHtml(deliManageNotice) + "</p>" : "") +
    (canEdit
      ? '<p class="mc-public-intro">Add an item, change its name, price, or pounds, or hide it from the website. A filled case tile can hide it too.</p>'
      : '<p class="mc-public-intro">You can look through the online menu. Only a manager can change it. Orders are on the Orders tab.</p>') +
    '<div class="mc-counter-actions">' +
    '<button type="button" class="btn small' + (deliManageFilter === "" ? "" : " outline") + '" onclick="deliManageFilter=\'\'; deliManageOnline()">All</button>' +
    '<button type="button" class="btn small' + (deliManageFilter === "meat" ? "" : " outline") + '" onclick="deliManageFilter=\'meat\'; deliManageOnline()">Meats</button>' +
    '<button type="button" class="btn small' + (deliManageFilter === "cheese" ? "" : " outline") + '" onclick="deliManageFilter=\'cheese\'; deliManageOnline()">Cheeses</button>' +
    '<input type="search" id="deli-manage-search" placeholder="Search name" value="' + escHtmlAttr(deliManageSearch) +
    '" oninput="deliManageSearch=this.value; deliManageOnline()">' +
    (canEdit
      ? '<button type="button" class="btn small" onclick="deliEditItem(\'\',\'meat\')">+ Meat</button>' +
        '<button type="button" class="btn small" onclick="deliEditItem(\'\',\'cheese\')">+ Cheese</button>' +
        '<button type="button" class="btn small outline" onclick="deliEditSettings()">Hours &amp; stock settings</button>'
      : "") +
    "</div>" +
    '<div class="search-panel-list" style="max-height:340px">' + list + "</div>" +
    '<details class="deli-fold"><summary>Discontinued (' + discontinued.length + ")</summary>" +
    (discontinued.map(deliManageRowHTML).join("") || '<p class="empty-note">None.</p>') + "</details>" +
    '<details class="deli-fold"><summary>Removed (' + removed.length + ")</summary>" +
    (removed.map(deliManageRowHTML).join("") || '<p class="empty-note">None.</p>') + "</details>" +
    '<div class="modal-actions"><button class="btn outline" onclick="deliManageNotice=\'\';closeModal()">Close</button></div>');
  deliWidenModal();
  var search = document.getElementById("deli-manage-search");
  if (search && deliManageSearch) {
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }
}

function deliRefreshManageIfWaiting() {
  if (!document.getElementById("deli-manage-loading")) return;
  if (deliPublicPhase() === "loading") return;
  deliManageOnline();
}

var deliConfirmAction = null;

function deliAskConfirm(message, onYes) {
  var slot = document.getElementById("deli-confirm-slot");
  if (!slot) return;
  deliConfirmAction = onYes;
  slot.hidden = false;
  slot.innerHTML = "<p>" + escHtml(message) + "</p>" +
    '<div class="modal-actions"><button type="button" class="btn outline" onclick="deliConfirmNo()">Cancel</button>' +
    '<button type="button" class="btn" onclick="deliConfirmYes()">Yes</button></div>';
}

function deliConfirmYes() {
  var fn = deliConfirmAction;
  deliConfirmAction = null;
  deliConfirmNo();
  if (fn) fn();
}

function deliConfirmNo() {
  deliConfirmAction = null;
  var slot = document.getElementById("deli-confirm-slot");
  if (!slot) return;
  slot.hidden = true;
  slot.innerHTML = "";
}

function deliEditMessage(text) {
  var el = document.getElementById("deli-edit-msg");
  if (!el) return;
  el.hidden = !text;
  el.textContent = text || "";
}

function deliClockLabel(value) {
  var parts = String(value || "00:00").split(":");
  var h = Number(parts[0]);
  var m = parts[1] || "00";
  if (!isFinite(h)) return value;
  var ap = h >= 12 ? "PM" : "AM";
  var h12 = h % 12 || 12;
  return h12 + (m === "00" ? "" : ":" + m) + " " + ap;
}

function deliDraftHoursSentence() {
  var open = document.getElementById("deli-set-open").value || "09:00";
  var counter = document.getElementById("deli-set-counter").value || "16:00";
  var cutoff = document.getElementById("deli-set-cutoff").value || "16:00";
  var week = document.getElementById("deli-set-week-close").value || "18:00";
  var sat = document.getElementById("deli-set-sat-close").value || "14:00";
  document.getElementById("deli-set-copy").value =
    "Deli counter open Mon–Fri " + deliClockLabel(open) + "–" + deliClockLabel(counter) +
    ", Sat " + deliClockLabel(open) + "–" + deliClockLabel(sat) +
    ". Order by " + deliClockLabel(cutoff) + " on weekdays and pick up until " + deliClockLabel(week) +
    ". Saturday pickup until " + deliClockLabel(sat) + ".";
}

function deliEditSettings() {
  if (!canEditOnlineDeli()) return;
  var settings = deliRuntimeSettings();
  openModal('<h3>Hours &amp; stock settings</h3>' +
    '<p class="mc-public-intro">The times are what the order form allows. The sentence is what customers read. Pickup hours are checked in the browser. The meat minimum is also checked when the order is saved.</p>' +
    deliSettingsFields(settings) +
    '<div class="modal-actions"><button type="button" class="btn outline" onclick="deliManageOnline()">Back to the menu</button></div>');
  deliWidenModal();
}

function deliSettingsFields(settings) {
  return '<div class="deli-settings"><div class="deli-settings-grid">' +
    '<div class="field"><label>Out of stock at or under (lb)</label><input id="deli-set-threshold" type="number" min="0" max="5" step="0.05" value="' + escHtmlAttr(String(settings.outOfStockAtLbs != null ? settings.outOfStockAtLbs : 0.25)) + '"></div>' +
    '<div class="field"><label>Minimum meat order (lb)</label><input id="deli-set-min" type="number" min="0.01" max="5" step="0.25" value="' + escHtmlAttr(String(settings.meatMinLbs != null ? settings.meatMinLbs : 0.25)) + '"></div>' +
    '<div class="field"><label>Store opens</label><input id="deli-set-open" type="time" value="' + deliTimeValue(settings.storeOpen, "09:00") + '"></div>' +
    '<div class="field"><label>Weekday counter closes</label><input id="deli-set-counter" type="time" value="' + deliTimeValue(settings.counterCloseWeekday, "16:00") + '"></div>' +
    '<div class="field"><label>Weekday order cutoff</label><input id="deli-set-cutoff" type="time" value="' + deliTimeValue(settings.weekdayOrderCutoff, "16:00") + '"></div>' +
    '<div class="field"><label>Weekday pickup until</label><input id="deli-set-week-close" type="time" value="' + deliTimeValue(settings.storeCloseWeekday, "18:00") + '"></div>' +
    '<div class="field"><label>Saturday pickup until</label><input id="deli-set-sat-close" type="time" value="' + deliTimeValue(settings.storeCloseSaturday, "14:00") + '"></div>' +
    "</div>" +
    '<div class="field"><label>Hours text on the website</label><textarea id="deli-set-copy">' + escHtml(settings.hoursCopy || DeliCounter.HOURS_COPY) + "</textarea></div>" +
    '<p id="deli-settings-msg" class="deli-inline-error" hidden></p>' +
    '<button type="button" class="btn small outline" onclick="deliDraftHoursSentence()">Write the sentence from these times</button> ' +
    '<button type="button" class="btn" onclick="deliSaveSettings()">Save settings</button></div>';
}

function deliIconPickerHTML(selected) {
  var choices = typeof DeliIcons !== "undefined" && DeliIcons.choices ? DeliIcons.choices() : [];
  var buttons = '<button type="button" data-key="" class="deli-icon-choice' + (!selected ? " is-on" : "") + '" onclick="deliPickIcon(\'\')"><span>Use default</span></button>';
  choices.forEach(function (choice) {
    buttons += '<button type="button" data-key="' + choice.key + '" class="deli-icon-choice' + (selected === choice.key ? " is-on" : "") + '" onclick="deliPickIcon(\'' + choice.key + '\')">' +
      choice.svg + "<span>" + escHtml(choice.label) + "</span></button>";
  });
  return '<input type="hidden" id="deli-edit-icon" value="' + escHtmlAttr(selected || "") + '"><div class="deli-icon-grid">' + buttons + "</div>";
}

function deliPickIcon(key) {
  var input = document.getElementById("deli-edit-icon");
  if (input) input.value = key || "";
  document.querySelectorAll(".deli-icon-choice").forEach(function (button) {
    var chosen = button.getAttribute("data-key") || "";
    button.classList.toggle("is-on", chosen === (key || ""));
  });
}

function deliEditItem(id, newCategory) {
  var item = id ? deliFind(id) : null;
  if (!canEditOnlineDeli()) {
    if (!item) return;
    openModal("<h3>" + escHtml(item.displayName || item.name) + "</h3>" +
      '<p class="mc-public-intro">' + escHtml(deliStatusLabel(item)) + " · " +
      escHtml(DeliCounter.formatWeight(item.lbsOnHand || 0)) + " lb · $" +
      Number(item.pricePerLb || item.price || 0).toFixed(2) + "/lb</p>" +
      '<p class="mc-public-intro">A manager changes the online menu. You can still take and finish orders.</p>' +
      '<div class="modal-actions"><button class="btn outline" onclick="closeModal()">Close</button></div>');
    return;
  }
  var category = item ? item.category : newCategory || "meat";
  var availability = item ? DeliCounter.availabilityOf(item) : "auto";
  if (availability === "discontinued") availability = "out";
  var meatType = item && item.meatType ? item.meatType : "chicken";
  var iconKey = item && item.iconKey ? item.iconKey : "";
  var chipped = !!(item && DeliCounter.isChippedMeat(item));
  openModal("<h3>" + (item ? "Edit " + escHtml(item.displayName || item.name) : "Add a " + (category === "cheese" ? "cheese" : "meat")) + "</h3>" +
    '<div class="deli-edit-body">' +
    '<div class="field"><label>Friendly name</label><input id="deli-edit-name" type="text" value="' + escHtmlAttr(item ? item.displayName || item.name || "" : "") + '"></div>' +
    (category === "meat"
      ? '<div class="field"><label>Group</label><select id="deli-edit-type">' +
        DeliCounter.MEAT_TYPES.map(function (type) {
          return '<option value="' + type + '"' + (type === meatType ? " selected" : "") + ">" + escHtml(DeliCounter.MEAT_LABELS[type]) + "</option>";
        }).join("") + "</select></div>"
      : '<p class="mc-public-intro">This is a cheese. It is listed alphabetically, not in a meat group.</p>') +
    '<div class="field"><label>Price per lb</label><input id="deli-edit-price" type="number" min="0" step="0.01" value="' +
    (item && item.pricePerLb != null ? item.pricePerLb : "") + '"></div>' +
    '<div class="field"><label>Pounds on hand</label><input id="deli-edit-lbs" type="number" min="0" step="0.01" value="' +
    (item && item.lbsOnHand != null ? item.lbsOnHand : 0) + '"></div>' +
    '<div class="field"><label>Toast name (optional, for imports)</label><input id="deli-edit-toast" type="text" value="' + escHtmlAttr(item ? item.toastName || "" : "") + '"></div>' +
    '<div class="field"><label>SKU (optional)</label><input id="deli-edit-sku" type="text" value="' + escHtmlAttr(item ? item.sku || "" : "") + '"></div>' +
    '<div class="field"><label>Stock</label><select id="deli-edit-availability">' +
    '<option value="auto"' + (availability === "auto" ? " selected" : "") + ">Follow the out-of-stock threshold</option>" +
    '<option value="in"' + (availability === "in" ? " selected" : "") + ">Force in stock while any weight remains</option>" +
    '<option value="out"' + (availability === "out" ? " selected" : "") + ">Force out of stock</option>" +
    "</select></div>" +
    '<label class="deli-check"><input id="deli-edit-hidden" type="checkbox"' + (item && item.hiddenOnline ? " checked" : "") + "> Hide online for now. This takes it off the customer site.</label>" +
    '<label class="deli-check"><input id="deli-edit-offline" type="checkbox"' + (chipped || (item && item.notOfferedOnline) ? " checked" : "") + (chipped ? " disabled" : "") + "> Not offered online (stays off after imports)</label>" +
    (chipped ? '<p class="mc-public-intro">Chipped Meat stays off the website. The order rules keep that safety check even if this box is cleared.</p>' : "") +
    (item && DeliCounter.availabilityOf(item) === "discontinued" ? '<p class="mc-public-intro">This item is discontinued. Use Restore to put it back.</p>' : "") +
    '<div class="field"><label>Icon</label>' + deliIconPickerHTML(iconKey) + "</div>" +
    '<div class="field"><label>Notes</label><textarea id="deli-edit-notes">' + escHtml(item ? item.notes || "" : "") + "</textarea></div></div>" +
    '<div class="deli-edit-actions">' +
    '<div id="deli-confirm-slot" class="deli-confirm" hidden></div>' +
    '<p id="deli-edit-msg" class="deli-inline-error" hidden></p>' +
    '<div class="modal-actions">' +
    '<button type="button" class="btn deli-save-btn" onclick="deliSaveEdited(\'' + (id || "") + '\',\'' + category + '\')">Save</button>' +
    '<button type="button" class="btn outline" onclick="deliManageOnline()">Back</button>' +
    (item ? '<button type="button" class="btn outline" onclick="deliAskDiscontinue(\'' + id + '\')">' +
      (DeliCounter.availabilityOf(item) === "discontinued" ? "Restore" : "Discontinue") + "</button>" : "") +
    (item && !item.removed ? '<button type="button" class="btn danger" onclick="deliAskRemove(\'' + id + '\')">Remove</button>' : "") +
    (item && item.removed ? '<button type="button" class="btn outline" onclick="deliRestoreRemoved(\'' + id + '\')">Restore</button>' : "") +
    "</div></div>");
  deliWidenModal();
}

function deliCounterRecord(base, patch) {
  var item = Object.assign({}, base || {}, patch || {});
  var availability = item.availability || "auto";
  var lbs = DeliCounter.normalizeLbs(item.lbsOnHand || 0);
  var price = Math.round(Number(item.pricePerLb || 0) * 100) / 100;
  var displayName = String(item.displayName || item.name || "").trim();
  return {
    id: item.id,
    catalog: "counter",
    category: item.category === "cheese" ? "cheese" : "meat",
    toastItemId: item.toastItemId || "",
    sku: item.sku || "",
    toastName: item.toastName || "",
    name: displayName,
    displayName: displayName,
    displayNameCustom: item.displayNameCustom !== false,
    price: price.toFixed(2),
    pricePerLb: price,
    lbsOnHand: lbs,
    availableWeight: item.availableWeight != null ? item.availableWeight : 0,
    availability: availability,
    discontinued: availability === "discontinued",
    inStock: DeliCounter.effectiveInStock(availability, lbs, deliThreshold()),
    posSource: item.posSource || "manual",
    emoji: item.emoji || "",
    brand: item.brand || "",
    notes: item.notes || "",
    meatType: item.category === "cheese" ? "" : item.meatType || "other",
    meatTypeEdited: item.category === "cheese" ? false : !!item.meatTypeEdited,
    iconKey: item.iconKey || "",
    hiddenOnline: !!item.hiddenOnline,
    notOfferedOnline: !!item.notOfferedOnline,
    removed: !!item.removed,
  };
}

function deliSaveEdited(id, category) {
  if (!canEditOnlineDeli()) return;
  var existing = id ? deliFind(id) : null;
  var displayName = document.getElementById("deli-edit-name").value.trim();
  if (!displayName) {
    deliEditMessage("Enter a friendly name.");
    return;
  }
  var price = Number(document.getElementById("deli-edit-price").value);
  if (!isFinite(price) || price < 0) {
    deliEditMessage("Enter a price per pound.");
    return;
  }
  deliEditMessage("");
  var availability = document.getElementById("deli-edit-availability").value;
  if (["auto", "in", "out"].indexOf(availability) === -1) return;
  if (existing && DeliCounter.availabilityOf(existing) === "discontinued") availability = "discontinued";
  var meatType = category === "cheese" ? "" : document.getElementById("deli-edit-type").value;
  if (category !== "cheese" && DeliCounter.MEAT_TYPES.indexOf(meatType) === -1) return;
  var record = deliCounterRecord(existing, {
    id: existing ? existing.id : newId("mci"),
    category: category,
    displayName: displayName,
    displayNameCustom: true,
    meatType: meatType,
    meatTypeEdited: category !== "cheese",
    lbsOnHand: DeliCounter.normalizeLbs(document.getElementById("deli-edit-lbs").value),
    pricePerLb: Math.round(price * 100) / 100,
    availability: availability,
    toastName: document.getElementById("deli-edit-toast").value.trim(),
    sku: document.getElementById("deli-edit-sku").value.trim(),
    iconKey: document.getElementById("deli-edit-icon").value,
    hiddenOnline: document.getElementById("deli-edit-hidden").checked,
    notOfferedOnline: document.getElementById("deli-edit-offline").checked || DeliCounter.isChippedMeat({
      sku: document.getElementById("deli-edit-sku").value.trim(),
      toastName: document.getElementById("deli-edit-toast").value.trim(),
      displayName: displayName,
    }),
    notes: document.getElementById("deli-edit-notes").value.trim(),
    posSource: existing && existing.posSource ? existing.posSource : "manual",
    toastItemId: existing ? existing.toastItemId || "" : "",
  });
  deliPersistItems([record]).then(function () {
    deliManageNotice = "Saved " + displayName + ".";
    if (typeof renderPortalBody === "function") renderPortalBody();
    if (typeof renderMeatCheesePublic === "function") renderMeatCheesePublic();
    deliManageOnline();
  }).catch(function (err) {
    console.error("Save deli item failed:", err);
    deliEditMessage("Couldn't save that item. If this is a new login, the Firestore rules may still need to be deployed.");
  });
}

function deliPatchItem(id, patch, notice, options) {
  var item = deliFind(id);
  if (!item || !canEditOnlineDeli()) return;
  var record = deliCounterRecord(item, patch);
  var backToCase = options && options.returnTo === "case";
  deliPersistItems([record]).then(function () {
    deliManageNotice = notice;
    if (typeof renderMeatCheesePublic === "function") renderMeatCheesePublic();
    if (typeof renderPortalBody === "function") renderPortalBody();
    if (backToCase) closeModal();
    else deliManageOnline();
  }).catch(function (err) {
    console.error(err);
    var slot = document.getElementById("deli-confirm-slot");
    if (slot) {
      slot.hidden = false;
      slot.innerHTML = '<p class="deli-inline-error">Couldn\'t update that item.</p>';
    }
  });
}

function deliAskDiscontinue(id) {
  var item = deliFind(id);
  if (!item) return;
  var restoring = DeliCounter.availabilityOf(item) === "discontinued";
  deliAskConfirm(
    restoring
      ? "Put this back on the website when it is in stock?"
      : "Discontinue this? It stays off the website, even after a Toast import.",
    function () {
      deliPatchItem(id, { availability: restoring ? "auto" : "discontinued" }, restoring ? "Restored." : "Discontinued. It's off the website.");
    }
  );
}

function deliAskRemove(id) {
  var item = deliFind(id);
  if (!item) return;
  deliAskConfirm(
    "Remove " + (item.displayName || item.name) + "? Past orders keep the name. You can restore it under Removed.",
    function () { deliPatchItem(id, { removed: true }, "Removed. Past orders are unchanged."); }
  );
}

function deliAskHide(id) {
  var item = deliFind(id);
  if (!item) return;
  deliAskConfirm(
    "Hide " + (item.displayName || item.name) + "? It comes off the customer website. The case pieces stay.",
    function () { deliPatchItem(id, { hiddenOnline: true }, "Hidden. It's off the website.", { returnTo: "case" }); }
  );
}

function deliShowOnline(id) {
  deliPatchItem(id, { hiddenOnline: false }, "It's back on the website when it is in stock.", { returnTo: "case" });
}

function deliRestoreRemoved(id) {
  deliPatchItem(id, { removed: false }, "Restored.");
}

function deliSaveSettings() {
  if (!canEditOnlineDeli()) return;
  var threshold = Number(document.getElementById("deli-set-threshold").value);
  var meatMin = Number(document.getElementById("deli-set-min").value);
  var settingsMsg = document.getElementById("deli-settings-msg");
  if (!isFinite(threshold) || threshold < 0 || threshold > 5 || !isFinite(meatMin) || meatMin <= 0 || meatMin > 5) {
    if (settingsMsg) {
      settingsMsg.hidden = false;
      settingsMsg.textContent = "Check the out-of-stock threshold and the meat minimum.";
    }
    return;
  }
  if (settingsMsg) settingsMsg.hidden = true;
  var next = {
    outOfStockAtLbs: DeliCounter.normalizeLbs(threshold),
    meatMinLbs: DeliCounter.normalizeLbs(meatMin),
    storeOpen: document.getElementById("deli-set-open").value || "09:00",
    counterCloseWeekday: document.getElementById("deli-set-counter").value || "16:00",
    weekdayOrderCutoff: document.getElementById("deli-set-cutoff").value || "16:00",
    storeCloseWeekday: document.getElementById("deli-set-week-close").value || "18:00",
    storeCloseSaturday: document.getElementById("deli-set-sat-close").value || "14:00",
    hoursCopy: document.getElementById("deli-set-copy").value.trim() || DeliCounter.HOURS_COPY,
  };
  db.deliCounter = Object.assign({}, db.deliCounter, next);
  var stockUpdates = DeliCounter.recomputeAutoStock(db.meatCheeseItems || [], next.outOfStockAtLbs).map(function (update) {
    var item = deliFind(update.id);
    return Object.assign({}, item, { inStock: update.inStock });
  });
  var write = window.__deliPreview ? Promise.resolve() : fsdb.collection("store").doc("deliCounter").set(next, { merge: true });
  write.then(function () {
    return stockUpdates.length ? deliPersistItems(stockUpdates) : null;
  }).then(function () {
    deliManageNotice = "Settings saved.";
    if (typeof renderMeatCheesePublic === "function") renderMeatCheesePublic();
    deliManageOnline();
  }).catch(function (err) {
    console.error(err);
    if (settingsMsg) {
      settingsMsg.hidden = false;
      settingsMsg.textContent = "Couldn't save settings.";
    }
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
      openModal('<h3>Import Toast items</h3><p>That file could not be read as a Toast item export.</p>' +
        '<div class="modal-actions"><button type="button" class="btn" onclick="closeModal()">Close</button></div>');
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
    deliManageNotice = "Imported " + items.length + " deli items.";
    if (typeof renderPortalBody === "function") renderPortalBody();
    if (typeof renderMeatCheesePublic === "function") renderMeatCheesePublic();
    deliManageOnline();
  }).catch(function (err) {
    console.error("Deli import failed:", err);
    openModal('<h3>Import didn\'t save</h3><p>If you just updated the site, the Firestore rules may still need to be deployed.</p>' +
      '<div class="modal-actions"><button type="button" class="btn" onclick="closeModal()">Close</button></div>');
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
    if (!silent) {
      openModal('<h3>Starter stock</h3><p>Couldn\'t load the starter stock.</p>' +
        '<div class="modal-actions"><button type="button" class="btn" onclick="closeModal()">Close</button></div>');
    }
  });
}

function deliLoadStarter() {
  openModal('<h3>Load starter stock</h3>' +
    '<p>Load the starter deli list from the last Toast export? Existing case items with the same name are updated in place. Slots are not moved.</p>' +
    '<div class="modal-actions"><button type="button" class="btn outline" onclick="closeModal()">Cancel</button>' +
    '<button type="button" class="btn" onclick="deliConfirmStarter()">Yes, load it</button></div>');
}

function deliConfirmStarter() {
  closeModal();
  deliSeedFailed = false;
  deliSeedInFlight = false;
  deliApplyStarter(false);
}

function deliMaybeSeed() {
  if (window.__deliPreview || deliSeedInFlight || deliSeedFailed) return;
  if (typeof activeTab === "undefined" || activeTab !== "Meats & Cheese") return;
  if (typeof canManageOnlineDeli !== "function" || !canManageOnlineDeli()) return;
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
  var previousItems = [];
  var planWasShort = false;
  if (next === "pickedUp" && !order.stockDecremented) {
    var plan = DeliCounter.planPickupDecrement(db.meatCheeseItems || [], order, deliThreshold());
    planWasShort = plan.short.length > 0;
    plan.updates.forEach(function (update) {
      var item = deliFind(update.id);
      if (!item) return;
      previousItems.push({ id: item.id, lbsOnHand: item.lbsOnHand, inStock: item.inStock });
      itemWrites.push({
        id: update.id,
        lbsOnHand: update.lbsOnHand,
        inStock: update.inStock,
      });
    });
    patch.stockDecremented = true;
  }
  var previousOrder = {
    deliStatus: order.deliStatus,
    status: order.status,
    stockDecremented: !!order.stockDecremented,
  };
  order.deliStatus = next;
  order.status = patch.status;
  if (patch.stockDecremented) order.stockDecremented = true;
  var itemsSaved = false;
  var itemsDone = itemWrites.length ? deliPersistItems(itemWrites) : Promise.resolve();
  var orderDone = window.__deliPreview
    ? Promise.resolve()
    : fsdb.collection("orders").doc(id).update(patch);
  itemsDone.then(function () {
    itemsSaved = true;
    return orderDone;
  }).then(function () {
    if (itemWrites.length && planWasShort) {
      alert("Marked picked up. At least one item didn't have enough on hand, so its count was set to 0. Adjust the catalog if the scale says otherwise.");
    }
    deliOpenStaffOrder(order);
    if (typeof renderPortalBody === "function") renderPortalBody();
  }).catch(function (err) {
    console.error("Update deli order failed:", err);
    var denied = err && (err.code === "permission-denied" || /permission-denied/i.test(String(err.message || err)));
    order.deliStatus = previousOrder.deliStatus;
    order.status = previousOrder.status;
    order.stockDecremented = previousOrder.stockDecremented;
    if (!itemsSaved) {
      previousItems.forEach(function (prev) {
        var item = deliFind(prev.id);
        if (!item) return;
        item.lbsOnHand = prev.lbsOnHand;
        item.inStock = prev.inStock;
      });
      alert(denied
        ? "Couldn't mark this picked up. The pounds didn't come off the online menu, so nothing was saved. Try again, or ask a manager if it keeps happening."
        : "Couldn't update that order. Nothing was saved.");
    } else if (itemWrites.length) {
      alert(denied
        ? "The pounds came off the online menu, but the order was not marked Picked Up. Refresh Orders before trying again so the pounds are not taken off twice."
        : "The pounds came off the online menu, but the order status didn't save. Refresh Orders before trying again.");
    } else {
      alert(denied
        ? "Couldn't update that order. The portal isn't allowed to save this change."
        : "Couldn't update that order.");
    }
    deliOpenStaffOrder(order);
    if (typeof renderPortalBody === "function") renderPortalBody();
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
