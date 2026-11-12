/* Boar's Head product photos, keyed by normalized Toast name.
   A blank photoUrl on the item uses this map. A saved photoUrl replaces it.
   Pages and filenames are listed in assets/deli-photos/sources.json. */
var DeliPhotos = (function () {
  var BY_TOAST = {
    "turkey honey maple": "assets/deli-photos/honey-maple-turkey.webp",
    "turkey ovengold": "assets/deli-photos/ovengold.webp",
    "chicken gldn clssc": "assets/deli-photos/golden-classic.webp",
    "ham smoke master black forest": "assets/deli-photos/smokemaster-ham.webp",
    "ham sweet slice": "assets/deli-photos/sweet-slice.webp",
    "turkey hickory smoked black forest": "assets/deli-photos/hickory-black-forest-turkey.webp",
    "turkey pitcraft": "assets/deli-photos/pitcraft.webp",
    "turkey salsalito": "assets/deli-photos/salsalito.webp",
    "chicken honey bbq": "assets/deli-photos/honey-bbq-chicken.webp",
    "chicken chipotle": "assets/deli-photos/chipotle-chicken.webp",
    "chicken buffalo": "assets/deli-photos/buffalo-chicken.webp",
    "cajun turkey": "assets/deli-photos/cajun-turkey.webp",
    "pastrami beef top rnd": "assets/deli-photos/pastrami-top-round.webp",
    "london broil roast beef": "assets/deli-photos/london-broil.webp",
    "turkey all natural tuscan": "assets/deli-photos/tuscan-turkey.webp",
    "turkey pastrami": "assets/deli-photos/turkey-pastrami.webp",
    "turkey carved and served oven roastd": "assets/deli-photos/carve-and-serve-turkey.webp",
    "salami metro genoa": "assets/deli-photos/genoa-salami.webp",
    "rstbf deluxe": "assets/deli-photos/deluxe-roast-beef.webp",
    "turkey blackened": "assets/deli-photos/blackened-turkey.webp",
    "chicken everroast": "assets/deli-photos/everroast.webp",
    "firesmith chicken": "assets/deli-photos/firesmith-chicken.webp",
    "pepperoni metro": "assets/deli-photos/pepperoni.webp",
    "ham spiral sliced": "assets/deli-photos/spiral-ham.webp",
    "red romanian pastrami": "assets/deli-photos/romanian-pastrami.webp",
    "turkey mesquite": "assets/deli-photos/mesquite-turkey.webp",
    "turkey cracked pepper": "assets/deli-photos/cracked-pepper-turkey.webp",
    "chicken lemon pepper": "assets/deli-photos/lemon-pepper-chicken.webp",
    "corned beef top rnd": "assets/deli-photos/corned-beef.webp",
    "ham bourbon": "assets/deli-photos/bourbonridge-ham.webp",
    "ham honey maple": "assets/deli-photos/honey-maple-ham.webp",
    "ichiban teriyaki chicken": "assets/deli-photos/ichiban-teriyaki.webp",
    "classic rst turkey breast": "assets/deli-photos/oven-roasted-turkey.webp",
    "turkey no salt ad": "assets/deli-photos/no-salt-turkey.webp",
    "colby jack": "assets/deli-photos/colby-jack.webp",
    "american yellow": "assets/deli-photos/american-yellow.webp",
    "3 pepper cojack": "assets/deli-photos/three-pepper-colby.webp",
    "lacey swiss": "assets/deli-photos/lacey-swiss.webp",
    "vermont cheddar": "assets/deli-photos/vermont-cheddar.webp",
    "havarti plain": "assets/deli-photos/havarti.webp",
    "smoked cheddar": "assets/deli-photos/smoked-cheddar.webp",
    "chipotle gouda": "assets/deli-photos/chipotle-gouda.webp",
    "provolone": "assets/deli-photos/provolone.webp",
    "american white": "assets/deli-photos/american-white.webp",
    "havarti dill": "assets/deli-photos/havarti-dill.webp",
    "smoked gruyere": "assets/deli-photos/smoked-gruyere.webp",
    "monterey jack": "assets/deli-photos/monterey-jack.webp",
    "mozzarella": "assets/deli-photos/mozzarella.webp",
    "muenster": "assets/deli-photos/muenster.webp",
    "asiago mild crmy": "assets/deli-photos/asiago.webp",
    "asiago mild+crmy": "assets/deli-photos/asiago.webp",
    "montry jack jalapeno": "assets/deli-photos/pepper-jack.webp",
    "havarti jalapeno": "assets/deli-photos/havarti-jalapeno.webp",
    "colby longhorn": "assets/deli-photos/colby-longhorn.webp",
    "aged gouda": "assets/deli-photos/aged-gouda.webp"
  };

  function normalize(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function photoFor(item) {
    if (!item) return "";
    var override = String(item.photoUrl || "").trim();
    if (override) return override;
    var names = [item.toastName, item.name, item.displayName];
    var i;
    for (i = 0; i < names.length; i++) {
      var key = normalize(names[i]);
      if (BY_TOAST[key]) return BY_TOAST[key] + "?v=4";
    }
    return "";
  }

  return { photoFor: photoFor };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = DeliPhotos;
}
