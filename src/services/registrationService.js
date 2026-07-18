import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { deriveEmail, REQUIRE_EMAIL_VERIFICATION } from '../utils/studentAuth.js';

// Thrown for the two reject cases the registrar-admitted record can be in.
// RegisterPage maps these codes to the exact copy the spec calls for.
export class ClaimRejectedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Claims a registrar-admitted student record by SR-Code, turning it into a
// working Firebase Auth login.
//
// KNOWN LIMITATIONS (see also studentAuth.js):
// - No email verification: this proves the caller can type a password twice for
//   a derivable email, not that they own the inbox. Anyone who knows an unclaimed
//   SR-Code can claim it. Deliberate Spark-plan trade-off, not a secure design.
// - Not race-proof end-to-end. Firestore's security rules DO stop two concurrent
//   claims from both succeeding on the same students/{srCode} doc (the second
//   update is checked against the just-written `claimed: true`, not the stale
//   value the client read), and Firebase Auth's own email-uniqueness constraint
//   stops a genuine double-claim of the same email. But the two steps below
//   (create the Auth user, then write the Firestore doc) are not wrapped in a
//   single atomic transaction — that would require Cloud Functions/Admin SDK,
//   unavailable on Spark. If step 1 succeeds and step 2 fails (network drop,
//   closed tab, rules typo) the result is an ORPHANED Auth account: the email is
//   now permanently taken in Firebase Auth, but students/{srCode} still shows
//   claimed: false, so the real student can never claim it again and instead
//   sees a confusing "email already in use" error. Recovery requires a registrar
//   to manually delete the orphaned user from the Firebase Auth console (Spark
//   has no Admin SDK to automate this).
export const claimStudentAccount = async (srCode, password) => {
  const email = deriveEmail(srCode);
  const studentRef = doc(db, 'students', srCode);
  const snap = await getDoc(studentRef);

  if (!snap.exists()) {
    throw new ClaimRejectedError('NOT_ADMITTED', 'No admitted record — contact the registrar.');
  }
  if (snap.data().claimed === true) {
    throw new ClaimRejectedError('ALREADY_CLAIMED', 'Account already claimed.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (REQUIRE_EMAIL_VERIFICATION) {
    await sendEmailVerification(credential.user);
  }

  // If this write fails after the Auth account above was created, that account
  // is orphaned — see KNOWN LIMITATIONS.
  await updateDoc(studentRef, { uid: credential.user.uid, claimed: true });

  return credential.user;
};
