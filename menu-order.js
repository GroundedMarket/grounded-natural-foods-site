/* Order for items inside a weekly deli box (Side Salads and the other
   boxes on the same editor). The week's `items` array is the current
   order. `savedOrder` is an optional id -> number map. An id with no
   saved number keeps its current index, so menus that have never been
   reordered stay put instead of jumping to the front. */
var MenuOrder = (function () {
  function savedKey(savedOrder, id) {
    if (!savedOrder || !Object.prototype.hasOwnProperty.call(savedOrder, id))
      return null;
    var raw = savedOrder[id];
    if (raw == null || raw === "") return null;
    var num = Number(raw);
    return isFinite(num) ? num : null;
  }

  // Items that have a saved number are placed at that index. Items that
  // don't are left in their current order and fill the gaps, so a menu
  // that has never been reordered — and a newly added item with no number
  // — does not jump to the front.
  function orderMenuItemIds(ids, savedOrder) {
    var list = Array.isArray(ids) ? ids : [];
    var unordered = [];
    var placed = [];
    list.forEach(function (id, index) {
      var saved = savedKey(savedOrder, id);
      if (saved == null) unordered.push(id);
      else placed.push({ id: id, order: saved, index: index });
    });
    placed.sort(function (a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return a.index - b.index;
    });
    var result = unordered.slice();
    placed.forEach(function (row) {
      var at = row.order;
      if (at < 0) at = 0;
      if (at > result.length) at = result.length;
      result.splice(at, 0, row.id);
    });
    return result;
  }

  // One step only, matching the ↑ / ↓ buttons. Returns a new array, or
  // null when the item is missing or already at that end.
  function moveMenuItem(ids, id, direction) {
    if (direction !== -1 && direction !== 1) return null;
    var list = Array.isArray(ids) ? ids : [];
    var idx = list.indexOf(id);
    var swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return null;
    var next = list.slice();
    var tmp = next[idx];
    next[idx] = next[swapIdx];
    next[swapIdx] = tmp;
    return next;
  }

  function savedOrderMap(ids) {
    var map = {};
    (Array.isArray(ids) ? ids : []).forEach(function (id, index) {
      map[id] = index;
    });
    return map;
  }

  return {
    orderMenuItemIds: orderMenuItemIds,
    moveMenuItem: moveMenuItem,
    savedOrderMap: savedOrderMap,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = MenuOrder;
}
