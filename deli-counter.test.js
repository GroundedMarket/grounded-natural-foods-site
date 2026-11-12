const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const DC = require("./deli-counter.js");
const Icons = require("./deli-icons.js");
require("./deli-counter-seed.js");

const catalog = () => DC.starterCatalog(0.25);

test("starter catalog keeps deli meat and cheese only", () => {
  const items = catalog();
  assert.equal(items.length, 69);
  items.forEach((item) => {
    assert.ok(item.category === "meat" || item.category === "cheese");
    assert.equal(/\bjerky\b/i.test(item.toastName), false);
    assert.equal(/tray/i.test(item.toastName), false);
  });
});

test("public list is the owner's 19 meats and 10 cheeses, grouped and alphabetized", () => {
  const grouped = DC.groupCatalog(catalog(), 0.25, { publicOnly: true });
  const names = (group) => group.items.map((item) => item.displayName);
  assert.deepEqual(grouped.meats.map((group) => group.label), ["Chicken", "Turkey", "Ham", "Beef"]);
  assert.deepEqual(names(grouped.meats[0]), [
    "Buffalo",
    "Chicken Chipotle",
    "Everroast",
    "Golden Classic",
    "Honey BBQ",
    "Ichiban Teriyaki",
  ]);
  assert.deepEqual(names(grouped.meats[1]), [
    "Cajun",
    "Hickory Smoked Black Forest",
    "Honey Maple",
    "Mesquite",
    "Ovengold",
    "Pitcraft",
    "Salsalito",
  ]);
  assert.deepEqual(names(grouped.meats[2]), ["Smoke Master Black Forest", "Sweet Slice"]);
  assert.deepEqual(names(grouped.meats[3]), [
    "Corned Beef Top Round",
    "London Broil Roast Beef",
    "Pastrami Top Round",
  ]);
  assert.deepEqual(
    grouped.cheeses.map((item) => item.displayName),
    [
      "3 Pepper Colby Jack",
      "Aged Gouda",
      "American Yellow",
      "Chipotle Gouda",
      "Colby Jack",
      "Havarti Plain",
      "Lacey Swiss",
      "Provolone",
      "Smoked Cheddar",
      "Vermont Cheddar",
    ]
  );
});

test("the staff case follows the catalog and keeps hidden items", () => {
  const items = [
    { id: "c1", catalog: "counter", category: "meat", meatType: "chicken", displayName: "Buffalo", lbsOnHand: 2, inStock: true, availability: "auto" },
    { id: "c2", catalog: "counter", category: "meat", meatType: "chicken", displayName: "Chipotle", lbsOnHand: 1, inStock: true, hiddenOnline: true, availability: "auto" },
    { id: "c3", catalog: "counter", category: "meat", meatType: "turkey", displayName: "Ovengold", lbsOnHand: 0, inStock: false, availability: "auto" },
    { id: "c4", catalog: "counter", category: "cheese", displayName: "Provolone", lbsOnHand: 3, inStock: true, availability: "auto" },
    { id: "c5", catalog: "counter", category: "cheese", displayName: "Smoked Gouda", lbsOnHand: 4, discontinued: true, availability: "discontinued" },
    { id: "c6", catalog: "counter", category: "cheese", displayName: "Gone", lbsOnHand: 2, removed: true, availability: "auto" },
    { id: "c7", catalog: "counter", category: "meat", meatType: "beef", displayName: "Roast Beef", lbsOnHand: 0.1, inStock: false, availability: "auto" },
  ];
  const shown = DC.staffCaseGroups(items, { showOutOfStock: false });
  assert.deepEqual(shown.meats.map((group) => group.label), ["Chicken", "Beef"]);
  assert.deepEqual(shown.meats[0].items.map((item) => item.displayName), ["Buffalo", "Chipotle"]);
  assert.equal(shown.meats[0].items[1].hiddenOnline, true);
  assert.deepEqual(shown.cheeses.map((item) => item.displayName), ["Provolone"]);
  const withOut = DC.staffCaseGroups(items, { showOutOfStock: true });
  const outNames = withOut.meats.flatMap((group) => group.items.map((item) => item.displayName));
  assert.ok(outNames.includes("Ovengold"));
  assert.equal(withOut.cheeses.some((item) => item.displayName === "Smoked Gouda"), false);
  assert.equal(withOut.cheeses.some((item) => item.displayName === "Gone"), false);
});

