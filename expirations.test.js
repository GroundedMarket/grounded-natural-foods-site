const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = __dirname;

test("expiration rules let any staff member edit and only management delete", () => {
  const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
  const start = rules.indexOf("match /expirationItems/{id}");
  const end = rules.indexOf("match /localUpcDb/{id}");
  assert.ok(start > 0 && end > start);
  const block = rules.slice(start, end);
  assert.match(block, /allow read, create: if isStaff\(\)/);
  assert.match(block, /allow delete: if isMaster\(\) \|\| isManagement\(\)/);
  assert.match(block, /allow update: if isMaster\(\) \|\| isManagement\(\)/);
  assert.match(block, /allow update: if isStaff\(\) && !expirationMarkedDeleted\(\)/);
  assert.equal(block.includes("expirationCrossOffOnly"), false);
  assert.equal(block.includes("allow read, write: if isStaff()"), false);
  const fn = rules.slice(
    rules.indexOf("function expirationMarkedDeleted()"),
    rules.indexOf("function deliHhmm(")
  );
  assert.match(fn, /keys\(\)\.hasAny\(\['deleted'\]\)/);
  assert.match(fn, /request\.resource\.data\.deleted == true/);
  assert.equal(rules.includes("function expirationCrossOffOnly"), false);
  assert.equal((rules.match(/function isManagement\(\)/g) || []).length, 1);
});

test("employees can edit and flag an expiration, and only management can delete", () => {
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const row = app.slice(app.indexOf("function expItemRow"), app.indexOf("function openEditExpItem"));
  assert.match(row, /expirationIsCrossedOff\(item\)/);
  assert.match(row, /openEditExpItem/);
  assert.match(row, /toggleFlag/);
  assert.match(row, /toggleDone/);
  assert.equal(row.includes("canManageExpirations"), false);
  const editor = app.slice(app.indexOf("function openEditExpItem"), app.indexOf("function saveExpItemDoc"));
  assert.match(editor, /canManageExpirations\(\)/);
  assert.match(editor, /btn danger/);
  assert.match(editor, /Delete/);
  assert.match(editor, /eex-count/);
  assert.match(editor, /eex-date/);
  assert.match(editor, /eex-brand/);
  const save = app.slice(app.indexOf("function saveEditExpItem"), app.indexOf("function deleteExpItem(id)"));
  assert.equal(save.includes("canManageExpirations"), false);
  assert.match(save, /i\.count = count/);
  assert.match(save, /i\.date = /);
  assert.match(save, /i\.aisles = aisleDraft/);
  const remove = app.slice(app.indexOf("function deleteExpItem(id)"), app.indexOf("function expirationActorName"));
  assert.match(remove, /if \(!canManageExpirations\(\)\) return/);
  assert.match(remove, /deleteExpItemDoc\(id\)/);
  const docDelete = app.slice(app.indexOf("function deleteExpItemDoc"), app.indexOf("function saveEditExpItem"));
  assert.match(docDelete, /\.delete\(\)/);
  const flag = app.slice(app.indexOf("function toggleFlag"), app.indexOf("function applyCustomMarkdown"));
  assert.equal(flag.includes("canManageExpirations"), false);
  const markdown = app.slice(app.indexOf("function applyMarkdown"), app.indexOf("function addItemFlow"));
  assert.equal(markdown.includes("canManageExpirations"), false);
  assert.match(markdown, /item\.flagged = true/);
  const toggle = app.slice(app.indexOf("function toggleDone"), app.indexOf("function escAttr"));
  assert.match(toggle, /i\.done = nowDone/);
  assert.match(toggle, /i\.crossedOff = nowDone/);
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
