import { Fragment } from 'react';
import { AlertTriangle, Printer, CheckCircle2, CircleDashed, Lock, RefreshCw, GitBranch, CalendarDays, GraduationCap, ClipboardCheck } from 'lucide-react';

const LOG_STYLES = {
  pass: { dot: 'bg-emerald-500', text: 'text-slate-600' },
  bridge: { dot: 'bg-amber-500', text: 'text-amber-900' },
  warn: { dot: 'bg-rose-500', text: 'text-rose-900' },
  plan: { dot: 'bg-blue-500', text: 'text-slate-600' },
  info: { dot: 'bg-slate-300', text: 'text-slate-500' }
};

// Phase 7 marks: Credited / Gap / Bridge / Scheduled.
const CHECK_MARK = {
  Credited: <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />,
  Bridge: <AlertTriangle size={13} className="text-amber-600 shrink-0" />,
  Scheduled: <ClipboardCheck size={13} className="text-blue-600 shrink-0" />,
  Gap: <CircleDashed size={13} className="text-rose-300 shrink-0" />
};

const ROW_TINT = {
  Credited: 'bg-emerald-50/40',
  Bridge: 'bg-amber-50/40',
  Scheduled: 'bg-blue-50/30',
  Gap: 'bg-rose-50/20'
};

const STATUS_BADGE = {
  Credited: 'bg-emerald-100 text-emerald-800',
  Bridge: 'bg-amber-100 text-amber-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  Gap: 'bg-rose-100 text-rose-700'
};