test("negative Toast quantities are stored as 0 lb and out of stock", () => {
  const items = catalog();
  ["Chipped Meat", "Turkey Cracked Pepper", "Muenster"].forEach((name) => {
    const item = items.find((entry) => entry.toastName === name);
    assert.ok(item, name);
    assert.equal(item.lbsOnHand, 0);
    assert.equal(item.inStock, false);
    assert.equal(DC.isOrderable(item, 0.25), false);
  });
});

test("discontinued cheeses stay off the public list", () => {
  const items = catalog();
  ["Smoked Gouda", "CARAMELIZED ONION JACK", "Horseradish Cheddar", "Mozzarella"].forEach((name) => {
    const item = items.find((entry) => entry.toastName === name);
    assert.equal(item.discontinued, true);
    assert.equal(item.availability, "discontinued");
    assert.equal(DC.isOrderable(item, 0.25), false);
  });
  const grouped = DC.groupCatalog(items, 0.25, { publicOnly: true });
  const publicNames = grouped.cheeses.map((item) => item.toastName);
  assert.equal(publicNames.includes("Smoked Gouda"), false);
});

test("meat type is detected from the Toast name", () => {
  assert.equal(DC.detectMeatType("Chicken Gldn Clssc"), "chicken");
  assert.equal(DC.detectMeatType("ICHIBAN TERIYAKI CHICKEN"), "chicken");
  assert.equal(DC.detectMeatType("CAJUN TURKEY"), "turkey");
  assert.equal(DC.detectMeatType("Ham Sweet Slice"), "ham");
  assert.equal(DC.detectMeatType("Rstbf Deluxe"), "beef");
  assert.equal(DC.detectMeatType("Pastrami Beef Top Rnd"), "beef");
  assert.equal(DC.detectMeatType("Corned Beef Top Rnd"), "beef");
  assert.equal(DC.detectMeatType("Chipped Meat"), "beef");
  assert.equal(DC.detectMeatType("London Broil Roast Beef"), "beef");
  assert.equal(DC.detectMeatType("Salami Metro Genoa"), "other");
  assert.equal(DC.detectMeatType("Pepperoni Metro"), "other");
});

test("a meat under 1/4 lb is not orderable, including Lemon Pepper", () => {
  const lemon = catalog().find((item) => item.displayName === "Lemon Pepper");
  assert.equal(lemon.lbsOnHand, 0.2);
  assert.equal(lemon.availability, "auto");
  assert.equal(DC.isOrderable(lemon, 0.25), false);
  assert.equal(DC.minimumMessage("meat", 0.1), "Minimum order is 1/4 lb.");
  assert.equal(DC.minimumMessage("cheese", 0.1), "");
  assert.equal(DC.defaultOrderWeight(0.2, 0, 0.25), null);
  assert.equal(DC.defaultOrderWeight(0.2), 0.2);
  const chipped = catalog().find((item) => item.toastName === "Chipped Meat");
  chipped.lbsOnHand = 4;
  chipped.inStock = true;
  chipped.availability = "in";
  assert.equal(DC.isChippedMeat(chipped), true);
  assert.equal(DC.isOrderable(chipped, 0.25), false);
  assert.equal(DC.SLICE_STYLES.some((style) => style.id === "chipped"), false);
  assert.equal(DC.effectiveInStock("auto", 0.25, 0.25), false);
  assert.equal(DC.effectiveInStock("auto", 0.26, 0.25), true);
  assert.equal(DC.effectiveInStock("auto", -2, 0.25), false);
});

