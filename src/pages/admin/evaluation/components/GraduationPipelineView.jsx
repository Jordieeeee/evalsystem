import React, { useState } from 'react';
import { 
  CheckCircle2, ShieldAlert, ClipboardList, ChevronDown, ChevronRight 
} from 'lucide-react';
import { normalizeYear, normalizeSemester } from '../../../../services/curriculumConfig';

// Import the official school logo dynamically from your assets directory
import schoolLogo from '../../../../assets/logo/logo.png';

export default function GraduationPipelineView({ 
  selectedStudentData, 
  auditOutput, 
  newSubjectsCatalog, 
  oldSubjectsCatalog, 
  studentSubjectsHistory, 
  handleFinalizeEvaluationMatrix, 
  isSubmitting,
  effectiveCurriculum
}) {
  const [expandedYear, setExpandedYear] = useState(null);

  if (!auditOutput) return null;

  const totalCompleted = auditOutput.completed?.length || 0;
  const totalCredited = auditOutput.creditedList?.length || 0;
  const totalRemaining = auditOutput.missingSubjects?.length || 0;

  const toggleYearAccordion = (year) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  // =========================================================================
  // DYNAMIC ACADEMIC STUDY & REMEDIATION PLAN GENERATOR
  // =========================================================================
 const generateRemediationPlan = () => {
    const missingSubjects = auditOutput.missingSubjects || [];
    const activeCatalog = (effectiveCurriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog) || [];
    const maxUnitsPerTerm = selectedStudentData?.maxAllowedUnits || 21;

    const detailedMissing = missingSubjects.map(miss => {
      const targetCode = String(miss.courseCode || miss.code || '').toUpperCase().trim();
      const catalogMatch = activeCatalog.find(c => String(c.courseCode || c.code || c.id || '').toUpperCase().trim() === targetCode);
      const historyRecord = studentSubjectsHistory.find(h => String(h.subjectCode).toUpperCase().trim() === targetCode);

      return {
        courseCode: targetCode,
        courseTitle: catalogMatch?.courseTitle || miss.courseTitle || miss.title || 'Required Subject Block',
        creditUnits: Number(catalogMatch?.creditUnits || miss.creditUnits || 3),
        semestersOffered: (Array.isArray(catalogMatch?.semesterOffered) ? catalogMatch.semesterOffered : (catalogMatch?.semesterOffered ? [catalogMatch.semesterOffered] : ['First Semester'])),
        yearLevel: catalogMatch?.yearLevel || miss.yearLevel || null,
        historicalGrade: historyRecord?.grade || null,
        historicalStatus: historyRecord?.status || null
      };
    });

    // Sort by catalog year level first, so earlier-year deficiencies get
    // scheduled before later-year ones instead of an arbitrary catalog order.
    const sortedMissing = [...detailedMissing].sort((a, b) => {
      const yearA = normalizeYear(a.yearLevel) || '99';
      const yearB = normalizeYear(b.yearLevel) || '99';
      return String(yearA).localeCompare(String(yearB));
    });

    // Calculate starting academic year
    const currentYearStr = selectedStudentData.academicYear || '2025-2026';
    let cursorYear = parseInt(currentYearStr.split('-')[0], 10) + 1;
    let termIndex = 0; // 0 = 1st Sem, 1 = 2nd Sem, 2 = Summer
    const TERM_LABELS = ['First Semester', 'Second Semester', 'Summer Term'];

    const slots = {}; // ordered map: "Term Label, A.Y. YYYY-YYYY" -> array of courses
    let remaining = [...sortedMissing];
    let safetyGuard = 0;
    const maxIterations = remaining.length * 3 + 10;

    const advanceTerm = () => {
      termIndex++;
      if (termIndex >= TERM_LABELS.length) {
        termIndex = 0;
        cursorYear++;
      }
    };

    while (remaining.length > 0 && safetyGuard < maxIterations) {
      safetyGuard++;
      const acadYear = `${cursorYear}-${cursorYear + 1}`;
      const termLabel = TERM_LABELS[termIndex];
      const slotKey = `${termLabel}, A.Y. ${acadYear}`;

      const normalizedTermKey = termIndex === 0 ? '1st' : termIndex === 1 ? '2nd' : 'summer';

      // Subjects offered in this specific term (or with no offering data, treated as flexible)
      const eligible = remaining.filter(course => {
        const offered = (course.semestersOffered || []).map(s => normalizeSemester(s));
        return offered.length === 0 || offered.includes(normalizedTermKey);
      });

      let bucketUnits = 0;
      const bucketItems = [];
      eligible.forEach(course => {
        if (bucketUnits + course.creditUnits <= maxUnitsPerTerm) {
          bucketItems.push(course);
          bucketUnits += course.creditUnits;
        }
      });

      if (bucketItems.length > 0) {
        slots[slotKey] = bucketItems;
        remaining = remaining.filter(c => !bucketItems.includes(c));
      }

      advanceTerm();
    }

    return { slots };
  };

  const remediation = generateRemediationPlan();

  const handlePrintAction = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left relative">
      
      {/* REGISTRAR PRINT OPTIMIZATIONS */}
      <style>{`
        @media print {
          /* Reset root layout coordinates to ensure zero top whitespace */
          html, body, #root, #root > div, main, aside, article, section {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            top: 0 !important;
          }

          /* Hide dashboard headers, sidebar, buttons and layout UI elements */
          body * {
            visibility: hidden;
          }
          
          /* Force display our isolated printing area at the exact top left */
          #graduation-print-area, #graduation-print-area * {
            visibility: visible !important;
          }

          #graduation-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            overflow: visible !important;
          }

          /* Ensure page blocks flow naturally as traditional documents */
          .print-page {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Force page break only on our explicit layout splits */
          .print-page-break {
            page-break-before: always !important;
            break-before: always !important;
            display: block !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }

          /* Align tabular content cleanly across standard printers */
          #graduation-print-area table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          #graduation-print-area tr { 
            display: table-row !important;
          }
          #graduation-print-area td, #graduation-print-area th { 
            display: table-cell !important; 
          }

          /* Apply Times New Roman 12pt specifically for printed document texts */
          .print-academic-font {
            font-family: "Times New Roman", Times, Georgia, serif !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }

          .print-academic-font-bold {
            font-family: "Times New Roman", Times, Georgia, serif !important;
            font-size: 12pt !important;
            font-weight: bold !important;
          }

          .no-print {
            display: none !important;
          }

          /* Philippine standard Long Bond Paper portrait settings */
          @page {
            size: 8.5in 13in portrait;
            margin: 0.5in;
          }
        }
      `}</style>

      {/* ================= SCREEN VIEW (DASHBOARD COMPONENT INTERFACE) ================= */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600 shadow-xs">
        <div className="space-y-0.5">
          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Student ID Reference</span>
          <span className="text-slate-900 font-black text-sm font-mono">{selectedStudentData.id}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Full Academic Name</span>
          <span className="text-slate-900 font-black text-sm uppercase">{selectedStudentData.lastName}, {selectedStudentData.firstName}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Degree Program & Track</span>
          <span className="text-slate-900 font-extrabold text-sm">{selectedStudentData.program || 'BSIT'} {selectedStudentData.track ? `(${selectedStudentData.track})` : ''}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Curriculum Version Model</span>
          <span className="text-slate-900 font-extrabold text-sm font-mono">{selectedStudentData.curriculum || 'NEW'} Framework</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Current Year Level</span>
          <span className="text-slate-900 font-bold">Level {selectedStudentData.yearLevel || '4'}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Active Academic Year</span>
          <span className="text-slate-900 font-bold">{selectedStudentData.academicYear || '2026-2027'}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Enrollment Student Status</span>
          <span className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded-md uppercase font-black inline-block mt-0.5">{selectedStudentData.status || 'Active'}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Admission Type Pipeline</span>
          <span className="bg-slate-200 text-slate-800 text-[10px] px-2 py-0.5 rounded-md uppercase font-black inline-block mt-0.5">{selectedStudentData.admissionType || 'Grad Candidate'}</span>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
        auditOutput.overallEligibility === 'ELIGIBLE FOR GRADUATION'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
          : 'bg-rose-50 border-rose-200 text-rose-950'
      }`}>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">Graduation Decision Node finding</span>
          <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            {auditOutput.overallEligibility === 'ELIGIBLE FOR GRADUATION' ? (
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0"/>
            ) : (
              <ShieldAlert size={24} className="text-rose-600 shrink-0"/>
            )}
            {auditOutput.overallEligibility}
          </h2>
          <p className="text-xs font-bold mt-1 text-slate-700 leading-relaxed">
            {auditOutput.decisionExplanation}
          </p>
        </div>
      </div>

      {/* PROGRESS HUD SCORECARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
        <div className="bg-white border p-3.5 rounded-xl shadow-2xs">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wide">Completion Rate</p>
          <p className="text-xl font-black text-blue-600 mt-1">{auditOutput.completionPercentage}%</p>
        </div>
        <div className="bg-white border p-3.5 rounded-xl shadow-2xs">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wide">Completed Courses</p>
          <p className="text-xl font-black text-emerald-600 mt-1">{totalCompleted}</p>
        </div>
        <div className="bg-white border p-3.5 rounded-xl shadow-2xs">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wide">Credited Units</p>
          <p className="text-xl font-black text-purple-600 mt-1">{totalCredited}</p>
        </div>
        <div className="bg-white border p-3.5 rounded-xl shadow-2xs">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wide">Remaining Courses</p>
          <p className="text-xl font-black text-rose-600 mt-1">{totalRemaining}</p>
        </div>
        <div className="bg-white border p-3.5 rounded-xl shadow-2xs">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wide">Earned Units</p>
          <p className="text-xl font-black text-slate-900 mt-1">{auditOutput.unitsEarned || 0}</p>
        </div>
        <div className="bg-white border p-3.5 rounded-xl shadow-2xs">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wide">Required Units</p>
          <p className="text-xl font-black text-slate-900 mt-1">{auditOutput.unitsRequired || 0}</p>
        </div>
        <div className="bg-white border p-3.5 rounded-xl shadow-2xs">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wide">Remaining Units</p>
          <p className="text-xl font-black text-rose-600 mt-1">{auditOutput.unitsRemaining || 0}</p>
        </div>
      </div>

      {/* CURRICULUM CHECKLIST */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b pb-2 flex items-center gap-1.5">
          <ClipboardList size={16} className="text-slate-500" /> Curriculum Structured Clearance Ledger
        </h3>
        
        {['1', '2', '3', '4'].map(year => (
          <div key={year} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div 
              onClick={() => toggleYearAccordion(year)}
              className="bg-slate-50/70 p-4 font-black text-xs text-slate-700 uppercase tracking-wider flex justify-between items-center cursor-pointer hover:bg-slate-100/50 transition select-none"
            >
              <span>Year Level Standard: Year {year}</span>
              {expandedYear === year ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            </div>

            {expandedYear === year && (
              <div className="p-4 bg-slate-50/20 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                {['1st Semester', '2nd Semester', 'Summer'].map(semester => {
                  const catalog = selectedStudentData.curriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog;
                  
                  const semesterCatalog = catalog.filter(course => {
                    const mappedYear = normalizeYear(course.yearLevel);
                    const semestersList = Array.isArray(course.semesterOffered) 
                      ? course.semesterOffered 
                      : [course.semesterOffered];

                    const normalizedOffers = semestersList.map(s => normalizeSemester(s));
                    const normalizedTargetSem = normalizeSemester(semester);

                    return mappedYear === year && normalizedOffers.includes(normalizedTargetSem);
                  });

                  if (semesterCatalog.length === 0) return null;

                  return (
                    <div key={semester} className="bg-white border rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-slate-100/70 p-2.5 border-b text-[11px] font-black text-slate-800 uppercase tracking-wide">
                        {semester}
                      </div>
                      <div className="divide-y text-[11px] font-semibold">
                        {semesterCatalog.map(course => {
                          const codeClean = (course.courseCode || course.code || '').toUpperCase();
                          const historyItem = studentSubjectsHistory.find(s => s.subjectCode === codeClean);
                          
                          let statusLabel = "Not Taken";
                          let statusColor = "text-slate-400 bg-slate-100 border-slate-200";

                          if (historyItem) {
                            if (historyItem.status === 'passed' || (parseFloat(historyItem.grade) >= 1.0 && parseFloat(historyItem.grade) <= 3.0)) {
                              statusLabel = "Completed";
                              statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                            } else if (historyItem.status === 'credited') {
                              statusLabel = "Credited";
                              statusColor = "text-blue-700 bg-blue-50 border-blue-200";
                            } else if (historyItem.status === 'in progress') {
                              statusLabel = "In Progress";
                              statusColor = "text-purple-700 bg-purple-50 border-purple-200";
                            } else if (historyItem.status === 'incomplete' || historyItem.grade === 'INC') {
                              statusLabel = "Incomplete";
                              statusColor = "text-amber-700 bg-amber-50 border-amber-200";
                            } else if (historyItem.status === 'failed' || historyItem.grade === '5.0') {
                              statusLabel = "Failed";
                              statusColor = "text-rose-700 bg-rose-50 border-rose-200";
                            }
                          }

                          return (
                            <div key={codeClean} className="p-2.5 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                              <div className="max-w-[70%] text-left">
                                <p className="font-bold text-slate-900 font-mono text-[11px]">{codeClean}</p>
                                <p className="text-slate-400 text-[10px] truncate font-medium">{course.courseTitle || course.title}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* DASHBOARD ACTION BOTTOM MENU */}
      <div className="flex flex-wrap justify-end gap-2 border-t pt-4 text-xs font-bold no-print">
        <button 
          type="button" 
          onClick={handlePrintAction} 
          className="border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-3xs"
        >
          Print Graduation Report
        </button>
        <button 
          type="button" 
          onClick={handleFinalizeEvaluationMatrix} 
          disabled={isSubmitting} 
          className="bg-slate-950 hover:bg-slate-850 text-white px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
        >
          {isSubmitting ? "Processing Matrix..." : "Save Graduation Audit"}
        </button>
      </div>

      {/* =========================================================================
          HIGH-FIDELITY TWO-PAGE OFFICIAL REGISTRAR REPORT PRINT CONTAINER
          ========================================================================= */}
      <div id="graduation-print-area" className="hidden print:block text-black bg-white">
        
        {/* ================= PAGE 1: AUDIT & GAPS ================= */}
        <div className="print-page pt-0 mt-0">
          
          {/* Header Letterhead */}
          <table className="w-full border-collapse" style={{ borderBottom: '3px double #000000', paddingBottom: '12px' }}>
            <tbody>
              <tr>
                <td style={{ width: '85px', verticalAlign: 'middle', paddingBottom: '12px' }}>
                  <img 
                    src={schoolLogo} 
                    alt="School Logo" 
                    style={{ width: '75px', height: '75px', objectFit: 'contain' }}
                  />
                </td>
                <td className="text-left" style={{ paddingLeft: '15px', verticalAlign: 'middle', paddingBottom: '12px' }}>
                  <h1 style={{ fontFamily: 'Arial, sans-serif', fontSize: '18px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    The Last Salle University
                  </h1>
                  <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', margin: '2px 0 0 0', letterSpacing: '1px' }}>
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
            <h2 style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#991b1b', margin: '0' }}>
              Official Evaluation of Graduation Gaps & Deficiencies
            </h2>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', fontStyle: 'italic', color: '#374151', margin: '3px 0 0 0' }}>
              Form Document Ref: OREG-GRAD-EV-2026
            </p>
          </div>

          {/* Student Matrix Info Grid - Applied Times New Roman 12pt on standard data cells */}
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif', margin: '10px 0' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px', width: '20%' }}>Student Name:</td>
                <td className="print-academic-font-bold" style={{ padding: '6px 0', color: '#000000', textTransform: 'uppercase', width: '30%' }}>{selectedStudentData.lastName}, {selectedStudentData.firstName}</td>
                <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px', width: '20%' }}>Student ID No:</td>
                <td className="print-academic-font-bold" style={{ padding: '6px 0', color: '#000000', width: '30%' }}>{selectedStudentData.id}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Degree Program:</td>
                <td className="print-academic-font-bold" style={{ padding: '6px 0', color: '#000000' }}>{selectedStudentData.program || 'BSIT'} {selectedStudentData.track ? `(${selectedStudentData.track})` : ''}</td>
                <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Curriculum Base:</td>
                <td className="print-academic-font-bold" style={{ padding: '6px 0', color: '#000000' }}>{selectedStudentData.curriculum || 'OLD'} Code Matrix</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Evaluation Date:</td>
                <td className="print-academic-font-bold" style={{ padding: '6px 0', color: '#000000' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                <td style={{ padding: '6px 0', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', fontSize: '9px' }}>Eligibility Status:</td>
                <td className="print-academic-font-bold" style={{ padding: '6px 0', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{auditOutput.overallEligibility}</td>
              </tr>
            </tbody>
          </table>

          {/* SECTION I - Modified to standard Times New Roman 12pt paragraph */}
          <div style={{ marginTop: '15px' }}>
            <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px', marginBottom: '6px' }}>
              I. Academic Progress Assessment Summary
            </h3>
            <p className="print-academic-font" style={{ textAlign: 'justify', margin: '0 0 10px 0' }}>
              An exhaustive review of the student's academic transcript and enrollment history was executed. The Office of the Registrar confirms that the candidate does not currently meet standard qualification criteria for graduation due to outstanding course deficiencies detailed below.
            </p>
            
            <table className="w-full text-center" style={{ borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif', fontSize: '10px', marginTop: '5px', border: '1px solid #d1d5db' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #d1d5db' }}>
                  <th style={{ padding: '6px', fontWeight: 'bold', borderRight: '1px solid #d1d5db' }}>Completion Rate</th>
                  <th style={{ padding: '6px', fontWeight: 'bold', borderRight: '1px solid #d1d5db' }}>Units Earned</th>
                  <th style={{ padding: '6px', fontWeight: 'bold', borderRight: '1px solid #d1d5db' }}>Deficient Units</th>
                  <th style={{ padding: '6px', fontWeight: 'bold' }}>Unresolved Courses</th>
                </tr>
              </thead>
              <tbody>
                <tr className="print-academic-font-bold" style={{ textAlign: 'center' }}>
                  <td style={{ padding: '6px', borderRight: '1px solid #d1d5db' }}>{auditOutput.completionPercentage}%</td>
                  <td style={{ padding: '6px', borderRight: '1px solid #d1d5db' }}>{auditOutput.unitsEarned || 0} / {auditOutput.unitsRequired || 0}</td>
                  <td style={{ padding: '6px', borderRight: '1px solid #d1d5db', color: '#b91c1c' }}>{auditOutput.unitsRemaining || 0} Units</td>
                  <td style={{ padding: '6px', color: '#b91c1c' }}>{totalRemaining} Blocks</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION II - Applied Times New Roman 12pt for course list layout text */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px', marginBottom: '6px' }}>
              II. Unresolved Course Deficiencies and Academic Gaps
            </h3>
            <p className="print-academic-font" style={{ fontStyle: 'italic', color: '#374151', margin: '0 0 6px 0' }}>
              The student must successfully resolve or pass the following target curriculum modules to satisfy program exit rules:
            </p>
            
            <table className="w-full text-left" style={{ borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1.5px solid #000000' }}>
                  <th style={{ padding: '6px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', borderRight: '1px solid #000000', width: '25%' }}>Requirement Type</th>
                  <th style={{ padding: '6px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>Description of Deficiency / Mapped Course Target</th>
                </tr>
              </thead>
              <tbody>
                {auditOutput.deficiencies && auditOutput.deficiencies.length > 0 ? (
                  auditOutput.deficiencies.map((def, idx) => {
                    const cleanDef = String(def).replace('•', '').trim();
                    const parts = cleanDef.split(':');
                    const label = parts.length > 1 ? parts[0] : "Academic Gap";
                    const desc = parts.length > 1 ? parts.slice(1).join(':') : cleanDef;

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '6px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', borderRight: '1px solid #000000', color: '#991b1b', textTransform: 'uppercase', fontSize: '9px' }}>
                          {label}
                        </td>
                        <td className="print-academic-font" style={{ padding: '6px', color: '#111827' }}>
                          {desc}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="2" className="print-academic-font" style={{ padding: '10px', textAlign: 'center', fontStyle: 'italic', color: '#6b7280' }}>
                      No core deficiencies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer for Page 1 */}
          <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af' }}>
            <span>Evaluation of Graduation Gaps (OREG-GRAD-EV-2026)</span>
            <span>Page 1 of 2</span>
          </div>
        </div>

        {/* Dynamic clean page break */}
        <div className="print-page-break"></div>

        {/* ================= PAGE 2: REMEDIATION & SIGNATURES ================= */}
        <div className="print-page pt-0 mt-0">
          
          {/* SECTION III - Applied Times New Roman 12pt to main text body */}
          <div>
            <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px', marginBottom: '6px' }}>
              III. Official Academic Remediation Enlistment Plan
            </h3>
            <p className="print-academic-font" style={{ textAlign: 'justify', margin: '0 0 10px 0' }}>
              The scheduling ledger has analyzed the student's program requirements alongside local semester offerings. To progress toward graduation, the candidate is directed to register for and pass the following courses in the designated semesters:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(remediation.slots).map(([termKey, courses]) => {
                if (courses.length === 0) return null;

                return (
                  <div key={termKey} style={{ border: '1px solid #000000', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#f3f4f6', padding: '6px 8px', borderBottom: '1px solid #000000', fontFamily: 'Arial, sans-serif', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📅 Schedule Slot: {termKey}
                    </div>
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e5e7eb', fontSize: '9px', textTransform: 'uppercase', color: '#4b5563', fontFamily: 'Arial, sans-serif' }}>
                          <th style={{ padding: '5px 8px', borderRight: '1px solid #e5e7eb', width: '20%' }}>Course Code</th>
                          <th style={{ padding: '5px 8px', borderRight: '1px solid #e5e7eb', width: '45%' }}>Course Title Description</th>
                          <th style={{ padding: '5px 8px', borderRight: '1px solid #e5e7eb', textAlign: 'center', width: '10%' }}>Units</th>
                          <th style={{ padding: '5px 8px', textAlign: 'right', width: '25%' }}>Prior Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map(course => (
                          <tr key={course.courseCode} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td className="print-academic-font-bold" style={{ padding: '5px 8px', borderRight: '1px solid #e5e7eb' }}>{course.courseCode}</td>
                            <td className="print-academic-font" style={{ padding: '5px 8px', borderRight: '1px solid #e5e7eb', color: '#1f2937' }}>{course.courseTitle}</td>
                            <td className="print-academic-font-bold" style={{ padding: '5px 8px', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>{course.creditUnits} u</td>
                            <td className="print-academic-font-bold" style={{ padding: '5px 8px', textAlign: 'right', color: '#991b1b' }}>
                              {course.historicalGrade ? (
                                <span>Grade: {course.historicalGrade} ({course.historicalStatus})</span>
                              ) : (
                                <span style={{ color: '#6b7280', fontStyle: 'italic', fontWeight: 'normal' }}>Never Taken</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION IV - Applied Times New Roman 12pt for validation sign-off */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '3px', marginBottom: '8px' }}>
              IV. Verification & Sign-off Matrix
            </h3>
            <p className="print-academic-font" style={{ textAlign: 'justify', margin: '0 0 20px 0' }}>
              We hereby certify that the courses registered above accurately represent the complete academic audit pathway required to resolve outstanding deficiencies for graduation qualification.
            </p>
            <table className="w-full" style={{ borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif', fontSize: '11px', fontWeight: 'bold' }}>
              <tbody>
                <tr>
                  <td style={{ width: '45%', textAlign: 'left', verticalAlign: 'top' }}>
                    <div style={{ height: '40px' }}></div>
                    <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', width: '220px' }}>
                      <p className="print-academic-font-bold" style={{ margin: '0', textTransform: 'uppercase' }}>
                        {selectedStudentData.firstName} {selectedStudentData.lastName}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#4b5563', fontWeight: 'normal' }}>
                        Candidate / Student Signature
                      </p>
                    </div>
                  </td>
                  <td style={{ width: '10%' }}></td>
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
                </tr>
                <tr>
                  <td style={{ paddingTop: '15px', fontSize: '9px', color: '#9ca3af', fontWeight: 'normal' }}>
                    Date Signed: ________________________
                  </td>
                  <td></td>
                  <td style={{ paddingTop: '15px', fontSize: '9px', color: '#9ca3af', fontWeight: 'normal' }}>
                    Verification Stamp: [ SECURITY CHK APPROVED ]
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer for Page 2 */}
          <div style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af' }}>
            <span>Evaluation of Graduation Gaps (OREG-GRAD-EV-2026)</span>
            <span>Page 2 of 2</span>
          </div>
        </div>

      </div>
    </div>
  );
}