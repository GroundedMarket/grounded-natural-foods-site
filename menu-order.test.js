const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const MenuOrder = require("./menu-order.js");

const root = __dirname;
const CURRENT = ["garden", "pasta", "caesar", "fruit", "greek", "broccoli"];

test("items without a saved order keep their current order", () => {
  assert.deepEqual(MenuOrder.orderMenuItemIds(CURRENT, null), CURRENT);
  assert.deepEqual(MenuOrder.orderMenuItemIds(CURRENT, undefined), CURRENT);
  assert.deepEqual(MenuOrder.orderMenuItemIds(CURRENT, {}), CURRENT);
  assert.deepEqual(MenuOrder.orderMenuItemIds([], {}), []);
  assert.deepEqual(MenuOrder.orderMenuItemIds(null, null), []);
});

test("a missing order is not treated as zero and does not jump to the front", () => {
  const saved = { garden: 0, pasta: 1, caesar: 2, fruit: 3, greek: 4 };
  assert.deepEqual(MenuOrder.orderMenuItemIds(CURRENT, saved), CURRENT);
  const withNew = CURRENT.concat(["slaw"]);
  assert.deepEqual(MenuOrder.orderMenuItemIds(withNew, saved), withNew);
});

test("order zero is a real saved position", () => {
  assert.deepEqual(
    MenuOrder.orderMenuItemIds(["garden", "pasta", "caesar"], {
      caesar: 0,
      garden: 1,
      pasta: 2,
    }),
    ["caesar", "garden", "pasta"]
  );
});

test("blank or non-numeric order falls back to the current position", () => {
  assert.deepEqual(
    MenuOrder.orderMenuItemIds(["garden", "pasta", "caesar"], {
      garden: "",
      pasta: "nope",
      caesar: null,
    }),
    ["garden", "pasta", "caesar"]
  );
});

test("unordered items keep their relative order around a saved one", () => {
  const ordered = MenuOrder.orderMenuItemIds(
    ["garden", "pasta", "caesar", "fruit"],
    { fruit: 1 }
  );
  assert.deepEqual(ordered, ["garden", "fruit", "pasta", "caesar"]);
  assert.deepEqual(
    ordered.filter((id) => id !== "fruit"),
    ["garden", "pasta", "caesar"]
  );
});

test("move steps one place and does not mutate the current list", () => {
  const original = CURRENT.slice();
  assert.equal(MenuOrder.moveMenuItem(CURRENT, "garden", -1), null);
  assert.equal(MenuOrder.moveMenuItem(CURRENT, "broccoli", 1), null);
  assert.equal(MenuOrder.moveMenuItem(CURRENT, "missing", -1), null);
  assert.equal(MenuOrder.moveMenuItem(CURRENT, "pasta", 2), null);
  assert.deepEqual(MenuOrder.moveMenuItem(CURRENT, "greek", -1), [
    "garden",
    "pasta",
    "caesar",
    "greek",
    "fruit",
    "broccoli",
  ]);
  assert.deepEqual(MenuOrder.moveMenuItem(CURRENT, "pasta", 1), [
    "garden",
    "caesar",
    "pasta",
    "fruit",
    "greek",
    "broccoli",
  ]);
  assert.deepEqual(CURRENT, original);
});

test("a move's saved order reproduces the new sequence from the old list", () => {
  const moved = MenuOrder.moveMenuItem(CURRENT, "greek", -1);
  const saved = MenuOrder.savedOrderMap(moved);
  assert.deepEqual(saved, {
    garden: 0,
    pasta: 1,
    caesar: 2,
    greek: 3,
    fruit: 4,
    broccoli: 5,
  });
  assert.deepEqual(MenuOrder.orderMenuItemIds(CURRENT, saved), moved);
  assert.deepEqual(MenuOrder.orderMenuItemIds(moved, saved), moved);
});

test("the menu editor arrows save order on the weekly menu masters already write", () => {
  const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
  const start = rules.indexOf("match /deliWeeklyMenus/{id}");
  assert.ok(start > 0);
  const line = rules.slice(start, rules.indexOf("\n", start));
  assert.equal(
    line.trim(),
    "match /deliWeeklyMenus/{id}  { allow read: if signedIn(); allow write: if isMaster(); }"
  );
  assert.equal(rules.includes("itemOrder"), false);

  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const editor = app.slice(
    app.indexOf("function editorBox"),
    app.indexOf("function toggleIndividualPricing")
  );
  assert.match(editor, /orderedDeliMenuIds\(data\)/);
  assert.match(editor, /class="btn small outline"/);
  assert.match(
    editor,
    /onclick="moveDeliMenuItem\('\$\{weekKey\}','\$\{boxId\}','\$\{id\}',-1\)"/
  );
  assert.match(
    editor,
    /onclick="moveDeliMenuItem\('\$\{weekKey\}','\$\{boxId\}','\$\{id\}',1\)"/
  );
  assert.match(editor, /title="Move up"/);
  assert.match(editor, /title="Move down"/);
  assert.match(editor, /i === 0 \? "disabled" : ""/);
  assert.match(editor, /i === menuRows\.length - 1 \? "disabled" : ""/);

  const move = app.slice(
    app.indexOf("function moveDeliMenuItem"),
    app.indexOf("function updatePrice")
  );
  assert.match(move, /orderedDeliMenuIds\(data\)/);
  assert.match(move, /MenuOrder\.moveMenuItem/);
  assert.match(move, /data\.itemOrder = MenuOrder\.savedOrderMap\(next\)/);
  assert.match(move, /saveDeliWeeklyMenuDoc\(weekKey, boxId\)/);
  assert.match(move, /cascadeDeliChangeForward\(weekKey, boxId\)/);

  const save = app.slice(
    app.indexOf("function saveDeliWeeklyMenuDoc"),
    app.indexOf("function cascadeDeliChangeForward")
  );
  assert.match(save, /deliWeeklyMenus/);
  assert.match(save, /payload\.itemOrder = data\.itemOrder/);
  assert.match(save, /__deliPreview/);

  const cascade = app.slice(
    app.indexOf("function cascadeDeliChangeForward"),
    app.indexOf("function copyLastWeekDeliMenu")
  );
  assert.match(cascade, /itemOrder/);
  assert.match(cascade, /k > weekKey/);

  const rebuild = app.slice(
    app.indexOf("function rebuildDeliWeeklyMenus"),
    app.indexOf("function rebuildSchedule")
  );
  assert.match(rebuild, /itemOrder: d\.itemOrder \|\| null/);

  const pub = app.slice(
    app.indexOf("function renderDeliGrid"),
    app.indexOf("function inspectDeliItem")
  );
  assert.match(pub, /orderedDeliMenuIds\(data\)/);

  const orderModal = app.slice(
    app.indexOf("function _renderPlaceOrderModal"),
    app.indexOf("function addItemToCartCore")
  );
  assert.match(orderModal, /orderedDeliMenuIds\(data\)/);

  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /menu-order\.js\?v=1/);
  assert.match(html, /app\.js\?v=87/);
  const menuSrc = html.indexOf("menu-order.js");
  const appSrc = html.indexOf("app.js?v=87");
  assert.ok(menuSrc > 0 && appSrc > menuSrc);
});