test("re-import keeps a custom display name, edited meat type, and discontinued flag", () => {
  const chipotle = {
    id: "case-chipotle",
    category: "meat",
    name: "Chipotle Chicken",
    emoji: "🍗",
    availableWeight: 0,
  };
  const row = {
    toastItemId: "toast-chipotle",
    sku: "70230",
    toastName: "Chicken Chipotle",
    category: "meat",
    lbsOnHand: 4,
    pricePerLb: 11.99,
  };
  const first = DC.applyPosRows([chipotle], [row], { threshold: 0.25 })[0];
  assert.equal(first.action, "update");
  assert.equal(first.item.id, "case-chipotle");
  assert.equal(first.item.displayName, "Chicken Chipotle");
  assert.equal(first.item.emoji, "🍗");
  assert.equal(first.item.meatType, "chicken");

  const edited = Object.assign({}, first.item, {
    displayName: "House Chipotle",
    name: "House Chipotle",
    displayNameCustom: true,
    meatType: "other",
    meatTypeEdited: true,
    availability: "discontinued",
    discontinued: true,
  });
  const again = DC.applyPosRows([edited], [Object.assign({}, row, { lbsOnHand: 9, pricePerLb: 10.5 })], {
    threshold: 0.25,
  })[0];
  assert.equal(again.item.displayName, "House Chipotle");
  assert.equal(again.item.meatType, "other");
  assert.equal(again.item.discontinued, true);
  assert.equal(again.item.inStock, false);
  assert.equal(again.item.lbsOnHand, 9);
  assert.equal(again.item.pricePerLb, 10.5);
  assert.equal(DC.isOrderable(again.item, 0.25), false);
});

test("a discontinued item is not revived when the CSV shows it back in stock", () => {
  const gouda = catalog().find((item) => item.toastName === "Smoked Gouda");
  const row = {
    toastItemId: gouda.toastItemId,
    sku: gouda.sku,
    toastName: gouda.toastName,
    category: "cheese",
    lbsOnHand: 6,
    pricePerLb: 8.99,
  };
  const next = DC.applyPosRows([gouda], [row], { threshold: 0.25 })[0];
  assert.equal(next.stayedDiscontinued, true);
  assert.equal(next.item.lbsOnHand, 6);
  assert.equal(DC.isOrderable(next.item, 0.25), false);
});

test("weight choices stay on quarter pounds and never pass what is on hand", () => {
  assert.deepEqual(DC.weightChoices(1), [0.25, 0.5, 0.75, 1]);
  assert.deepEqual(DC.weightChoices(0.3), [0.25]);
  assert.deepEqual(DC.weightChoices(0), []);
  assert.equal(DC.formatWeight(0.25), "0.25");
  assert.equal(DC.formatWeight(1.5), "1.5");
  assert.equal(DC.formatWeight(8.75), "8.75");
  assert.equal(DC.formatWeight(37.445), "37.445");
  assert.equal(
    DC.stockMessage(0.87, 2),
    "Sorry, we don't have enough to fill this order. We have about 0.87 lb on hand."
  );
  assert.equal(DC.stockMessage(2, 0.5), "");
  assert.equal(DC.defaultOrderWeight(8.75), 1);
  assert.equal(DC.defaultOrderWeight(0.4), 0.25);
  assert.equal(DC.defaultOrderWeight(0.2), 0.2);
  assert.equal(DC.defaultOrderWeight(0.2, 0, 0.25), null);
  assert.equal(DC.defaultOrderWeight(0.2, 0.2), null);
  assert.equal(DC.defaultOrderWeight(0), null);
});

test("public meats are only chicken, turkey, ham, and beef", () => {
  const items = catalog();
  const asiago = items.filter((item) => /asiago mild/i.test(item.toastName));
  assert.equal(asiago.length, 2);
  asiago.forEach((item) => assert.equal(DC.isOrderable(item, 0.25), false));
  const pepperoni = items.find((item) => /pepperoni/i.test(item.toastName));
  assert.equal(pepperoni.meatType, "other");
  const grouped = DC.groupCatalog(items, 0.25, { publicOnly: true });
  const meatNames = grouped.meats.flatMap((group) => group.items.map((item) => item.displayName));
  const cheeseNames = grouped.cheeses.map((item) => item.displayName);
  assert.deepEqual(grouped.meats.map((group) => group.type), ["chicken", "turkey", "ham", "beef"]);
  assert.equal(meatNames.some((name) => /pepperoni|salami|pastrami turkey/i.test(name)), false);
  assert.equal(cheeseNames.some((name) => /asiago/i.test(name)), false);
  assert.equal(grouped.cheeses.filter((item) => /asiago/i.test(item.displayName)).length, 0);
});

