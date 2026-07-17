import { Plus, Trash2, AlertTriangle, Play, ClipboardList, RefreshCw } from 'lucide-react';
import { BATSTATEU_GRADES, SEMESTER_LIST, ACADEMIC_YEARS_LIST } from '../../../../services/curriculumConfig';
import { isPassingGrade, canonical } from '../utils/runCurriculumShiftEvaluation';
import { createEntryRow } from '../utils/courseEntryValidation';

export default function CourseEntryPanel({
  entries, setEntries, oldSubjectsCatalog,
  validation, onRunEvaluation, isEvaluating, hasResult
}) {
  const updateRow = (rowId, patch) => {
    setEntries((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)));
  };

  // Selecting a catalogued code auto-fills title and units; both stay editable
  // for courses that are not in old_subjects.
  const handleCodeChange = (rowId, value) => {
    const match = oldSubjectsCatalog.find((c) => canonical(c.courseCode || c.id) === canonical(value));
    updateRow(rowId, match
      ? { courseCode: value, courseTitle: match.courseTitle || '', units: match.creditUnits ?? '' }
      : { courseCode: value });
  };

  const addRow = () => setEntries((prev) => [...prev, createEntryRow()]);
  const removeRow = (rowId) => setEntries((prev) => prev.filter((row) => row.rowId !== rowId));

  const passedCount = entries.filter((e) => isPassingGrade(e.grade)).length;

  return (
    <div className="border rounded-2xl bg-white p-4 space-y-4 animate-fadeIn text-left">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-3">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
            <ClipboardList size={16} className="text-blue-600" /> Transcript Course Entry
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
            Key in the student's completed Old Curriculum courses. Only passed courses are mapped for credit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 text-slate-700 text-[10px] px-2.5 py-1 rounded-full font-black">
            {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · {passedCount} passed
          </span>
          <button type="button" onClick={addRow} className="border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5">
            <Plus size={13} /> Add Course
          </button>
        </div>
      </div>

      {/* ENTRY ROWS */}
      <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
        {entries.length === 0 && (
          <div className="text-center py-10 text-slate-400 font-semibold text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ClipboardList className="mx-auto text-slate-300 mb-2" size={28} />
            <p>No courses entered yet. Use “Add Course” to key in the student's transcript.</p>
          </div>
        )}

        {entries.map((row, index) => {
          const rowError = validation.rowErrors[row.rowId];
          const rowWarning = validation.rowWarnings[row.rowId];
          const notPassing = row.grade && !isPassingGrade(row.grade);

          return (
            <div
              key={row.rowId}
              className={`p-3 rounded-xl border space-y-2 transition ${
                rowError ? 'border-rose-200 bg-rose-50/30'
                  : notPassing ? 'border-slate-200 bg-slate-50/60 opacity-75'
                  : rowWarning ? 'border-amber-200 bg-amber-50/30'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 block mb-0.5 uppercase">Course Code</label>
                  <input
                    list={`old-codes-${row.rowId}`}
                    value={row.courseCode}
                    onChange={(e) => handleCodeChange(row.rowId, e.target.value)}
                    placeholder="CS_111"
                    className="w-full bg-white border p-1.5 rounded text-[11px] font-bold outline-none focus:ring-1 focus:ring-slate-950"
                  />
                  <datalist id={`old-codes-${row.rowId}`}>
                    {oldSubjectsCatalog.map((c) => (
                      <option key={c.id} value={c.courseCode || c.id}>{c.courseTitle}</option>
                    ))}
                  </datalist>
                </div>

                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-slate-400 block mb-0.5 uppercase">Course Title</label>
                  <input
                    value={row.courseTitle}
                    onChange={(e) => updateRow(row.rowId, { courseTitle: e.target.value })}
                    placeholder="Computer Programming"
                    className="w-full bg-white border p-1.5 rounded text-[11px] font-semibold outline-none focus:ring-1 focus:ring-slate-950"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-0.5 uppercase">Grade</label>
                  <select
                    value={row.grade}
                    onChange={(e) => updateRow(row.rowId, { grade: e.target.value })}
                    className="w-full bg-white border p-1.5 rounded text-[11px] font-bold outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    <option value="">--</option>
                    {BATSTATEU_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="text-[9px] font-black text-slate-400 block mb-0.5 uppercase">Units</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={row.units}
                    onChange={(e) => updateRow(row.rowId, { units: e.target.value })}
                    className="w-full bg-white border p-1.5 rounded text-[11px] font-bold outline-none focus:ring-1 focus:ring-slate-950"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 block mb-0.5 uppercase">A.Y. Taken</label>
                  <select
                    value={row.academicYear}
                    onChange={(e) => updateRow(row.rowId, { academicYear: e.target.value })}
                    className="w-full bg-white border p-1.5 rounded text-[11px] font-bold outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    <option value="">-- Select --</option>
                    {ACADEMIC_YEARS_LIST.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 block mb-0.5 uppercase">Semester Taken</label>
                  <select
                    value={row.semester}
                    onChange={(e) => updateRow(row.rowId, { semester: e.target.value })}
                    className="w-full bg-white border p-1.5 rounded text-[11px] font-bold outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    <option value="">-- Select --</option>
                    {SEMESTER_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRow(row.rowId)}
                    title={`Remove row ${index + 1}`}
                    className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {rowError && (
                <p className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                  <AlertTriangle size={11} /> {rowError.join(' · ')}
                </p>
              )}
              {!rowError && rowWarning && (
                <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                  <AlertTriangle size={11} /> {rowWarning}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* VALIDATION SUMMARY + RUN */}
      <div className="border-t pt-3 space-y-2">
        {validation.errors.length > 0 && entries.length > 0 && (
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 space-y-1">
            {validation.errors.map((err, i) => (
              <p key={i} className="text-[11px] font-bold text-rose-800 flex items-start gap-1.5">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {err}
              </p>
            ))}
          </div>
        )}

        <div className="flex justify-end items-center gap-3">
          {hasResult && (
            <span className="text-[10px] font-bold text-slate-400">
              Editing entries requires re-running the evaluation.
            </span>
          )}
          <button
            type="button"
            onClick={onRunEvaluation}
            disabled={!validation.isValid || isEvaluating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isEvaluating ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
            {isEvaluating ? 'Running Evaluation...' : 'Run Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
}
