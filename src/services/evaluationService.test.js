import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeQuerySnapshot } from '../test/firestoreMocks.js';

vi.mock('./firebase', () => ({ db: { __type: 'db' } }));
vi.mock('./systemService', () => ({
  systemService: { getAcademicConfig: vi.fn() },
}));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ __type: 'collection', name })),
  query: vi.fn((ref, ...constraints) => ({ __type: 'query', ref, constraints })),
  where: vi.fn((field, op, value) => ({ __type: 'where', field, op, value })),
  doc: vi.fn((...args) => ({ __type: 'doc', args })),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
}));

import { getDocs, writeBatch } from 'firebase/firestore';
import { systemService } from './systemService';
import { evaluationService } from './evaluationService.js';

const setupEligibility = ({ subjects, evals, config }) => {
  getDocs
    .mockResolvedValueOnce(makeQuerySnapshot(subjects))
    .mockResolvedValueOnce(makeQuerySnapshot(evals));
  if (config instanceof Error) {
    systemService.getAcademicConfig.mockRejectedValue(config);
  } else {
    systemService.getAcademicConfig.mockResolvedValue(config);
  }
};

describe('evaluationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('getAllEvaluations maps snapshot docs', async () => {
    getDocs.mockResolvedValue(makeQuerySnapshot([{ id: 'e1', status: 'Passed' }]));

    expect(await evaluationService.getAllEvaluations()).toEqual([{ id: 'e1', status: 'Passed' }]);
  });

  describe('getEligibleSubjectsForStudent', () => {
    it('excludes passed and active subjects', async () => {
      setupEligibility({
        subjects: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
        evals: [
          { subjectCode: 'A', status: 'Passed' },
          { subjectCode: 'B', status: 'Assigned' },
        ],
        config: { activeSemester: '1st Semester' },
      });

      const { passed, eligible } = await evaluationService.getEligibleSubjectsForStudent('s1');

      expect(passed).toEqual(['A']);
      expect(eligible.map((s) => s.id)).toEqual(['C']);
    });

    it('filters subjects not offered in the active semester (array form)', async () => {
      setupEligibility({
        subjects: [
          { id: 'A', semesterOffered: ['1st Semester'] },
          { id: 'B', semesterOffered: ['2nd Semester'] },
        ],
        evals: [],
        config: { activeSemester: '1st Semester' },
      });

      const { eligible } = await evaluationService.getEligibleSubjectsForStudent('s1');

      expect(eligible.map((s) => s.id)).toEqual(['A']);
    });

    it('filters subjects not offered in the active semester (string form)', async () => {
      setupEligibility({
        subjects: [
          { id: 'A', semesterOffered: '1st Semester' },
          { id: 'B', semesterOffered: '2nd Semester' },
        ],
        evals: [],
        config: { activeSemester: '2nd Semester' },
      });

      const { eligible } = await evaluationService.getEligibleSubjectsForStudent('s1');

      expect(eligible.map((s) => s.id)).toEqual(['B']);
    });

    it('excludes subjects with unmet prerequisites', async () => {
      setupEligibility({
        subjects: [
          { id: 'A', prerequisites: ['X'] },
          { id: 'B', prerequisites: ['X'] },
        ],
        evals: [{ subjectCode: 'X', status: 'Passed' }],
        config: { activeSemester: '1st Semester' },
      });

      const { eligible } = await evaluationService.getEligibleSubjectsForStudent('s1');

      // X is passed, so both prerequisites are met (X is excluded as it's already passed)
      expect(eligible.map((s) => s.id)).toEqual(['A', 'B']);
    });

    it('keeps subjects whose prerequisites are unmet out of the eligible list', async () => {
      setupEligibility({
        subjects: [{ id: 'A', prerequisites: ['Y'] }],
        evals: [],
        config: { activeSemester: '1st Semester' },
      });

      const { eligible } = await evaluationService.getEligibleSubjectsForStudent('s1');

      expect(eligible).toEqual([]);
    });

    it('falls back to 1st Semester when the academic config lookup fails', async () => {
      setupEligibility({
        subjects: [
          { id: 'A', semesterOffered: '1st Semester' },
          { id: 'B', semesterOffered: '2nd Semester' },
        ],
        evals: [],
        config: new Error('settings unavailable'),
      });

      const { eligible } = await evaluationService.getEligibleSubjectsForStudent('s1');

      expect(eligible.map((s) => s.id)).toEqual(['A']);
    });
  });

  describe('dispatchMultipleAssignments', () => {
    it('batches an Assigned record per subject code and commits', async () => {
      const set = vi.fn();
      const commit = vi.fn().mockResolvedValue(undefined);
      writeBatch.mockReturnValue({ set, commit });

      const result = await evaluationService.dispatchMultipleAssignments('s1', ['A', 'B']);

      expect(set).toHaveBeenCalledTimes(2);
      expect(set.mock.calls[0][1]).toMatchObject({
        studentId: 's1',
        subjectCode: 'A',
        status: 'Assigned',
        isManualEntry: false,
      });
      expect(commit).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });
  });

  describe('addManualTORRecords', () => {
    it('normalizes string entries into Passed records', async () => {
      const set = vi.fn();
      const commit = vi.fn().mockResolvedValue(undefined);
      writeBatch.mockReturnValue({ set, commit });

      await evaluationService.addManualTORRecords('s1', ['A']);

      expect(set.mock.calls[0][1]).toMatchObject({
        studentId: 's1',
        subjectCode: 'A',
        status: 'Passed',
        isManualEntry: true,
      });
    });

    it('preserves object entries and coerces status to Passed/Failed', async () => {
      const set = vi.fn();
      const commit = vi.fn().mockResolvedValue(undefined);
      writeBatch.mockReturnValue({ set, commit });

      await evaluationService.addManualTORRecords('s1', [
        { subjectCode: 'A', grade: '1.5', status: 'Failed' },
        { subjectCode: 'B', grade: '2.0', status: 'Excellent' },
      ]);

      expect(set.mock.calls[0][1]).toMatchObject({ subjectCode: 'A', grade: '1.5', status: 'Failed' });
      expect(set.mock.calls[1][1]).toMatchObject({ subjectCode: 'B', grade: '2.0', status: 'Passed' });
    });
  });
});