test("pickup rejects Sundays, closed days, and times outside counter hours", () => {
  const now = new Date(2026, 10, 11, 10, 0, 0);
  const closed = ["2026-11-26"];
  assert.match(DC.validatePickup("2026-11-15", "11:00", { now, closedDates: closed }), /Sunday/);
  assert.match(DC.validatePickup("2026-11-14", "15:00", { now, closedDates: closed }), /Saturday/);
  assert.equal(DC.validatePickup("2026-11-14", "13:00", { now, closedDates: closed }), "");
  assert.equal(DC.validatePickup("2026-11-13", "17:00", { now, closedDates: closed }), "");
  assert.equal(DC.validatePickup("2026-11-13", "18:00", { now, closedDates: closed }), "");
  assert.match(DC.validatePickup("2026-11-13", "18:15", { now, closedDates: closed }), /6:00 PM/);
  const afterFour = new Date(2026, 10, 13, 16, 30, 0);
  assert.equal(DC.pickupDates(afterFour, closed, 4)[0], "2026-11-14");
  assert.match(DC.validatePickup("2026-11-13", "17:30", { now: afterFour, closedDates: closed }), /after 4/);
  assert.match(DC.validatePickup("2026-11-26", "11:00", { now, closedDates: closed }), /closed/i);
  const dates = DC.pickupDates(now, closed, 21);
  assert.equal(dates.includes("2026-11-15"), false);
  assert.equal(dates.includes("2026-11-26"), false);
  assert.equal(dates.includes("2026-11-11"), true);
});

test("an order cannot ask for more than is on hand", () => {
  const item = catalog().find((entry) => entry.displayName === "Pastrami Top Round");
  const now = new Date(2026, 10, 11, 10, 0, 0);
  const bad = DC.buildOrder({
    customerName: "Jamie Ellis",
    customerPhone: "8125550142",
    pickupDate: "2026-11-13",
    pickupTime: "11:00",
    notes: "",
    now,
    closedDates: [],
    threshold: 0.25,
    itemsById: { [item.id]: item },
    lines: [{ itemId: item.id, weightLbs: 3, sliceStyle: "thin", note: "", lineId: "li1" }],
  });
  assert.equal(bad.ok, false);
  const good = DC.buildOrder({
    customerName: "Jamie Ellis",
    customerPhone: "(812) 555-0142",
    pickupDate: "2026-11-13",
    pickupTime: "11:00",
    notes: "Pay at the counter",
    now,
    closedDates: [],
    threshold: 0.25,
    itemsById: { [item.id]: item },
    lines: [{ itemId: item.id, weightLbs: 0.5, sliceStyle: "thin", note: "not too salty", lineId: "li1" }],
  });
  assert.equal(good.ok, true);
  assert.equal(good.order.channel, "deliCounter");
  assert.equal(good.order.deliStatus, "new");
  assert.equal(good.order.payAtPickup, true);
  assert.equal(good.order.items[0].pricePerLb, item.pricePerLb);
});

