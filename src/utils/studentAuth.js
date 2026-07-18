// Helpers for the student self-registration ("claim account") flow.
//
// SECURITY NOTE — read before touching this file:
// Because this app runs on the Firebase Spark plan (no Cloud Functions, no Admin
// SDK), there is no server-side step that can verify a claimant actually owns the
// {SR-Code}@g.tlsu.edu.ph inbox before an account is created for it. SR-Codes are
// sequential and printed on physical student IDs, so anyone who knows (or guesses)
// an unclaimed SR-Code can claim it and read that student's records. This is a
// deliberate, accepted trade-off for a free-tier demo — see REQUIRE_EMAIL_VERIFICATION
// below for how to close the hole if/when a paid plan or an email-sending backend
// becomes available.

// Master switch for the email-verification hardening path. Flipping this to `true`
// alone is NOT enough — it only takes effect once you also:
//   1. call sendEmailVerification(user) right after createUserWithEmailAndPassword
//      (already wired in registrationService.js behind this flag), and
//   2. add `&& request.auth.token.email_verified == true` to the claim condition
//      in firestore.rules (the exact line to uncomment is marked there).
// Left off (false) by default because Spark-plan self-registration has no way to
// force a user to leave the app and click the email link before losing interest —
// that's a product decision, not a technical limitation, so it's left as a switch.
export const REQUIRE_EMAIL_VERIFICATION = false;

// YY-NNNNN: 2 digits, a dash, then 4–5 digits (e.g. 23-08214, 9-1234).
// Adjust this if your registrar's SR-Code format differs.
const SR_CODE_REGEX = /^\d{2}-\d{4,5}$/;

export const isValidSrCode = (srCode) => SR_CODE_REGEX.test((srCode || '').trim());

// A student's Firebase Auth email is never typed by anyone — it is always
// deterministically derived from their SR-Code so there is exactly one possible
// email per SR-Code, on both the registrar's admit form and this claim flow.
export const deriveEmail = (srCode) => `${(srCode || '').trim()}@g.tlsu.edu.ph`;

export const isPasswordLongEnough = (password) => (password || '').length >= 8;
