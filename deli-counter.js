/* Deli counter stock and pickup orders.
   The physical case (meatCheeseSlots / meatCheeseBlocks) stays the shelf
   layout. This module is the catalog side: Toast or any later POS feeds
   normalized rows in, staff display names and meat types survive a
   re-import, and the public list groups meats independently of slot order.
   No live Toast API calls live here — registerPosAdapter() is the seam. */
var DeliCounter = (function () {
  var DEFAULT_THRESHOLD = 0.25;
  var MEAT_TYPES = ["chicken", "turkey", "ham", "beef", "other"];
  var MEAT_LABELS = {
    chicken: "Chicken",
    turkey: "Turkey",
    ham: "Ham",
    beef: "Beef",
    other: "Other",
  };
  var SLICE_STYLES = [
    { id: "shaved", label: "Shaved" },
    { id: "thin", label: "Thin" },
    { id: "medium", label: "Medium" },
    { id: "large", label: "Large" },
    { id: "thick", label: "Thick" },
  ];
  var MEAT_MIN_LB = 0.25;
  var HOURS_COPY =
    "Deli counter open Mon–Fri 9–4, Sat 9–2. Order by 4 PM on weekdays and pick up until 6 PM. Saturday pickup until 2 PM.";
  var DISCONTINUED_NAMES = {
    "smoked gouda": true,
    "caramelized onion jack": true,
    "horseradish cheddar": true,
  };
  /* Friendly names for the starter menu. Keys are normalized Toast names. */
  var DISPLAY_NAMES = {
    "chicken chipotle": "Chicken Chipotle",
    "chicken gldn clssc": "Golden Classic",
    "chicken honey bbq": "Honey BBQ",
    "chicken buffalo": "Buffalo",
    "chicken everroast": "Everroast",
    "chicken lemon pepper": "Lemon Pepper",
    "ichiban teriyaki chicken": "Ichiban Teriyaki",
    "turkey mesquite": "Mesquite",
    "turkey honey maple": "Honey Maple",
    "turkey ovengold": "Ovengold",
    "turkey pitcraft": "Pitcraft",
    "turkey hickory smoked black forest": "Hickory Smoked Black Forest",
    "cajun turkey": "Cajun",
    "turkey salsalito": "Salsalito",
    "ham smoke master black forest": "Smoke Master Black Forest",
    "ham sweet slice": "Sweet Slice",
    "london broil roast beef": "London Broil Roast Beef",
    "pastrami beef top rnd": "Pastrami Top Round",
    "corned beef top rnd": "Corned Beef Top Round",
    "3 pepper cojack": "3 Pepper Colby Jack",
    "aged gouda": "Aged Gouda",
    "american yellow": "American Yellow",
    "chipotle gouda": "Chipotle Gouda",
    "colby jack": "Colby Jack",
    "havarti plain": "Havarti Plain",
    "lacey swiss": "Lacey Swiss",
    "mozzarella": "Mozzarella",
    "provolone": "Provolone",
    "smoked cheddar": "Smoked Cheddar",
    "vermont cheddar": "Vermont Cheddar",
  };
  /* Names already on the case that should attach to a Toast row
     instead of becoming a second catalog item. */
  var MATCH_ALIASES = {
    "ichiban teriyaki chicken": ["teriyaki chicken", "ichiban teriyaki"],
    "chicken chipotle": ["chipotle chicken"],
    "chicken gldn clssc": ["golden classic", "chicken golden classic"],
    "chicken honey bbq": ["honey bbq chicken", "honey bbq"],
    "chicken buffalo": ["buffalo chicken"],
    "chicken everroast": ["everroast chicken"],
    "chicken lemon pepper": ["lemon pepper chicken"],
    "turkey mesquite": ["mesquite turkey"],
    "turkey honey maple": ["honey maple turkey"],
    "turkey ovengold": ["ovengold turkey"],
    "turkey pitcraft": ["pitcraft turkey"],
    "turkey hickory smoked black forest": ["hickory smoked black forest"],
    "cajun turkey": ["cajun"],
    "turkey salsalito": ["salsalito turkey"],
    "ham smoke master black forest": ["smoke master black forest"],
    "ham sweet slice": ["sweet slice ham"],
    "pastrami beef top rnd": ["pastrami top round"],
    "corned beef top rnd": ["corned beef top round"],
    "3 pepper cojack": ["3 pepper colby jack"],
  };

  var adapters = {};

  function normalizeName(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function tidyToastName(name) {
    var s = String(name || "").replace(/\s+/g, " ").trim();
    if (s && s === s.toUpperCase() && /[A-Z]/.test(s)) {
      return s.toLowerCase().replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
      });
    }
    return s;
  }

  function suggestedDisplayName(toastName) {
    var key = normalizeName(toastName);
    if (DISPLAY_NAMES[key]) return DISPLAY_NAMES[key];
    return tidyToastName(toastName);
  }

  function isDiscontinuedName(toastName) {
    return !!DISCONTINUED_NAMES[normalizeName(toastName)];
  }

  function normalizeLbs(value) {
    var n = Number(value);
    if (!isFinite(n) || n < 0) return 0;
    return Math.round(n * 1000) / 1000;
  }

  function normalizePrice(value) {
    var n = Number(value);
    if (!isFinite(n) || n < 0) return 0;
    return Math.round(n * 100) / 100;
  }

  function thresholdOf(value) {
    var n = Number(value);
    if (!isFinite(n) || n < 0) return DEFAULT_THRESHOLD;
    return Math.round(n * 1000) / 1000;
  }

  /* chicken, turkey, and ham win on the word itself. Beef is only the
     cuts the counter actually slices — a bare "beef" in some other name
     is not enough. */
  function detectMeatType(name) {
    var text = normalizeName(name);
    if (!text) return "other";
    if (/\bchicken\b/.test(text)) return "chicken";
    if (/\bturkey\b/.test(text)) return "turkey";
    if (/\bham\b/.test(text)) return "ham";
    if (
      text.indexOf("roast beef") !== -1 ||
      text.indexOf("rstbf") !== -1 ||
      text.indexOf("pastrami") !== -1 ||
      text.indexOf("corned beef") !== -1 ||
      text.indexOf("chipped meat") !== -1
    ) {
      return "beef";
    }
    return "other";
  }

  function effectiveInStock(availability, lbs, threshold) {
    var n = normalizeLbs(lbs);
    var limit = thresholdOf(threshold);
    switch (availability) {
      case "auto":
        return n > limit;
      case "in":
        return n > 0;
      case "out":
      case "discontinued":
        return false;
      default: {
        var unexpected = availability;
        throw new Error("Unknown deli availability: " + unexpected);
      }
    }
  }

function availabilityOf(item) {
  if (!item) return "auto";
  if (
    item.availability === "in" ||
    item.availability === "out" ||
    item.availability === "auto" ||
    item.availability === "discontinued"
  ) {
    return item.availability;
  }
  if (item.discontinued) return "discontinued";
  return "auto";
}

  function isCounterItem(item) {
    return !!(item && item.catalog === "counter");
  }

  function isChippedMeat(item) {
    if (!item) return false;
    if (String(item.sku || "") === "70238") return true;
    var names = [item.toastName, item.displayName, item.name];
    var i;
    for (i = 0; i < names.length; i++) {
      if (normalizeName(names[i]) === "chipped meat") return true;
    }
    return false;
  }

  function isOrderable(item, threshold, settings) {
    if (!isCounterItem(item)) return false;
    if (isChippedMeat(item)) return false;
    if (item.hiddenOnline || item.removed || item.notOfferedOnline) return false;
    var availability = availabilityOf(item);
    if (availability === "discontinued" || item.discontinued) return false;
    if (!effectiveInStock(availability, item.lbsOnHand, threshold)) return false;
    var meatMin = readHours(settings).meatMinLbs;
    if (item.category === "meat" && normalizeLbs(item.lbsOnHand) < meatMin - 1e-9) return false;
    return true;
  }

  function weightChoices(lbs) {
    var n = normalizeLbs(lbs);
    var out = [];
    var q;
    for (q = 0.25; q <= n + 1e-9; q = Math.round((q + 0.25) * 100) / 100) {
      out.push(Math.round(q * 100) / 100);
      if (out.length > 80) break;
    }
    if (!out.length && n > 0) out.push(n);
    return out;
  }

  /* One decimal style everywhere: 8.75, 0.25, 37.445. No mixed fractions. */
  function formatWeight(n) {
    var q = normalizeLbs(n);
    if (!isFinite(q)) return "0";
    return q.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  }

  /* Quarter-pound presets through 1 lb. minimum 0 still offers a remainder
   under 1/4 lb (cheese). Meats pass 0.25, so nothing under that is chosen. */
  function defaultOrderWeight(onHand, alreadyRequested, minimum) {
    var have = normalizeLbs(normalizeLbs(onHand) - normalizeLbs(alreadyRequested || 0));
    if (have < 0) have = 0;
    var min = minimum == null ? 0 : Number(minimum);
    var presets = [0.25, 0.5, 0.75, 1];
    if (have > 0 && have < 0.25 && have + 1e-9 >= min) presets.unshift(have);
    var best = null;
    presets.forEach(function (weight) {
      if (weight + 1e-9 < min) return;
      if (weight <= have + 1e-9 && (best == null || weight > best)) best = weight;
    });
    return best;
  }

  function minimumMessage(category, weight, minLbs) {
    if (category !== "meat") return "";
    var want = Number(weight);
    if (!isFinite(want) || want <= 0) return "";
    var min = minLbs == null || !isFinite(Number(minLbs)) ? MEAT_MIN_LB : normalizeLbs(minLbs);
    if (want < min - 1e-9) {
      var label = Math.abs(min - 0.25) < 1e-9 ? "1/4 lb" : formatWeight(min) + " lb";
      return "Minimum order is " + label + ".";
    }
    return "";
  }

function stockMessage(onHand, requested) {
    var want = Number(requested);
    if (!isFinite(want) || want <= 0) return "";
    var have = normalizeLbs(onHand);
    if (want > have + 1e-9) {
      return "Sorry, we don't have enough to fill this order. We have about " + formatWeight(have) + " lb on hand.";
    }
    return "";
  }

  function byDisplayName(a, b) {
    var an = (a.displayName || a.name || "").toLowerCase();
    var bn = (b.displayName || b.name || "").toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  }

  function meatTypeOf(item) {
    if (item && item.meatType && MEAT_LABELS[item.meatType]) return item.meatType;
    return detectMeatType((item && (item.toastName || item.displayName || item.name)) || "");
  }

  function groupCatalog(items, threshold, options) {
    var publicOnly = !!(options && options.publicOnly);
    var settings = options && options.settings;
    var limit = thresholdOf(threshold);
    var buckets = { chicken: [], turkey: [], ham: [], beef: [], other: [] };
    var cheeses = [];
    (items || []).forEach(function (item) {
      if (!item) return;
      var orderable = isCounterItem(item) ? isOrderable(item, limit, settings) : (item.availableWeight || 0) > 0 && item.discontinued !== true && !isChippedMeat(item);
      if (publicOnly && !orderable) return;
      if (item.category === "cheese") {
        cheeses.push(item);
        return;
      }
      if (item.category !== "meat" && !isCounterItem(item)) return;
      var type = item.category === "meat" || isCounterItem(item) ? meatTypeOf(item) : "other";
      if (item.category === "cheese") return;
      if (!buckets[type]) type = "other";
      if (item.category === "meat" || (isCounterItem(item) && item.category !== "cheese")) {
        buckets[type].push(item);
      }
    });
    var meats = [];
    MEAT_TYPES.forEach(function (type) {
      if (publicOnly && type === "other") return;
      var list = buckets[type].slice().sort(byDisplayName);
      if (!list.length) return;
      meats.push({ type: type, label: MEAT_LABELS[type], items: list });
    });
    cheeses.sort(byDisplayName);
    return { meats: meats, cheeses: cheeses };
  }

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var cell = "";
    var inQuotes = false;
    var i;
    var c;
    var src = String(text || "").replace(/^\uFEFF/, "");
    for (i = 0; i < src.length; i++) {
      c = src[i];
      if (inQuotes) {
        if (c === '"') {
          if (src[i + 1] === '"') {
            cell += '"';
            i++;
          } else inQuotes = false;
        } else cell += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && src[i + 1] === "\n") i++;
        row.push(cell);
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
        cell = "";
      } else cell += c;
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows;
  }

  function headerMap(headers) {
    var map = {};
    headers.forEach(function (header, index) {
      var key = String(header || "")
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase();
      if (!(key in map)) map[key] = index;
    });
    return map;
  }

  function cell(row, map, key) {
    if (!(key in map)) return "";
    return row[map[key]] == null ? "" : String(row[map[key]]).trim();
  }

  function parseMoney(value) {
    var t = String(value || "")
      .replace(/[$,\s]/g, "")
      .replace(/^'+/, "");
    if (!t || t === "-" || t === ".") return null;
    var n = Number(t);
    if (!isFinite(n)) return null;
    return Math.round(n * 100) / 100;
  }

  function parseQty(value) {
    var t = String(value || "").replace(/,/g, "").trim();
    if (!t) return 0;
    var n = Number(t);
    if (!isFinite(n)) return 0;
    return n;
  }

  function isJerky(name) {
    return /\bjerky\b/i.test(name || "");
  }

  function categoryId(label) {
    if (label === "Deli Meat") return "meat";
    if (label === "Deli Cheese") return "cheese";
    return "";
  }

  function parseToastExportCsv(text) {
    var table = parseCsv(text);
    var accepted = [];
    var skipped = [];
    if (!table.length) return { accepted: accepted, skipped: skipped };
    var map = headerMap(table[0]);
    var r;
    for (r = 1; r < table.length; r++) {
      var cols = table[r];
      var toastName = cell(cols, map, "name");
      var categoryLabel = cell(cols, map, "category");
      var category = categoryId(categoryLabel);
      if (!toastName) continue;
      if (!category) {
        skipped.push({ name: toastName, category: categoryLabel, reason: "category" });
        continue;
      }
      if (isJerky(toastName)) {
        skipped.push({ name: toastName, category: categoryLabel, reason: "jerky" });
        continue;
      }
      var pricePerLb = parseMoney(cell(cols, map, "price"));
      if (pricePerLb == null) {
        skipped.push({ name: toastName, category: categoryLabel, reason: "price" });
        continue;
      }
      var quantityRaw = parseQty(cell(cols, map, "inventory quantity"));
      accepted.push({
        toastItemId: cell(cols, map, "item id"),
        sku: cell(cols, map, "barcode"),
        toastName: toastName.replace(/\s+/g, " ").trim(),
        category: category,
        quantityRaw: quantityRaw,
        lbsOnHand: normalizeLbs(quantityRaw),
        pricePerLb: pricePerLb,
      });
    }
    accepted = accepted.filter(function (row) {
      if (!row.toastItemId) {
        skipped.push({ name: row.toastName, category: row.category, reason: "id" });
        return false;
      }
      return true;
    });
    return { accepted: accepted, skipped: skipped };
  }

  function registerPosAdapter(adapter) {
    if (!adapter || !adapter.id || typeof adapter.parse !== "function") {
      throw new Error("A POS adapter needs an id and a parse function.");
    }
    adapters[adapter.id] = adapter;
    return adapter;
  }

  function getPosAdapter(id) {
    var adapter = adapters[id];
    if (!adapter) throw new Error("Unknown POS adapter: " + id);
    return adapter;
  }

  function listPosAdapters() {
    return Object.keys(adapters).map(function (id) {
      return { id: id, label: adapters[id].label || id };
    });
  }

  registerPosAdapter({
    id: "toast-csv",
    label: "Toast Export items CSV",
    parse: parseToastExportCsv,
  });

  function matchKeysForRow(row) {
    var keys = {};
    function add(value) {
      var key = normalizeName(value);
      if (key) keys[key] = true;
    }
    add(row.toastName);
    add(suggestedDisplayName(row.toastName));
    (MATCH_ALIASES[normalizeName(row.toastName)] || []).forEach(add);
    return keys;
  }

  function itemMatchKeys(item) {
    var keys = {};
    function add(value) {
      var key = normalizeName(value);
      if (key) keys[key] = true;
    }
    add(item.toastName);
    add(item.displayName);
    add(item.name);
    return keys;
  }

  function findMatch(counters, row, usedIds) {
    var i;
    for (i = 0; i < counters.length; i++) {
      var item = counters[i];
      if (usedIds[item.id]) continue;
      if (item.toastItemId && item.toastItemId === row.toastItemId) return item;
    }
    var wanted = matchKeysForRow(row);
    for (i = 0; i < counters.length; i++) {
      var candidate = counters[i];
      if (usedIds[candidate.id]) continue;
      if (candidate.toastItemId && candidate.toastItemId !== row.toastItemId) continue;
      var have = itemMatchKeys(candidate);
      var key;
      for (key in wanted) {
        if (Object.prototype.hasOwnProperty.call(wanted, key) && have[key]) return candidate;
      }
    }
    return null;
  }

  function toItem(fields) {
    var availability = fields.availability;
    var lbs = normalizeLbs(fields.lbsOnHand);
    var pricePerLb = normalizePrice(fields.pricePerLb);
    var inStock = effectiveInStock(availability, lbs, fields.threshold);
    var displayName = String(fields.displayName || "").trim() || suggestedDisplayName(fields.toastName);
    var meatType = fields.category === "cheese" ? "" : fields.meatType || detectMeatType(fields.toastName || displayName);
    return {
      id: fields.id,
      catalog: "counter",
      category: fields.category,
      toastItemId: fields.toastItemId,
      sku: fields.sku || "",
      toastName: fields.toastName,
      name: displayName,
      displayName: displayName,
      displayNameCustom: !!fields.displayNameCustom,
      price: pricePerLb.toFixed(2),
      pricePerLb: pricePerLb,
      lbsOnHand: lbs,
      availableWeight: fields.availableWeight != null ? fields.availableWeight : 0,
      inStock: inStock,
      availability: availability,
      discontinued: availability === "discontinued",
      posSource: fields.posSource || "toast-csv",
      emoji: fields.emoji || "",
      brand: fields.brand || "",
      notes: fields.notes || "",
      meatType: meatType,
      meatTypeEdited: !!fields.meatTypeEdited,
      iconKey: fields.iconKey || "",
      hiddenOnline: !!fields.hiddenOnline,
      notOfferedOnline: !!fields.notOfferedOnline,
      removed: !!fields.removed,
    };
  }

function seedAvailability(row) {
    if (isDiscontinuedName(row.toastName)) return "discontinued";
    return "auto";
  }

  function applyPosRows(existing, rows, options) {
    var threshold = thresholdOf(options && options.threshold);
    var seed = !!(options && options.seed);
    var counters = (existing || []).filter(function (item) {
      return item && (item.catalog === "counter" || item.category === "meat" || item.category === "cheese");
    });
    var used = {};
    return (rows || []).map(function (row) {
      var match = findMatch(counters, row, used);
      if (match) used[match.id] = true;
      if (!match) {
        var createdAvailability = seed ? seedAvailability(row) : isDiscontinuedName(row.toastName) ? "discontinued" : "auto";
        var created = toItem({
          id: row.toastItemId,
          threshold: threshold,
          availability: createdAvailability,
          displayName: suggestedDisplayName(row.toastName),
          displayNameCustom: false,
          toastItemId: row.toastItemId,
          sku: row.sku,
          toastName: row.toastName,
          category: row.category,
          lbsOnHand: row.lbsOnHand,
          pricePerLb: row.pricePerLb,
          meatType: row.category === "cheese" ? "" : detectMeatType(row.toastName),
          meatTypeEdited: false,
          availableWeight: 0,
          posSource: "toast-csv",
          iconKey: "",
          hiddenOnline: false,
          notOfferedOnline: String(row.sku || "") === "70238" || normalizeName(row.toastName) === "chipped meat",
          removed: false,
        });
        return {
          action: "create",
          item: created,
          keptDisplayName: false,
          stayedDiscontinued: created.discontinued,
        };
      }
      var previous = availabilityOf(match);
      var availability = previous === "discontinued" || match.discontinued ? "discontinued" : previous === "in" ? "in" : "auto";
      if (!seed && isDiscontinuedName(row.toastName) && !match.toastItemId && !match.displayNameCustom) {
        availability = "discontinued";
      }
      var firstLink = !match.toastItemId;
      var displayName;
      var displayNameCustom = !!match.displayNameCustom;
      if (displayNameCustom && (match.displayName || match.name)) {
        displayName = match.displayName || match.name;
      } else if (firstLink) {
        displayName = suggestedDisplayName(row.toastName);
        displayNameCustom = false;
      } else {
        displayName = match.displayName || match.name || suggestedDisplayName(row.toastName);
      }
      var meatTypeEdited = !!match.meatTypeEdited;
      var meatType = match.category === "cheese" || row.category === "cheese"
        ? ""
        : meatTypeEdited
          ? meatTypeOf(match)
          : detectMeatType(row.toastName);
      var item = toItem({
        id: match.id,
        threshold: threshold,
        availability: availability,
        displayName: displayName,
        displayNameCustom: displayNameCustom,
        toastItemId: row.toastItemId,
        sku: row.sku || match.sku || "",
        toastName: row.toastName,
        category: match.category === "meat" || match.category === "cheese" ? match.category : row.category,
        lbsOnHand: row.lbsOnHand,
        pricePerLb: row.pricePerLb,
        meatType: meatType,
        meatTypeEdited: meatTypeEdited,
        availableWeight: match.availableWeight != null ? match.availableWeight : 0,
        emoji: match.emoji || "",
        brand: match.brand || "",
        notes: match.notes || "",
        posSource: match.posSource || "toast-csv",
        iconKey: match.iconKey || "",
        hiddenOnline: !!match.hiddenOnline,
        notOfferedOnline: !!match.notOfferedOnline || String(row.sku || match.sku || "") === "70238" || normalizeName(row.toastName) === "chipped meat",
        removed: !!match.removed,
      });
      return {
        action: "update",
        item: item,
        keptDisplayName: !firstLink || displayNameCustom,
        stayedDiscontinued: item.discontinued,
      };
    });
  }

  function starterRows() {
    if (typeof DELI_COUNTER_SEED_ROWS !== "undefined" && DELI_COUNTER_SEED_ROWS) {
      return DELI_COUNTER_SEED_ROWS;
    }
    return [];
  }

  function starterCatalog(threshold) {
    return applyPosRows([], starterRows(), { threshold: thresholdOf(threshold), seed: true }).map(function (result) {
      return result.item;
    });
  }

  function recomputeAutoStock(items, threshold) {
    var limit = thresholdOf(threshold);
    var updates = [];
    (items || []).forEach(function (item) {
      if (!isCounterItem(item)) return;
      if (availabilityOf(item) !== "auto") return;
      var inStock = effectiveInStock("auto", item.lbsOnHand, limit);
      if (item.inStock === inStock) return;
      updates.push({ id: item.id, inStock: inStock });
    });
    return updates;
  }

  function isoFromDate(date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
  }

  function parseISODate(iso) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!match) return null;
    var y = Number(match[1]);
    var m = Number(match[2]);
    var d = Number(match[3]);
    var date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }

  function toHHMM(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function toMinutes(hhmm) {
    var parts = String(hhmm || "").split(":");
    if (parts.length < 2) return NaN;
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  /* Store pickup: Mon–Fri 9–6, Sat 9–2, closed Sunday.
     Same-day weekday pickup after the counter closes (until 6) is only
     for orders placed by 4:00 PM. Saturday never extends past 2. */
  function clockMinutes(value, fallback) {
    if (typeof value === "number" && isFinite(value)) return value;
    var match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ""));
    if (!match) return fallback;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function readHours(settings) {
    var s = settings || {};
    return {
      open: clockMinutes(s.storeOpen, 9 * 60),
      weekdayClose: clockMinutes(s.storeCloseWeekday, 18 * 60),
      saturdayClose: clockMinutes(s.storeCloseSaturday, 14 * 60),
      weekdayCutoff: clockMinutes(s.weekdayOrderCutoff, 16 * 60),
      meatMinLbs: s.meatMinLbs != null && isFinite(Number(s.meatMinLbs)) ? normalizeLbs(s.meatMinLbs) : MEAT_MIN_LB,
      hoursCopy: s.hoursCopy || HOURS_COPY,
    };
  }

  function hoursFor(dateISO, now, settings) {
    var date = parseISODate(dateISO);
    if (!date) return null;
    var dow = date.getDay();
    if (dow === 0) return null;
    var hours = readHours(settings);
    var close = dow === 6 ? hours.saturdayClose : hours.weekdayClose;
    if (now && isoFromDate(now) === dateISO) {
      var nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (dow === 6 && nowMinutes > hours.saturdayClose) return null;
      if (dow !== 6 && nowMinutes > hours.weekdayCutoff) return null;
    }
    return { open: hours.open, close: close };
  }

  function closedMap(closedDates) {
    var map = {};
    (closedDates || []).forEach(function (entry) {
      var iso = typeof entry === "string" ? entry : entry && entry.id;
      if (iso) map[iso] = true;
    });
    return map;
  }

  function pickupTimes(dateISO, now, closedDates, settings) {
    if (closedMap(closedDates)[dateISO]) return [];
    var hours = hoursFor(dateISO, now, settings);
    if (!hours) return [];
    var times = [];
    var minute;
    for (minute = hours.open; minute <= hours.close; minute += 15) times.push(toHHMM(minute));
    if (isoFromDate(now) !== dateISO) return times;
    var nowMinutes = now.getHours() * 60 + now.getMinutes();
    return times.filter(function (time) {
      return toMinutes(time) >= nowMinutes;
    });
  }

  function pickupDates(now, closedDates, days, settings) {
    var span = days || 21;
    var out = [];
    var i;
    for (i = 0; i < span; i++) {
      var date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      var iso = isoFromDate(date);
      if (pickupTimes(iso, now, closedDates, settings).length) out.push(iso);
    }
    return out;
  }

  function validatePickup(dateISO, timeStr, options) {
    var now = (options && options.now) || new Date();
    var closed = closedMap(options && options.closedDates);
    if (!parseISODate(dateISO)) return "Choose a pickup date.";
    if (closed[dateISO]) {
      return "We're closed that day — please choose a different pickup date.";
    }
    var date = parseISODate(dateISO);
    if (date.getDay() === 0) {
      return "We're closed Sundays for pickup — please choose a Monday through Saturday date.";
    }
    var hours = hoursFor(dateISO, now, options && options.settings);
    var minutes = toMinutes(timeStr);
    if (!hours) {
      if (date.getDay() !== 0 && isoFromDate(now) === dateISO) {
        return date.getDay() === 6
          ? "Saturday pickup ends at 2:00 PM. Please choose the next open day."
          : "Weekday orders placed after 4:00 PM are picked up the next open day.";
      }
      return "Choose a pickup time during store hours.";
    }
    if (!isFinite(minutes) || minutes < hours.open || minutes > hours.close) {
      return date.getDay() === 6
        ? "Saturday pickup is 9:00 AM to 2:00 PM."
        : "Weekday pickup is 9:00 AM to 6:00 PM. Order by 4:00 PM for same-day pickup.";
    }
    var allowed = pickupTimes(dateISO, now, options && options.closedDates, options && options.settings);
    if (allowed.indexOf(timeStr) === -1) {
      return "That pickup time has already passed. Choose a later time.";
    }
    return "";
  }

  function phoneOk(phone) {
    var digits = String(phone || "").replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15 && String(phone).trim().length <= 40;
  }

  function buildOrder(input) {
    var threshold = thresholdOf(input && input.threshold);
    var name = String((input && input.customerName) || "").trim();
    var phone = String((input && input.customerPhone) || "").trim();
    var notes = String((input && input.notes) || "").trim();
    if (name.length < 2 || name.length > 80) return { ok: false, error: "Please enter the name for the order." };
    if (!phoneOk(phone)) return { ok: false, error: "Please enter a phone number we can reach you at." };
    if (notes.length > 300) return { ok: false, error: "Please keep the order note under 300 characters." };
    var when = validatePickup(input.pickupDate, input.pickupTime, input);
    if (when) return { ok: false, error: when };
    var lines = input.lines || [];
    if (!lines.length) return { ok: false, error: "Add at least one meat or cheese." };
    if (lines.length > 8) return { ok: false, error: "An online deli order can have up to 8 items. Call the store for a larger order." };
    var byId = input.itemsById || {};
    var requested = {};
    var items = [];
    var i;
    for (i = 0; i < lines.length; i++) {
      var line = lines[i];
      var item = byId[line.itemId];
      if (!item || !isOrderable(item, threshold, input.settings)) {
        return { ok: false, error: "One of those items just went out of stock. Take another look at the list." };
      }
      var weight = normalizeLbs(line.weightLbs);
      var tooSmall = minimumMessage(item.category, weight, input.settings && input.settings.meatMinLbs);
      if (tooSmall) return { ok: false, error: tooSmall };
      var choices = weightChoices(item.lbsOnHand);
      var allowedWeight = choices.some(function (choice) {
        return Math.abs(choice - weight) < 1e-9;
      });
      if (!allowedWeight) {
        return { ok: false, error: "Choose a weight we can cut for " + (item.displayName || item.name) + "." };
      }
      requested[item.id] = normalizeLbs((requested[item.id] || 0) + weight);
      if (requested[item.id] - normalizeLbs(item.lbsOnHand) > 1e-9) {
        return {
          ok: false,
          error: stockMessage(item.lbsOnHand, requested[item.id]) || "Sorry, we don't have enough to fill this order.",
        };
      }
      var style = SLICE_STYLES.filter(function (entry) { return entry.id === line.sliceStyle; })[0];
      if (!style) return { ok: false, error: "Choose how you'd like " + (item.displayName || item.name) + " sliced." };
      var note = String(line.note || "").trim();
      if (note.length > 140) return { ok: false, error: "Please keep each item note shorter." };
      items.push({
        kind: "meatcheese",
        catalog: "counter",
        itemId: item.id,
        name: item.displayName || item.name,
        weightLbs: weight,
        sliceStyle: style.id,
        sliceStyleLabel: style.label,
        pricePerLb: normalizePrice(item.pricePerLb),
        note: note,
        lineId: line.lineId || "li" + (i + 1),
        qty: 1,
      });
    }
    return {
      ok: true,
      order: {
        channel: "deliCounter",
        customerName: name,
        customerPhone: phone,
        pickupDate: input.pickupDate,
        pickupTime: input.pickupTime,
        notes: notes,
        items: items,
        deliStatus: "new",
        status: "incomplete",
        payAtPickup: true,
        stockDecremented: false,
        submittedAt: input.submittedAt || new Date().toISOString(),
        autoprinted: false,
        weekKey: "",
      },
    };
  }

  function planPickupDecrement(catalog, order, threshold) {
    var limit = thresholdOf(threshold);
    var need = {};
    (order && order.items || []).forEach(function (line) {
      if (!line || !line.itemId) return;
      need[line.itemId] = normalizeLbs((need[line.itemId] || 0) + (Number(line.weightLbs) || 0));
    });
    var updates = [];
    var short = [];
    Object.keys(need).forEach(function (id) {
      var item = (catalog || []).filter(function (entry) { return entry.id === id; })[0];
      if (!item) {
        short.push({ itemId: id, missing: true, requested: need[id] });
        return;
      }
      var have = normalizeLbs(item.lbsOnHand);
      var take = need[id];
      var next = normalizeLbs(Math.max(0, have - take));
      if (take - have > 1e-9) {
        short.push({
          itemId: id,
          name: item.displayName || item.name,
          requested: take,
          have: have,
        });
      }
      var availability = availabilityOf(item);
      updates.push({
        id: id,
        lbsOnHand: next,
        inStock: effectiveInStock(availability, next, limit),
        availability: availability,
        discontinued: availability === "discontinued",
      });
    });
    return { updates: updates, short: short };
  }

  return {
    DEFAULT_THRESHOLD: DEFAULT_THRESHOLD,
    MEAT_TYPES: MEAT_TYPES,
    MEAT_LABELS: MEAT_LABELS,
    SLICE_STYLES: SLICE_STYLES,
    MEAT_MIN_LB: MEAT_MIN_LB,
    HOURS_COPY: HOURS_COPY,
    readHours: readHours,
    isChippedMeat: isChippedMeat,
    minimumMessage: minimumMessage,
    normalizeName: normalizeName,
    suggestedDisplayName: suggestedDisplayName,
    isDiscontinuedName: isDiscontinuedName,
    normalizeLbs: normalizeLbs,
    detectMeatType: detectMeatType,
    meatTypeOf: meatTypeOf,
    effectiveInStock: effectiveInStock,
    availabilityOf: availabilityOf,
    isOrderable: isOrderable,
    weightChoices: weightChoices,
    formatWeight: formatWeight,
    stockMessage: stockMessage,
    defaultOrderWeight: defaultOrderWeight,
    groupCatalog: groupCatalog,
    parseToastExportCsv: parseToastExportCsv,
    registerPosAdapter: registerPosAdapter,
    getPosAdapter: getPosAdapter,
    listPosAdapters: listPosAdapters,
    applyPosRows: applyPosRows,
    starterCatalog: starterCatalog,
    recomputeAutoStock: recomputeAutoStock,
    hoursFor: hoursFor,
    pickupDates: pickupDates,
    pickupTimes: pickupTimes,
    validatePickup: validatePickup,
    buildOrder: buildOrder,
    planPickupDecrement: planPickupDecrement,
    isoFromDate: isoFromDate,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = DeliCounter;
}
