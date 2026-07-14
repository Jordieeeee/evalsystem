import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeDocSnapshot } from '../test/firestoreMocks.js';

vi.mock('./firebase', () => ({ db: { __type: 'db' } }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args) => ({ __type: 'doc', args })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { systemService } from './systemService.js';

describe('systemService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAcademicConfig', () => {
    it('returns stored config when the document exists', async () => {
      getDoc.mockResolvedValue(
        makeDocSnapshot('academic', { activeYear: '2030-2031', activeSemester: '2nd Semester' })
      );

      const config = await systemService.getAcademicConfig();

      expect(doc).toHaveBeenCalledWith({ __type: 'db' }, 'system_settings', 'academic');
      expect(config).toEqual({ activeYear: '2030-2031', activeSemester: '2nd Semester' });
    });

    it('returns fallback defaults when the document does not exist', async () => {
      getDoc.mockResolvedValue(makeDocSnapshot('academic', null));

      const config = await systemService.getAcademicConfig();

      expect(config).toEqual({ activeYear: '2026-2027', activeSemester: '1st Semester' });
    });

    it('rethrows when the read fails', async () => {
      const err = new Error('offline');
      getDoc.mockRejectedValue(err);

      await expect(systemService.getAcademicConfig()).rejects.toThrow('offline');
    });
  });

  describe('updateAcademicConfig', () => {
    it('merges the config and resolves true', async () => {
      setDoc.mockResolvedValue(undefined);

      const result = await systemService.updateAcademicConfig({ activeSemester: '2nd Semester' });

      expect(setDoc).toHaveBeenCalledWith(
        { __type: 'doc', args: [{ __type: 'db' }, 'system_settings', 'academic'] },
        { activeSemester: '2nd Semester' },
        { merge: true }
      );
      expect(result).toBe(true);
    });

    it('rethrows when the write fails', async () => {
      setDoc.mockRejectedValue(new Error('write failed'));

      await expect(systemService.updateAcademicConfig({})).rejects.toThrow('write failed');
    });
  });
});