test("cheese cannot be shaved, and a shaved selection falls back to thin", () => {
  const meat = catalog().find((item) => item.displayName === "Buffalo");
  const cheese = catalog().find((item) => item.category === "cheese" && DC.isOrderable(item, 0.25));
  assert.ok(cheese);
  assert.deepEqual(DC.sliceStylesFor(cheese).map((style) => style.id), ["thin", "medium", "large", "thick"]);
  assert.equal(DC.sliceStylesFor(meat).some((style) => style.id === "shaved"), true);
  assert.equal(DC.coerceSlice(cheese, "shaved"), "thin");
  assert.equal(DC.coerceSlice(cheese, "large"), "large");
  assert.equal(DC.coerceSlice(meat, "shaved"), "shaved");
  const now = new Date(2026, 10, 11, 10, 0, 0);
  const order = {
    customerName: "Jamie Ellis",
    customerPhone: "(812) 555-0142",
    pickupDate: "2026-11-13",
    pickupTime: "11:00",
    notes: "",
    now,
    closedDates: [],
    threshold: 0.25,
  };
  const shavedCheese = DC.buildOrder(Object.assign({}, order, {
    itemsById: { [cheese.id]: cheese },
    lines: [{ itemId: cheese.id, weightLbs: 0.25, sliceStyle: "shaved", note: "", lineId: "li1" }],
  }));
  assert.equal(shavedCheese.ok, false);
  const thinCheese = DC.buildOrder(Object.assign({}, order, {
    itemsById: { [cheese.id]: cheese },
    lines: [{ itemId: cheese.id, weightLbs: 0.25, sliceStyle: "thin", note: "", lineId: "li1" }],
  }));
  assert.equal(thinCheese.ok, true);
  assert.equal(thinCheese.order.items[0].sliceStyle, "thin");
  assert.equal(thinCheese.order.items[0].sliceStyleLabel, "Thin");
  const shavedMeat = DC.buildOrder(Object.assign({}, order, {
    itemsById: { [meat.id]: meat },
    lines: [{ itemId: meat.id, weightLbs: 0.5, sliceStyle: "shaved", note: "", lineId: "li1" }],
  }));
  assert.equal(shavedMeat.ok, true);
  assert.equal(shavedMeat.order.items[0].sliceStyleLabel, "Shaved");
  const rules = fs.readFileSync(path.join(__dirname, "firestore.rules"), "utf8");
  const line = rules.slice(rules.indexOf("function deliLineOk"), rules.indexOf("function deliLinesOk"));
  assert.match(line, /category != 'cheese'/);
  assert.match(line, /sliceStyle != 'shaved'/);
});

test("a deli pickup prints as a deli ticket, not a custom salad", () => {
  const order = {
    channel: "deliCounter",
    payAtPickup: true,
    customerName: "Jamie Ellis",
    customerPhone: "(812) 555-0142",
    pickupDate: "2026-11-13",
    pickupTime: "11:00",
    notes: "Extra napkins",
    items: [
      { kind: "meatcheese", name: "Buffalo", weightLbs: 0.5, sliceStyle: "thin", sliceStyleLabel: "Thin", note: "not too salty" },
      { kind: "meatcheese", name: "Lacey Swiss", weightLbs: 0.25, sliceStyle: "medium", sliceStyleLabel: "Medium", note: "" },
    ],
  };
  assert.equal(DC.isDeliPickupOrder(order), true);
  assert.equal(DC.isDeliPickupOrder({ items: [{ kind: "custom", customType: "salad", name: "House" }] }), false);
  const ticket = DC.formatDeliTicket(order);
  assert.match(ticket, /^DELI ORDER — Meats & Cheese/);
  assert.match(ticket, /PICKUP/);
  assert.match(ticket, /Jamie Ellis/);
  assert.match(ticket, /\(812\) 555-0142/);
  assert.match(ticket, /Pickup: Fri 2026-11-13 {2}11:00 AM/);
  assert.match(ticket, /Buffalo\n0\.5 lb · Thin\nNote: not too salty/);
  assert.match(ticket, /Lacey Swiss\n0\.25 lb · Medium/);
  assert.match(ticket, /PAY AT PICKUP\nNote: Extra napkins/);
  assert.equal(ticket.includes("Custom Salad"), false);
});

