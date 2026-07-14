// Shared helpers for normalizing Firestore reads into plain objects.

// Map a query snapshot's docs into an array of { id, ...data() } objects.
export const mapSnapshot = (snapshot) =>
  snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));

// Map a single document snapshot into { id, ...data() }, or null when missing.
export const docToData = (snap) =>
  snap.exists() ? { id: snap.id, ...snap.data() } : null;
