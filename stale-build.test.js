const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function loadScriptVersionsIn() {
  const app = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
  const start = app.indexOf("function scriptVersionsIn(");
  const end = app.indexOf("function staleTabIsIdle(");
  assert.ok(start > 0 && end > start);
  return new Function(app.slice(start, end) + "\nreturn scriptVersionsIn;")();
}

test("scriptVersionsIn reads js?v=N and ignores unversioned scripts", () => {
  const scriptVersionsIn = loadScriptVersionsIn();
  const html = [
    '<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>',
    '<script src="deli-counter.js?v=14"></script>',
    "<script src='app.js?v=88'></script>",
    '<script defer src="newspaper.js?v=1"></script>',
    '<script src="app.js?v=3&extra=1"></script>',
    '<script src="app.js?v=90"></script>',
  ].join("\n");
  assert.deepEqual(scriptVersionsIn(html), {
    "deli-counter.js": "14",
    "app.js": "90",
    "newspaper.js": "1",
  });
  assert.deepEqual(scriptVersionsIn(""), {});
  const live = scriptVersionsIn(fs.readFileSync(path.join(__dirname, "index.html"), "utf8"));
  assert.equal(live["app.js"], "88");
  assert.equal(live["deli-counter-ui.js"], "19");
  assert.equal(live["menu-order.js"], "1");
  assert.equal(Object.prototype.hasOwnProperty.call(live, "html2canvas.min.js"), false);
  const newer = Object.assign({}, live, { "app.js": "89" });
  assert.notEqual(newer["app.js"], live["app.js"]);
});

test("a stale tab checks index.html every 5 minutes and reloads only while idle", () => {
  const app = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
  const idle = app.slice(app.indexOf("function staleTabIsIdle("), app.indexOf("function reloadIfNewBuild("));
  assert.match(idle, /orderCart/);
  assert.match(idle, /modal-root/);
  assert.match(idle, /INPUT\|TEXTAREA\|SELECT/);
  const reload = app.slice(app.indexOf("function reloadIfNewBuild("), app.indexOf("function bindChatMessagesCollection("));
  assert.match(reload, /fetch\("index.html", \{ cache: "no-store" \}\)/);
  assert.match(reload, /scriptVersionsIn\(html\)/);
  assert.match(reload, /staleTabIsIdle\(\)/);
  assert.match(reload, /location\.reload\(\)/);
  assert.match(reload, /if \(!latest\["app\.js"\]\) return/);
  const callAt = app.indexOf("bindOrdersCollection();");
  assert.match(app.slice(callAt, callAt + 80), /bindOrdersCollection\(\);\n  setInterval\(reloadIfNewBuild, 5 \* 60 \* 1000\);/);
});
