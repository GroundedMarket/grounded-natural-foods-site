/* Small hand-drawn icons for the public deli list.
   Matched on the friendly name, then a type fallback. */
var DeliIcons = (function () {
  var STROKE =
    'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

  function svg(inner) {
    return (
      '<svg class="mc-deli-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
      inner +
      "</svg>"
    );
  }

  function wing() {
    return svg(
      '<path ' + STROKE + ' d="M5 20c6-9 14-13 22-14-3 5-3 9 0 13-7 1-15 1-22 1z"/>' +
        '<path ' + STROKE + ' d="M11 18c2 2 5 3 8 3"/>'
    );
  }
  function mirepoix() {
    return svg(
      '<path ' + STROKE + ' d="M7 22c2-8 3-12 2-16"/>' +
        '<path ' + STROKE + ' d="M16 23V8"/>' +
        '<path ' + STROKE + ' d="M15 12h2M15 16h2"/>' +
        '<circle ' + STROKE + ' cx="24" cy="18" r="5"/>' +
        '<path ' + STROKE + ' d="M24 13v3"/>'
    );
  }
  function roastBird() {
    return svg(
      '<ellipse ' + STROKE + ' cx="16" cy="18" rx="9" ry="6"/>' +
        '<path ' + STROKE + ' d="M22 16c3 0 5-2 6-4M10 20c-3 2-5 2-7 1"/>' +
        '<circle ' + STROKE + ' cx="20" cy="16" r="0.8" fill="currentColor"/>'
    );
  }
  function honeyDipper() {
    return svg(
      '<path ' + STROKE + ' d="M20 4L12 20"/>' +
        '<ellipse ' + STROKE + ' cx="11" cy="23" rx="4" ry="5"/>' +
        '<path ' + STROKE + ' d="M8 21h6M8 24h6"/>'
    );
  }
  function lemonPepper() {
    return svg(
      '<circle ' + STROKE + ' cx="13" cy="16" r="7"/>' +
        '<path ' + STROKE + ' d="M13 9v14M8 14c3 2 7 2 10 0"/>' +
        '<circle cx="24" cy="10" r="1.2" fill="currentColor"/>' +
        '<circle cx="27" cy="15" r="1.2" fill="currentColor"/>' +
        '<circle cx="23" cy="18" r="1.2" fill="currentColor"/>'
    );
  }
  function chili() {
    return svg(
      '<path ' + STROKE + ' d="M10 8c6 1 12 6 12 12 0 4-3 6-6 6-5 0-8-4-8-8 0-4 2-8 2-10z"/>' +
        '<path ' + STROKE + ' d="M14 8c1-3 3-4 5-4"/>'
    );
  }
  function chipotle() {
    return svg(
      '<path ' + STROKE + ' d="M9 14c2-6 8-8 12-6 2 6 1 12-2 16-5 2-10 0-12-4 1-2 2-4 2-6z"/>' +
        '<path ' + STROKE + ' d="M14 12c2 2 3 5 2 8"/>'
    );
  }
  function bottle() {
    return svg(
      '<path ' + STROKE + ' d="M13 8h6l-1 4v12a3 3 0 01-3 3h-0a3 3 0 01-3-3V12z"/>' +
        '<path ' + STROKE + ' d="M14 5h4v3h-4zM12 18h8"/>'
    );
  }
  function smokeLog() {
    return svg(
      '<path ' + STROKE + ' d="M6 22c4-2 16-2 20 0-2 3-6 4-10 4s-8-1-10-4z"/>' +
        '<path ' + STROKE + ' d="M14 18c0-3 1-5 0-8M18 17c1-3 0-5 1-8"/>'
    );
  }
  function maple() {
    return svg(
      '<path ' + STROKE + ' d="M16 28V16M16 14l-4-3 1-4-4-1 3-4 4 3 4-3 3 4-4 1 1 4z"/>'
    );
  }
  function ovenBird() {
    return svg(
      '<rect ' + STROKE + ' x="6" y="8" width="20" height="16" rx="2"/>' +
        '<path ' + STROKE + ' d="M6 14h20"/>' +
        '<ellipse ' + STROKE + ' cx="16" cy="20" rx="4" ry="2.5"/>'
    );
  }
  function flame() {
    return svg(
      '<path ' + STROKE + ' d="M16 28c-5 0-8-4-8-8 0-5 4-7 5-12 2 3 3 4 5 4 0-4 2-7 3-10 4 4 6 8 6 13 0 6-4 13-11 13z"/>'
    );
  }
  function pine() {
    return svg(
      '<path ' + STROKE + ' d="M16 26V14M16 22L8 22 16 10l8 12zM16 16L10 16 16 6l6 10"/>' +
        '<path ' + STROKE + ' d="M22 8c1-2 1-3 0-5"/>'
    );
  }
  function salsa() {
    return svg(
      '<path ' + STROKE + ' d="M8 14h16l-2 10H10z"/>' +
        '<circle ' + STROKE + ' cx="12" cy="10" r="2.2"/>' +
        '<path ' + STROKE + ' d="M20 6c2 2 2 4 0 6"/>'
    );
  }
  function ham() {
    return svg(
      '<path ' + STROKE + ' d="M8 18c0-6 4-10 10-10 6 0 8 4 8 8 0 5-4 10-10 10-4 0-8-3-8-8z"/>' +
        '<circle ' + STROKE + ' cx="12" cy="18" r="2"/>'
    );
  }
  function glazedHam() {
    return svg(
      '<path ' + STROKE + ' d="M8 18c0-6 4-10 10-10 6 0 8 4 8 8 0 5-4 10-10 10-4 0-8-3-8-8z"/>' +
        '<circle ' + STROKE + ' cx="12" cy="18" r="2"/>' +
        '<path ' + STROKE + ' d="M20 8c1 2 0 3-1 4"/>'
    );
  }
  function roastBeef() {
    return svg(
      '<ellipse ' + STROKE + ' cx="16" cy="18" rx="10" ry="6"/>' +
        '<path ' + STROKE + ' d="M10 18c2-2 10-2 12 0"/>'
    );
  }
  function pastrami() {
    return svg(
      '<ellipse ' + STROKE + ' cx="16" cy="18" rx="10" ry="6"/>' +
        '<circle cx="12" cy="16" r="0.9" fill="currentColor"/>' +
        '<circle cx="16" cy="19" r="0.9" fill="currentColor"/>' +
        '<circle cx="20" cy="16" r="0.9" fill="currentColor"/>' +
        '<circle cx="18" cy="21" r="0.9" fill="currentColor"/>'
    );
  }
  function cornedBeef() {
    return svg(
      '<rect ' + STROKE + ' x="7" y="12" width="18" height="10" rx="3"/>' +
        '<circle cx="12" cy="16" r="0.8" fill="currentColor"/>' +
        '<circle cx="17" cy="18" r="0.8" fill="currentColor"/>' +
        '<circle cx="21" cy="15" r="0.8" fill="currentColor"/>'
    );
  }
  function wedge() {
    return svg('<path ' + STROKE + ' d="M8 24L16 6l8 18z"/>');
  }
  function swiss() {
    return svg(
      '<path ' + STROKE + ' d="M8 24L16 6l8 18z"/>' +
        '<circle cx="15" cy="16" r="1.3" fill="currentColor"/>' +
        '<circle cx="18" cy="20" r="1.1" fill="currentColor"/>'
    );
  }
  function wheel() {
    return svg(
      '<circle ' + STROKE + ' cx="16" cy="16" r="9"/>' +
        '<path ' + STROKE + ' d="M16 7v9l7 4"/>'
    );
  }
  function block() {
    return svg('<rect ' + STROKE + ' x="7" y="10" width="18" height="13" rx="2"/>');
  }
  function pepperJack() {
    return svg(
      '<path ' + STROKE + ' d="M8 24L16 6l8 18z"/>' +
        '<circle cx="14" cy="16" r="1" fill="currentColor"/>' +
        '<circle cx="18" cy="19" r="1" fill="currentColor"/>' +
        '<circle cx="15" cy="21" r="0.8" fill="currentColor"/>'
    );
  }
  function smokedWedge() {
    return svg(
      '<path ' + STROKE + ' d="M8 24L16 8l8 16z"/>' +
        '<path ' + STROKE + ' d="M20 6c1-2 1-3 0-4M24 8c1-2 1-3 0-4"/>'
    );
  }
  function ball() {
    return svg('<circle ' + STROKE + ' cx="16" cy="17" r="8"/>');
  }
  function marbled() {
    return svg(
      '<path ' + STROKE + ' d="M8 24L16 6l8 18z"/>' +
        '<path ' + STROKE + ' d="M12 18c3-1 5 1 8-1"/>'
    );
  }
  function sliceSquare() {
    return svg(
      '<rect ' + STROKE + ' x="8" y="10" width="16" height="12" rx="1"/>' +
        '<path ' + STROKE + ' d="M8 14h16"/>'
    );
  }

  var BY_NAME = {
    buffalo: wing,
    "chicken chipotle": chipotle,
    everroast: mirepoix,
    "golden classic": roastBird,
    "honey bbq": honeyDipper,
    "lemon pepper": lemonPepper,
    "ichiban teriyaki": bottle,
    cajun: chili,
    "hickory smoked black forest": pine,
    "honey maple": maple,
    mesquite: smokeLog,
    ovengold: ovenBird,
    pitcraft: flame,
    salsalito: salsa,
    "smoke master black forest": ham,
    "sweet slice": glazedHam,
    "london broil roast beef": roastBeef,
    "pastrami top round": pastrami,
    "corned beef top round": cornedBeef,
    "3 pepper colby jack": pepperJack,
    "aged gouda": wheel,
    "american yellow": sliceSquare,
    "chipotle gouda": pepperJack,
    "colby jack": marbled,
    "havarti plain": wedge,
    "lacey swiss": swiss,
    mozzarella: ball,
    provolone: wedge,
    "smoked cheddar": smokedWedge,
    "vermont cheddar": block,
  };

  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  var CHOICES = [
    { key: "wing", label: "Chicken wing", draw: wing },
    { key: "mirepoix", label: "Celery, carrot, onion", draw: mirepoix },
    { key: "roast-bird", label: "Roast bird", draw: roastBird },
    { key: "honey", label: "Honey dipper", draw: honeyDipper },
    { key: "lemon-pepper", label: "Lemon and pepper", draw: lemonPepper },
    { key: "chili", label: "Chili pepper", draw: chili },
    { key: "chipotle", label: "Chipotle", draw: chipotle },
    { key: "bottle", label: "Sauce bottle", draw: bottle },
    { key: "smoke-log", label: "Wood smoke", draw: smokeLog },
    { key: "maple", label: "Maple leaf", draw: maple },
    { key: "oven", label: "Oven roast", draw: ovenBird },
    { key: "flame", label: "Grill flame", draw: flame },
    { key: "pine", label: "Pine and smoke", draw: pine },
    { key: "salsa", label: "Salsa", draw: salsa },
    { key: "ham", label: "Ham", draw: ham },
    { key: "glazed-ham", label: "Glazed ham", draw: glazedHam },
    { key: "roast-beef", label: "Roast beef", draw: roastBeef },
    { key: "pastrami", label: "Pastrami", draw: pastrami },
    { key: "corned-beef", label: "Corned beef", draw: cornedBeef },
    { key: "wedge", label: "Cheese wedge", draw: wedge },
    { key: "swiss", label: "Swiss", draw: swiss },
    { key: "wheel", label: "Cheese wheel", draw: wheel },
    { key: "block", label: "Cheese block", draw: block },
    { key: "pepper-jack", label: "Pepper cheese", draw: pepperJack },
    { key: "smoked-wedge", label: "Smoked cheese", draw: smokedWedge },
    { key: "ball", label: "Cheese ball", draw: ball },
    { key: "marbled", label: "Marbled cheese", draw: marbled },
    { key: "slice", label: "Cheese slice", draw: sliceSquare },
  ];

  function iconFor(item) {
    if (item && item.iconKey && item.iconKey !== "default") {
      var chosen = null;
      var c;
      for (c = 0; c < CHOICES.length; c++) {
        if (CHOICES[c].key === item.iconKey) chosen = CHOICES[c];
      }
      if (chosen) return chosen.draw();
    }
    var names = [item && item.displayName, item && item.name, item && item.toastName];
    var i;
    var blob = "";
    for (i = 0; i < names.length; i++) {
      var key = normalize(names[i]);
      blob += " " + key;
      if (BY_NAME[key]) return BY_NAME[key]();
    }
    if (/swiss/.test(blob)) return swiss();
    if (item && item.category === "cheese") {
      if (/smok/.test(blob)) return smokedWedge();
      if (/pepper|chipotle|jalap/.test(blob)) return pepperJack();
      if (/mozz/.test(blob)) return ball();
      if (/gouda|wheel/.test(blob)) return wheel();
      return wedge();
    }
    var type = item && item.meatType;
    if (type === "chicken" || /\bchicken\b/.test(blob)) return wing();
    if (type === "turkey" || /\bturkey\b/.test(blob)) return roastBird();
    if (type === "ham" || /\bham\b/.test(blob)) return ham();
    if (type === "beef") return roastBeef();
    return wedge();
  }

  return {
    iconFor: iconFor,
    choices: function () {
      return CHOICES.map(function (choice) {
        return { key: choice.key, label: choice.label, svg: choice.draw() };
      });
    },
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = DeliIcons;
}
