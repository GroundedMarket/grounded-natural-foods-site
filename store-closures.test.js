const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const SC = require("./store-closures.js");

/* Dates actually stored in the store's closedDates calendar.
   They are inputs to the tests, not a hardcoded close-every-holiday list. */
const CONFIGURED = [
  "2026-07-04",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
  "2027-01-01",
  "2027-05-31",
  "2027-07-04",
  "2027-12-25",
  "2028-01-01",
];

const EXPECTED_NAMES = {
  "2026-07-04": "Independence Day",
  "2026-09-07": "Labor Day",
  "2026-11-26": "Thanksgiving",
  "2026-12-25": "Christmas",
  "2027-01-01": "New Year's Day",
  "2027-05-31": "Memorial Day",
  "2027-07-04": "Independence Day",
  "2027-12-25": "Christmas",
  "2028-01-01": "New Year's Day",
};

test("configured closure dates use their real holiday names", () => {
  Object.entries(EXPECTED_NAMES).forEach(([iso, name]) => {
    const closure = SC.closureForDate(iso, CONFIGURED);
    assert.ok(closure, iso);
    assert.equal(closure.name, name);
    assert.equal(closure.holiday, name);
  });
});

test("a named holiday that is not configured stays open", () => {
  const open = [
    "2026-11-11", // Veterans Day
    "2026-05-25", // Memorial Day 2026
    "2027-11-25", // Thanksgiving 2027
    "2027-09-06", // Labor Day 2027
    "2027-01-18", // MLK Day
    "2026-12-24", // Christmas Eve
    "2026-11-27", // day after Thanksgiving
  ];
  open.forEach((iso) => {
    assert.equal(SC.closureForDate(iso, CONFIGURED), null, iso);
  });
  assert.equal(SC.holidayNameForISO("2027-11-25"), "Thanksgiving");
  assert.equal(SC.holidayNameForISO("2026-11-11"), "Veterans Day");
  assert.equal(SC.holidayNameForISO("2026-05-25"), "Memorial Day");
});

test("Thanksgiving bookmark uses the live wobble turkey once, not repeated bands", () => {
  const closure = SC.closureForDate("2026-11-26", CONFIGURED);
  assert.equal(closure.motif, "wobble-turkey");
  const html = SC.closureLaneHTML(closure, 5, false);
  assert.equal(html.match(/class="wobble"/g).length, 1);
  assert.equal(html.match(/closure-stamp/g).length, 1);
  assert.equal(html.includes("closure-band"), false);
  assert.match(html, /Happy<br><span class="th">Thanksgiving<\/span>/);
  assert.match(html, /A day to<br>give thanks/);
  assert.match(html, /STORE<\/small>CLOSED/);
  assert.equal(html.includes("aria-hidden=\"true\""), true);
  const live = fs.readFileSync("reserve-turkey.html", "utf8");
  const start = live.indexOf('<svg class="wobble"');
  const end = live.indexOf("</svg>", start);
  const livePaths = live.slice(start, end).match(/d="[^"]+"/g);
  const usedPaths = html.match(/d="[^"]+"/g);
  assert.deepEqual(usedPaths, livePaths);
});