test("whole pieces skip the slice, the weight, and the quarter-pound minimum", () => {
  const names = ["Ham Spiral Sliced", "Classic Rst Turkey Breast", "Turkey Carved and Served Oven Roastd"];
  names.forEach((toastName) => {
    const item = catalog().find((entry) => entry.toastName === toastName);
    assert.ok(item, toastName);
    assert.equal(item.wholePieceOnly, true);
    assert.equal(DC.isWholePieceOnly(item), true);
    const light = Object.assign({}, item, { lbsOnHand: 0.1, availability: "auto", discontinued: false, inStock: false });
    assert.equal(DC.isOrderable(light, 0.25), true);
    assert.equal(DC.isOrderable(Object.assign({}, light, { lbsOnHand: 0 }), 0.25), false);
    assert.equal(DC.isOrderable(Object.assign({}, light, { availability: "out", lbsOnHand: 4 }), 0.25), false);
  });
  assert.equal(DC.isWholePieceOnly({ toastName: "Ham Spiral Sliced", wholePieceOnly: false }), false);
  const ham = Object.assign({}, catalog().find((entry) => entry.toastName === "Ham Spiral Sliced"), {
    lbsOnHand: 0.1,
    availability: "auto",
    inStock: false,
  });
  const now = new Date(2026, 10, 11, 10, 0, 0);
  const built = DC.buildOrder({
    customerName: "Jamie Ellis",
    customerPhone: "(812) 555-0142",
    pickupDate: "2026-11-13",
    pickupTime: "11:00",
    notes: "",
    now,
    closedDates: [],
    threshold: 0.25,
    itemsById: { [ham.id]: ham },
    lines: [{ itemId: ham.id, pieceCount: 2, weightLbs: 5, sliceStyle: "thin", note: "", lineId: "li1" }],
  });
  assert.equal(built.ok, true);
  assert.equal(built.order.items[0].sliceStyle, "whole");
  assert.equal(built.order.items[0].pieceCount, 2);
  assert.equal(built.order.items[0].weightLbs, 0);
  assert.equal(built.order.items[0].sliceStyleLabel, "");
  const ticket = DC.formatDeliTicket(built.order);
  assert.match(ticket, /Ham Spiral Sliced\n2 whole pieces/);
  assert.equal(ticket.includes("Thin"), false);
  assert.equal(ticket.includes(" lb"), false);
  const plan = DC.planPickupDecrement([ham], built.order, 0.25);
  assert.equal(plan.updates.length, 0);
  const turnedOff = DC.applyPosRows([Object.assign({}, ham, { wholePieceOnly: false })], [{
    toastItemId: ham.toastItemId,
    sku: ham.sku,
    toastName: ham.toastName,
    category: "meat",
    lbsOnHand: 3,
    pricePerLb: ham.pricePerLb,
  }], { threshold: 0.25 })[0];
  assert.equal(turnedOff.item.wholePieceOnly, false);
});

