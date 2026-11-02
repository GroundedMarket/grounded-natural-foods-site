/* Public Thanksgiving reservation page.
   Reads turkeyInventory only. Names and phones are written on create and
   are never read back here. Nothing is emailed or texted. */
const firebaseConfig = {
  apiKey: "AIzaSyCYd08eJkPenGNUkVuRC2ozfe5nTfTye1I",
  authDomain: "groundedmarket-86e50.firebaseapp.com",
  projectId: "groundedmarket-86e50",
  storageBucket: "groundedmarket-86e50.firebasestorage.app",
  messagingSenderId: "518382046314",
  appId: "1:518382046314:web:4bd964d6bf2607cb7a8e13",
};

let turkeyBirds = [];
let turkeyLive = false;
let openBirdId = "";

const dateInput = document.getElementById("reserve-date");
dateInput.min = turkeyTodayISO();
dateInput.max = TURKEY_PICKUP_DEADLINE;

function birdById(id) {
  return turkeyBirds.find((bird) => bird.id === id);
}

function renderTurkeyTiles() {
  ["organic", "freeRange"].forEach((type) => {
    const host = document.getElementById("tiles-" + type);
    const birds = turkeyBirds.filter((bird) => bird.type === type).sort(turkeyCompare);
    if (!birds.length) {
      host.innerHTML = '<p class="small">Weights will show here once the store posts them.</p>';
      return;
    }
    host.innerHTML = birds
      .map((bird) => {
        const label = bird.weight + " lb";
        if (bird.status !== "available") {
          return (
            '<button class="tile res" type="button" disabled><s>' +
            label +
            "</s><span>Reserved</span></button>"
          );
        }
        return (
          '<button class="tile" type="button" data-id="' +
          bird.id +
          '">' +
          label +
          "</button>"
        );
      })
      .join("");
  });
}

function setBirds(list, live) {
  turkeyBirds = list.map((bird) => ({
    id: bird.id,
    type: bird.type,
    weight: String(bird.weight),
    status: bird.status === "available" ? "available" : "reserved",
    sort: bird.sort || 0,
  }));
  turkeyLive = live;
  renderTurkeyTiles();
  if (openBirdId) {
    const open = birdById(openBirdId);
    if (!open || open.status !== "available") {
      const err = document.getElementById("reserve-error");
      err.textContent = "That weight was just reserved. Please pick another.";
      document.getElementById("reserve-submit").disabled = true;
    }
  }
}

function openTurkeyModal(id) {
  const bird = birdById(id);
  if (!bird || bird.status !== "available") return;
  openBirdId = id;
  const kind = TURKEY_TYPES[bird.type];
  document.getElementById("reserve-chosen").textContent =
    (kind ? kind.mary : "Turkey") + " · " + bird.weight + " lb";
  document.getElementById("reserve-error").textContent = "";
  document.getElementById("reserve-submit").disabled = false;
  document.getElementById("reserve-form").hidden = false;
  document.getElementById("reserve-form").reset();
  dateInput.min = turkeyTodayISO();
  dateInput.max = TURKEY_PICKUP_DEADLINE;
  document.getElementById("reserve-modal").classList.add("open");
  document.getElementById("reserve-name").focus();
}

function closeTurkeyModal() {
  openBirdId = "";
  document.getElementById("reserve-modal").classList.remove("open");
}

document.getElementById("avail").addEventListener("click", (event) => {
  const button = event.target.closest(".tile");
  if (!button || button.disabled) return;
  openTurkeyModal(button.getAttribute("data-id"));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeTurkeyModal();
});

function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

document.getElementById("reserve-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const err = document.getElementById("reserve-error");
  const submit = document.getElementById("reserve-submit");
  const bird = birdById(openBirdId);
  if (!bird || bird.status !== "available") {
    err.textContent = "That weight was just reserved. Please pick another.";
    return;
  }
  const name = document.getElementById("reserve-name").value.trim();
  const phone = document.getElementById("reserve-phone").value.trim();
  const pickup = dateInput.value;
  if (name.length < 2) {
    err.textContent = "Please enter your name.";
    return;
  }
  if (phoneDigits(phone).length < 10) {
    err.textContent = "Please enter a phone number.";
    return;
  }
  const dateError = turkeyPickupError(pickup);
  if (dateError) {
    err.textContent = dateError;
    return;
  }
  if (!turkeyLive) {
    err.textContent = "We couldn't save that reservation. Please call the store at (812) 482-4060.";
    return;
  }
  submit.disabled = true;
  err.textContent = "";
  try {
    await reserveLiveTurkey(bird, { name, phone, pickupDate: pickup || null });
    document.getElementById("reserve-chosen").textContent =
      "Reserved. We'll hold " +
      (TURKEY_TYPES[bird.type] ? TURKEY_TYPES[bird.type].mary : "your turkey") +
      " · " +
      bird.weight +
      " lb at the store.";
    document.getElementById("reserve-form").hidden = true;
  } catch (error) {
    submit.disabled = false;
    if (error && error.code === "taken") {
      err.textContent = "That weight was just reserved. Please pick another.";
      return;
    }
    console.error("Turkey reservation failed:", error);
    err.textContent = "We couldn't save that reservation. Please call the store at (812) 482-4060.";
  }
});

async function reserveLiveTurkey(bird, fields) {
  const invRef = fsdb.collection("turkeyInventory").doc(bird.id);
  const resRef = fsdb.collection("turkeyReservations").doc();
  await fsdb.runTransaction(async (tx) => {
    const snap = await tx.get(invRef);
    if (!snap.exists || snap.data().status !== "available") {
      const taken = new Error("taken");
      taken.code = "taken";
      throw taken;
    }
    const data = snap.data();
    tx.set(resRef, {
      inventoryId: bird.id,
      type: data.type,
      weight: data.weight,
      name: fields.name,
      phone: fields.phone,
      pickupDate: fields.pickupDate,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: "reserved",
    });
    tx.update(invRef, {
      status: "reserved",
      reservationId: resRef.id,
      reservedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });
}

firebase.initializeApp(firebaseConfig);
const fsdb = firebase.firestore();
firebase
  .auth()
  .signInAnonymously()
  .then(() => {
    fsdb.collection("turkeyInventory").onSnapshot(
      (snap) => {
        if (snap.empty) {
          setBirds([], true);
          return;
        }
        setBirds(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          true
        );
      },
      (error) => {
        console.error("Turkey inventory unavailable:", error);
        setBirds(TURKEY_SEED, false);
      }
    );
  })
  .catch((error) => {
    console.error("Anonymous sign-in failed:", error);
    setBirds(TURKEY_SEED, false);
  });