test("other configured holidays reuse the bookmark with their own motif", () => {
  const christmas = SC.closureForDate("2026-12-25", CONFIGURED);
  const christmasHTML = SC.closureLaneHTML(christmas, 6, false);
  assert.equal(christmas.motif, "evergreen");
  assert.match(christmasHTML, /christmas-evergreen\.svg/);
  assert.equal(christmasHTML.includes("wobble"), false);
  assert.match(christmasHTML, /Merry<br><span class="th">Christmas<\/span>/);

  const newYear = SC.closureForDate("2027-01-01", CONFIGURED);
  assert.equal(newYear.motif, "neutral");
  assert.match(SC.closureLaneHTML(newYear, 2, false), /closed-neutral\.svg/);
  assert.match(SC.closureLaneHTML(newYear, 2, false), /New Year's/);

  const july = SC.closureForDate("2026-07-04", CONFIGURED);
  assert.equal(july.motif, "neutral");
  assert.equal(july.line2, "Day");
});

test("Christmas art does not close a Christmas that is not configured", () => {
  assert.equal(SC.closureForDate("2029-12-25", CONFIGURED), null);
  assert.equal(SC.holidayNameForISO("2029-12-25"), "Christmas");
});

test("local dates do not shift across the year boundary", () => {
  assert.equal(SC.scheduleDateForDay("2026-12-28", "THU"), "2026-12-31");
  assert.equal(SC.scheduleDateForDay("2026-12-28", "FRI"), "2027-01-01");
  assert.equal(SC.scheduleDateForDay("2026-12-28", "SAT"), "2027-01-02");
  assert.equal(SC.addDaysISO("2026-12-31", 1), "2027-01-01");
  assert.equal(SC.addDaysISO("2027-01-01", -1), "2026-12-31");
  const parsed = SC.parseISO("2027-01-01");
  assert.equal(parsed.getFullYear(), 2027);
  assert.equal(parsed.getMonth(), 0);
  assert.equal(parsed.getDate(), 1);
  assert.equal(SC.localISODate(new Date(2026, 11, 31, 23, 30)), "2026-12-31");
  const friday = SC.closureForDate("2027-01-01", CONFIGURED);
  assert.equal(friday.name, "New Year's Day");
  assert.equal(SC.closureForDate("2026-12-31", CONFIGURED), null);
});

test("week of Thanksgiving resolves Thursday locally", () => {
  assert.equal(SC.scheduleDateForDay("2026-11-23", "THU"), "2026-11-26");
  assert.equal(
    SC.closureAriaLabel(SC.closureForDate("2026-11-26", CONFIGURED), "THU"),
    "Thu Nov 26, Thanksgiving: Store closed"
  );
});

test("largest free span avoids blocked shift rows", () => {
  const gap = SC.largestFreeSpan(0, 400, [
    { start: 0, end: 80 },
    { start: 200, end: 260 },
  ]);
  assert.deepEqual(gap, { start: 260, end: 400 });
  const top = SC.largestFreeSpan(10, 100, [{ start: 70, end: 100 }]);
  assert.deepEqual(top, { start: 10, end: 70 });
  assert.equal(SC.largestFreeSpan(0, 40, [{ start: 0, end: 40 }]), null);
});

test("wand skips closure days and keeps an existing shift", () => {
  const existing = { THU: { start: "10:00", end: "14:00", notes: "already there" } };
  const frozen = JSON.stringify(existing);
  const plan = SC.planTypicalFill({
    weekMondayISO: "2026-11-23",
    typicalSchedule: {
      MON: { start: "09:00", end: "17:00", notes: "open" },
      THU: { start: "09:00", end: "17:00", notes: "regular" },
    },
    closedDates: CONFIGURED,
    timeOffRequests: [],
    employeeId: "e1",
    existingShifts: existing,
  });
  assert.deepEqual(plan.writes, {
    MON: { start: "09:00", end: "17:00", notes: "open" },
  });
  assert.equal(plan.preserved[0].shift.start, "10:00");
  assert.equal(plan.skipped[0].dayKey, "THU");
  assert.equal(JSON.stringify(existing), frozen);
});

test("approved time off is skipped per employee and is not mutated", () => {
  const request = {
    id: "r1",
    employeeId: "e1",
    status: "approved",
    startDate: "2026-11-23",
    endDate: "2026-11-25",
    start: "09:00",
    end: "17:00",
  };
  Object.freeze(request);
  const before = JSON.stringify(request);
  const typical = {
    MON: { start: "09:00", end: "17:00" },
    TUE: { start: "09:00", end: "17:00" },
    WED: { start: "09:00", end: "17:00" },
    THU: { start: "09:00", end: "17:00" },
    FRI: { start: "09:00", end: "17:00" },
  };
  const mine = SC.planTypicalFill({
    weekMondayISO: "2026-11-23",
    typicalSchedule: typical,
    closedDates: ["2026-11-26"],
    timeOffRequests: [request],
    employeeId: "e1",
    existingShifts: {},
  });
  assert.deepEqual(Object.keys(mine.writes).sort(), ["FRI"]);
  assert.equal(JSON.stringify(request), before);
  const other = SC.planTypicalFill({
    weekMondayISO: "2026-11-23",
    typicalSchedule: typical,
    closedDates: ["2026-11-26"],
    timeOffRequests: [request],
    employeeId: "e2",
    existingShifts: {},
  });
  assert.deepEqual(Object.keys(other.writes).sort(), ["FRI", "MON", "TUE", "WED"]);
});

test("pending, denied, absence, and deleted requests do not count as approved", () => {
  const typical = { FRI: { start: "09:00", end: "17:00" } };
  ["pending", "denied", "recorded"].forEach((status) => {
    const plan = SC.planTypicalFill({
      weekMondayISO: "2026-11-23",
      typicalSchedule: typical,
      closedDates: [],
      timeOffRequests: [
        {
          id: status,
          employeeId: "e1",
          status,
          kind: status === "recorded" ? "absence" : undefined,
          startDate: "2026-11-27",
          endDate: "2026-11-27",
          start: "09:00",
          end: "17:00",
        },
      ],
      employeeId: "e1",
      existingShifts: {},
    });
    assert.ok(plan.writes.FRI, status);
  });
  const deleted = SC.planTypicalFill({
    weekMondayISO: "2026-11-23",
    typicalSchedule: typical,
    closedDates: [],
    timeOffRequests: [
      {
        id: "gone",
        employeeId: "e1",
        status: "approved",
        deleted: true,
        startDate: "2026-11-27",
        endDate: "2026-11-27",
        start: "09:00",
        end: "17:00",
      },
    ],
    employeeId: "e1",
    existingShifts: {},
  });
  assert.ok(deleted.writes.FRI);
});

test("partial time off blocks only an overlapping regular shift", () => {
  const off = {
    id: "part",
    employeeId: "e1",
    status: "approved",
    startDate: "2026-11-23",
    endDate: "2026-11-23",
    start: "09:00",
    end: "12:00",
  };
  const clear = SC.planTypicalFill({
    weekMondayISO: "2026-11-23",
    typicalSchedule: { MON: { start: "13:00", end: "17:00" } },
    closedDates: [],
    timeOffRequests: [off],
    employeeId: "e1",
    existingShifts: {},
  });
  assert.ok(clear.writes.MON);
  const clash = SC.planTypicalFill({
    weekMondayISO: "2026-11-23",
    typicalSchedule: { MON: { start: "09:00", end: "17:00" } },
    closedDates: [],
    timeOffRequests: [off],
    employeeId: "e1",
    existingShifts: { MON: { start: "08:00", end: "12:00", notes: "keep" } },
  });
  assert.equal(clash.writes.MON, undefined);
  assert.equal(clash.preserved[0].shift.notes, "keep");
  assert.equal(JSON.stringify(off), JSON.stringify({
    id: "part",
    employeeId: "e1",
    status: "approved",
    startDate: "2026-11-23",
    endDate: "2026-11-23",
    start: "09:00",
    end: "12:00",
  }));
});

test("a closure and approved time off on the same day are both reported", () => {
  const plan = SC.planTypicalFill({
    weekMondayISO: "2026-11-23",
    typicalSchedule: { THU: { start: "09:00", end: "17:00" } },
    closedDates: ["2026-11-26"],
    timeOffRequests: [
      {
        id: "both",
        employeeId: "e1",
        status: "approved",
        startDate: "2026-11-26",
        endDate: "2026-11-26",
        start: "09:00",
        end: "17:00",
      },
    ],
    employeeId: "e1",
    existingShifts: {},
  });
  assert.deepEqual(
    plan.skipped[0].reasons.map((r) => r.type),
    ["closure", "timeOff"]
  );
  const message = SC.magicFillSkipMessage("Avery", plan);
  assert.match(message, /Thanksgiving/);
  assert.match(message, /approved time off/);
});

test("swap onto a closure is detected and a normal day is not", () => {
  const hits = SC.closuresTouchedBySwap(
    {
      kind: "transfer",
      targetShiftRef: { weekKey: "2026-11-23", dayKey: "THU" },
    },
    CONFIGURED
  );
  assert.equal(hits[0].name, "Thanksgiving");
  assert.deepEqual(
    SC.closuresTouchedBySwap(
      {
        kind: "transfer",
        targetShiftRef: { weekKey: "2026-11-23", dayKey: "FRI" },
      },
      CONFIGURED
    ),
    []
  );
});

test("reduced motion and the public wobble rule stay in place", () => {
  const css = fs.readFileSync("closure.css", "utf8");
  const pub = fs.readFileSync("reserve-turkey.css", "utf8");
  assert.match(pub, /\.wobble\{transform-origin:50% 95%;animation:wobble 1\.6s ease-in-out infinite\}/);
  assert.match(pub, /@media \(prefers-reduced-motion:reduce\)\{\.wobble\{animation:none\}\}/);
  assert.match(css, /@keyframes wobble/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /rotate\(-6deg\)/);
  assert.equal(css.includes("STORE CLOSED"), false);
});
