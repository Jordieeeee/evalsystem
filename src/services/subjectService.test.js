import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeQuerySnapshot, makeDocSnapshot } from '../test/firestoreMocks.js';

vi.mock('./firebase', () => ({ db: { __type: 'db' } }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ __type: 'collection', name })),
  doc: vi.fn((_db, name, id) => ({ __type: 'doc', name, id })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

import { doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { subjectService } from './subjectService.js';

describe('subjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('getAllSubjects maps snapshot docs to objects with ids', async () => {
    getDocs.mockResolvedValue(
      makeQuerySnapshot([
        { id: 'CC_100', name: 'Intro' },
        { id: 'CC_101', name: 'Data' },
      ])
    );

    const subjects = await subjectService.getAllSubjects();

    expect(subjects).toEqual([
      { id: 'CC_100', name: 'Intro' },
      { id: 'CC_101', name: 'Data' },
    ]);
  });

  describe('getSubject', () => {
    it('returns the subject when it exists', async () => {
      getDoc.mockResolvedValue(makeDocSnapshot('CC_100', { name: 'Intro' }));

      const subject = await subjectService.getSubject('CC_100');

      expect(subject).toEqual({ id: 'CC_100', name: 'Intro' });
    });

    it('returns null when it does not exist', async () => {
      getDoc.mockResolvedValue(makeDocSnapshot('CC_100', null));

      expect(await subjectService.getSubject('CC_100')).toBeNull();
    });
  });

  it('getCrosswalkMappings builds an old-code -> new-code dictionary', async () => {
    getDocs.mockResolvedValue(
      makeQuerySnapshot([
        { id: 'IT_111', newCourseCode: 'CC_100' },
        { id: 'CS_111', newCourseCode: 'CC_101' },
      ])
    );

    const mappings = await subjectService.getCrosswalkMappings();

    expect(mappings).toEqual({ IT_111: 'CC_100', CS_111: 'CC_101' });
  });

  it('addSubject uppercases the id and strips it from the payload', async () => {
    setDoc.mockResolvedValue(undefined);

    const result = await subjectService.addSubject({ id: 'cc_100', name: 'Intro', units: 3 });

    expect(doc).toHaveBeenCalledWith({ __type: 'db' }, 'new_subjects', 'CC_100');
    expect(setDoc).toHaveBeenCalledWith(
      { __type: 'doc', name: 'new_subjects', id: 'CC_100' },
      { name: 'Intro', units: 3 }
    );
    expect(result).toEqual({ id: 'CC_100', name: 'Intro', units: 3 });
  });

  describe('deleteSubject', () => {
    it('resolves true on success', async () => {
      deleteDoc.mockResolvedValue(undefined);

      expect(await subjectService.deleteSubject('CC_100')).toBe(true);
      expect(deleteDoc).toHaveBeenCalledOnce();
    });

    it('rethrows when the delete fails', async () => {
      deleteDoc.mockRejectedValue(new Error('nope'));

      await expect(subjectService.deleteSubject('CC_100')).rejects.toThrow('nope');
    });
  });
});
