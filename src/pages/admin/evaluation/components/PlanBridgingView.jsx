import { AlertTriangle, CheckCircle2, CircleDashed, ArrowRight, GitBranch, Ban } from 'lucide-react';

// Same status palette CurriculumShiftView uses, so a Credited/Bridge/Gap row
// reads identically wherever bridging results appear.
const ROW_TINT = {
  Credited: 'bg-emerald-50/40',
  Bridge: 'bg-amber-50/40',
  Unmapped: 'bg-rose-50/20',
  Gap: 'bg-rose-50/20'
};

const STATUS_BADGE = {
  Credited: 'bg-emerald-100 text-emerald-800',
  Bridge: 'bg-amber-100 text-amber-800',
  Unmapped: 'bg-rose-100 text-rose-800',
  Gap: 'bg-rose-100 text-rose-800'
};

const SectionHeading = ({ children }) => (
  <div className="flex items-center gap-2 pb-1 border-b">
    <span className="w-1 h-3.5 bg-blue-600 rounded-xs" />
    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">{children}</h4>
  </div>
);

/**
 * Read-only Plan Bridging comparison.
 *
 * Renders what runCurriculumShiftEvaluation derived from the student's recorded
 * grades: every passed old subject and where it lands under the new curriculum,
 * plus the new-curriculum requirements nothing has satisfied yet.
 *
 * Purely presentational -- it mutates nothing and offers no finalize action.
 * Every passed course the engine saw appears in exactly one bucket; unmapped
 * subjects and unsatisfied requirements are never collapsed away, because both
 * are evaluator decisions rather than settled facts.
 */
