import { vi } from 'vitest';

// Build a fake query snapshot whose `.docs` mimics Firestore QueryDocumentSnapshots.
export const makeQuerySnapshot = (records) => {
  const docs = records.map(({ id, ...data }) => ({
    id,
    data: () => data,
  }));
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (cb) => docs.forEach(cb),
  };
};

// Build a fake single document snapshot.
export const makeDocSnapshot = (id, data) => ({
  id,
  exists: () => data !== null && data !== undefined,
  data: () => data,
});

// A firestore module mock where every exported function used by the services is a vi.fn().
export const createFirestoreMock = () => ({
  collection: vi.fn((_db, name) => ({ __type: 'collection', name })),
  query: vi.fn((ref, ...constraints) => ({ __type: 'query', ref, constraints })),
  where: vi.fn((field, op, value) => ({ __type: 'where', field, op, value })),
  doc: vi.fn((...args) => ({ __type: 'doc', args })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(() => '__serverTimestamp__'),
});
