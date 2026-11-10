/* Hand-drawn deli icons. DeliIcons.iconFor(item) and DeliIcons.choices().
   Strokes use currentColor so meats stay terracotta and cheeses stay gold.
   Accent details use the site's CSS variables. */
var DeliIcons = (function () {
  function svg(inner) {
    return (
      '<svg class="mc-deli-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
      inner +
      "</svg>"
    );
  }

  function chipotle() {
    return svg("<path d=\"M9 14c2-6 8-8 12-6 2 6 1 12-2 16-5 2-10 0-12-4 1-2 2-4 2-6z\" fill=\"currentColor\" fill-opacity=\"0.28\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14 12c2 2 3 5 2 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function wing() {
    return svg("<path d=\"M5 20.8c0.6-5.6 4.4-8.6 8.8-7.4 3 0.8 5.2 2.6 7 1.2 3.4-3.4 7.4-6 11.4-7-1.4 3.4-1 6.8 1.2 10.2-6.6 1-13.6 1.6-20.8 1.8-3.2 0.1-6.2 0.2-7.6 1.2z\" fill=\"currentColor\" fill-opacity=\"0.28\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12.2 18.6c2.2 1.8 5.2 2.6 8.4 2.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M5 20.8c-1.6 0.6-2.8 0.5-3.6-0.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function mirepoix() {
    return svg("<path d=\"M6.8 24.2c1.6-8.2 2.4-13.4 1.6-19.2\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M7.6 11.5h3.1M7.4 15.8h3.4\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M6.2 24.5c0.4-0.2 1.8-0.2 3.2 0\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16.2 7.2c-0.2 5.6-1.1 11.6-2.6 17.4h5.4c-1.6-5.8-2.6-11.8-2.8-17.4z\" fill=\"currentColor\" fill-opacity=\"0.35\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16.2 7.2v-2.4M14.8 12.6h2.8M14.6 16.8h3.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"24.2\" cy=\"19.2\" r=\"5.1\" fill=\"var(--gold)\" fill-opacity=\"0.3\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M24.2 14.1v-3.2\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M22.6 17.6c1.2 0.7 2.6 0.7 3.6 0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function roastBird() {
    return svg("<path d=\"M7.6 20.4c0.8-5.8 5.2-8.8 10.4-7.6 4.2 0.8 7.2 3.4 7.6 6.6 0.5 3.4-2.2 6.4-7.2 7.2-5.2 0.8-10.4-0.6-10.8-6.2z\" fill=\"var(--gold)\" fill-opacity=\"0.32\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M22.6 16.4c2.4-0.6 4.6-2.6 5.6-5.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M9.2 22.8c-3.2 2.6-6.4 3.4-8.4 2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M18.4 14.6c0.4-2.8-0.4-4.8-1.8-6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"20.6\" cy=\"16.2\" r=\"0.85\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/>");
  }
  function honey() {
    return svg("<path d=\"M21.2 4.6L12.4 20.2\" fill=\"none\" stroke=\"var(--brown)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><ellipse cx=\"11.2\" cy=\"23.2\" rx=\"4.3\" ry=\"5.1\" fill=\"var(--gold)\" fill-opacity=\"0.38\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M7.8 21.2h6.8M7.8 24.4h6.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M11.2 28.4c0.1 1.6 0.2 2.4 0 3.2\" fill=\"none\" stroke=\"var(--gold)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function lemonPepper() {
    return svg("<circle cx=\"12.8\" cy=\"16.2\" r=\"7.1\" fill=\"var(--gold)\" fill-opacity=\"0.34\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12.8 9.3v13.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M8 14.4c2.9 2 6.6 2 9.4 0.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"23.6\" cy=\"10.2\" r=\"1.35\" fill=\"var(--ink)\" fill-opacity=\"0.85\" stroke=\"var(--terracotta)\" stroke-width=\"0.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"26.6\" cy=\"15.2\" r=\"1.35\" fill=\"var(--ink)\" fill-opacity=\"0.85\" stroke=\"var(--terracotta)\" stroke-width=\"0.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"22.8\" cy=\"18.4\" r=\"1.25\" fill=\"var(--ink)\" fill-opacity=\"0.85\" stroke=\"var(--terracotta)\" stroke-width=\"0.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function peppercorn() {
    return svg("<circle cx=\"12.4\" cy=\"14.2\" r=\"2.55\" fill=\"var(--ink)\" fill-opacity=\"0.75\" stroke=\"var(--terracotta)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"17.6\" cy=\"11.8\" r=\"2.25\" fill=\"var(--ink)\" fill-opacity=\"0.7\" stroke=\"var(--terracotta)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"21.8\" cy=\"16.0\" r=\"2.45\" fill=\"var(--ink)\" fill-opacity=\"0.78\" stroke=\"var(--terracotta)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"14.2\" cy=\"19.6\" r=\"2.15\" fill=\"var(--ink)\" fill-opacity=\"0.7\" stroke=\"var(--terracotta)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"19.2\" cy=\"20.6\" r=\"1.95\" fill=\"var(--ink)\" fill-opacity=\"0.72\" stroke=\"var(--terracotta)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"16.6\" cy=\"16.2\" r=\"1.55\" fill=\"var(--ink)\" fill-opacity=\"0.65\" stroke=\"var(--terracotta)\" stroke-width=\"1.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function chili() {
    return svg("<path d=\"M11.2 8.6c5.6 0.6 12.2 6.2 12.2 13.1 0 3.6-2.9 5.8-5.8 5.8-5.1 0-8.1-4.1-8.1-8.2 0-3.8 1.9-8 2.6-10.7z\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14.4 8.2c1.3-3.1 3.4-4.3 5.6-4.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function bottle() {
    return svg("<path d=\"M13.2 9.2h5.7l-0.9 3.6v11.8a2.7 2.7 0 01-2.7 2.7h0a2.7 2.7 0 01-2.7-2.7V12.8z\" fill=\"var(--gold)\" fill-opacity=\"0.22\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><rect x=\"14.1\" y=\"5.0\" width=\"3.9\" height=\"4.1\" rx=\"0.6\" fill=\"currentColor\" fill-opacity=\"0.35\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12.4 18.2h7.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function smokeLog() {
    return svg("<path d=\"M6 22.4c4.1-2.1 16.1-2.1 20.2 0-2 3.1-6.1 4.2-10.1 4.2s-8.1-1.1-10.1-4.2z\" fill=\"var(--brown)\" fill-opacity=\"0.28\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14.1 18.6c0.1-3.1 1.2-5.2 0.2-8.3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M18.2 17.5c1.1-3.1 0.1-5.3 1.3-8.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function maple() {
    return svg("<path d=\"M16 5.2L18 10.2 23.6 8.2 21 13.6 27.2 16 21 18.2 23.4 23.8 17.6 21 16 24.8 14.4 21 8.6 23.8 11 18.2 4.8 16 11 13.6 8.4 8.2 14 10.2z\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16 24.8V29.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function oven() {
    return svg("<rect x=\"6.2\" y=\"8.2\" width=\"19.6\" height=\"16.2\" rx=\"2.1\" fill=\"var(--paper)\" fill-opacity=\"0.5\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M6.2 14.1h19.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><ellipse cx=\"16\" cy=\"20.3\" rx=\"4.1\" ry=\"2.55\" fill=\"var(--gold)\" fill-opacity=\"0.35\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14.2 8.2V6.2h3.6v2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function flame() {
    return svg("<path d=\"M16 28.2c-5.1 0-8.1-4.1-8.1-8.2 0-5.1 4.1-7.1 5.1-12.1 2 3 3.1 4.1 5.1 4.1 0-4.1 2-7.1 3.1-10.1 4 4.1 6.1 8.1 6.1 13.2 0 6.1-4.1 13.1-11.3 13.1z\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16 24.6c-1.8 0-3.2-1.6-3.2-3.4 0-2 1.6-3 2.1-5.2 0.9 1.2 1.4 1.6 2.3 1.6 0-1.6 0.7-2.8 1.2-4.2 1.6 1.8 2.4 3.4 2.4 5.6 0 2.8-1.8 5.6-4.8 5.6z\" fill=\"var(--gold)\" fill-opacity=\"0.45\" stroke=\"none\"/>");
  }
  function pine() {
    return svg("<path d=\"M16 26.4V15.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16 22.2L8.2 22.2 16 10.4l7.8 11.8z\" fill=\"var(--green-moss)\" fill-opacity=\"0.32\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16 16.4L10.6 16.4 16 6.6l5.4 9.8z\" fill=\"var(--green-moss)\" fill-opacity=\"0.28\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M22.4 8.2c1.1-2.1 1.1-3.2 0.1-5.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function salsa() {
    return svg("<path d=\"M8.2 14.8h15.6l-2.1 10.1H10.3z\" fill=\"currentColor\" fill-opacity=\"0.22\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"12.4\" cy=\"10.4\" r=\"2.35\" fill=\"currentColor\" fill-opacity=\"0.4\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M20.2 6.2c2.1 2.1 2.1 4.2 0 6.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function ham() {
    return svg("<path d=\"M9 17.2c0.2-3.8 2.6-7.4 8-8.6 6-1.2 10.8 2 11.6 7 0.8 5.4-3.6 10.8-10 11.8-5.2 0.8-9.2-1.8-10.4-5.8-0.4-1.6 0-3.2 0.8-4.4z\" fill=\"currentColor\" fill-opacity=\"0.24\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"10.6\" cy=\"19.4\" r=\"2.15\" fill=\"var(--paper)\" fill-opacity=\"0.7\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function glazedHam() {
    return svg("<path d=\"M9 17.2c0.2-3.8 2.6-7.4 8-8.6 6-1.2 10.8 2 11.6 7 0.8 5.4-3.6 10.8-10 11.8-5.2 0.8-9.2-1.8-10.4-5.8-0.4-1.6 0-3.2 0.8-4.4z\" fill=\"var(--gold)\" fill-opacity=\"0.28\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"10.6\" cy=\"19.4\" r=\"2.15\" fill=\"var(--paper)\" fill-opacity=\"0.7\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M20.6 8.4c1.2 2.2 0.2 3.2-0.8 4.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M23.2 9.6c1 1.6 0.4 3.2-0.6 4.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function spiral() {
    return svg("<path d=\"M9 17.2c0.2-3.8 2.6-7.4 8-8.6 6-1.2 10.8 2 11.6 7 0.8 5.4-3.6 10.8-10 11.8-5.2 0.8-9.2-1.8-10.4-5.8-0.4-1.6 0-3.2 0.8-4.4z\" fill=\"currentColor\" fill-opacity=\"0.22\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14.2 16.2c0.6-2.8 3.4-4.4 6.2-3.6 2.6 0.8 4 3.4 3.2 5.8-0.8 2.2-3.2 3.4-5.2 2.8-1.6-0.5-2.4-2-2-3.4 0.3-1.1 1.4-1.8 2.4-1.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"10.6\" cy=\"19.4\" r=\"1.9\" fill=\"var(--paper)\" fill-opacity=\"0.65\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function pesto() {
    return svg("<path d=\"M9.6 22.4c-1.8-7.6 2.2-13.8 6.4-15.6 0.8 5.8-0.2 11.6-2.2 15.4-1.8 0.8-3.2 0.8-4.2 0.2z\" fill=\"var(--green-moss)\" fill-opacity=\"0.38\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16.2 23.2c0.8-8.6 6.2-13.2 10.2-13.4-0.2 6.1-2.2 11.8-5.2 15.1-2.1 0.7-4.1-0.1-5-1.7z\" fill=\"var(--green-moss)\" fill-opacity=\"0.32\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14.2 22.6v4.6M19.4 23.2v4.2\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function bourbon() {
    return svg("<path d=\"M9.2 8.4h13.6M9.2 25.6h13.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M9.2 8.4c-2.8 5.6-2.8 11.6 0 17.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M22.8 8.4c2.8 5.6 2.8 11.6 0 17.2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M7.6 13.2h16.8M7.6 20.8h16.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"16\" cy=\"17\" r=\"1.35\" fill=\"var(--gold)\" fill-opacity=\"0.45\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M9.2 8.4h13.6c0.2 0.2 0.4 0.6 0.4 1.1H8.8c0-0.5 0.2-0.9 0.4-1.1z\" fill=\"var(--brown)\" fill-opacity=\"0.25\" stroke=\"none\"/>");
  }
  function roastBeef() {
    return svg("<ellipse cx=\"16\" cy=\"18.2\" rx=\"10.1\" ry=\"6.1\" fill=\"currentColor\" fill-opacity=\"0.26\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M10.1 18.2c2.1-2.1 10.1-2.1 12.2 0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M11.2 20.6c1.8-1.2 8.4-1.2 10.4 0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function pastrami() {
    return svg("<ellipse cx=\"16\" cy=\"18.2\" rx=\"10.1\" ry=\"6.1\" fill=\"currentColor\" fill-opacity=\"0.24\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"12.1\" cy=\"16.2\" r=\"0.95\" fill=\"var(--ink)\" fill-opacity=\"0.8\" stroke=\"none\"/><circle cx=\"16.1\" cy=\"19.2\" r=\"0.95\" fill=\"var(--ink)\" fill-opacity=\"0.8\" stroke=\"none\"/><circle cx=\"20.2\" cy=\"16.1\" r=\"0.95\" fill=\"var(--ink)\" fill-opacity=\"0.8\" stroke=\"none\"/><circle cx=\"18.2\" cy=\"21.2\" r=\"0.9\" fill=\"var(--ink)\" fill-opacity=\"0.8\" stroke=\"none\"/><circle cx=\"13.6\" cy=\"20.4\" r=\"0.8\" fill=\"var(--ink)\" fill-opacity=\"0.75\" stroke=\"none\"/>");
  }
  function cornedBeef() {
    return svg("<rect x=\"7.1\" y=\"12.1\" width=\"17.8\" height=\"10.2\" rx=\"3.1\" fill=\"currentColor\" fill-opacity=\"0.24\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"12.1\" cy=\"16.2\" r=\"0.85\" fill=\"var(--ink)\" fill-opacity=\"0.8\" stroke=\"none\"/><circle cx=\"17.1\" cy=\"18.4\" r=\"0.85\" fill=\"var(--ink)\" fill-opacity=\"0.8\" stroke=\"none\"/><circle cx=\"21.2\" cy=\"15.4\" r=\"0.85\" fill=\"var(--ink)\" fill-opacity=\"0.8\" stroke=\"none\"/>");
  }
  function salami() {
    return svg("<path d=\"M6.4 18.2c0-5.2 2.2-8.6 6.2-10.2l10.2-3.4c3.6 0.6 5.4 4.2 5.4 8.8 0 5.2-2.2 8.8-6.2 10.4l-10.2 3.4c-3.6-0.6-5.4-4.2-5.4-9z\" fill=\"currentColor\" fill-opacity=\"0.26\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><ellipse cx=\"24.2\" cy=\"14.2\" rx=\"3.6\" ry=\"5.4\" fill=\"var(--gold)\" fill-opacity=\"0.22\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"23.4\" cy=\"12.6\" r=\"0.8\" fill=\"var(--ink)\" fill-opacity=\"0.7\" stroke=\"none\"/><circle cx=\"25.4\" cy=\"15.2\" r=\"0.7\" fill=\"var(--ink)\" fill-opacity=\"0.7\" stroke=\"none\"/><circle cx=\"23.2\" cy=\"16.6\" r=\"0.65\" fill=\"var(--ink)\" fill-opacity=\"0.7\" stroke=\"none\"/>");
  }
  function pepperoni() {
    return svg("<circle cx=\"13.2\" cy=\"15.6\" r=\"7.0\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"20.4\" cy=\"18.4\" r=\"6.2\" fill=\"currentColor\" fill-opacity=\"0.22\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"11.4\" cy=\"13.6\" r=\"0.85\" fill=\"var(--ink)\" fill-opacity=\"0.65\" stroke=\"none\"/><circle cx=\"15.6\" cy=\"16.8\" r=\"0.75\" fill=\"var(--ink)\" fill-opacity=\"0.65\" stroke=\"none\"/><circle cx=\"12.2\" cy=\"18.2\" r=\"0.7\" fill=\"var(--ink)\" fill-opacity=\"0.6\" stroke=\"none\"/><circle cx=\"19.2\" cy=\"16.6\" r=\"0.75\" fill=\"var(--ink)\" fill-opacity=\"0.6\" stroke=\"none\"/><circle cx=\"22.2\" cy=\"19.8\" r=\"0.7\" fill=\"var(--ink)\" fill-opacity=\"0.6\" stroke=\"none\"/>");
  }
  function rotisserie() {
    return svg("<path d=\"M3.6 15.4h24.8\" fill=\"none\" stroke=\"var(--brown)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"4.2\" cy=\"15.4\" r=\"1.3\" fill=\"var(--brown)\" fill-opacity=\"0.4\" stroke=\"var(--brown)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"27.8\" cy=\"15.4\" r=\"1.3\" fill=\"var(--brown)\" fill-opacity=\"0.4\" stroke=\"var(--brown)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><ellipse cx=\"16\" cy=\"17.6\" rx=\"7.2\" ry=\"4.6\" fill=\"var(--gold)\" fill-opacity=\"0.32\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12.8 21.6l-1.1 4.4M19.4 21.6l1.1 4.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M21.4 15.2c2.1-0.8 3.2-2.1 3.6-3.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function herb() {
    return svg("<path d=\"M10.2 25.6c4.4-4.2 8.2-9.6 12.6-17.8\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M13.2 21.2c-2.4-0.6-3.8-2.2-3.4-4.2 2.2 0.4 3.6 2.1 3.4 4.2z\" fill=\"var(--green-moss)\" fill-opacity=\"0.35\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M15.6 18.2c2.4-0.2 3.8-1.8 3.6-3.8-2.2-0.1-3.8 1.4-3.6 3.8z\" fill=\"var(--green-moss)\" fill-opacity=\"0.35\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M17.6 14.6c-2.2-0.8-3.4-2.4-2.8-4.2 2.1 0.3 3.4 2 2.8 4.2z\" fill=\"var(--green-moss)\" fill-opacity=\"0.35\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M20.2 11.4c2.1-0.4 3.4-1.8 3.2-3.6-2-0.1-3.4 1.2-3.2 3.6z\" fill=\"var(--green-moss)\" fill-opacity=\"0.35\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function noSalt() {
    return svg("<path d=\"M12.2 12.4h7.6l-1.1 13.6H13.3z\" fill=\"var(--paper)\" fill-opacity=\"0.55\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><rect x=\"13.1\" y=\"8.0\" width=\"5.8\" height=\"4.3\" rx=\"0.7\" fill=\"currentColor\" fill-opacity=\"0.28\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"15.1\" cy=\"10.0\" r=\"0.45\" fill=\"var(--ink)\" fill-opacity=\"0.7\" stroke=\"none\"/><circle cx=\"16.6\" cy=\"10.0\" r=\"0.45\" fill=\"var(--ink)\" fill-opacity=\"0.7\" stroke=\"none\"/><circle cx=\"18.0\" cy=\"10.0\" r=\"0.45\" fill=\"var(--ink)\" fill-opacity=\"0.7\" stroke=\"none\"/><path d=\"M9.2 25.4L22.8 7.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function wedge() {
    return svg("<path d=\"M8.2 24.4L16 6.4l7.8 18z\" fill=\"currentColor\" fill-opacity=\"0.28\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M8.2 24.4h15.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function swiss() {
    return svg("<path d=\"M8.2 24.4L16 6.4l7.8 18z\" fill=\"currentColor\" fill-opacity=\"0.26\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"15.1\" cy=\"16.2\" r=\"1.45\" fill=\"var(--paper)\" fill-opacity=\"1\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"18.2\" cy=\"20.4\" r=\"1.2\" fill=\"var(--paper)\" fill-opacity=\"1\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"13.6\" cy=\"21.2\" r=\"0.85\" fill=\"var(--paper)\" fill-opacity=\"1\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function wheel() {
    return svg("<circle cx=\"16\" cy=\"16\" r=\"9.1\" fill=\"currentColor\" fill-opacity=\"0.26\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M16 6.9v9.1l7.1 4.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function block() {
    return svg("<rect x=\"7.1\" y=\"10.2\" width=\"17.8\" height=\"12.8\" rx=\"1.8\" fill=\"currentColor\" fill-opacity=\"0.26\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M7.1 13.6h17.8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function pepperJack() {
    return svg("<path d=\"M8.2 24.4L16 6.4l7.8 18z\" fill=\"currentColor\" fill-opacity=\"0.24\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"14.1\" cy=\"16.2\" r=\"1.05\" fill=\"var(--terracotta)\" fill-opacity=\"0.9\" stroke=\"none\"/><circle cx=\"18.2\" cy=\"19.2\" r=\"1.05\" fill=\"var(--terracotta)\" fill-opacity=\"0.9\" stroke=\"none\"/><circle cx=\"15.2\" cy=\"21.4\" r=\"0.85\" fill=\"var(--terracotta)\" fill-opacity=\"0.85\" stroke=\"none\"/>");
  }
  function smokedWedge() {
    return svg("<path d=\"M8.2 24.6L16 8.4l7.8 16.2z\" fill=\"currentColor\" fill-opacity=\"0.24\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M20.4 6.4c1.1-2.1 1.1-3.2 0-4.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M24.2 8.2c1.1-2.1 1.1-3.2 0-4.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function ball() {
    return svg("<circle cx=\"16\" cy=\"17.1\" r=\"8.1\" fill=\"var(--paper)\" fill-opacity=\"0.7\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M11.6 13.2c2.2-2.2 6.2-2.2 8.4 0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function marbled() {
    return svg("<path d=\"M8.2 24.4L16 6.4l7.8 18z\" fill=\"currentColor\" fill-opacity=\"0.26\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12.1 18.4c3.1-1.1 5.1 1.1 8.1-1.1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M13.2 21.6c2.4-0.8 4.2 0.6 6.6-0.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function slice() {
    return svg("<rect x=\"8.1\" y=\"10.2\" width=\"15.8\" height=\"12.1\" rx=\"1.2\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M8.1 14.6h15.8\" fill=\"none\" stroke=\"var(--brown)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M20.4 10.2l3.5 3.6\" fill=\"none\" stroke=\"var(--brown)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function blackWax() {
    return svg("<rect x=\"7.1\" y=\"12.4\" width=\"17.8\" height=\"12.2\" rx=\"1.6\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M7.1 10.2h17.8c0.6 0 1.1 0.6 1.1 1.4v3.2H6v-3.2c0-0.8 0.5-1.4 1.1-1.4z\" fill=\"var(--ink)\" fill-opacity=\"0.82\" stroke=\"var(--ink)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function dill() {
    return svg("<path d=\"M7.6 24.8L14.8 7.6l7.2 17.2z\" fill=\"currentColor\" fill-opacity=\"0.26\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M21.6 8.4c0.2 4.2-1.6 6.6-1.8 10.4\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M20.6 10.2l3.8-2.1M20.6 10.2l-2.2-2.8\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M20.2 13.4l3.8-1.2M20.2 13.4l-2.6-2.2\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M19.8 16.4l3.4-0.8M19.8 16.4l-2.4-1.6\" fill=\"none\" stroke=\"var(--green-moss)\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }
  function longhorn() {
    return svg("<path d=\"M6.4 12.2h4.2v7.6c0 3.4 2.6 5.6 5.4 5.6s5.4-2.2 5.4-5.6v-7.6h4.2v7.6c0 5.6-4.2 9.4-9.6 9.4s-9.6-3.8-9.6-9.4z\" fill=\"currentColor\" fill-opacity=\"0.28\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
  }

  var BY_NAME = {
    "3 pepper cojack": pepperJack,
    "3 pepper colby jack": pepperJack,
    "aged gouda": wheel,
    "all natural roast beef": roastBeef,
    "american white": slice,
    "american yellow": slice,
    "applewood smoked": smokeLog,
    "asiago mild & creamy": wedge,
    "asiago mild crmy": wedge,
    "asiago mild+crmy": wedge,
    "black wax cheddar": blackWax,
    "blackened": flame,
    "blck wax cheddar": blackWax,
    "bourbon": bourbon,
    "buffalo": wing,
    "cajun": chili,
    "cajun turkey": chili,
    "carved oven roasted": oven,
    "chicken buffalo": wing,
    "chicken chipotle": chipotle,
    "chicken everroast": mirepoix,
    "chicken gldn clssc": roastBird,
    "chicken honey bbq": honey,
    "chicken jerk": chili,
    "chicken lemon pepper": lemonPepper,
    "chicken rotisserie": rotisserie,
    "chipotle": chipotle,
    "chipotle gouda": pepperJack,
    "classic roast breast": roastBird,
    "classic rst turkey breast": roastBird,
    "colby jack": marbled,
    "colby longhorn": longhorn,
    "corned beef top rnd": cornedBeef,
    "corned beef top round": cornedBeef,
    "cracked pepper": peppercorn,
    "everroast": mirepoix,
    "firesmith": flame,
    "firesmith chicken": flame,
    "genoa salami": salami,
    "golden classic": roastBird,
    "ham all natural applewood smoked": smokeLog,
    "ham bourbon": bourbon,
    "ham honey maple": maple,
    "ham smoke master black forest": ham,
    "ham spiral sliced": spiral,
    "ham sweet slice": glazedHam,
    "havarti dill": dill,
    "havarti jalapeno": pepperJack,
    "havarti jalape\u00f1o": pepperJack,
    "havarti plain": wedge,
    "hickory smoked black forest": pine,
    "honey bbq": honey,
    "honey maple": maple,
    "ichiban teriyaki": bottle,
    "ichiban teriyaki chicken": bottle,
    "italian roast beef": roastBeef,
    "jalape\u00f1o monterey jack": pepperJack,
    "jerk": chili,
    "lacey swiss": swiss,
    "lemon pepper": lemonPepper,
    "london broil roast beef": roastBeef,
    "mesquite": smokeLog,
    "monterey jack": marbled,
    "montry jack jalapeno": pepperJack,
    "mozzarela ciliegine": ball,
    "mozzarela ovaline": ball,
    "mozzarella": ball,
    "mozzarella ciliegine": ball,
    "mozzarella ovoline": ball,
    "muenster": wedge,
    "no salt added": noSalt,
    "ovengold": oven,
    "pastrami beef top rnd": pastrami,
    "pastrami top round": pastrami,
    "pepperoni": pepperoni,
    "pepperoni metro": pepperoni,
    "pesto parm": pesto,
    "pesto parm ham": pesto,
    "pitcraft": flame,
    "provolone": wedge,
    "red romanian pastrami": pastrami,
    "roast beef deluxe": roastBeef,
    "rotisserie": rotisserie,
    "rstbf all natrl": roastBeef,
    "rstbf deluxe": roastBeef,
    "salami metro genoa": salami,
    "salsalito": salsa,
    "smoke master black forest": ham,
    "smoked cheddar": smokedWedge,
    "smoked gruyere": smokedWedge,
    "smoked gruy\u00e8re": smokedWedge,
    "spiral sliced": spiral,
    "sweet slice": glazedHam,
    "turkey all natural tuscan": herb,
    "turkey blackened": flame,
    "turkey carved and served oven roastd": oven,
    "turkey cracked pepper": peppercorn,
    "turkey hickory smoked black forest": pine,
    "turkey honey maple": maple,
    "turkey mesquite": smokeLog,
    "turkey no salt ad": noSalt,
    "turkey ovengold": oven,
    "turkey pastrami": pastrami,
    "turkey pitcraft": flame,
    "turkey salsalito": salsa,
    "tuscan": herb,
    "vermont cheddar": block,
    "virginia smoked": smokeLog,
    "virginia smoked ham": smokeLog,
  };

  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  var CHOICES = [
    { key: "chipotle", label: "Chipotle", draw: chipotle },
    { key: "wing", label: "Chicken wing", draw: wing },
    { key: "mirepoix", label: "Celery, carrot, onion", draw: mirepoix },
    { key: "roast-bird", label: "Roast bird", draw: roastBird },
    { key: "honey", label: "Honey dipper", draw: honey },
    { key: "lemon-pepper", label: "Lemon and pepper", draw: lemonPepper },
    { key: "peppercorn", label: "Cracked pepper", draw: peppercorn },
    { key: "chili", label: "Chili pepper", draw: chili },
    { key: "bottle", label: "Sauce bottle", draw: bottle },
    { key: "smoke-log", label: "Wood smoke", draw: smokeLog },
    { key: "maple", label: "Maple leaf", draw: maple },
    { key: "oven", label: "Oven roast", draw: oven },
    { key: "flame", label: "Grill flame", draw: flame },
    { key: "pine", label: "Pine and smoke", draw: pine },
    { key: "salsa", label: "Salsa", draw: salsa },
    { key: "ham", label: "Ham", draw: ham },
    { key: "glazed-ham", label: "Glazed ham", draw: glazedHam },
    { key: "spiral", label: "Spiral ham", draw: spiral },
    { key: "pesto", label: "Basil pesto", draw: pesto },
    { key: "bourbon", label: "Bourbon barrel", draw: bourbon },
    { key: "roast-beef", label: "Roast beef", draw: roastBeef },
    { key: "pastrami", label: "Pastrami", draw: pastrami },
    { key: "corned-beef", label: "Corned beef", draw: cornedBeef },
    { key: "salami", label: "Genoa salami", draw: salami },
    { key: "pepperoni", label: "Pepperoni", draw: pepperoni },
    { key: "rotisserie", label: "Rotisserie bird", draw: rotisserie },
    { key: "herb", label: "Herb sprig", draw: herb },
    { key: "no-salt", label: "No salt", draw: noSalt },
    { key: "wedge", label: "Cheese wedge", draw: wedge },
    { key: "swiss", label: "Swiss", draw: swiss },
    { key: "wheel", label: "Cheese wheel", draw: wheel },
    { key: "block", label: "Cheese block", draw: block },
    { key: "pepper-jack", label: "Pepper cheese", draw: pepperJack },
    { key: "smoked-wedge", label: "Smoked cheese", draw: smokedWedge },
    { key: "ball", label: "Cheese ball", draw: ball },
    { key: "marbled", label: "Marbled cheese", draw: marbled },
    { key: "slice", label: "Cheese slice", draw: slice },
    { key: "black-wax", label: "Black wax cheddar", draw: blackWax },
    { key: "dill", label: "Dill cheese", draw: dill },
    { key: "longhorn", label: "Longhorn", draw: longhorn },
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
      if (/longhorn/.test(blob)) return longhorn();
      if (/dill/.test(blob)) return dill();
      if (/wax/.test(blob)) return blackWax();
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