export default function CurriculumShiftView({
  auditOutput, evaluationStrategy,
  triggerReportModalOpen, handleFinalizeEvaluationMatrix, isSubmitting, isFinalized, isStale
}) {
  if (!auditOutput) return null;

  const { semesterPlan = [], creditedList = [], bridgeCourses = [], gapCourses = [], unmappedList = [], creditBoundary = {} } = auditOutput;

  return (
    <div className="space-y-6 animate-fadeIn text-left">

      {/* ================= PHASE 5: CURRICULUM PROGRESS METRICS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-50/60 border border-slate-200/60 p-4 rounded-2xl space-y-3.5 text-xs font-semibold">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="font-black text-slate-900">Curriculum Progress</span>
            <span className="text-blue-600 font-extrabold">{auditOutput.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${auditOutput.curriculumProgress}%` }} />
          </div>
          <div className="space-y-1.5 pt-1 text-slate-500 text-[11px]">
            <p className="flex justify-between"><span>Units Earned Mapped</span><span className="font-bold text-slate-900">{auditOutput.unitsEarned} Units</span></p>
            <p className="flex justify-between"><span>Units Deficient Remaining</span><span className="font-bold text-slate-900">{auditOutput.unitsRemaining} Units</span></p>
            <p className="flex justify-between"><span>Total Required Units</span><span className="font-bold text-slate-900">{auditOutput.totalRequiredUnits} Units</span></p>
            <p className="flex justify-between"><span>Permitted Credit Boundary</span><span className="font-bold text-slate-900">{creditBoundary.min} – {creditBoundary.max} Units</span></p>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-slate-200 bg-white rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-2xl font-black font-mono text-slate-900">{auditOutput.estimatedSemesters}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Est. Semesters</p>
            <p className="text-[10px] font-bold text-slate-400">{auditOutput.regularSlotsRemaining} left in program</p>
          </div>
          <div className={`border rounded-2xl p-4 flex flex-col justify-center ${auditOutput.exceedsNormalDuration ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
            <GraduationCap size={18} className={auditOutput.exceedsNormalDuration ? 'text-amber-700' : 'text-slate-400'} />
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500 mt-1">Projected Graduation</p>
            <p className={`text-[11px] font-black ${auditOutput.exceedsNormalDuration ? 'text-amber-800' : 'text-slate-900'}`}>{auditOutput.projectedGraduation}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-2xl font-black font-mono text-emerald-700">{creditedList.length}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600">Credited</p>
            <p className="text-[10px] font-bold text-emerald-600/70">{auditOutput.mappingStats?.autoMatched || 0} auto · {auditOutput.mappingStats?.manuallyTransferred || 0} manual</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-2xl font-black font-mono text-rose-700">{gapCourses.length + bridgeCourses.length}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-rose-600">To Take</p>
            <p className="text-[10px] font-bold text-rose-600/70">{bridgeCourses.length} bridge · {unmappedList.length} unmapped</p>
          </div>
        </div>
      </div>

      {/* ================= PHASE 6: WARNING BANNERS ================= */}
      {auditOutput.alerts?.length > 0 && (
        <div className="space-y-2">
          {auditOutput.alerts.map((alertText, index) => (
            <div key={index} className="bg-amber-50/50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">{alertText}</p>
            </div>
          ))}
        </div>
      )}

      {/* ================= PHASE 4: SEMESTER-BY-SEMESTER ENROLLMENT PLAN ================= */}
      <div className="border rounded-2xl overflow-hidden bg-white">
        <div className="bg-slate-50 p-3 border-b flex flex-wrap justify-between items-center gap-2">
          <span className="text-xs font-black text-slate-950 uppercase flex items-center gap-1.5">
            <CalendarDays size={14} className="text-blue-600" /> Semester Enrollment Plan
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            From {auditOutput.currentStanding?.label} → {auditOutput.projectedGraduation}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[30rem] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b sticky top-0">
              <tr>
                <th className="p-2.5">Semester</th><th className="p-2.5">Course Code</th><th className="p-2.5">Course Title</th>
                <th className="p-2.5 text-right">Units</th><th className="p-2.5">Prerequisites</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-slate-700">
              {semesterPlan.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400 font-semibold">No remaining courses to schedule.</td></tr>
              )}
              {semesterPlan.map((slot) => (
                <Fragment key={slot.slotIndex}>
                  {slot.courses.map((course, cIdx) => (
                    <tr key={`${slot.slotIndex}-${cIdx}`} className="border-b hover:bg-slate-50/40">
                      {cIdx === 0 && (
                        <td rowSpan={slot.courses.length} className={`p-2.5 align-top border-r ${slot.isCurrent ? 'bg-blue-50/50' : 'bg-slate-50/30'}`}>
                          <p className="font-extrabold text-slate-900">{slot.yearLevel}</p>
                          <p className="text-[10px] text-slate-500">{slot.semester}</p>
                          {slot.isCurrent && <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Current</span>}
                        </td>
                      )}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">{course.code}</span>
                          {course.status === 'Bridge' && <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1 rounded uppercase">Bridge</span>}
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-500">{course.title}</td>
                      <td className="p-2.5 text-right font-mono font-black">{course.units}u</td>
                      <td className="p-2.5 text-[10px]">
                        {course.prereqStatus.length === 0
                          ? <span className="text-slate-400">None</span>
                          : course.prereqStatus.map((p) => (
                            <span key={p.code} className="inline-flex items-center gap-0.5 mr-1.5 text-slate-500 font-bold">
                              {p.code} <CheckCircle2 size={9} className="text-emerald-600" />
                            </span>
                          ))}
                      </td>
                    </tr>
                  ))}
                  <tr className={`border-b-2 ${slot.isOverloaded || slot.isUnderloaded ? 'bg-amber-50/40' : 'bg-slate-50/60'}`}>
                    <td className="p-1.5" />
                    <td colSpan={2} className="p-1.5 text-right text-[10px] font-black uppercase text-slate-400">
                      {slot.yearLevel} {slot.semester} Subtotal
                    </td>
                    <td className="p-1.5 text-right font-mono font-black text-slate-900">{slot.totalUnits}u</td>
                    <td className="p-1.5">
                      {slot.isOverloaded && <span className="bg-rose-100 text-rose-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Over {slot.maxUnits}u limit</span>}
                      {slot.isUnderloaded && <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Under {slot.minUnits}u minimum</span>}
                      {!slot.isOverloaded && !slot.isUnderloaded && <span className="text-[9px] font-bold text-slate-400">max {slot.maxUnits}u</span>}
                    </td>
                  </tr>

                  {/* Spare capacity: account for it, so an admin never has to guess
                      whether the planner under-scheduled or nothing else was takeable. */}
                  {slot.spareUnits > 0 && slot.skipped?.length > 0 && (
                    <tr className="border-b-2 bg-slate-50/40">
                      <td />
                      <td colSpan={4} className="px-2.5 pb-2">
                        <details className="text-[10px]">
                          <summary className="cursor-pointer font-bold text-slate-400 hover:text-slate-600 select-none">
                            {slot.spareUnits}u spare — why {slot.skipped.length} course(s) were not placed here
                          </summary>
                          <div className="mt-1.5 space-y-1 pl-3 border-l-2 border-slate-200">
                            {slot.skipped.slice(0, 12).map((s, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase shrink-0 ${
                                  s.reason === 'prerequisite' ? 'bg-rose-100 text-rose-700'
                                    : s.reason === 'semester' ? 'bg-slate-200 text-slate-600'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {s.reason === 'prerequisite' ? 'Prereq' : s.reason === 'semester' ? 'Not offered' : 'Capacity'}
                                </span>
                                <span className="text-slate-500 font-semibold">
                                  <span className="font-extrabold text-slate-700">{s.code}</span> ({s.yearLevel}, {s.units}u, offered {s.semesterOffered.join('/')})
                                  {s.reason === 'prerequisite' && <> — needs {s.missingPrereqs.join(', ')}</>}
                                  {s.reason === 'capacity' && <> — would exceed the {slot.maxUnits}u cap</>}
                                </span>
                              </div>
                            ))}
                            {slot.skipped.length > 12 && (
                              <p className="text-slate-400 italic">+{slot.skipped.length - 12} more</p>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
            {semesterPlan.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2">
                <tr>
                  <td colSpan={3} className="p-2.5 text-[10px] font-black uppercase text-slate-600">
                    Projected Graduation — {auditOutput.projectedGraduation}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-slate-900">
                    {semesterPlan.reduce((s, x) => s + x.totalUnits, 0)}u
                  </td>
                  <td className="p-2.5 text-[10px] font-bold text-slate-500">{auditOutput.estimatedSemesters} semester(s)</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {auditOutput.unschedulableCourses?.length > 0 && (
          <div className="border-t bg-rose-50/30 p-3 space-y-1">
            <p className="text-[10px] font-black uppercase text-rose-800">Cannot Be Scheduled</p>
            {auditOutput.unschedulableCourses.map((c, i) => (
              <p key={i} className="text-[10px] font-semibold text-rose-700">
                {c.code} — {c.title}: unresolved prerequisite(s) {c.missingPrereqs.join(', ') || '—'}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ================= PHASE 6 + 7: LOGS AND CHECKSHEET ================= */}
      <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
          <span className="text-xs font-black text-slate-950 uppercase">Analysis Logs & Rule Results</span>
          <div className="flex items-center gap-2">
            {isFinalized && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1">
                <Lock size={10} /> Finalized
              </span>
            )}
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
              auditOutput.overallEligibility === 'ELIGIBLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>{auditOutput.overallEligibility}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {auditOutput.reviewReasons?.length > 0 && (
            <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-3">
              <p className="text-[10px] font-black uppercase text-amber-800 mb-1">Justification</p>
              <ul className="list-disc list-inside space-y-0.5">
                {auditOutput.reviewReasons.map((reason, i) => (
                  <li key={i} className="text-[11px] font-semibold text-amber-900">{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="border rounded-xl bg-slate-50/40 p-3 space-y-1.5 max-h-56 overflow-y-auto font-mono">
            {auditOutput.analysisLogs?.map((entry, idx) => {
              const style = LOG_STYLES[entry.level] || LOG_STYLES.info;
              return (
                <div key={idx} className="flex items-start gap-2 text-[10.5px] leading-relaxed">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${style.dot}`} />
                  <p className={`font-semibold ${style.text}`}>{entry.message}</p>
                </div>
              );
            })}
          </div>

          {/* PHASE 7: TARGET REQUIREMENT CHECKSHEET */}
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide">Target Requirement Checksheet</h4>
              <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400">
                <span className="flex items-center gap-1">{CHECK_MARK.Credited} Credited</span>
                <span className="flex items-center gap-1">{CHECK_MARK.Scheduled} Scheduled</span>
                <span className="flex items-center gap-1">{CHECK_MARK.Bridge} Bridge</span>
                <span className="flex items-center gap-1">{CHECK_MARK.Gap} Gap</span>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {auditOutput.checksheetGroups?.map((group) => (
                <div key={group.yearLevel} className="border rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-700">{group.yearLevel}</span>
                    <span className="text-[10px] font-bold text-slate-500">{group.totalUnits} units</span>
                  </div>
                  {group.semesters.map((semGroup) => (
                    <div key={semGroup.semester}>
                      <div className="bg-slate-50 px-3 py-1 border-y flex justify-between">
                        <span className="text-[9px] font-black uppercase text-slate-400">{semGroup.semester}</span>
                        <span className="text-[9px] font-bold text-slate-400">{semGroup.totalUnits}u</span>
                      </div>
                      {semGroup.courses.map((course, idx) => (
                        <div key={idx} className={`px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] border-b last:border-b-0 ${ROW_TINT[course.status]}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {CHECK_MARK[course.status]}
                            <span className="font-extrabold text-slate-900 shrink-0">{course.code}</span>
                            <span className="text-slate-500 font-semibold truncate">{course.title}</span>
                            {course.creditedFrom && (
                              <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-0.5 shrink-0">
                                <GitBranch size={9} /> {course.creditedFrom}{course.creditSource === 'manual' ? ' (manual)' : ''}
                              </span>
                            )}
                            {course.scheduledIn && (
                              <span className="text-[9px] text-blue-600 font-semibold shrink-0 hidden md:inline">{course.scheduledIn}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${STATUS_BADGE[course.status]}`}>{course.status}</span>
                            <span className="font-mono font-black text-slate-400">{course.units}u</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
            <button type="button" onClick={() => triggerReportModalOpen(evaluationStrategy)} className="border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-xl flex items-center gap-1.5">
              <Printer size={13} /> Preview Checksheet PDF
            </button>
            <button
              type="button"
              onClick={handleFinalizeEvaluationMatrix}
              disabled={isSubmitting || isFinalized || isStale}
              title={
                isFinalized ? 'This evaluation has been finalized and is locked against edits.'
                  : isStale ? 'The transcript changed since this result was produced. Re-run the evaluation first.'
                  : undefined
              }
              className="bg-slate-950 hover:bg-slate-850 text-white px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isSubmitting && <RefreshCw className="animate-spin" size={13} />}
              {isFinalized ? <><Lock size={13} /> Evaluation Locked</>
                : isStale ? 'Re-run Evaluation to Finalize'
                : isSubmitting ? 'Finalizing Pipeline...' : 'Finalize & Record Evaluation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
