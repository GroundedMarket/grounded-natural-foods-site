const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validatePublicOrder } = require("./public-order");

const root = path.join(__dirname, "..");

function meat(overrides) {
  return Object.assign({
    id: "buffalo",
    catalog: "counter",
    category: "meat",
    toastName: "Chicken Buffalo",
    sku: "111",
    inStock: true,
    discontinued: false,
    pricePerLb: 12.99,
    lbsOnHand: 5,
    hiddenOnline: false,
  }, overrides);
}

function cheese(overrides) {
  return Object.assign(meat({
    id: "swiss",
    category: "cheese",
    toastName: "Lacey Swiss",
    pricePerLb: 9.5,
    lbsOnHand: 2,
  }), overrides);
}

function depsFrom(items, settings) {
  const byId = {};
  items.forEach((item) => {
    byId[item.id] = item;
  });
  return {
    getItem: async (id) => byId[id] || null,
    getDeliSettings: async () => (settings === undefined ? null : settings),
  };
}

function line(item, overrides) {
  return Object.assign({
    kind: "meatcheese",
    catalog: "counter",
    itemId: item.id,
    name: "Buffalo",
    weightLbs: 0.5,
    sliceStyle: "thin",
    sliceStyleLabel: "Thin",
    pricePerLb: item.pricePerLb,
    note: "",
    lineId: "li1",
    qty: 1,
  }, overrides);
}

function deliOrder(items, overrides) {
  return Object.assign({
    channel: "deliCounter",
    customerName: "Jamie Ellis",
    customerPhone: "(812) 555-0142",
    pickupDate: "2026-11-13",
    pickupTime: "11:00",
    notes: "",
    items,
    deliStatus: "new",
    status: "incomplete",
    payAtPickup: true,
    stockDecremented: false,
    submittedAt: "2026-11-11T15:00:00.000Z",
    autoprinted: false,
    weekKey: "",
  }, overrides);
}

function kitchenOrder(items, overrides) {
  return Object.assign({
    customerName: "Jamie",
    customerPhone: "8125550142",
    pickupDate: "2026-11-13",
    pickupTime: "11:00",
    weekKey: "2026-11-09",
    items: items || [{ kind: "soup", name: "Tomato Bisque", qty: 1, lineId: "li1" }],
    status: "incomplete",
    submittedAt: "2026-11-11T15:00:00.000Z",
    autoprinted: false,
  }, overrides);
}

function mixedOrder(deliLines, kitchenItems, overrides) {
  return Object.assign(kitchenOrder(deliLines.concat(kitchenItems), {
    customerName: "Jamie Ellis",
    customerPhone: "(812) 555-0142",
    notes: "",
    payAtPickup: true,
    stockDecremented: false,
  }), overrides);
}

test("a kitchen-only order is saved without a catalog lookup", async () => {
  let looked = false;
  const result = await validatePublicOrder(kitchenOrder(), {
    getItem: async () => {
      looked = true;
      return null;
    },
    getDeliSettings: async () => null,
  });
  assert.equal(result.ok, true);
  assert.equal(looked, false);
  assert.equal(result.order.items[0].name, "Tomato Bisque");
  assert.equal(result.order.channel, undefined);
});

test("deli-only orders of 1 through 8 lines are allowed, and a 9th is not", async () => {
  const item = meat();
  for (let count = 1; count <= 8; count++) {
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push(line(item, { lineId: "li" + i, weightLbs: 0.25 }));
    }
    const result = await validatePublicOrder(deliOrder(items), depsFrom([item]));
    assert.equal(result.ok, true, "lines " + count);
    assert.equal(result.order.items.length, count);
  }
  const tooMany = [];
  for (let i = 0; i < 9; i++) tooMany.push(line(item, { lineId: "li" + i, weightLbs: 0.25 }));
  const rejected = await validatePublicOrder(deliOrder(tooMany), depsFrom([item]));
  assert.equal(rejected.ok, false);
  assert.match(rejected.message, /up to 8/);
});

test("a deli and kitchen mix is allowed, including eight deli lines before the kitchen item", async () => {
  const item = meat();
  const soup = { kind: "soup", name: "Tomato Bisque", qty: 1, lineId: "soup" };
  const one = await validatePublicOrder(
    mixedOrder([line(item)], [soup]),
    depsFrom([item])
  );
  assert.equal(one.ok, true);
  assert.equal(one.order.items[1].kind, "soup");
  assert.equal(one.order.channel, undefined);
  const lines = [];
  for (let i = 0; i < 8; i++) lines.push(line(item, { lineId: "li" + i, weightLbs: 0.25 }));
  const eight = await validatePublicOrder(mixedOrder(lines, [soup]), depsFrom([item]));
  assert.equal(eight.ok, true);
  const ninth = line(item, { lineId: "extra", weightLbs: 0.25 });
  const over = await validatePublicOrder(mixedOrder(lines.concat([ninth]), [soup]), depsFrom([item]));
  assert.equal(over.ok, false);
  assert.match(over.message, /up to 8/);
});

test("not enough stock names the item and how much is on hand", async () => {
  const item = meat({ lbsOnHand: 0.75, inStock: true });
  const result = await validatePublicOrder(
    deliOrder([line(item, { weightLbs: 0.5, lineId: "a" }), line(item, { weightLbs: 0.5, lineId: "b" })]),
    depsFrom([item])
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, "failed-precondition");
  assert.equal(
    result.message,
    "Sorry, we don't have enough Buffalo to fill this order. We have about 0.75 lb on hand."
  );
});

