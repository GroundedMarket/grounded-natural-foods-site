/* Store-closure rules shared by the weekly schedule, the closures
   calendar, and pickup checks.
   A date is closed only when it is in the store's closedDates list
   (the same calendar that already blocks pickup). A holiday name is a
   label for a date that is already closed. It never closes a day by
   itself, and sample art is not a closure.
   Thanksgiving columns reuse the public reservation page's wobbly
   turkey. Other closures get the name and one Closed notice until a
   later illustration is chosen. */
var StoreClosures = (function () {
  var DAY_INDEX = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6 };
  var ASSET = {
    evergreen: "assets/closures/christmas-evergreen.svg",
    neutral: "assets/closures/closed-neutral.svg",
    leaf: "assets/closures/leaf.svg",
    wheat: "assets/closures/wheat.svg",
  };
  /* Exact paths from reserve-turkey.html. aria-hidden is the only change
     from the live tag, matching the closure bookmark preview. */
  var WOBBLE_TURKEY_SVG =
    '<svg class="wobble" width="140" height="140" viewBox="0 0 140 140" aria-hidden="true" focusable="false"><g><path d="M70 92 L20 40 A55 55 0 0 1 50 18Z" fill="#a8000f"/><path d="M70 92 L50 18 A55 55 0 0 1 90 18Z" fill="#e0902b"/><path d="M70 92 L90 18 A55 55 0 0 1 120 40Z" fill="#c49a6c"/><path d="M70 92 L120 40 A55 55 0 0 1 128 72Z" fill="#a8000f"/><path d="M70 92 L12 72 A55 55 0 0 1 20 40Z" fill="#e0902b"/></g><ellipse cx="70" cy="96" rx="34" ry="30" fill="#7a4a2a"/><circle cx="70" cy="62" r="18" fill="#8b5a36"/><circle cx="63" cy="58" r="4" fill="#fff"/><circle cx="77" cy="58" r="4" fill="#fff"/><circle cx="63" cy="59" r="2" fill="#000"/><circle cx="77" cy="59" r="2" fill="#000"/><path d="M66 65 L74 65 L70 72Z" fill="#f2b632"/><path d="M72 70 q6 4 2 12" stroke="#a8000f" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M60 124 v10 M80 124 v10" stroke="#f2b632" stroke-width="4" stroke-linecap="round"/></svg>';
  var HOLIDAY_FRAME = {
    Thanksgiving: {
      motif: "wobble-turkey",
      line1: "Happy",
      line2: "Thanksgiving",
      note: "A day to<br>give thanks",
    },
    Christmas: {
      motif: "evergreen",
      line1: "Merry",
      line2: "Christmas",
      note: "With warmth",
    },
    "New Year's Day": {
      motif: "neutral",
      line1: "Happy",
      line2: "New Year's",
      note: "A fresh start",
    },
    "Independence Day": {
      motif: "neutral",
      line1: "Independence",
      line2: "Day",
      note: "The market rests",
    },
    "Labor Day": {
      motif: "neutral",
      line1: "Labor",
      line2: "Day",
      note: "A day of rest",
    },
    "Memorial Day": {
      motif: "neutral",
      line1: "Memorial",
      line2: "Day",
      note: "We remember",
    },
  };
  var DAY_LABEL = {
    MON: "Mon",
    TUE: "Tue",
    WED: "Wed",
    THU: "Thu",
    FRI: "Fri",
    SAT: "Sat",
    SUN: "Sun",
  };
  var MONTHS_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  function localISODate(date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
  }

  function parseISO(iso) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!match) return null;
    var y = Number(match[1]);
    var m = Number(match[2]);
    var d = Number(match[3]);
    var date = new Date(y, m - 1, d);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    ) {
      return null;
    }
    return date;
  }

  function addDaysISO(iso, n) {
    var date = parseISO(iso);
    if (!date) return "";
    date.setDate(date.getDate() + n);
    return localISODate(date);
  }

  function scheduleDateForDay(weekMondayISO, dayKey) {
    if (!Object.prototype.hasOwnProperty.call(DAY_INDEX, dayKey)) return "";
    return addDaysISO(weekMondayISO, DAY_INDEX[dayKey]);
  }

  function nthWeekdayOfMonth(year, monthIndex, weekday, n) {
    if (n < 0) {
      var last = new Date(year, monthIndex + 1, 0);
      var back = (last.getDay() - weekday + 7) % 7;
      last.setDate(last.getDate() - back);
      return localISODate(last);
    }
    var first = new Date(year, monthIndex, 1);
    var forward = (weekday - first.getDay() + 7) % 7;
    first.setDate(1 + forward + (n - 1) * 7);
    return localISODate(first);
  }

  function holidayNameForISO(iso) {
    var date = parseISO(iso);
    if (!date) return "";
    var y = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    if (month === 0 && day === 1) return "New Year's Day";
    if (iso === nthWeekdayOfMonth(y, 0, 1, 3)) return "Martin Luther King Jr. Day";
    if (iso === nthWeekdayOfMonth(y, 1, 1, 3)) return "Presidents Day";
    if (iso === nthWeekdayOfMonth(y, 4, 1, -1)) return "Memorial Day";
    if (month === 5 && day === 19) return "Juneteenth";
    if (month === 6 && day === 4) return "Independence Day";
    if (iso === nthWeekdayOfMonth(y, 8, 1, 1)) return "Labor Day";
    if (iso === nthWeekdayOfMonth(y, 9, 1, 2)) return "Columbus Day";
    if (month === 10 && day === 11) return "Veterans Day";
    if (iso === nthWeekdayOfMonth(y, 10, 4, 4)) return "Thanksgiving";
    if (month === 11 && day === 25) return "Christmas";
    return "";
  }

  function normalizeRecord(entry) {
    if (typeof entry === "string") return { id: entry, name: "" };
    if (!entry || typeof entry.id !== "string") return null;
    var name = typeof entry.name === "string" ? entry.name.trim() : "";
    return { id: entry.id, name: name };
  }

  function frameForHoliday(holidayName) {
    return HOLIDAY_FRAME[holidayName] || null;
  }

  function closureForDate(iso, records) {
    if (!parseISO(iso)) return null;
    var list = records || [];
    var found = null;
    for (var i = 0; i < list.length; i++) {
      var rec = normalizeRecord(list[i]);
      if (rec && rec.id === iso) {
        found = rec;
        break;
      }
    }
    if (!found) return null;
    var holiday = holidayNameForISO(iso);
    var name = found.name || holiday || "";
    var frame = frameForHoliday(holiday) || {
      motif: "neutral",
      line1: "",
      line2: name || "Closed",
      note: "",
    };
    return {
      date: iso,
      name: name,
      holiday: holiday,
      motif: frame.motif,
      line1: frame.line1,
      line2: frame.line2,
      note: frame.note,
    };
  }

  function prettyDate(iso) {
    var date = parseISO(iso);
    if (!date) return iso || "";
    return MONTHS_SHORT[date.getMonth()] + " " + date.getDate();
  }

  function closureAriaLabel(closure, dayKey) {
    if (!closure) return "";
    var dow = DAY_LABEL[dayKey] || dayKey || "";
    var when = (dow ? dow + " " : "") + prettyDate(closure.date);
    return when + (closure.name ? ", " + closure.name : "") + ": Store closed";
  }

  function escapeText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function motifHTML(motif) {
    if (motif === "wobble-turkey") {
      return '<div class="closure-turkey">' + WOBBLE_TURKEY_SVG + "</div>";
    }
    var src = ASSET[motif] || ASSET.neutral;
    return (
      '<div class="closure-turkey"><img src="' +
      src +
      '" alt=""></div>'
    );
  }

  function closureLaneHTML(closure, gridColumn, hasShifts) {
    if (!closure) return "";
    var holiday = closure.line1
      ? escapeText(closure.line1) +
        '<br><span class="th">' +
        escapeText(closure.line2) +
        "</span>"
      : '<span class="th">' + escapeText(closure.line2) + "</span>";
    var note = closure.note
      ? '<div class="closure-note">' + closure.note + "</div>"
      : "";
    var place =
      typeof gridColumn === "number"
        ? ' style="grid-column:' + gridColumn + ';grid-row:2 / -1"'
        : "";
    var wash =
      typeof gridColumn === "number"
        ? '<div class="closure-wash" aria-hidden="true" style="grid-column:' +
          gridColumn +
          ';grid-row:2 / -1"></div>'
        : "";
    return (
      wash +
      '<div class="closure-art' +
      (hasShifts ? " has-shifts" : "") +
      '" data-motif="' +
      escapeText(closure.motif) +
      '" data-closure-date="' +
      closure.date +
      '" data-grid-column="' +
      (typeof gridColumn === "number" ? gridColumn : "") +
      '" aria-hidden="true"' +
      place +
      ">" +
      '<img class="closure-leaf" src="' +
      ASSET.leaf +
      '" alt="" style="top:34%;left:16%;transform:rotate(-30deg)">' +
      '<img class="closure-leaf" src="' +
      ASSET.leaf +
      '" alt="" style="top:58%;right:14%;transform:rotate(40deg) scaleX(-1)">' +
      '<img class="closure-leaf" src="' +
      ASSET.wheat +
      '" alt="" style="bottom:56px;left:18%;width:14px">' +
      '<div class="closure-holiday">' +
      holiday +
      "</div>" +
      motifHTML(closure.motif) +
      '<div class="closure-stamp"><small>STORE</small>CLOSED</div>' +
      note +
      "</div>"
    );
  }

  /* Largest open vertical interval inside [start, end], given blocked
     ranges. Used to park the bookmark where shift cards are not. */
  function largestFreeSpan(start, end, blocked) {
    if (!(end > start)) return null;
    var cursor = start;
    var spans = [];
    var list = (blocked || []).slice().sort(function (a, b) {
      return a.start - b.start;
    });
    for (var i = 0; i < list.length; i++) {
      var b0 = Math.max(start, list[i].start);
      var b1 = Math.min(end, list[i].end);
      if (b1 <= b0) continue;
      if (b0 > cursor) spans.push({ start: cursor, end: b0 });
      if (b1 > cursor) cursor = b1;
    }
    if (end > cursor) spans.push({ start: cursor, end: end });
    var best = null;
    for (var j = 0; j < spans.length; j++) {
      if (!best || spans[j].end - spans[j].start > best.end - best.start) {
        best = spans[j];
      }
    }
    return best;
  }

  function minutesOf(hhmm) {
    if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
    var parts = hhmm.split(":");
    var h = Number(parts[0]);
    var m = Number(parts[1]);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
  }

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    var as = minutesOf(aStart);
    var ae = minutesOf(aEnd);
    var bs = minutesOf(bStart);
    var be = minutesOf(bEnd);
    if (as === null || ae === null || bs === null || be === null) return true;
    if (ae <= as || be <= bs) return true;
    return as < be && bs < ae;
  }

  function requestRange(request) {
    var startDate = request.startDate || request.date || "";
    var endDate = request.endDate || request.date || request.startDate || "";
    return { startDate: startDate, endDate: endDate };
  }

  function isApprovedTimeOff(request) {
    return !!(
      request &&
      request.status === "approved" &&
      !request.deleted &&
      request.kind !== "absence"
    );
  }

  function approvedTimeOffOnDate(requests, employeeId, dateISO) {
    var out = [];
    var list = requests || [];
    for (var i = 0; i < list.length; i++) {
      var request = list[i];
      if (!isApprovedTimeOff(request) || request.employeeId !== employeeId) continue;
      var range = requestRange(request);
      if (!range.startDate || !range.endDate) continue;
      if (range.startDate <= dateISO && dateISO <= range.endDate) out.push(request);
    }
    return out;
  }

  function typicalConflictsWithTimeOff(shift, requests) {
    if (!requests.length) return false;
    if (!shift || shift.unavailable || !shift.start || !shift.end) return true;
    for (var i = 0; i < requests.length; i++) {
      var request = requests[i];
      if (!request.start || !request.end) return true;
      if (rangesOverlap(shift.start, shift.end, request.start, request.end)) return true;
    }
    return false;
  }

  function planTypicalFill(opts) {
    var typical = (opts && opts.typicalSchedule) || {};
    var existing = (opts && opts.existingShifts) || {};
    var writes = {};
    var skipped = [];
    var preserved = [];
    var dayKey;
    for (dayKey in typical) {
      if (!Object.prototype.hasOwnProperty.call(typical, dayKey)) continue;
      if (!Object.prototype.hasOwnProperty.call(DAY_INDEX, dayKey)) continue;
      var val = typical[dayKey];
      if (!val || val.unavailable) continue;
      var date = scheduleDateForDay(opts.weekMondayISO, dayKey);
      var closure = closureForDate(date, opts.closedDates);
      var offs = approvedTimeOffOnDate(opts.timeOffRequests, opts.employeeId, date);
      var timeOffConflict = typicalConflictsWithTimeOff(val, offs);
      var reasons = [];
      if (closure) {
        reasons.push({
          type: "closure",
          date: date,
          name: closure.name,
        });
      }
      if (timeOffConflict) {
        reasons.push({ type: "timeOff", date: date });
      }
      if (reasons.length) {
        var hadShift = !!existing[dayKey];
        skipped.push({
          dayKey: dayKey,
          date: date,
          reasons: reasons,
          preservedExistingShift: hadShift,
        });
        if (hadShift) {
          preserved.push({ dayKey: dayKey, date: date, shift: existing[dayKey] });
        }
        continue;
      }
      writes[dayKey] = {
        start: val.start,
        end: val.end,
        notes: val.notes || "",
      };
    }
    return { writes: writes, skipped: skipped, preserved: preserved };
  }

  function skipReasonText(reason) {
    switch (reason.type) {
      case "closure":
        return reason.name ? "store closed (" + reason.name + ")" : "store closed";
      case "timeOff":
        return "approved time off";
      default: {
        var unexpected = reason.type;
        return unexpected ? String(unexpected) : "skipped";
      }
    }
  }

  function magicFillSkipMessage(employeeName, plan) {
    if (!plan || !plan.skipped || !plan.skipped.length) return "";
    var lines = plan.skipped.map(function (skip) {
      var bits = skip.reasons.map(skipReasonText).filter(Boolean);
      var extra = skip.preservedExistingShift ? " Existing shift left in place." : "";
      return skip.dayKey + " " + skip.date + " — " + bits.join("; ") + "." + extra;
    });
    var wrote = plan.writes ? Object.keys(plan.writes).length : 0;
    var head = wrote
      ? "Filled " +
        wrote +
        " day" +
        (wrote === 1 ? "" : "s") +
        " from " +
        employeeName +
        "'s regular schedule."
      : "No regular hours were added for " + employeeName + ".";
    return head + "\nSkipped:\n" + lines.map(function (line) { return "• " + line; }).join("\n");
  }

  function closurePickupMessage(dateISO, records) {
    var closure = closureForDate(dateISO, records);
    if (!closure) return "";
    return closure.name
      ? "We're closed that day (" +
          closure.name +
          ") — please choose a different pickup date."
      : "We're closed that day — please choose a different pickup date.";
  }

  function closuresTouchedBySwap(swap, records) {
    if (!swap) return [];
    var refs = [];
    if (swap.kind === "trade") {
      if (swap.requesterShiftRef) refs.push(swap.requesterShiftRef);
      if (swap.targetShiftRef) refs.push(swap.targetShiftRef);
    } else {
      var ref = swap.requesterShiftRef || swap.targetShiftRef;
      if (ref) refs.push(ref);
    }
    var hits = [];
    refs.forEach(function (ref) {
      if (!ref || !ref.weekKey || !ref.dayKey) return;
      var date = scheduleDateForDay(ref.weekKey, ref.dayKey);
      var closure = closureForDate(date, records);
      if (closure) hits.push(closure);
    });
    return hits;
  }

  return {
    localISODate: localISODate,
    parseISO: parseISO,
    addDaysISO: addDaysISO,
    scheduleDateForDay: scheduleDateForDay,
    holidayNameForISO: holidayNameForISO,
    closureForDate: closureForDate,
    closureAriaLabel: closureAriaLabel,
    closureLaneHTML: closureLaneHTML,
    largestFreeSpan: largestFreeSpan,
    prettyDate: prettyDate,
    planTypicalFill: planTypicalFill,
    magicFillSkipMessage: magicFillSkipMessage,
    closurePickupMessage: closurePickupMessage,
    closuresTouchedBySwap: closuresTouchedBySwap,
    approvedTimeOffOnDate: approvedTimeOffOnDate,
    WOBBLE_TURKEY_SVG: WOBBLE_TURKEY_SVG,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = StoreClosures;
}
