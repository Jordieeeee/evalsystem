import React from 'react';
import schoolLogo from '../../../../assets/logo/logo.png'; // Confirm accurate asset location mapping path
import ChecksheetPrintSheet from './ChecksheetPrintSheet';

export default function PrintReportModal({ isReportModalOpen, activeReportData, setIsReportModalOpen }) {
  if (!isReportModalOpen || !activeReportData) return null;

  const data = activeReportData.summary || {};
  // Plan bridging prints its own checksheet document instead of the transferee report.
  const isChecksheet = activeReportData.type === 'curr-shift';
  const currentTimestamp = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
      
      {/* Printable Area Specific Style Rules */}
      <style>{`
        @media print {
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
          
          body * {
            visibility: hidden;
          }

          #transferee-evaluation-reports-wrapper, #transferee-evaluation-reports-wrapper * {
            visibility: visible !important;
          }

          #transferee-evaluation-reports-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            width: 100% !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            display: block !important;
          }

          .print-page {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            margin-top: 0 !important;
            padding-top: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-page-break {
            page-break-before: always !important;
            break-before: always !important;
            display: block !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }

          /* Global font standardization for print elements */
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

          @page {
            size: 8.5in 13in portrait; /* Philippine standard Long Bond Paper portrait settings */
            margin: 0.5in;
          }
        }
      `}</style>

      {/* Screen Interactive Container */}
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp">
        
        {/* Modal Top Actions */}
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase">Evaluation Portrait Printable Document Sheets</h3>
            <p className="text-slate-500 text-[10px] font-bold">Standard 2-Page Registrar Evaluation and Academic Program Plan Reports</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition">
              Print Documents
            </button>
            <button onClick={() => setIsReportModalOpen(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition">
              Close
            </button>
          </div>
        </div>

        {/* Modal Sheet Scroll View (Desktop Screen Render) */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
          
          <div id="transferee-evaluation-reports-wrapper" className="bg-white p-8 max-w-[8.5in] mx-auto text-black shadow-lg rounded-xl">

            {isChecksheet && <ChecksheetPrintSheet activeReportData={activeReportData} />}

            {/* ================= REPORT PAGE 1: TRANSFEREE EVALUATION ================= */}
            <div className="print-page pt-0 mt-0" style={{ display: isChecksheet ? 'none' : undefined }}>
              
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
            <div className="print-page-break" style={{ display: isChecksheet ? 'none' : undefined }}></div>

            {/* ================= REPORT PAGE 2: RECOMMENDED STUDY PLAN ================= */}
            <div className="print-page pt-0 mt-0" style={{ display: isChecksheet ? 'none' : undefined }}>
              
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

          </div>
        </div>

      </div>
    </div>
  );
}