test("marking an order picked up subtracts pounds and floors at zero", () => {
  const item = Object.assign({}, catalog().find((entry) => entry.displayName === "Sweet Slice"));
  const plan = DC.planPickupDecrement(
    [item],
    { items: [{ itemId: item.id, weightLbs: 0.5 }, { itemId: item.id, weightLbs: 0.25 }] },
    0.25
  );
  assert.equal(plan.short.length, 0);
  assert.equal(plan.updates[0].lbsOnHand, DC.normalizeLbs(item.lbsOnHand - 0.75));
  assert.equal(plan.updates[0].inStock, true);
  assert.equal(Object.prototype.hasOwnProperty.call(plan.updates[0], "availability"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(plan.updates[0], "discontinued"), false);
  const emptied = DC.planPickupDecrement([item], { items: [{ itemId: item.id, weightLbs: 20 }] }, 0.25);
  assert.equal(emptied.updates[0].lbsOnHand, 0);
  assert.equal(emptied.updates[0].inStock, false);
  assert.equal(emptied.short.length, 1);
  const held = Object.assign({}, item, { availability: "discontinued", discontinued: true, lbsOnHand: 2, inStock: false });
  const stillHeld = DC.planPickupDecrement([held], { items: [{ itemId: held.id, weightLbs: 0.5 }] }, 0.25);
  assert.equal(stillHeld.updates[0].lbsOnHand, 1.5);
  assert.equal(stillHeld.updates[0].inStock, false);
  assert.deepEqual(Object.keys(stillHeld.updates[0]).sort(), ["id", "inStock", "lbsOnHand"]);
});

test("another POS can register the same row shape without a Toast API client", () => {
  DC.registerPosAdapter({
    id: "fixture-pos",
    label: "Fixture",
    parse: function () {
      return { accepted: [], skipped: [] };
    },
  });
  assert.equal(DC.getPosAdapter("fixture-pos").label, "Fixture");
  assert.equal(DC.getPosAdapter("toast-csv").label, "Toast Export items CSV");
  assert.throws(() => DC.getPosAdapter("missing"), /Unknown POS adapter/);
});

test("quoted CSV commas do not shift the price column, and jerky and trays are skipped", () => {
  const csv = [
    "item id,name,category,inventory quantity,price,barcode,last 90 day sales",
    'aaa,Chicken Test,Deli Meat,1.5,$11.99,111,"$1,234.00"',
    "bbb,Jerky Turkey,Deli Meat,2,$8.99,222,0",
    "ccc,Small Meat & Cheese Tray,Deli,,$65.99,333,0",
    "ddd,Chipped Meat,Deli Meat,-2.112,$2.99,444,0",
  ].join("\n");
  const parsed = DC.parseToastExportCsv(csv);
  assert.deepEqual(parsed.accepted.map((row) => row.toastName), ["Chicken Test", "Chipped Meat"]);
  assert.equal(parsed.accepted[0].pricePerLb, 11.99);
  assert.equal(parsed.accepted[1].lbsOnHand, 0);
  assert.equal(parsed.accepted[1].quantityRaw, -2.112);
  assert.deepEqual(parsed.skipped.map((row) => row.reason), ["jerky", "category"]);
});

test("a manager's hide flags and a higher meat minimum stay off the public list", () => {
  const buffalo = catalog().find((item) => item.displayName === "Buffalo");
  assert.equal(DC.isOrderable(buffalo, 0.25), true);
  assert.equal(DC.isOrderable(Object.assign({}, buffalo, { hiddenOnline: true }), 0.25), false);
  assert.equal(DC.isOrderable(Object.assign({}, buffalo, { notOfferedOnline: true }), 0.25), false);
  assert.equal(DC.isOrderable(Object.assign({}, buffalo, { removed: true }), 0.25), false);
  const short = Object.assign({}, buffalo, { lbsOnHand: 0.5, availability: "in", inStock: true });
  assert.equal(DC.isOrderable(short, 0.25, { meatMinLbs: 1 }), false);
  assert.equal(DC.isOrderable(short, 0.25, { meatMinLbs: 0.25 }), true);
  const hours = DC.hoursFor("2026-11-11", new Date(2026, 10, 11, 10, 0), {
    storeOpen: "10:00",
    storeCloseWeekday: "17:00",
    weekdayOrderCutoff: "15:00",
  });
  assert.equal(hours.open, 10 * 60);
  assert.equal(hours.close, 17 * 60);
  assert.equal(DC.hoursFor("2026-11-11", new Date(2026, 10, 11, 15, 30), { weekdayOrderCutoff: "15:00" }), null);
  assert.equal(DC.readHours({ hoursCopy: "Pickup by the counter." }).hoursCopy, "Pickup by the counter.");
});

test("re-import keeps an icon and the hide flags", () => {
  const buffalo = catalog().find((item) => item.displayName === "Buffalo");
  const edited = Object.assign({}, buffalo, {
    iconKey: "wing",
    photoUrl: "https://example.com/buffalo.jpg",
    hiddenOnline: true,
    notOfferedOnline: false,
    removed: false,
    displayNameCustom: true,
  });
  const next = DC.applyPosRows([edited], [{
    toastItemId: buffalo.toastItemId,
    sku: buffalo.sku,
    toastName: buffalo.toastName,
    category: "meat",
    lbsOnHand: 3,
    pricePerLb: buffalo.pricePerLb,
  }], { threshold: 0.25 })[0];
  assert.equal(next.item.iconKey, "wing");
  assert.equal(next.item.photoUrl, "https://example.com/buffalo.jpg");
  assert.equal(next.item.hiddenOnline, true);
  assert.equal(next.item.removed, false);
  assert.equal(DC.isOrderable(next.item, 0.25), false);
  const chipped = catalog().find((item) => item.toastName === "Chipped Meat");
  assert.equal(chipped.notOfferedOnline, true);
  const forced = Icons.iconFor({ displayName: "Buffalo", iconKey: "flame", category: "meat", meatType: "chicken" });
  assert.notEqual(forced, Icons.iconFor({ displayName: "Buffalo", category: "meat", meatType: "chicken" }));
  assert.equal(Icons.choices().some((choice) => choice.key === "wing"), true);
});

test("a Boar's Head photo follows the Toast name, and a saved URL replaces it", () => {
  const Photos = require("./deli-photos.js");
  assert.match(Photos.photoFor({ toastName: "Turkey Ovengold" }), /assets\/deli-photos\/ovengold\.webp\?v=6$/);
  assert.match(Photos.photoFor({ toastName: "Chicken Chipotle" }), /chipotle-chicken\.webp\?v=6$/);
  assert.match(Photos.photoFor({ toastName: "Ham Spiral Sliced" }), /assets\/deli-photos\/spiral-ham\.webp\?v=6$/);
  assert.match(Photos.photoFor({ toastName: "Classic Rst Turkey Breast" }), /classic-roast-turkey\.webp\?v=6$/);
  assert.match(Photos.photoFor({ toastName: "Classic Roast Turkey Brst" }), /classic-roast-turkey\.webp\?v=6$/);
  assert.match(Photos.photoFor({ toastName: "Blck Wax Cheddar" }), /^$/);
  assert.equal(Photos.photoFor({ toastName: "Chipped Meat" }), "");
  assert.equal(
    Photos.photoFor({ toastName: "Turkey Ovengold", photoUrl: "https://example.com/slice.jpg" }),
    "https://example.com/slice.jpg"
  );
});

test("each starter item has its own drawn icon, with a type fallback", () => {
  const buffalo = Icons.iconFor({ displayName: "Buffalo", category: "meat", meatType: "chicken" });
  const swiss = Icons.iconFor({ displayName: "Lacey Swiss", category: "cheese" });
  const fallback = Icons.iconFor({ displayName: "Mystery Roast", category: "meat", meatType: "beef" });
  assert.match(buffalo, /<svg/);
  assert.notEqual(buffalo, swiss);
  assert.match(fallback, /<svg/);
  assert.equal(Icons.iconFor({ displayName: "Lemon Pepper", category: "meat" }).includes("circle"), true);
});

function rulesFunction(source, name) {
  const marker = "function " + name;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, name);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error("Unclosed rules function " + name);
}

