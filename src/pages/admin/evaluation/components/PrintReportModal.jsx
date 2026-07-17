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

<<<<<<< HEAD
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
=======
  const data = activeReportData.summary || {};
  const currentTimestamp = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const isReturningReport = activeReportData.type === 'returning' || activeReportData.type === 'RETURNING';
>>>>>>> 49c4c80 (Returnee)

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

<<<<<<< HEAD
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
=======
        {/* Modal Sheet Scroll View (Desktop Screen Render) */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
          
          <div id="transferee-evaluation-reports-wrapper" className="bg-white p-8 max-w-[8.5in] mx-auto text-black shadow-lg rounded-xl">

            {isReturningReport ? (
              /* ================= RETURNING STUDENT (LOA) REPORT ================= */
              <>
                <div className="print-page pt-0 mt-0">

                  {/* Header Letterhead */}
                  <table className="w-full border-collapse" style={{ borderBottom: '3px double #000000', paddingBottom: '12px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '85px', verticalAlign: 'middle', paddingBottom: '12px' }}>
                          <img src={schoolLogo} alt="School Logo" style={{ width: '75px', height: '75px', objectFit: 'contain' }} />
                        </td>
                        <td className="text-left" style={{ paddingLeft: '15px', verticalAlign: 'middle', paddingBottom: '12px' }}>
                          <h1 style={{ fontFamily: 'Arial, sans-serif', fontSize: '18px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>
                            The Last Salle University
                          </h1>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', margin: '2px 0 0 0' }}>
                            Office of the University Registrar
                          </p>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#6b7280', margin: '1px 0 0 0' }}>
                            Brgy. San Jose, Lipa City, Batangas, Philippines
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Title Block */}
                  <div className="text-center" style={{ margin: '15px 0 10px 0' }}>
                    <h2 style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', margin: '0' }}>
                      Returning Student (LOA) Progression Resume Report
                    </h2>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'italic', color: '#374151', margin: '3px 0 0 0' }}>
                      Document Code Reference: OREG-RETURN-LOA-2026
                    </p>
                  </div>

                  {/* Profile Table */}
                  <table className="w-full text-xs" style={{ borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif', margin: '10px 0' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px', width: '25%' }}>Student Name:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000', textTransform: 'uppercase' }}>{activeReportData.name}</td>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px', width: '25%' }}>Student ID No:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>{activeReportData.studentId}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Assigned Curriculum:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>
                          {data.effectiveCurriculum === 'NEW' ? 'New Curriculum' : 'Old Curriculum'}
                          {data.curriculumShifted ? ' (Auto-Shifted from Old Curriculum)' : ''}
                        </td>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Years Inactive:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>{data.yearsSinceLastActive ?? 'N/A'} year(s)</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Overall Eligibility:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>{activeReportData.eligibility}</td>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Evaluation Date:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>{currentTimestamp}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Summary Metrics */}
                  <div style={{ marginTop: '15px' }}>
                    <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px' }}>
                      I. Curriculum Progress Summary
                    </h3>
                    <p className="print-academic-font" style={{ margin: '5px 0 10px 0' }}>
                      Based on the student's recorded academic history and the applicable curriculum track determined above, the current standing is compiled below:
                    </p>
                    <table className="w-full text-center" style={{ borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #d1d5db' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #d1d5db', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                          <th style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>Units Earned</th>
                          <th style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>Units Deficient Remaining</th>
                          <th style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>Total Required Units</th>
                          <th style={{ padding: '5px' }}>Completion Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="print-academic-font-bold" style={{ textAlign: 'center' }}>
                          <td style={{ padding: '5px', borderRight: '1px solid #d1d5db', color: '#059669' }}>{data.unitsEarned || 0} Units</td>
                          <td style={{ padding: '5px', borderRight: '1px solid #d1d5db', color: '#dc2626' }}>{data.unitsRemaining || 0} Units</td>
                          <td style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>{data.totalRequired || 0} Units</td>
                          <td style={{ padding: '5px', color: '#2563eb' }}>{data.completionPercentage}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Previously Taken Subjects Table */}
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px' }}>
                      II. Previously Completed / Credited Subjects
                    </h3>
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '10px', marginTop: '5px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1.5px solid #000000', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                          <th style={{ padding: '5px', width: '20%', borderRight: '1px solid #000000' }}>Subject Code</th>
                          <th style={{ padding: '5px', width: '45%', borderRight: '1px solid #000000' }}>Subject Description Title</th>
                          <th style={{ padding: '5px', width: '15%', borderRight: '1px solid #000000', textAlign: 'center' }}>Units</th>
                          <th style={{ padding: '5px', width: '10%', borderRight: '1px solid #000000', textAlign: 'center' }}>Grade</th>
                          <th style={{ padding: '5px', width: '10%', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.subjectList && data.subjectList.filter(s => ['Completed', 'Credited'].includes(s.status)).length > 0 ? (
                          data.subjectList.filter(s => ['Completed', 'Credited'].includes(s.status)).map((s, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td className="print-academic-font-bold" style={{ padding: '4px 5px', borderRight: '1px solid #e5e7eb' }}>{s.code}</td>
                              <td className="print-academic-font" style={{ padding: '4px 5px', borderRight: '1px solid #e5e7eb' }}>{s.title}</td>
                              <td className="print-academic-font" style={{ padding: '4px 5px', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>{s.units}</td>
                              <td className="print-academic-font-bold" style={{ padding: '4px 5px', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>{s.grade}</td>
                              <td className="print-academic-font-bold" style={{ padding: '4px 5px', textAlign: 'center', color: '#059669' }}>{s.status}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="print-academic-font" style={{ padding: '10px', textAlign: 'center', fontStyle: 'italic', color: '#6b7280' }}>No previously completed subjects recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Page Footer */}
                  <div style={{ marginTop: '50px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af' }}>
                    <span>University Evaluation Report System (OREG-RETURN-LOA-2026)</span>
                    <span>Page 1 of 2</span>
                  </div>

                </div>

                {/* Print separation gap */}
                <div className="print-page-break"></div>

                {/* ================= REPORT PAGE 2: RECOMMENDED STUDY PLAN ================= */}
                <div className="print-page pt-0 mt-0">

                  <div className="text-center" style={{ margin: '0 0 20px 0' }}>
                    <h2 style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', margin: '0' }}>
                      Recommended Course Plan & Graduation Roadmap
                    </h2>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'italic', color: '#374151', margin: '3px 0 0 0' }}>
                      Sequenced Course Load for Returning (LOA) Student Progression
                    </p>
                  </div>

                  {/* Alerts / Deficiencies */}
                  <div>
                    <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px' }}>
                      III. Analysis Logs & Rule Results
                    </h3>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px', minHeight: '40px' }}>
                      {data.alerts && data.alerts.length > 0 ? (
                        <ul style={{ margin: '0', paddingLeft: '15px', color: '#92400e' }} className="print-academic-font-bold">
                          {data.alerts.map((alertText, idx) => (
                            <li key={idx} style={{ padding: '2px 0' }}>{alertText}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="print-academic-font" style={{ fontStyle: 'italic', color: '#4b5563', margin: '0' }}>No outstanding flags detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Recommended Priority Plan — now rendered per labeled term,
                      the same way the transferee roadmap below is rendered,
                      instead of one flat untitled table. */}
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px' }}>
                      IV. Sequential Priority Plan (Recommended Enrollment Load)
                    </h3>
                    <p className="print-academic-font" style={{ margin: '5px 0 10px 0' }}>
                      This recommended load prioritizes not-yet-completed and retakeable subjects, sequenced by year level and semester, within the permitted credit boundary:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {data.recommendedRoadmap && data.recommendedRoadmap.length > 0 ? (
                        data.recommendedRoadmap.slice(0, 3).map((term, index) => (
                          <div key={index} style={{ border: '1px solid #000000', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: '#f3f4f6', padding: '6px', borderBottom: '1px solid #000000', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{term.term}</span>
                              <span>Load: {term.totalUnits} Units</span>
                            </div>
                            <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: '10px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa', color: '#4b5563' }}>
                                  <th style={{ padding: '4px 8px', width: '20%' }}>Course Code</th>
                                  <th style={{ padding: '4px 8px', width: '65%' }}>Course Title Description</th>
                                  <th style={{ padding: '4px 8px', width: '15%', textAlign: 'right' }}>Units</th>
                                </tr>
                              </thead>
                              <tbody>
                                {term.subjects.map((s) => (
                                  <tr key={s.code} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td className="print-academic-font-bold" style={{ padding: '4px 8px' }}>{s.code}</td>
                                    <td className="print-academic-font" style={{ padding: '4px 8px' }}>{s.title}</td>
                                    <td className="print-academic-font-bold" style={{ padding: '4px 8px', textAlign: 'right' }}>{s.units} u</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))
                      ) : (
                        <div style={{ border: '1px solid #000000', borderRadius: '4px', padding: '10px' }}>
                          <p className="print-academic-font" style={{ fontStyle: 'italic', color: '#6b7280', margin: '0', textAlign: 'center' }}>
                            No subjects could be scheduled for the upcoming term.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification & Sign-off Block */}
                  <div style={{ marginTop: '35px' }}>
                    <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '11px', fontWeight: 'bold' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '45%', textAlign: 'left', verticalAlign: 'top' }}>
                            <div style={{ height: '40px' }}></div>
                            <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', width: '220px' }}>
                              <p className="print-academic-font-bold" style={{ margin: '0', textTransform: 'uppercase' }}>
                                Authorized Registrar Officer
                              </p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#4b5563', fontWeight: 'normal' }}>
                                Office of the University Registrar
                              </p>
                            </div>
                          </td>
                          <td style={{ width: '10%' }}></td>
                          <td style={{ width: '45%', textAlign: 'left', verticalAlign: 'top' }}>
                            <div style={{ height: '40px' }}></div>
                            <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', width: '220px' }}>
                              <p className="print-academic-font-bold" style={{ margin: '0', textTransform: 'uppercase' }}>
                                {activeReportData.name}
                              </p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#4b5563', fontWeight: 'normal' }}>
                                Returning Student Acknowledgment
                              </p>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Page Footer */}
                  <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af' }}>
                    <span>University Evaluation Report System (OREG-RETURN-LOA-2026)</span>
                    <span>Page 2 of 2</span>
                  </div>

                </div>
              </>
            ) : (
              /* ================= TRANSFEREE / DEFAULT REPORT (unchanged) ================= */
              <>
                <div className="print-page pt-0 mt-0">
                  
                  {/* Header Letterhead */}
                  <table className="w-full border-collapse" style={{ borderBottom: '3px double #000000', paddingBottom: '12px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '85px', verticalAlign: 'middle', paddingBottom: '12px' }}>
                          <img src={schoolLogo} alt="School Logo" style={{ width: '75px', height: '75px', objectFit: 'contain' }} />
                        </td>
                        <td className="text-left" style={{ paddingLeft: '15px', verticalAlign: 'middle', paddingBottom: '12px' }}>
                          <h1 style={{ fontFamily: 'Arial, sans-serif', fontSize: '18px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>
                            The Last Salle University
                          </h1>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', margin: '2px 0 0 0' }}>
                            Office of the University Registrar
                          </p>
                          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#6b7280', margin: '1px 0 0 0' }}>
                            Brgy. San Jose, Lipa City, Batangas, Philippines
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Title Block */}
                  <div className="text-center" style={{ margin: '15px 0 10px 0' }}>
                    <h2 style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', margin: '0' }}>
                      Transferee Credential Evaluation & Equivalency Audit Report
                    </h2>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'italic', color: '#374151', margin: '3px 0 0 0' }}>
                      Document Code Reference: OREG-TRANS-CREDIT-2026
                    </p>
                  </div>

                  {/* Profile Table using clean academic fonts */}
                  <table className="w-full text-xs" style={{ borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif', margin: '10px 0' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px', width: '25%' }}>Student Name:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000', textTransform: 'uppercase' }}>{activeReportData.name}</td>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px', width: '25%' }}>Student ID No:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>{activeReportData.studentId}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Origin School:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>{activeReportData.prevSchool}</td>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Previous Major:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>{activeReportData.prevProgram}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Assigned Curriculum:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>{activeReportData.curriculum} Framework</td>
                        <td style={{ padding: '5px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Evaluation Date:</td>
                        <td className="print-academic-font-bold" style={{ padding: '5px 0', color: '#000000' }}>{currentTimestamp}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Summary Metrics */}
                  <div style={{ marginTop: '15px' }}>
                    <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px' }}>
                      I. Transfer Credit Summary Checklist
                    </h3>
                    <p className="print-academic-font" style={{ margin: '5px 0 10px 0' }}>
                      Following rigorous document verification under university equivalency guidelines, the student's final credited status is compiled below:
                    </p>
                    <table className="w-full text-center" style={{ borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #d1d5db' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #d1d5db', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                          <th style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>Transferred Total</th>
                          <th style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>Approved Credited</th>
                          <th style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>Rejected Obsolete</th>
                          <th style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>Units Completed</th>
                          <th style={{ padding: '5px' }}>Completion Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="print-academic-font-bold" style={{ textAlign: 'center' }}>
                          <td style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>{(data.creditedList?.length || 0) + (data.obsoleteList?.length || 0)}</td>
                          <td style={{ padding: '5px', borderRight: '1px solid #d1d5db', color: '#059669' }}>{data.creditedList?.length || 0}</td>
                          <td style={{ padding: '5px', borderRight: '1px solid #d1d5db', color: '#dc2626' }}>{data.obsoleteList?.length || 0}</td>
                          <td style={{ padding: '5px', borderRight: '1px solid #d1d5db' }}>{data.unitsEarned || 0} Units</td>
                          <td style={{ padding: '5px', color: '#2563eb' }}>{data.completionPercentage}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Credited Map Details */}
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px' }}>
                      II. Course Equivalency Approvals Table
                    </h3>
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '10px', marginTop: '5px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1.5px solid #000000', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                          <th style={{ padding: '5px', width: '20%', borderRight: '1px solid #000000' }}>Origin Code</th>
                          <th style={{ padding: '5px', width: '45%', borderRight: '1px solid #000000' }}>Subject Description Title</th>
                          <th style={{ padding: '5px', width: '10%', borderRight: '1px solid #000000', textAlign: 'center' }}>Units</th>
                          <th style={{ padding: '5px', width: '10%', borderRight: '1px solid #000000', textAlign: 'center' }}>Grade</th>
                          <th style={{ padding: '5px', width: '15%' }}>BSU Equivalency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.creditedList && data.creditedList.length > 0 ? (
                          data.creditedList.map((cr, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td className="print-academic-font-bold" style={{ padding: '4px 5px', borderRight: '1px solid #e5e7eb' }}>{cr.originalSubject}</td>
                              <td className="print-academic-font" style={{ padding: '4px 5px', borderRight: '1px solid #e5e7eb' }}>{cr.title}</td>
                              <td className="print-academic-font" style={{ padding: '4px 5px', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>{cr.units}</td>
                              <td className="print-academic-font-bold" style={{ padding: '4px 5px', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>{cr.grade}</td>
                              <td className="print-academic-font-bold" style={{ padding: '4px 5px', color: '#2563eb' }}>{cr.code}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="print-academic-font" style={{ padding: '10px', textAlign: 'center', fontStyle: 'italic', color: '#6b7280' }}>No transfer credits applied.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Page Footer */}
                  <div style={{ marginTop: '50px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af' }}>
                    <span>University Evaluation Report System (OREG-TRANS-CREDIT-2026)</span>
                    <span>Page 1 of 2</span>
                  </div>

                </div>

                {/* Print separation gap */}
                <div className="print-page-break"></div>

                {/* ================= REPORT PAGE 2: RECOMMENDED STUDY PLAN ================= */}
                <div className="print-page pt-0 mt-0">
                  
                  <div className="text-center" style={{ margin: '0 0 20px 0' }}>
                    <h2 style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', margin: '0' }}>
                      Recommended Course Plan & Graduation Roadmap
                    </h2>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'italic', color: '#374151', margin: '3px 0 0 0' }}>
                      Patient Sequence Blueprint for Integrated Progressions
                    </p>
                  </div>

                  {/* Prerequisite deficiencies analysis */}
                  <div>
                    <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px' }}>
                      III. Active Prerequisite & Corequisite Deficiencies
                    </h3>
                    <p className="print-academic-font" style={{ margin: '5px 0' }}>
                      The registry has identified the following prerequisite chains that are currently broken or require priority completion:
                    </p>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px', minHeight: '60px' }}>
                      {data.deficiencies && data.deficiencies.length > 0 ? (
                        <ul style={{ margin: '0', paddingLeft: '15px', color: '#991b1b' }} className="print-academic-font-bold">
                          {data.deficiencies.map((def, idx) => (
                            <li key={idx} style={{ padding: '2px 0' }}>{def}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="print-academic-font" style={{ fontStyle: 'italic', color: '#4b5563', margin: '0' }}>No prerequisite chain locks detected. Student is cleared for standard progressions.</p>
                      )}
                    </div>
                  </div>

                  {/* Recommended Semester Course Plan (Roadmap) */}
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px' }}>
                      IV. Multi-Term Academic Enrollment Pathway
                    </h3>
                    <p className="print-academic-font" style={{ margin: '5px 0 10px 0' }}>
                      This recommended pathway prioritize missing prerequisite subjects, filters term schedules based on academic availability, and observes recommended credit-load regulations:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {data.recommendedRoadmap && data.recommendedRoadmap.slice(0, 3).map((term, index) => (
                        <div key={index} style={{ border: '1px solid #000000', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ backgroundColor: '#f3f4f6', padding: '6px', borderBottom: '1px solid #000000', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Schedule: {term.term}</span>
                            <span>Load: {term.totalUnits} Units</span>
                          </div>
                          <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: '10px' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa', color: '#4b5563' }}>
                                <th style={{ padding: '4px 8px', width: '20%' }}>Course Code</th>
                                <th style={{ padding: '4px 8px', width: '65%' }}>Course Title Description</th>
                                <th style={{ padding: '4px 8px', width: '15%', textAlign: 'right' }}>Units</th>
                              </tr>
                            </thead>
                            <tbody>
                              {term.subjects.map(s => (
                                <tr key={s.code} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <td className="print-academic-font-bold" style={{ padding: '4px 8px' }}>{s.code}</td>
                                  <td className="print-academic-font" style={{ padding: '4px 8px' }}>{s.title}</td>
                                  <td className="print-academic-font-bold" style={{ padding: '4px 8px', textAlign: 'right' }}>{s.units} u</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verification & Sign-off Block */}
                  <div style={{ marginTop: '35px' }}>
                    <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '11px', fontWeight: 'bold' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '45%', textAlign: 'left', verticalAlign: 'top' }}>
                            <div style={{ height: '40px' }}></div>
                            <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', width: '220px' }}>
                              <p className="print-academic-font-bold" style={{ margin: '0', textTransform: 'uppercase' }}>
                                Authorized Registrar Officer
                              </p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#4b5563', fontWeight: 'normal' }}>
                                Office of the University Registrar
                              </p>
                            </div>
                          </td>
                          <td style={{ width: '10%' }}></td>
                          <td style={{ width: '45%', textAlign: 'left', verticalAlign: 'top' }}>
                            <div style={{ height: '40px' }}></div>
                            <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', width: '220px' }}>
                              <p className="print-academic-font-bold" style={{ margin: '0', textTransform: 'uppercase' }}>
                                {activeReportData.name}
                              </p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#4b5563', fontWeight: 'normal' }}>
                                Transferee Candidate Acknowledgment
                              </p>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Page Footer */}
                  <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af' }}>
                    <span>University Evaluation Report System (OREG-TRANS-CREDIT-2026)</span>
                    <span>Page 2 of 2</span>
                  </div>

                </div>
              </>
            )}
>>>>>>> 49c4c80 (Returnee)

          </div>
        </div>
      </div>
    </div>
  );
}