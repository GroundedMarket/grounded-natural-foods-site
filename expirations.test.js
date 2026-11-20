const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = __dirname;

test("expiration rules allow a cross-off and refuse an employee delete", () => {
  const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
  const start = rules.indexOf("match /expirationItems/{id}");
  const end = rules.indexOf("match /localUpcDb/{id}");
  assert.ok(start > 0 && end > start);
  const block = rules.slice(start, end);
  assert.match(block, /allow read, create: if isStaff\(\)/);
  assert.match(block, /allow delete: if isMaster\(\) \|\| isManagement\(\)/);
  assert.match(block, /allow update: if isMaster\(\) \|\| isManagement\(\)/);
  assert.match(block, /allow update: if isStaff\(\) && expirationCrossOffOnly\(\)/);
  assert.equal(block.includes("allow read, write: if isStaff()"), false);
  const fn = rules.slice(
    rules.indexOf("function expirationCrossOffOnly()"),
    rules.indexOf("function deliHhmm(")
  );
  assert.match(
    fn,
    /hasOnly\(\[\s*'done', 'crossedOff', 'crossedOffBy', 'crossedOffAt'\s*\]\)/
  );
  assert.match(fn, /request\.resource\.data\.done is bool/);
  assert.equal((rules.match(/function isManagement\(\)/g) || []).length, 1);
});

test("general employees cross an item off and cannot open delete", () => {
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const row = app.slice(app.indexOf("function expItemRow"), app.indexOf("function openEditExpItem"));
  assert.match(row, /canManageExpirations\(\)/);
  assert.match(row, /expirationIsCrossedOff\(item\)/);
  assert.match(row, /openEditExpItem/);
  assert.match(row, /toggleFlag/);
  assert.match(row, /toggleDone/);
  const remove = app.slice(app.indexOf("function deleteExpItem"), app.indexOf("function expirationActorName"));
  assert.match(remove, /if \(!canManageExpirations\(\)\) return/);
  const toggle = app.slice(app.indexOf("function toggleDone"), app.indexOf("function escAttr"));
  assert.match(toggle, /i\.done = nowDone/);
  assert.match(toggle, /i\.crossedOff = nowDone/);
  assert.match(toggle, /\.update\(\{/);
  assert.match(toggle, /crossedOffBy: i\.crossedOffBy/);
  assert.match(toggle, /nowDone = !wasDone/);
  const manage = app.slice(
    app.indexOf("function canManageExpirations"),
    app.indexOf("function expirationIsCrossedOff")
  );
  assert.match(manage, /session\.isMaster/);
  assert.match(manage, /\/management\/i/);
});

test("the schedule name column is sticky inside the horizontal scroller", () => {
  const css = [
    fs.readFileSync(path.join(root, "styles.css"), "utf8"),
    fs.readFileSync(path.join(root, "closure.css"), "utf8"),
  ].join("\n");
  assert.match(css, /\.sched-scroll\{[^}]*overflow-x:auto/);
  assert.match(
    css,
    /\.sched-grid > \.sched-head:first-child,\s*\.sched-grid > \.sched-name\{[^}]*position:sticky[^}]*left:0/
  );
  assert.match(
    css,
    /\.week-box \.sched-grid > \.sched-head:first-child \{[^}]*position: sticky[^}]*left: 0/
  );
  assert.match(css, /\.week-box \.sched-grid > \.sched-name \{[^}]*position: sticky[^}]*background: var\(--cream\)/);
  assert.match(css, /\.week-box \.sched-grid > \.sched-name\.open-available-name \{[^}]*background: var\(--paper\)/);
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.match(app, /class="sched-scroll"/);
  assert.match(app, /sched-role-label/);
  const week = app.slice(app.indexOf("function weekBoxHTML"), app.indexOf("function placeClosureLanes"));
  assert.match(week, /sched-scroll/);
  assert.equal(week.includes('style="overflow-x:auto"'), false);
});
