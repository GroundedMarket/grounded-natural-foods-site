/* Shared Thanksgiving turkey list.
   Public pages only ever read inventory status (never names or phones).
   The Staff Login Turkeys tab is the only place reservations are listed.
   No email or text is sent when someone reserves. */
const TURKEY_TYPES = {
  organic: { label: "Organic", mary: "Mary's Organic", price: "$7.99" },
  freeRange: { label: "Free Range", mary: "Mary's Free Range", price: "$5.99" },
};
const TURKEY_PICKUP_DEADLINE = "2026-12-31";
const TURKEY_HELD_NAME = "Held before online reservations";

/* Starting case. The three reserved birds are already spoken for.
   Two Free Range birds share 15.81 lb; they are separate birds. */
const TURKEY_SEED = [
  { id: "org-858", type: "organic", weight: "8.58", status: "reserved", sort: 10 },
  { id: "org-877", type: "organic", weight: "8.77", status: "available", sort: 20 },
  { id: "org-929", type: "organic", weight: "9.29", status: "available", sort: 30 },
  { id: "org-961", type: "organic", weight: "9.61", status: "available", sort: 40 },
  { id: "org-1038", type: "organic", weight: "10.38", status: "available", sort: 50 },
  { id: "org-1040", type: "organic", weight: "10.40", status: "available", sort: 60 },
  { id: "org-1151", type: "organic", weight: "11.51", status: "reserved", sort: 70 },
  { id: "org-1178", type: "organic", weight: "11.78", status: "available", sort: 80 },
  { id: "fr-946", type: "freeRange", weight: "9.46", status: "available", sort: 110 },
  { id: "fr-1135", type: "freeRange", weight: "11.35", status: "available", sort: 120 },
  { id: "fr-1513", type: "freeRange", weight: "15.13", status: "available", sort: 130 },
  { id: "fr-1529", type: "freeRange", weight: "15.29", status: "available", sort: 140 },
  { id: "fr-1553", type: "freeRange", weight: "15.53", status: "available", sort: 150 },
  { id: "fr-1559", type: "freeRange", weight: "15.59", status: "available", sort: 160 },
  { id: "fr-1581a", type: "freeRange", weight: "15.81", status: "available", sort: 170 },
  { id: "fr-1581b", type: "freeRange", weight: "15.81", status: "available", sort: 180 },
  { id: "fr-1927", type: "freeRange", weight: "19.27", status: "available", sort: 190 },
  { id: "fr-1992", type: "freeRange", weight: "19.92", status: "available", sort: 200 },
  { id: "fr-2123", type: "freeRange", weight: "21.23", status: "available", sort: 210 },
  { id: "fr-2737", type: "freeRange", weight: "27.37", status: "reserved", sort: 220 },
];

function turkeyWeightNumber(weight) {
  const n = Number(weight);
  return Number.isFinite(n) ? n : 0;
}

function turkeyCompare(a, b) {
  const byWeight = turkeyWeightNumber(a.weight) - turkeyWeightNumber(b.weight);
  if (byWeight) return byWeight;
  return String(a.sort || 0) - String(b.sort || 0) || String(a.id).localeCompare(String(b.id));
}

function turkeyNormalizeWeight(raw) {
  const text = String(raw || "")
    .trim()
    .replace(/lb\.?$/i, "")
    .trim();
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(text)) return "";
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0 || n >= 80) return "";
  return text;
}

function turkeyTodayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

function turkeyPickupError(value) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Enter a valid date.";
  if (value < turkeyTodayISO()) return "Pickup date can't be in the past.";
  if (value > TURKEY_PICKUP_DEADLINE) return "Pickup is open through December 31, 2026.";
  return "";
}
