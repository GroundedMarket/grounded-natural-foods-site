/**
 * Server-side checks for a public order. This is the catalog validation
 * the Firestore rules used to do on each deli line, before that check
 * crossed Firestore's 1,000-expression limit. Kitchen lines are still
 * not checked one by one. The Admin SDK writes the order after this
 * returns ok.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const WHOLE_PIECE_NAMES = new Set([
  'Ham Spiral Sliced',
  'Classic Roast Turkey Brst',
  'Classic Rst Turkey Breast',
  'Turkey Carved and Served Oven Roastd',
]);
const SLICE_STYLES = new Set(['shaved', 'thin', 'medium', 'large', 'thick']);
const DELI_LINE_KEYS = [
  'kind', 'catalog', 'itemId', 'name', 'weightLbs', 'sliceStyle',
  'sliceStyleLabel', 'pricePerLb', 'note', 'lineId', 'qty', 'pieceCount',
];
const KITCHEN_KEYS = [
  'customerName', 'customerPhone', 'pickupDate', 'pickupTime', 'weekKey',
  'items', 'status', 'submittedAt', 'autoprinted',
];
const DELI_KEYS = [
  'channel', 'customerName', 'customerPhone', 'pickupDate', 'pickupTime',
  'notes', 'items', 'deliStatus', 'status', 'payAtPickup', 'stockDecremented',
  'submittedAt', 'autoprinted', 'weekKey',
];
const MIXED_KEYS = [
  'customerName', 'customerPhone', 'pickupDate', 'pickupTime', 'weekKey',
  'items', 'status', 'submittedAt', 'autoprinted',
  'notes', 'payAtPickup', 'stockDecremented',
];

function fail(code, message) {
  return { ok: false, code, message };
}

function pass(order) {
  return { ok: true, order };
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasOnly(obj, keys) {
  const allowed = new Set(keys);
  return Object.keys(obj).every((key) => allowed.has(key));
}

function pick(obj, keys) {
  const out = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];
  });
  return out;
}

function isStringBetween(value, min, max) {
  return typeof value === 'string' && value.length >= min && value.length <= max;
}

function formatWeight(n) {
  const q = Math.round(Number(n) * 1000) / 1000;
  if (!Number.isFinite(q)) return '0';
  return q.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function stockMessage(name, onHand) {
  return "Sorry, we don't have enough " + name + " to fill this order. We have about "
    + formatWeight(onHand) + " lb on hand.";
}

function isCounterDeliLine(item) {
  return isPlainObject(item) && item.catalog === 'counter';
}

function catalogIsWholePiece(data) {
  if (data.wholePieceOnly === true) return true;
  if (Object.prototype.hasOwnProperty.call(data, 'wholePieceOnly')) return false;
  return WHOLE_PIECE_NAMES.has(data.toastName);
}

function meatMinFrom(settings) {
  const n = settings && settings.meatMinLbs;
  if (typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 5) return n;
  return 0.25;
}

function pricesMatch(catalogPrice, linePrice) {
  return typeof catalogPrice === 'number'
    && typeof linePrice === 'number'
    && Number.isFinite(catalogPrice)
    && Number.isFinite(linePrice)
    && Math.abs(catalogPrice - linePrice) < 0.001;
}

function onHandOf(data) {
  return typeof data.lbsOnHand === 'number' && Number.isFinite(data.lbsOnHand) ? data.lbsOnHand : 0;
}

function classify(order) {
  if (!isPlainObject(order)) return 'invalid';
  if (order.channel === 'deliCounter' || Object.prototype.hasOwnProperty.call(order, 'deliStatus')) {
    return 'deli';
  }
  if (order.kind != null) return 'invalid';
  if (Array.isArray(order.items) && order.items.some(isCounterDeliLine)) return 'mixed';
  return 'kitchen';
}

function requirePickup(order, nameMin, phoneMin) {
  if (!isStringBetween(order.customerName, nameMin, 80)) {
    return fail('invalid-argument', 'Please enter the name for the order.');
  }
  if (!isStringBetween(order.customerPhone, phoneMin, 40)) {
    return fail('invalid-argument', 'Please enter a phone number we can reach you at.');
  }
  if (typeof order.pickupDate !== 'string' || !DATE_RE.test(order.pickupDate)) {
    return fail('invalid-argument', 'Choose a pickup date.');
  }
  if (typeof order.pickupTime !== 'string' || !TIME_RE.test(order.pickupTime)) {
    return fail('invalid-argument', 'Choose a pickup time.');
  }
  if (order.status !== 'incomplete' || order.autoprinted !== false) {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  if (typeof order.submittedAt !== 'string' || order.submittedAt.length > 40 || order.submittedAt.length < 1) {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  if (!Array.isArray(order.items)) {
    return fail('invalid-argument', 'Add at least one item.');
  }
  return null;
}

async function checkDeliLine(item, ctx) {
  if (!isPlainObject(item) || !hasOnly(item, DELI_LINE_KEYS)) {
    return fail('invalid-argument', 'A deli line on this order is incomplete. Please refresh and try again.');
  }
  if (item.kind !== 'meatcheese' || item.catalog !== 'counter' || item.qty !== 1) {
    return fail('invalid-argument', 'A deli line on this order is incomplete. Please refresh and try again.');
  }
  if (typeof item.sliceStyleLabel !== 'string' || item.sliceStyleLabel.length > 80) {
    return fail('invalid-argument', 'Choose how you would like that item sliced.');
  }
  if (typeof item.note !== 'string' || item.note.length > 140) {
    return fail('invalid-argument', 'Please keep each item note shorter.');
  }
  if (!isStringBetween(item.name, 1, 80)) {
    return fail('invalid-argument', 'A deli line is missing its name. Please refresh and try again.');
  }
  if (typeof item.itemId !== 'string' || item.itemId.length < 1 || item.itemId.length > 200 || item.itemId.includes('/')) {
    return fail('invalid-argument', 'A deli line is missing its item. Please refresh and try again.');
  }
  if (typeof item.lineId !== 'string' || item.lineId.length < 1 || item.lineId.length > 80) {
    return fail('invalid-argument', 'A deli line on this order is incomplete. Please refresh and try again.');
  }
  if (typeof item.pricePerLb !== 'number' || !Number.isFinite(item.pricePerLb)) {
    return fail('invalid-argument', 'A deli line is missing its price. Please refresh and try again.');
  }
  const name = item.name;
  let data = ctx.items.get(item.itemId);
  if (data === undefined) {
    data = await ctx.getItem(item.itemId);
    ctx.items.set(item.itemId, data || null);
  }
  if (!data) {
    return fail('failed-precondition', "We couldn't find " + name + " on the counter. Please refresh and try again.");
  }
  if (data.catalog !== 'counter') {
    return fail('failed-precondition', name + " isn't available on the online counter.");
  }
  if (typeof data.category !== 'string' || typeof data.toastName !== 'string') {
    return fail('failed-precondition', name + " isn't available to order online. Please refresh and try again.");
  }
  if (data.discontinued !== false) {
    return fail('failed-precondition', name + " has been discontinued and can't be ordered online.");
  }
  if (data.hiddenOnline === true || data.notOfferedOnline === true || data.removed === true) {
    return fail('failed-precondition', name + " isn't offered online. Please choose something else.");
  }
  const sku = Object.prototype.hasOwnProperty.call(data, 'sku') ? data.sku : '';
  if (data.toastName === 'Chipped Meat' || sku === '70238') {
    return fail('failed-precondition', name + " isn't offered online.");
  }
  if (!pricesMatch(data.pricePerLb, item.pricePerLb)) {
    const shown = typeof data.pricePerLb === 'number'
      ? ' It is $' + Number(data.pricePerLb).toFixed(2) + '/lb now.'
      : '';
    return fail('failed-precondition', 'The price for ' + name + ' changed.' + shown + ' Please refresh and try again.');
  }
  const onHand = onHandOf(data);
  if (catalogIsWholePiece(data)) {
    if (item.sliceStyle !== 'whole' || item.sliceStyleLabel !== '' || item.weightLbs !== 0) {
      return fail('failed-precondition', name + ' is sold by the whole piece. Choose how many pieces instead of a sliced weight.');
    }
    if (!Number.isInteger(item.pieceCount) || item.pieceCount < 1 || item.pieceCount > 12) {
      return fail('invalid-argument', 'Choose 1 to 12 whole pieces of ' + name + '.');
    }
  } else {
    if (Object.prototype.hasOwnProperty.call(item, 'pieceCount')) {
      return fail('invalid-argument', name + ' is sliced to order. Choose a weight and a slice.');
    }
    if (typeof item.weightLbs !== 'number' || !Number.isFinite(item.weightLbs) || item.weightLbs <= 0 || item.weightLbs > 30) {
      return fail('invalid-argument', 'Choose a weight up to 30 lb for ' + name + '.');
    }
    if (!SLICE_STYLES.has(item.sliceStyle)) {
      return fail('invalid-argument', 'Choose how you would like ' + name + ' sliced.');
    }
    if (data.category === 'cheese' && item.sliceStyle === 'shaved') {
      return fail('failed-precondition', "We don't shave cheese. Choose another slice for " + name + '.');
    }
    if (data.category === 'meat' && !(item.weightLbs + 1e-9 >= ctx.meatMin)) {
      const label = Math.abs(ctx.meatMin - 0.25) < 1e-9 ? '1/4 lb' : formatWeight(ctx.meatMin) + ' lb';
      return fail('failed-precondition', 'Minimum order for ' + name + ' is ' + label + '.');
    }
    const already = ctx.requested.get(item.itemId) || 0;
    const next = Math.round((already + item.weightLbs) * 1000) / 1000;
    if (!(onHand + 1e-9 >= next)) {
      return fail('failed-precondition', stockMessage(name, onHand));
    }
    ctx.requested.set(item.itemId, next);
  }
  if (data.inStock !== true) {
    return fail('failed-precondition', stockMessage(name, onHand));
  }
  return { ok: true, item: pick(item, DELI_LINE_KEYS) };
}

function validateKitchen(order) {
  if (!hasOnly(order, KITCHEN_KEYS)) {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  const pickup = requirePickup(order, 1, 1);
  if (pickup) return pickup;
  if (typeof order.weekKey !== 'string' || order.weekKey.length > 20) {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  if (order.items.length < 1 || order.items.length > 40) {
    return fail('invalid-argument', 'Add at least one item.');
  }
  if (order.items.some(isCounterDeliLine)) {
    return fail('failed-precondition', 'Meats and cheeses have to be checked against the counter. Please refresh and try again.');
  }
  return pass(pick(order, KITCHEN_KEYS));
}

async function validateDeli(order, ctx) {
  if (!hasOnly(order, DELI_KEYS)) {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  if (order.channel !== 'deliCounter' || order.deliStatus !== 'new' || order.payAtPickup !== true || order.stockDecremented !== false) {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  if (order.weekKey !== '') {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  if (typeof order.notes !== 'string' || order.notes.length > 300) {
    return fail('invalid-argument', 'Please keep the order note under 300 characters.');
  }
  const pickup = requirePickup(order, 2, 10);
  if (pickup) return pickup;
  if (order.items.length < 1) {
    return fail('invalid-argument', 'Add at least one meat or cheese.');
  }
  if (order.items.length > 8) {
    return fail('invalid-argument', 'An online deli order can have up to 8 items. Call the store for a larger order.');
  }
  const items = [];
  for (let i = 0; i < order.items.length; i++) {
    const checked = await checkDeliLine(order.items[i], ctx);
    if (!checked.ok) return checked;
    items.push(checked.item);
  }
  return pass(Object.assign(pick(order, DELI_KEYS), { items }));
}

async function validateMixed(order, ctx) {
  if (!hasOnly(order, MIXED_KEYS)) {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  if (order.payAtPickup !== true || order.stockDecremented !== false) {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  if (typeof order.weekKey !== 'string' || order.weekKey.length < 1 || order.weekKey.length > 20) {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  if (typeof order.notes !== 'string' || order.notes.length > 300) {
    return fail('invalid-argument', 'Please keep the order note under 300 characters.');
  }
  const pickup = requirePickup(order, 2, 10);
  if (pickup) return pickup;
  if (order.items.length < 2 || order.items.length > 40) {
    return fail('invalid-argument', 'Add the kitchen item to this order, or place the meats and cheeses on their own.');
  }
  if (!isCounterDeliLine(order.items[0]) || isCounterDeliLine(order.items[order.items.length - 1])) {
    return fail('invalid-argument', 'Put meats and cheeses first, then the kitchen items.');
  }
  const items = [];
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    if (!isCounterDeliLine(item)) {
      items.push(item);
      continue;
    }
    if (i >= 8) {
      return fail('invalid-argument', 'An online deli order can have up to 8 meats and cheeses. Call the store for a larger order.');
    }
    const checked = await checkDeliLine(item, ctx);
    if (!checked.ok) return checked;
    items.push(checked.item);
  }
  return pass(Object.assign(pick(order, MIXED_KEYS), { items }));
}

async function validatePublicOrder(order, deps) {
  if (!deps || typeof deps.getItem !== 'function' || typeof deps.getDeliSettings !== 'function') {
    throw new Error('validatePublicOrder requires getItem and getDeliSettings');
  }
  const kind = classify(order);
  if (kind === 'invalid') {
    return fail('invalid-argument', 'This order could not be saved. Please try again.');
  }
  const ctx = {
    getItem: deps.getItem,
    items: new Map(),
    requested: new Map(),
    meatMin: 0.25,
  };
  if (kind === 'deli' || kind === 'mixed') {
    ctx.meatMin = meatMinFrom(await deps.getDeliSettings());
  }
  switch (kind) {
    case 'kitchen':
      return validateKitchen(order);
    case 'deli':
      return validateDeli(order, ctx);
    case 'mixed':
      return validateMixed(order, ctx);
    default: {
      const unexpected = kind;
      throw new Error('Unknown public order kind: ' + unexpected);
    }
  }
}

module.exports = {
  validatePublicOrder,
  stockMessage,
  formatWeight,
};