test("pickup decrement is a staff write that can only lower pounds", () => {
  const rules = fs.readFileSync(path.join(__dirname, "firestore.rules"), "utf8");
  const block = rules.slice(rules.indexOf("match /meatCheeseItems/"), rules.indexOf("match /meatCheeseSlots/"));
  assert.match(block, /allow update: if isStaff\(\)[\s\S]*hasOnly\(\['lbsOnHand', 'inStock', 'availableWeight'\]\)/);
  assert.match(block, /request\.resource\.data\.lbsOnHand <= resource\.data\.lbsOnHand/);
  assert.match(block, /request\.resource\.data\.availability == resource\.data\.availability/);
  assert.match(block, /request\.resource\.data\.discontinued == resource\.data\.discontinued/);
  assert.match(block, /counterShape\(request\.resource\.data\)/);
});

test("a public deli order fetches only the line items and store/deliCounter", () => {
  const rules = fs.readFileSync(path.join(__dirname, "firestore.rules"), "utf8");
  const body = ["deliMeatMin", "deliLineOk", "deliLinesOk", "validPublicDeliOrder"]
    .map((name) => rulesFunction(rules, name))
    .join("\n");
  const paths = body.match(/documents\/[A-Za-z0-9_/{}$().]+/g) || [];
  assert.ok(paths.length > 0);
  paths.forEach((path) => {
    assert.match(path, /^documents\/(meatCheeseItems\/|store\/deliCounter)/);
  });
  assert.equal(body.includes("employees/"), false);
  assert.equal(body.includes("function canEditOnlineDeli"), false);
  const distinct = new Set(paths.map((path) => path.split("/")[1]));
  assert.deepEqual([...distinct].sort(), ["meatCheeseItems", "store"]);
});