test("an out-of-stock flag still reports the pounds on hand", async () => {
  const item = meat({ lbsOnHand: 2, inStock: false });
  const result = await validatePublicOrder(deliOrder([line(item, { weightLbs: 0.5 })]), depsFrom([item]));
  assert.equal(result.ok, false);
  assert.match(result.message, /about 2 lb on hand/);
});

test("price, hidden, discontinued, and chipped meat are refused", async () => {
  const priced = await validatePublicOrder(
    deliOrder([line(meat(), { pricePerLb: 1 })]),
    depsFrom([meat()])
  );
  assert.match(priced.message, /\$12\.99\/lb/);
  const hidden = await validatePublicOrder(
    deliOrder([line(meat({ hiddenOnline: true }))]),
    depsFrom([meat({ hiddenOnline: true })])
  );
  assert.match(hidden.message, /isn't offered online/);
  const gone = await validatePublicOrder(
    deliOrder([line(meat({ discontinued: true, inStock: false }))]),
    depsFrom([meat({ discontinued: true, inStock: false })])
  );
  assert.match(gone.message, /discontinued/);
  const chipped = meat({ toastName: "Chipped Meat" });
  const chip = await validatePublicOrder(deliOrder([line(chipped)]), depsFrom([chipped]));
  assert.match(chip.message, /isn't offered online/);
  const sku = meat({ sku: "70238", toastName: "Something Else" });
  const bySku = await validatePublicOrder(deliOrder([line(sku)]), depsFrom([sku]));
  assert.match(bySku.message, /isn't offered online/);
  const missing = await validatePublicOrder(deliOrder([line(meat())]), depsFrom([]));
  assert.match(missing.message, /couldn't find Buffalo/);
});

test("cheese cannot be shaved, and meat under the minimum is refused", async () => {
  const item = cheese();
  const shaved = await validatePublicOrder(
    deliOrder([line(item, { name: "Lacey Swiss", sliceStyle: "shaved", sliceStyleLabel: "Shaved", weightLbs: 0.25 })]),
    depsFrom([item])
  );
  assert.match(shaved.message, /don't shave cheese/);
  const thin = await validatePublicOrder(
    deliOrder([line(item, { name: "Lacey Swiss", weightLbs: 0.25 })]),
    depsFrom([item])
  );
  assert.equal(thin.ok, true);
  const short = await validatePublicOrder(
    deliOrder([line(meat(), { weightLbs: 0.1 })]),
    depsFrom([meat()])
  );
  assert.match(short.message, /1\/4 lb/);
  const raised = await validatePublicOrder(
    deliOrder([line(meat(), { weightLbs: 0.5 })]),
    depsFrom([meat()], { meatMinLbs: 1 })
  );
  assert.match(raised.message, /1 lb/);
});

test("whole pieces are ordered by the piece, and a sliced whole piece is refused", async () => {
  const ham = meat({
    id: "ham",
    toastName: "Ham Spiral Sliced",
    wholePieceOnly: true,
    lbsOnHand: 0.1,
    inStock: true,
    category: "meat",
  });
  const good = await validatePublicOrder(deliOrder([line(ham, {
    name: "Ham Spiral Sliced",
    weightLbs: 0,
    sliceStyle: "whole",
    sliceStyleLabel: "",
    pieceCount: 2,
  })]), depsFrom([ham]));
  assert.equal(good.ok, true);
  assert.equal(good.order.items[0].pieceCount, 2);
  const sliced = await validatePublicOrder(deliOrder([line(ham, {
    name: "Ham Spiral Sliced",
    weightLbs: 0.5,
    sliceStyle: "thin",
  })]), depsFrom([ham]));
  assert.match(sliced.message, /whole piece/);
  const named = meat({ id: "turkey", toastName: "Classic Rst Turkey Breast" });
  delete named.wholePieceOnly;
  const implied = await validatePublicOrder(deliOrder([line(named, {
    name: "Classic Roast Turkey",
    weightLbs: 0.5,
  })]), depsFrom([named]));
  assert.match(implied.message, /whole piece/);
  const forcedOff = Object.assign({}, named, { wholePieceOnly: false, id: "turkey" });
  const slicedOk = await validatePublicOrder(deliOrder([line(forcedOff, {
    name: "Classic Roast Turkey",
    weightLbs: 0.5,
  })]), depsFrom([forcedOff]));
  assert.equal(slicedOk.ok, true);
});

test("checkout calls submitPublicOrder instead of writing the order document", () => {
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const ui = fs.readFileSync(path.join(root, "deli-counter-ui.js"), "utf8");
  assert.match(app, /httpsCallable\("submitPublicOrder"\)/);
  assert.match(app, /function publicOrderErrorMessage/);
  const write = app.slice(app.indexOf("function writePublicOrder"), app.indexOf("function showOrderConfirmation"));
  assert.equal(write.includes('collection("orders")'), false);
  assert.match(ui, /submitPublicOrderCallable\(built\.order\)/);
  const submit = ui.slice(ui.indexOf("function deliSubmitOrder"), ui.indexOf("function deliCounterToolbarHTML"));
  assert.equal(submit.includes('collection("orders")'), false);
});
