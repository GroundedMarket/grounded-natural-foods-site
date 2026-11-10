const test = require("node:test");
const assert = require("node:assert/strict");
const DC = require("./deli-counter.js");
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

test("public list is the owner's 19 meats and 11 cheeses, grouped and alphabetized", () => {
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
    "Lemon Pepper",
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
      "Mozzarella",
      "Provolone",
      "Smoked Cheddar",
      "Vermont Cheddar",
    ]
  );
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
  ["Smoked Gouda", "CARAMELIZED ONION JACK", "Horseradish Cheddar"].forEach((name) => {
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

test("quantities at or under the threshold are out of stock, except seeded Lemon Pepper", () => {
  const lemon = catalog().find((item) => item.displayName === "Lemon Pepper");
  assert.equal(lemon.lbsOnHand, 0.2);
  assert.equal(lemon.availability, "in");
  assert.equal(DC.isOrderable(lemon, 0.25), true);
  assert.deepEqual(DC.weightChoices(0.2), [0.2]);
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
  assert.equal(DC.formatWeight(0.25), "1/4");
  assert.equal(DC.formatWeight(1.5), "1 1/2");
});

test("pickup rejects Sundays, closed days, and times outside counter hours", () => {
  const now = new Date(2026, 10, 11, 10, 0, 0);
  const closed = ["2026-11-26"];
  assert.match(DC.validatePickup("2026-11-15", "11:00", { now, closedDates: closed }), /Sunday/);
  assert.match(DC.validatePickup("2026-11-14", "15:00", { now, closedDates: closed }), /Saturday/);
  assert.equal(DC.validatePickup("2026-11-14", "13:00", { now, closedDates: closed }), "");
  assert.match(DC.validatePickup("2026-11-13", "17:00", { now, closedDates: closed }), /4:00 PM/);
  assert.equal(DC.validatePickup("2026-11-13", "16:00", { now, closedDates: closed }), "");
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
  const emptied = DC.planPickupDecrement([item], { items: [{ itemId: item.id, weightLbs: 20 }] }, 0.25);
  assert.equal(emptied.updates[0].lbsOnHand, 0);
  assert.equal(emptied.updates[0].inStock, false);
  assert.equal(emptied.short.length, 1);
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
