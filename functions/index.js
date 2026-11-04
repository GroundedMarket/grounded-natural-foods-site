/**
 * Grounded Natural Foods — auth management functions.
 * These run on Google's servers, never in a browser, which is what makes
 * role claims trustworthy: nothing here can be faked from client code.
 *
 * Usernames are mapped to synthetic emails (username@groundedmarket.com)
 * because Firebase Auth is email-based; staff never see or use the email.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
admin.initializeApp();

const EMAIL_DOMAIN = 'groundedmarket.com';
const toEmail = (username) => `${username.trim().toLowerCase().replace(/\s+/g, '')}@${EMAIL_DOMAIN}`;

function requireMaster(request){
  if (!request.auth || request.auth.token.role !== 'master') {
    throw new HttpsError('permission-denied', 'Only the master account can manage employee logins.');
  }
}

function authErrorCode(err) {
  return (err && (err.code || (err.errorInfo && err.errorInfo.code))) || '';
}

// Create a Firebase Auth login, stamp employee claims, and store authUid.
// If that email is already registered, reuse the user (set password + claims)
// instead of failing — a previous attempt may have created the Auth user
// without ever writing authUid onto the employee doc.
async function createEmployeeLogin({ username, password, employeeId }) {
  if (!username || !password || !employeeId) {
    throw new HttpsError('invalid-argument', 'username, password, and employeeId are required.');
  }
  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters (Firebase requirement).');
  }
  const email = toEmail(username);
  let user;
  try {
    user = await admin.auth().createUser({ email, password });
  } catch (err) {
    if (authErrorCode(err) !== 'auth/email-already-exists') throw err;
    user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password });
  }
  await admin.auth().setCustomUserClaims(user.uid, { role: 'employee', employeeId });
  await admin.firestore().collection('employees').doc(employeeId).set({ authUid: user.uid }, { merge: true });
  return user;
}

// Create a Firebase Auth login for a new employee.
// Called by the app right after master adds the employee's Firestore profile.
exports.createEmployeeAuth = onCall(async (request) => {
  requireMaster(request);
  const { username, password, employeeId } = request.data || {};
  const user = await createEmployeeLogin({ username, password, employeeId });
  return { uid: user.uid };
});

// Update an employee's username and/or password, or enable/disable login.
// When authUid is missing — or the Auth user was deleted — and a password
// is supplied, create the login the same way createEmployeeAuth does.
// createEmployeeAuth can fail at add time (for example billing disabled)
// and leave a profile with no login; setting a password repairs that.
exports.updateEmployeeAuth = onCall(async (request) => {
  requireMaster(request);
  const { employeeId, username, password, disabled } = request.data || {};
  if (!employeeId) throw new HttpsError('invalid-argument', 'employeeId is required.');
  const snap = await admin.firestore().collection('employees').doc(employeeId).get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'No auth account found for that employee — try Save again after re-adding them.');
  }
  const data = snap.data() || {};
  const uid = data.authUid || null;
  if (uid) {
    const update = {};
    if (username) update.email = toEmail(username);
    if (password) {
      if (password.length < 6) throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.');
      update.password = password;
    }
    if (typeof disabled === 'boolean') update.disabled = disabled;
    try {
      await admin.auth().updateUser(uid, update);
      return { ok: true };
    } catch (err) {
      if (authErrorCode(err) !== 'auth/user-not-found') throw err;
    }
  }
  const loginUsername = username || data.username;
  if (!loginUsername || !password) {
    throw new HttpsError('not-found', 'No auth account found for that employee — try Save again after re-adding them.');
  }
  const user = await createEmployeeLogin({ username: loginUsername, password, employeeId });
  if (typeof disabled === 'boolean') await admin.auth().updateUser(user.uid, { disabled });
  return { ok: true };
});

// Delete an employee's login entirely (called when master deletes them).
exports.deleteEmployeeAuth = onCall(async (request) => {
  requireMaster(request);
  const { employeeId } = request.data || {};
  if (!employeeId) throw new HttpsError('invalid-argument', 'employeeId is required.');
  const snap = await admin.firestore().collection('employees').doc(employeeId).get();
  const uid = snap.exists ? snap.data().authUid : null;
  if (uid) await admin.auth().deleteUser(uid).catch(() => {});
  return { ok: true };
});
