/* Staff Login → Turkeys.
   Master and management only. Lists name, phone, weight, type, pickup
   date, and when it was reserved. Nothing is emailed or texted.
   These listeners are NOT part of the app-wide save gate: a missing
   rules deploy must not block the rest of the portal. */
let turkeyListenersStarted = false;
let turkeyInventoryReady = false;
let turkeyReservationsReady = false;
let turkeyInventoryError = "";
let turkeySeedStarted = false;

function canManageTurkeys() {
  if (!session) return false;
  if (session.isMaster) return true;
  const emp = db.employees.find((e) => e.id === session.employeeId);
  return !!(emp && typeof emp.role === "string" && /management/i.test(emp.role));
}

function ensureTurkeyPortal() {
  if (!canManageTurkeys() || turkeyListenersStarted) return;
  turkeyListenersStarted = true;
  fsdb.collection("turkeyInventory").onSnapshot(
    (snap) => {
      db.turkeyInventory = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      turkeyInventoryReady = true;
      turkeyInventoryError = "";
      if (!db.turkeyInventory.length) seedTurkeyCatalogIfEmpty();
      if (activeTab === "Turkeys") renderPortalBody();
    },
    (err) => {
      console.error("turkeyInventory listener failed:", err);
      turkeyInventoryReady = false;
      turkeyInventoryError = err && err.code ? err.code : "unavailable";
      if (activeTab === "Turkeys") renderPortalBody();
    }
  );
  fsdb.collection("turkeyReservations").onSnapshot(
    (snap) => {
      db.turkeyReservations = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      turkeyReservationsReady = true;
      if (activeTab === "Turkeys") renderPortalBody();
    },
    (err) => {
      console.error("turkeyReservations listener failed:", err);
      turkeyReservationsReady = false;
      if (activeTab === "Turkeys") renderPortalBody();
    }
  );
}

function turkeyPortalLive() {
  return turkeyInventoryReady && turkeyReservationsReady && !turkeyInventoryError;
}