export default function PlanBridgingView({ auditOutput }) {
  if (!auditOutput) return null;

  const {
    creditedList = [],
    bridgeCourses = [],
    unmappedList = [],
    gapCourses = [],
    excludedEntries = [],
    mappingStats = {}
  } = auditOutput;

  // One row per old subject the student passed, in a single comparison table.
  const bridgedRows = [
    ...creditedList.map(c => ({
      key: `credited-${c.canonicalOld || c.oldCode}`,
      status: 'Credited',
      oldCode: c.oldCode,
      oldTitle: c.oldTitle,
      oldUnits: c.oldUnits,
      grade: c.grade,
      newCode: c.newCode,
      newTitle: c.newTitle,
      note: c.matchType === 'manual' ? 'Manually transferred' : 'Mapped equivalency'
    })),
    ...bridgeCourses.map(b => ({
      key: `bridge-${b.canonicalOld || b.oldCode || b.newCode}`,
      status: 'Bridge',
      oldCode: b.oldCode,
      oldTitle: b.oldTitle,
      oldUnits: b.oldUnits,
      grade: b.grade,
      newCode: b.newCode,
      newTitle: b.newTitle,
      note: b.requirement || 'Partial equivalency — bridging requirement'
    })),
    ...unmappedList.map(u => ({
      key: `unmapped-${u.canonicalOld || u.oldCode}`,
      status: 'Unmapped',
      oldCode: u.oldCode,
      oldTitle: u.oldTitle,
      oldUnits: u.oldUnits,
      grade: u.grade,
      newCode: null,
      newTitle: null,
      note: u.reason || 'No mapping found in curriculum_mappings'
    }))
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-left">

      {/* Provenance: these numbers are only as complete as the mapping registry. */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex gap-3 items-start text-xs font-semibold">
        <GitBranch size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-black uppercase tracking-wide text-[10px]">Bridging view only — derived from curriculum_mappings</p>
          <p className="text-amber-800 font-medium">
            Equivalencies below come solely from the curriculum mapping registry applied to this student's recorded grades.
            Coverage is only as complete as that registry: an unmapped subject means no equivalency has been authored yet,
            not that the subject earns no credit. Unmapped subjects and unsatisfied requirements both need an evaluator's decision.
          </p>
        </div>
      </div>

      {/* Counts, straight from the engine. No invented totals. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-slate-200 bg-white rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-2xl font-black font-mono text-emerald-700">{mappingStats.autoMatched ?? creditedList.length}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Mapped &amp; Credited</p>
        </div>
        <div className="border border-slate-200 bg-white rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-2xl font-black font-mono text-amber-700">{mappingStats.bridge ?? bridgeCourses.length}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Bridge Required</p>
        </div>
        <div className={`border rounded-2xl p-4 flex flex-col justify-center ${unmappedList.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
          <p className="text-2xl font-black font-mono text-rose-700">{mappingStats.unmapped ?? unmappedList.length}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Unmapped — needs review</p>
        </div>
        <div className={`border rounded-2xl p-4 flex flex-col justify-center ${gapCourses.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
          <p className="text-2xl font-black font-mono text-rose-700">{gapCourses.length}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Not Yet Satisfied</p>
        </div>
      </div>

      {/* ================= OLD -> NEW COMPARISON ================= */}
      <div className="space-y-4">
        <SectionHeading>Old Curriculum → New Curriculum Bridging</SectionHeading>
        <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider border-b text-[10px]">
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Old Subject</th>
                  <th className="px-6 py-3 text-center">Grade</th>
                  <th className="px-6 py-3">New Curriculum Equivalent</th>
                  <th className="px-6 py-3">Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-600">
                {bridgedRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-semibold">
                      No passed subjects available to bridge for this student.
                    </td>
                  </tr>
                )}
                {bridgedRows.map(row => (
                  <tr key={row.key} className={ROW_TINT[row.status]}>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-black inline-flex items-center gap-1 ${STATUS_BADGE[row.status]}`}>
                        {row.status === 'Credited' && <CheckCircle2 size={11} />}
                        {row.status === 'Bridge' && <AlertTriangle size={11} />}
                        {row.status === 'Unmapped' && <AlertTriangle size={11} />}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{row.oldCode}</p>
                      <p className="text-slate-500 font-medium">{row.oldTitle}</p>
                      <p className="text-slate-400 text-[10px] font-bold mt-0.5">{row.oldUnits} Unit{row.oldUnits === 1 ? '' : 's'}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold text-slate-900">{row.grade}</td>
                    <td className="px-6 py-4">
                      {row.newCode ? (
                        <div className="flex items-start gap-2">
                          <ArrowRight size={13} className="text-slate-300 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-900">{row.newCode}</p>
                            <p className="text-slate-500 font-medium">{row.newTitle}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-rose-700 font-black text-[11px] uppercase tracking-wide">No equivalent — unmapped</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium text-[11px]">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= NEW-CURRICULUM REQUIREMENTS NOT YET SATISFIED ================= */}
      <div className="space-y-4">
        <SectionHeading>New-Curriculum Subjects Not Yet Satisfied</SectionHeading>
        <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50/70 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDashed size={16} className="text-rose-400" />
              <span className="font-bold text-slate-800 text-xs">Requirements with no completed old-subject mapping</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
              {gapCourses.length} Subject{gapCourses.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider border-b text-[10px]">
                  <th className="px-6 py-3">Subject Code</th>
                  <th className="px-6 py-3">Descriptive Title</th>
                  <th className="px-6 py-3">Year Level</th>
                  <th className="px-6 py-3 text-center">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-600">
                {gapCourses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-semibold">
                      Every new-curriculum requirement is satisfied by a mapped subject.
                    </td>
                  </tr>
                )}
                {gapCourses.map(gap => (
                  <tr key={gap.canonicalCode || gap.code} className={ROW_TINT.Gap}>
                    <td className="px-6 py-4 font-bold text-slate-900">{gap.code}</td>
                    <td className="px-6 py-4 text-slate-500">{gap.title}</td>
                    <td className="px-6 py-4 text-slate-400">{gap.yearLevel}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">{gap.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Not passed -> never eligible for bridging, but still shown rather than dropped. */}
      {excludedEntries.length > 0 && (
        <div className="space-y-4">
          <SectionHeading>Excluded From Bridging (Not Passed)</SectionHeading>
          <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider border-b text-[10px]">
                    <th className="px-6 py-3">Subject Code</th>
                    <th className="px-6 py-3">Descriptive Title</th>
                    <th className="px-6 py-3 text-center">Grade</th>
                    <th className="px-6 py-3 text-center">Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-600">
                  {excludedEntries.map((entry, idx) => (
                    <tr key={`${entry.courseCode}-${idx}`} className="bg-slate-50/40">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-1.5">
                        <Ban size={12} className="text-slate-400" />{entry.courseCode}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{entry.courseTitle}</td>
                      <td className="px-6 py-4 text-center font-extrabold text-slate-900">{entry.grade}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">{entry.units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
