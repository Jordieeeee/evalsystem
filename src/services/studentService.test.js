import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeQuerySnapshot, makeDocSnapshot } from '../test/firestoreMocks.js';

vi.mock('./firebase', () => ({ db: { __type: 'db' } }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ __type: 'collection', name })),
  query: vi.fn((ref, ...constraints) => ({ __type: 'query', ref, constraints })),
  where: vi.fn((field, op, value) => ({ __type: 'where', field, op, value })),
  doc: vi.fn((_db, name, id) => ({ __type: 'doc', name, id })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => '__ts__'),
}));

import { getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { studentService } from './studentService.js';

describe('studentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns the profile when it exists', async () => {
      getDoc.mockResolvedValue(makeDocSnapshot('s1', { name: 'Ana' }));

      expect(await studentService.getProfile('s1')).toEqual({ id: 's1', name: 'Ana' });
    });

    it('returns null when it does not exist', async () => {
      getDoc.mockResolvedValue(makeDocSnapshot('s1', null));

      expect(await studentService.getProfile('s1')).toBeNull();
    });
  });

  describe('createStudentProfile', () => {
    it('applies sensible defaults and merges', async () => {
      setDoc.mockResolvedValue(undefined);

      const result = await studentService.createStudentProfile('s1');

      expect(setDoc).toHaveBeenCalledWith(
        { __type: 'doc', name: 'students', id: 's1' },
        expect.objectContaining({
          id: 's1',
          studentId: 's1',
          name: '',
          course: 'BSIT',
          program: 'BSIT',
          year: '1',
          status: 'active',
          createdAt: '__ts__',
        }),
        { merge: true }
      );
      expect(result).toMatchObject({ id: 's1', status: 'active' });
    });

    it('honors provided payload values and docId', async () => {
      setDoc.mockResolvedValue(undefined);

      const result = await studentService.createStudentProfile('s1', {
        docId: 'custom',
        name: 'Ben',
        program: 'BSCS',
        year: '3',
      });

      expect(setDoc).toHaveBeenCalledWith(
        { __type: 'doc', name: 'students', id: 'custom' },
        expect.objectContaining({ name: 'Ben', program: 'BSCS', course: 'BSCS', year: '3' }),
        { merge: true }
      );
      expect(result).toMatchObject({ name: 'Ben', program: 'BSCS', course: 'BSCS', year: '3' });
    });
  });

  it('updateStudentProfile stamps updatedAt', async () => {
    updateDoc.mockResolvedValue(undefined);

    const result = await studentService.updateStudentProfile('s1', { name: 'New' });

    expect(updateDoc).toHaveBeenCalledWith(
      { __type: 'doc', name: 'students', id: 's1' },
      { name: 'New', updatedAt: '__ts__' }
    );
    expect(result).toEqual({ id: 's1', name: 'New', updatedAt: '__ts__' });
  });

  it('deleteStudentProfile deletes the doc', async () => {
    deleteDoc.mockResolvedValue(undefined);

    await studentService.deleteStudentProfile('s1');

    expect(deleteDoc).toHaveBeenCalledWith({ __type: 'doc', name: 'students', id: 's1' });
  });

  describe('getAcademicRecords', () => {
    it('sorts by assignedDate desc and splits current vs completed', async () => {
      getDocs.mockResolvedValue(
        makeQuerySnapshot([
          { id: 'r1', status: 'Assigned', assignedDate: '2024-01-01' },
          { id: 'r2', status: 'Passed', assignedDate: '2024-03-01' },
          { id: 'r3', status: 'Failed', assignedDate: '2024-02-01' },
          { id: 'r4', status: 'Unknown', assignedDate: '2024-04-01' },
        ])
      );

      const { currentSubjects, completedHistory } = await studentService.getAcademicRecords('s1');

      expect(currentSubjects.map((r) => r.id)).toEqual(['r1']);
      expect(completedHistory.map((r) => r.id)).toEqual(['r2', 'r3']);
      // r2 (March) sorts before r3 (Feb) because newest-first
      expect(completedHistory[0].id).toBe('r2');
    });
  });

  it('getAllStudents maps snapshot docs', async () => {
    getDocs.mockResolvedValue(makeQuerySnapshot([{ id: 's1', name: 'Ana' }]));

    expect(await studentService.getAllStudents()).toEqual([{ id: 's1', name: 'Ana' }]);
  });
});
