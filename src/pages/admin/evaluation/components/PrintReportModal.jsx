import React from 'react';
import { Printer, FileText, Calendar, AlertTriangle, CheckCircle2, Star, Layers } from 'lucide-react';
import universitySeal from '../../../../assets/logo/logo.png';

export default function PrintReportModal({
  isReportModalOpen,
  activeReportData,
  setIsReportModalOpen,
  prevSchoolName
}) {
  if (!isReportModalOpen || !activeReportData) return null;

  const {
    name,
    studentId,
    timestamp,
    summary = {},
    program = "BSIT",
    assignedStanding = "First Year (2nd Semester)",
    profileTrack = "NEW CURRICULUM"
  } = activeReportData;

  const simulatedTimeline = summary?.cascadedPlanTimeline || [];
  const deficiencies = summary?.deficiencies || [];
  const hasDeficiencies = deficiencies.length > 0;
  const isOldCurriculum = String(profileTrack || "").toUpperCase().includes("OLD");

  // I-filter at ihiwalay ang Year 3 electives para sa Old Curriculum
  const isolatedTrackElectives = [];
  const cleanedTimeline = simulatedTimeline.map(termBlock => {
    const remainingSubjects = [];
    termBlock.subjects?.forEach(s => {
      const isYear3 = parseInt(s.year, 10) === 3 || termBlock.termLabel.includes("Year 3");
      const isElective = String(s.category || s.title).toLowerCase().includes("elective") || String(s.code).includes("EL");

      if (isYear3 && isOldCurriculum && isElective) {
        isolatedTrackElectives.push({
          ...s,
          assignedTerm: termBlock.termLabel || termBlock.term
        });
      } else {
        remainingSubjects.push(s);
      }
    });

    return {
      ...termBlock,
      subjects: remainingSubjects,
      totalUnits: remainingSubjects.reduce((acc, current) => acc + current.units, 0)
    };
  });

  const getStatusIndicator = (courseCode) => {
    const cleanTarget = String(courseCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();

    const isDeficient = deficiencies.some(def => {
      const defStr = String(def?.code || def || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return defStr.includes(cleanTarget);
    });
    if (isDeficient) {
      return { label: "❌ FAILED / BACKLOG", className: "text-red-600 bg-red-50 border-red-200" };
    }

    const isCredited = summary?.creditedList?.some(c =>
      String(c?.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanTarget
    );
    if (isCredited) {
      return { label: "🟢 PASSED (Credited)", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }

    return { label: "🟡 PENDING / READY", className: "text-amber-600 bg-amber-50 border-amber-200" };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-200 rounded-3xl shadow-2xl w-full max-w-[850px] my-8 overflow-hidden flex flex-col print:shadow-none print:my-0 print:rounded-none">

        {/* Header Controls */}
        <div className="bg-slate-900 text-white p-4 px-6 flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-blue-400" />
            <span className="text-xs font-black uppercase tracking-wider">Grouped Curriculum Sequence Plan</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all">
              <Printer size={14} /> Print Audit Sheet
            </button>
            <button onClick={() => setIsReportModalOpen(false)} className="bg-slate-800 hover:bg-slate-750 text-slate-400 px-3 py-2 rounded-xl text-xs font-bold transition-all">Close</button>
          </div>
        </div>

        {/* Workspace Canvas Container */}
        <div className="flex-1 overflow-y-auto p-12 bg-white printable-area max-h-[75vh] print:max-h-none print:p-0">
          <div className="space-y-6 max-w-[700px] mx-auto text-left text-xs text-slate-800 font-medium">

            {/* Header Identity Block */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <h2 className="text-lg font-serif font-black tracking-tight text-slate-900">THE LAST SALLE UNIVERSITY</h2>
                <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Office of the University Registrar | Curriculum Evaluation Audit</p>
                <p className="text-[9px] text-slate-500 font-mono">Date and Time Evaluated: {timestamp}</p>
              </div>
              <img src={universitySeal} alt="Seal" className="w-12 h-12 shrink-0 p-1 border rounded" />
            </div>

            {/* Profile Table Registry */}
            <table className="w-full border border-slate-300 text-[11px]">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-2.5 bg-slate-50 font-black uppercase text-[9px] text-slate-500 border-r border-slate-300 w-[25%]">Student Name</td>
                  <td className="p-2.5 font-bold text-slate-900 w-[25%]">{name}</td>
                  <td className="p-2.5 bg-slate-50 font-black uppercase text-[9px] text-slate-500 border-r border-slate-300 border-l w-[25%]">SR-Code / ID</td>
                  <td className="p-2.5 font-mono font-bold text-slate-900 w-[25%]">{studentId}</td>
                </tr>
                <tr>
                  <td className="p-2.5 bg-slate-50 font-black uppercase text-[9px] text-slate-500 border-r border-slate-300">Previous School</td>
                  <td className="p-2.5 text-slate-700 font-semibold">{prevSchoolName || 'Aparri State College'}</td>
                  <td className="p-2.5 bg-slate-50 font-black uppercase text-[9px] text-slate-500 border-r border-slate-300 border-l">Evaluation Track</td>
                  <td className="p-2.5 font-black text-slate-900 uppercase">{program} - {profileTrack} ({assignedStanding})</td>
                </tr>
              </tbody>
            </table>

            {/* Section I: Transferred Credits */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">I. Approved Transfer Credits Registry</h3>
              <table className="w-full border border-slate-300 text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300 text-[8px] font-black text-slate-500 uppercase">
                    <th className="p-2 pl-3 border-r border-slate-300 w-[25%]">External Code</th>
                    <th className="p-2 border-r border-slate-300 w-[50%]">TLSU Equivalent Course Title</th>
                    <th className="p-2 text-center border-r border-slate-300 w-[13%]">Grade</th>
                    <th className="p-2 text-center w-[12%]">Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  {summary?.creditedList && summary.creditedList.length > 0 ? (
                    summary.creditedList.map((sub, idx) => (
                      <tr key={idx}>
                        <td className="p-2 pl-3 font-mono font-semibold border-r border-slate-200">{sub.originalSubject}</td>
                        <td className="p-2 border-r border-slate-200"><span className="font-bold">{sub.code}</span> - {sub.title}</td>
                        <td className="p-2 text-center font-mono font-bold border-r border-slate-200">{sub.grade}</td>
                        <td className="p-2 text-center font-mono">{sub.units} u</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="p-4 text-center italic text-slate-400">No transfer credits credited.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section II: Deficiency Block */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">II. Registrar Deficiency &amp; Gatekeeper Audit</h3>
              {hasDeficiencies ? (
                <div className="border-l-4 border-red-600 bg-red-50/45 p-3 rounded-r-lg">
                  <span className="text-[9px] font-black text-red-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <AlertTriangle size={13} /> Active Core Deficiencies / Backlogs Detected
                  </span>
                  <div className="text-xs font-semibold text-slate-900 font-mono space-y-1">
                    {deficiencies.map((def, idx) => (
                      <p key={idx} className="text-red-700 font-bold">{def?.code || def}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-l-4 border-emerald-600 bg-emerald-50/45 p-3 rounded-r-lg flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                  <span className="text-xs font-bold text-emerald-800 font-mono">CLEARED: No active deficiency blockers. Student is cleared for progression.</span>
                </div>
              )}
            </div>

            {/* DYNAMIC TRACK ISOLATION MATRIX TABLE (TABLE B) */}
            {isOldCurriculum && isolatedTrackElectives.length > 0 && (
              <div className="space-y-2 p-4 bg-amber-50/40 border border-amber-200 rounded-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Star size={14} className="text-amber-600" />
                  III. Year 3 Track Electives Selection Matrix (Old Curriculum Framework)
                </h3>
                <table className="w-full text-left text-[11px] border-collapse bg-white border border-amber-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-amber-100/50 text-[8px] font-black text-amber-900 uppercase border-b border-amber-200">
                      <th className="p-2 pl-3 w-[20%]">Elective Code</th>
                      <th className="p-2 w-[50%]">Required Elective Allocation Track Options</th>
                      <th className="p-2 text-center w-[12%]">Units</th>
                      <th className="p-2 w-[18%]">Target Term</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 font-semibold text-slate-700">
                    {isolatedTrackElectives.map((el, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 pl-3 font-mono font-bold text-amber-950">{el.code}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-slate-900 block">{el.title}</span>
                          <span className="text-[8.5px] text-blue-700 font-black uppercase tracking-wider block mt-0.5">
                            Specializations: {el.track || "Network Administration / Business Analytics / Software Systems"}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono">{el.units} u</td>
                        <td className="p-2.5 font-mono text-slate-500 text-[9px]">{el.assignedTerm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section III: DYNAMIC SIMULATED PATHWAY (Automated Cascade Timeline) */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                IV. Chronological Study Plan (Grouped Term Schedule View)
              </h3>
              {cleanedTimeline.some(term => term.subjects.length > 0) ? (
                cleanedTimeline.map((termBlock, tIdx) => {
                  if (termBlock.subjects.length === 0) return null;
                  return (
                    <div key={tIdx} className="border border-slate-300 rounded overflow-hidden bg-white print:break-inside-avoid">

                      {/* Semester Title Card Header */}
                      <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-300 flex justify-between items-center text-[10px] font-black text-slate-800">
                        <span className="flex items-center gap-1"><Calendar size={11} className="text-slate-400" /> {termBlock.termLabel || termBlock.term}</span>
                        <span className="font-mono text-slate-600">{termBlock.totalUnits} UNITS PRESCRIBED</span>
                      </div>

                      {/* Table Render Loop */}
                      <table className="w-full text-left text-[11px] table-fixed">
                        <thead>
                          <tr className="bg-slate-50/40 border-b border-slate-200 text-[8px] font-black text-slate-400 uppercase">
                            <th className="p-2 pl-3 w-[20%]">Course Code</th>
                            <th className="p-2 w-[50%]">Course Descriptive Title</th>
                            <th className="p-2 text-center w-[12%]">Units</th>
                            <th className="p-2 text-center w-[18%]">Academic Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                          {termBlock.subjects?.map((s, sIdx) => {
                            const indicator = getStatusIndicator(s.code);
                            return (
                              <tr key={sIdx}>
                                <td className="p-2 pl-3 font-mono font-bold text-slate-900">{s.code}</td>
                                <td className="p-2">
                                  <span className="font-semibold block">{s.title}</span>
                                </td>
                                <td className="p-2 text-center font-mono font-semibold text-slate-600">{s.units} u</td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-mono border inline-block w-full text-center ${indicator.className}`}>
                                    {indicator.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center border border-dashed rounded text-slate-400 italic">No curriculum pathway simulation could be initialized.</div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-12 flex justify-between items-end text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <p className="italic font-medium text-[8px] normal-case tracking-normal text-slate-400/80 max-w-[220px]">* Generated directly from Registrar Student System Audit Module.</p>
              <div className="text-center w-48 border-t border-slate-400 pt-1.5 text-slate-700">
                <p className="font-black text-[10px]">Office of the Registrar</p>
                <p className="font-semibold text-slate-400 text-[8px]">Academic Audit Section</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}