function turkeyWhen(value) {
  if (!value) return "—";
  const date = value.toDate ? value.toDate() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function turkeyRows() {
  if (turkeyPortalLive()) return db.turkeyInventory.slice();
  if (turkeyInventoryError) return TURKEY_SEED.map((item) => ({ ...item }));
  return [];
}

function turkeyReservationRows() {
  const source = turkeyPortalLive()
    ? db.turkeyReservations
    : turkeyInventoryError
      ? TURKEY_SEED.filter((item) => item.status === "reserved").map((item) => ({
          id: "seed-" + item.id,
          inventoryId: item.id,
          type: item.type,
          weight: item.weight,
          name: TURKEY_HELD_NAME,
          phone: "",
          pickupDate: null,
          createdAt: null,
          status: "reserved",
          seeded: true,
        }))
      : [];
  return source.filter((row) => row.status === "reserved" || row.status === "pickedUp");
}

function turkeysTabHTML() {
  const live = turkeyPortalLive();
  const birds = turkeyRows().sort(turkeyCompare);
  const reservations = turkeyReservationRows().sort((a, b) => {
    const aTime = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
  const banner = live
    ? ""
    : turkeyInventoryError
      ? '<p class="turkey-note">Firestore rules for turkeys are not active yet, so this list is only the starting case. Deploy the rules, then open this tab again to post it. Nothing here is emailed or texted.</p>'
      : '<p class="turkey-note">Loading turkeys… Nothing is emailed or texted when someone reserves.</p>';
  const reservationTable = reservations.length
    ? `<table><thead><tr><th>Name</th><th>Phone</th><th>Weight</th><th>Type</th><th>Pickup</th><th>Reserved</th><th></th></tr></thead><tbody>
      ${reservations
        .map((row) => {
          const actions = live
            ? `<div class="turkey-actions">
                ${
                  row.status === "reserved"
                    ? `<button class="btn small outline" type="button" onclick="markTurkeyPickedUp('${row.id}')">Mark picked up</button>`
                    : ""
                }
                <button class="btn small outline" type="button" onclick="unreserveTurkey('${row.id}')">Un-reserve</button>
              </div>`
            : "—";
          return `<tr>
            <td>${escHtml(row.name || "—")}</td>
            <td>${escHtml(row.phone || "—")}</td>
            <td>${escHtml(row.weight)} lb</td>
            <td>${escHtml(TURKEY_TYPES[row.type] ? TURKEY_TYPES[row.type].label : row.type)}</td>
            <td>${escHtml(row.pickupDate || "—")}</td>
            <td>${escHtml(turkeyWhen(row.createdAt))}${row.status === "pickedUp" ? "<br>Picked up" : ""}</td>
            <td>${actions}</td>
          </tr>`;
        })
        .join("")}
    </tbody></table>`
    : '<p class="empty-note">No reservations yet.</p>';
  const weightColumn = (type) => {
    const list = birds.filter((bird) => bird.type === type);
    return `<div><h3>${TURKEY_TYPES[type].label} · ${TURKEY_TYPES[type].price}/lb</h3>
      ${
        list.length
          ? `<table><thead><tr><th>Weight</th><th>Status</th><th></th></tr></thead><tbody>
            ${list
              .map((bird) => {
                const actions = live
                  ? `<div class="turkey-actions">
                      <button class="btn small outline" type="button" onclick="editTurkeyWeight('${bird.id}')">Edit</button>
                      <button class="btn small outline" type="button" onclick="removeTurkeyWeight('${bird.id}')">Remove</button>
                    </div>`
                  : "—";
                return `<tr><td>${escHtml(bird.weight)} lb</td><td>${escHtml(bird.status || "available")}</td><td>${actions}</td></tr>`;
              })
              .join("")}
          </tbody></table>`
          : '<p class="empty-note">None posted.</p>'
      }</div>`;
  };
  return `<div class="turkey-admin">
    <h2 class="section-title">Turkeys ${
      live ? '<button class="btn" type="button" onclick="addTurkeyWeight()">+ Add weight</button>' : ""
    }</h2>
    ${banner}
    ${live ? '<p class="turkey-note">Reservations stay in this tab. Customers never see a name or phone, and the store does not email or text them.</p>' : ""}
    <h3>Reservations</h3>
    ${reservationTable}
    <h3>Weights</h3>
    <div class="turkey-weights">${weightColumn("organic")}${weightColumn("freeRange")}</div>
  </div>`;
}

async function seedTurkeyCatalogIfEmpty() {
  if (turkeySeedStarted || db.turkeyInventory.length || !turkeyInventoryReady) return;
  if (!canManageTurkeys()) return;
  turkeySeedStarted = true;
  try {
    const batch = fsdb.batch();
    TURKEY_SEED.forEach((item) => {
      batch.set(fsdb.collection("turkeyInventory").doc(item.id), {
        type: item.type,
        weight: item.weight,
        status: item.status,
        sort: item.sort,
        reservationId: item.status === "reserved" ? "seed-" + item.id : null,
        reservedAt: item.status === "reserved" ? firebase.firestore.FieldValue.serverTimestamp() : null,
      });
    });
    TURKEY_SEED.filter((item) => item.status === "reserved").forEach((item) => {
      batch.set(fsdb.collection("turkeyReservations").doc("seed-" + item.id), {
        inventoryId: item.id,
        type: item.type,
        weight: item.weight,
        name: TURKEY_HELD_NAME,
        phone: "",
        pickupDate: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "reserved",
        seeded: true,
      });
    });
    await batch.commit();
  } catch (err) {
    turkeySeedStarted = false;
    console.error("Turkey seed failed:", err);
  }
}

function addTurkeyWeight() {
  if (!turkeyPortalLive()) return;
  openModal(`<h3>Add a turkey weight</h3>
    <div class="field"><label>Type</label>
      <select id="tk-type">
        <option value="organic">Organic · $7.99/lb</option>
        <option value="freeRange">Free Range · $5.99/lb</option>
      </select>
    </div>
    <div class="field"><label>Weight (lb)</label><input id="tk-weight" inputmode="decimal" placeholder="12.40"></div>
    <p class="turkey-note">The tile shows the weight only. The price per pound stays on the reservation page.</p>
    <div class="modal-actions"><button class="btn" type="button" onclick="saveNewTurkeyWeight()">Add</button></div>`);
}

async function saveNewTurkeyWeight() {
  const type = document.getElementById("tk-type").value;
  const weight = turkeyNormalizeWeight(document.getElementById("tk-weight").value);
  if (!weight || !TURKEY_TYPES[type]) {
    alert("Enter a weight like 12.40");
    return;
  }
  try {
    await fsdb.collection("turkeyInventory").doc(newId("tk")).set({
      type,
      weight,
      status: "available",
      sort: Date.now(),
      reservationId: null,
      reservedAt: null,
    });
    closeModal();
  } catch (err) {
    console.error(err);
    alert("Couldn't add that weight.");
  }
}

function editTurkeyWeight(id) {
  const bird = db.turkeyInventory.find((item) => item.id === id);
  if (!bird || !turkeyPortalLive()) return;
  openModal(`<h3>Edit weight</h3>
    <div class="field"><label>Type</label>
      <select id="tk-type">
        <option value="organic" ${bird.type === "organic" ? "selected" : ""}>Organic · $7.99/lb</option>
        <option value="freeRange" ${bird.type === "freeRange" ? "selected" : ""}>Free Range · $5.99/lb</option>
      </select>
    </div>
    <div class="field"><label>Weight (lb)</label><input id="tk-weight" value="${escHtmlAttr(bird.weight)}"></div>
    <div class="modal-actions"><button class="btn" type="button" onclick="saveTurkeyWeightEdit('${id}')">Save</button></div>`);
}

async function saveTurkeyWeightEdit(id) {
  const type = document.getElementById("tk-type").value;
  const weight = turkeyNormalizeWeight(document.getElementById("tk-weight").value);
  if (!weight || !TURKEY_TYPES[type]) {
    alert("Enter a weight like 12.40");
    return;
  }
  const bird = db.turkeyInventory.find((item) => item.id === id);
  try {
    await fsdb.collection("turkeyInventory").doc(id).update({ type, weight });
    if (bird && bird.reservationId) {
      await fsdb.collection("turkeyReservations").doc(bird.reservationId).update({ type, weight });
    }
    closeModal();
  } catch (err) {
    console.error(err);
    alert("Couldn't save that weight.");
  }
}

async function removeTurkeyWeight(id) {
  const bird = db.turkeyInventory.find((item) => item.id === id);
  if (!bird || !turkeyPortalLive()) return;
  if (!confirm("Remove the " + bird.weight + " lb " + (TURKEY_TYPES[bird.type] ? TURKEY_TYPES[bird.type].label : "") + " turkey?")) return;
  try {
    if (bird.reservationId) {
      await fsdb.collection("turkeyReservations").doc(bird.reservationId).update({ status: "cancelled" });
    }
    await fsdb.collection("turkeyInventory").doc(id).delete();
  } catch (err) {
    console.error(err);
    alert("Couldn't remove that weight.");
  }
}

async function unreserveTurkey(reservationId) {
  const row =
    db.turkeyReservations.find((item) => item.id === reservationId) ||
    turkeyReservationRows().find((item) => item.id === reservationId);
  if (!row || !turkeyPortalLive()) return;
  if (!confirm("Make " + row.weight + " lb available again?")) return;
  try {
    await fsdb.collection("turkeyReservations").doc(reservationId).update({ status: "cancelled" });
    if (row.inventoryId) {
      await fsdb.collection("turkeyInventory").doc(row.inventoryId).update({
        status: "available",
        reservationId: null,
        reservedAt: null,
      });
    }
  } catch (err) {
    console.error(err);
    alert("Couldn't un-reserve that turkey.");
  }
}

async function markTurkeyPickedUp(reservationId) {
  const row = db.turkeyReservations.find((item) => item.id === reservationId);
  if (!row || !turkeyPortalLive()) return;
  try {
    await fsdb.collection("turkeyReservations").doc(reservationId).update({ status: "pickedUp" });
    if (row.inventoryId) {
      await fsdb.collection("turkeyInventory").doc(row.inventoryId).update({ status: "pickedUp" });
    }
  } catch (err) {
    console.error(err);
    alert("Couldn't mark that turkey picked up.");
  }
}
