import { Fragment } from 'react';
import schoolLogo from '../../../../assets/logo/logo.png';

// --- PHASE 8: EVALUATION SUMMARY REPORT ---
// Six-page printable report for the Curriculum Shift (Plan Bridging) pipeline.
// Rendered inside PrintReportModal's print wrapper, inheriting its @media print
// rules and long-bond-paper page setup.

const MARK = { Credited: '✅', Bridge: '⚠', Gap: '⬜', Scheduled: '📋' };

const cell = { padding: '4px 5px', borderRight: '1px solid #d1d5db' };
const lastCell = { padding: '4px 5px' };
const headCell = { padding: '5px', borderRight: '1px solid #9ca3af', fontWeight: 'bold', textAlign: 'left' };
const tableStyle = { fontSize: '9.5px', border: '1px solid #d1d5db', marginBottom: '8px' };
const h2 = { fontFamily: 'Arial, sans-serif', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', margin: '0' };
const sectionHead = { background: '#e5e7eb', padding: '3px 6px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid #9ca3af' };

function Letterhead() {
  return (
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
  );
}

function PageFooter({ page }) {
  return (
    <div style={{ marginTop: '18px', paddingTop: '8px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af' }}>
      <span>University Evaluation Report System (OREG-CURR-SHIFT-2026)</span>
      <span>Page {page} of 6</span>
    </div>
  );
}

export default function ChecksheetPrintSheet({ activeReportData }) {
  const data = activeReportData.summary || {};
  const student = activeReportData.student || {};
  const stats = data.mappingStats || {};
  const entered = data.enteredCourses || [];
  const plan = data.semesterPlan || [];
  const gaps = data.gapCourses || [];

  const srCode = activeReportData.srCode || activeReportData.studentId || '—';

  // Per entered course, the decision the engine reached.
  const decisionFor = (code) => {
    const credit = (data.creditedList || []).find((c) => c.oldCode === code);
    if (credit) return { label: `Credited to ${credit.newCode}`, type: credit.source === 'manual' ? 'Manual' : 'Auto', units: credit.units, color: '#059669' };
    const bridge = (data.bridgeCourses || []).find((b) => b.oldCode === code);
    if (bridge) return { label: `Bridge → ${bridge.newCode} (${bridge.shortfallUnits}u short)`, type: 'Bridge', units: 0, color: '#b45309' };
    const unmap = (data.unmappedList || []).find((u) => u.oldCode === code);
    if (unmap) return { label: 'No Credit', type: 'Unmapped', units: 0, color: '#6b7280' };
    return { label: 'Not counted (not passed)', type: '—', units: 0, color: '#9ca3af' };
  };

  const gapsByYear = {};
  gaps.forEach((g) => {
    const key = g.yearLevel || 'First Year';
    (gapsByYear[key] = gapsByYear[key] || []).push(g);
  });

  return (
    <>
      {/* ================= PAGE 1: COVER & STUDENT INFORMATION ================= */}
      <div className="print-page pt-0 mt-0">
        <Letterhead />
        <div className="text-center" style={{ margin: '15px 0 10px 0' }}>
          <h2 style={h2}>Curriculum Shift Evaluation — Summary Report</h2>
          <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#6b7280', margin: '2px 0 0 0' }}>
            Plan Bridging: Old Curriculum → New Curriculum Equivalency Audit
          </p>
        </div>

        <div style={{ ...sectionHead, marginTop: '14px' }}>Student Information</div>
        <table className="w-full border-collapse" style={{ fontSize: '10px', border: '1px solid #d1d5db', borderTop: 'none', marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold', width: '120px' }}>Student Name</td>
              <td style={cell}>{activeReportData.name || '—'}</td>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold', width: '110px' }}>SR Code</td>
              <td style={lastCell}>{srCode}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #d1d5db' }}>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Program</td>
              <td style={cell}>{student.program || student.course || 'BSIT'}</td>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Specialization Track</td>
              <td style={lastCell}>{student.track || student.specialization || '—'}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #d1d5db' }}>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Admission Type</td>
              <td style={cell}>{student.admissionType || '—'}</td>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Current Standing</td>
              <td style={lastCell}>{data.currentStanding?.label || '—'}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #d1d5db' }}>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Original Academic Year</td>
              <td style={cell}>{student.academicYear || '—'}</td>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Original Curriculum</td>
              <td style={lastCell}>{data.originCurriculum === 'NEW' ? 'New Curriculum' : 'Old Curriculum'}</td>
            </tr>
          </tbody>
        </table>

        <div style={sectionHead}>Evaluation Details</div>
        <table className="w-full border-collapse" style={{ fontSize: '10px', border: '1px solid #d1d5db', borderTop: 'none', marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold', width: '120px' }}>Evaluation Date</td>
              <td style={cell}>{activeReportData.timestamp || '—'}</td>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold', width: '110px' }}>Evaluating Admin</td>
              <td style={lastCell}>{activeReportData.evaluatedBy || '—'}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #d1d5db' }}>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Evaluation Pipeline</td>
              <td colSpan={3} style={lastCell}>Curriculum Shift Evaluation (Plan Bridging)</td>
            </tr>
            <tr style={{ borderTop: '1px solid #d1d5db' }}>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Eligibility</td>
              <td colSpan={3} style={{ ...lastCell, fontWeight: 'bold', color: data.overallEligibility === 'ELIGIBLE' ? '#059669' : '#b45309' }}>
                {data.overallEligibility || '—'}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={sectionHead}>Progress At A Glance</div>
        <table className="w-full border-collapse" style={{ fontSize: '10px', border: '1px solid #d1d5db', borderTop: 'none' }}>
          <thead style={{ background: '#f3f4f6', borderBottom: '1px solid #9ca3af' }}>
            <tr>
              <th style={headCell}>Units Earned</th><th style={headCell}>Units Deficient</th><th style={headCell}>Total Required</th>
              <th style={headCell}>Progress</th><th style={headCell}>Est. Semesters</th><th style={{ ...headCell, borderRight: 'none' }}>Projected Graduation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cell, color: '#059669', fontWeight: 'bold' }}>{data.unitsEarned || 0}u</td>
              <td style={{ ...cell, color: '#dc2626', fontWeight: 'bold' }}>{data.unitsRemaining || 0}u</td>
              <td style={cell}>{data.totalRequiredUnits || 0}u</td>
              <td style={{ ...cell, color: '#2563eb', fontWeight: 'bold' }}>{data.completionPercentage}%</td>
              <td style={cell}>{data.estimatedSemesters || 0}</td>
              <td style={lastCell}>{data.projectedGraduation || '—'}</td>
            </tr>
          </tbody>
        </table>

        <PageFooter page={1} />
      </div>

      {/* ================= PAGE 2: TRANSCRIPT OF TRANSFERRED CREDITS ================= */}
      <div className="print-page" style={{ pageBreakBefore: 'always' }}>
        <h2 style={{ ...h2, marginBottom: '8px' }}>Transcript of Transferred Credits</h2>
        <table className="w-full border-collapse" style={tableStyle}>
          <thead style={{ background: '#f3f4f6', borderBottom: '1px solid #9ca3af' }}>
            <tr>
              <th style={headCell}>Code</th><th style={headCell}>Title</th><th style={{ ...headCell, textAlign: 'right' }}>Units</th>
              <th style={headCell}>Grade</th><th style={headCell}>A.Y. Taken</th><th style={headCell}>Semester</th>
              <th style={{ ...headCell, borderRight: 'none' }}>Transfer Decision</th>
            </tr>
          </thead>
          <tbody>
            {entered.length === 0 && (
              <tr><td colSpan={7} style={{ ...lastCell, textAlign: 'center', color: '#6b7280' }}>No courses entered.</td></tr>
            )}
            {entered.map((c, i) => {
              const decision = decisionFor(c.courseCode);
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: c.counted ? 'transparent' : '#f9fafb' }}>
                  <td style={{ ...cell, fontWeight: 'bold' }}>{c.courseCode}</td>
                  <td style={cell}>{c.courseTitle}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{c.units}u</td>
                  <td style={{ ...cell, color: c.counted ? '#111827' : '#dc2626', fontWeight: 'bold' }}>{c.grade}</td>
                  <td style={cell}>{c.academicYear}</td>
                  <td style={cell}>{c.semester}</td>
                  <td style={{ ...lastCell, color: decision.color, fontWeight: 'bold' }}>{decision.label}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot style={{ background: '#f3f4f6', borderTop: '1px solid #9ca3af' }}>
            <tr>
              <td colSpan={2} style={{ ...cell, fontWeight: 'bold' }}>Total Old Units Entered</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 'bold' }}>{stats.totalOldUnitsEntered || 0}u</td>
              <td colSpan={3} style={{ ...cell, fontWeight: 'bold', textAlign: 'right' }}>Total New Units Credited</td>
              <td style={{ ...lastCell, fontWeight: 'bold', color: '#059669' }}>{stats.totalNewUnitsCredited || 0}u</td>
            </tr>
          </tfoot>
        </table>
        <PageFooter page={2} />
      </div>

      {/* ================= PAGE 3: EQUIVALENCY MAPPING DETAIL ================= */}
      <div className="print-page" style={{ pageBreakBefore: 'always' }}>
        <h2 style={{ ...h2, marginBottom: '8px' }}>Equivalency Mapping Detail</h2>
        <table className="w-full border-collapse" style={tableStyle}>
          <thead style={{ background: '#f3f4f6', borderBottom: '1px solid #9ca3af' }}>
            <tr>
              <th style={headCell}>Old Code</th><th style={headCell}>New Code</th>
              <th style={headCell}>Equivalency Type</th><th style={{ ...headCell, borderRight: 'none', textAlign: 'right' }}>Units Credited</th>
            </tr>
          </thead>
          <tbody>
            {(data.creditedList || []).map((c, i) => (
              <tr key={`c-${i}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ ...cell, fontWeight: 'bold' }}>{c.oldCode}</td>
                <td style={{ ...cell, fontWeight: 'bold', color: '#059669' }}>{c.newCode}</td>
                <td style={cell}>{c.source === 'manual' ? 'Manual Transfer' : c.matchType === 'direct' ? 'Auto — Direct Code Match' : 'Auto — Registry Mapping'}</td>
                <td style={{ ...lastCell, textAlign: 'right', fontWeight: 'bold' }}>{c.units}u</td>
              </tr>
            ))}
            {(data.bridgeCourses || []).map((b, i) => (
              <tr key={`b-${i}`} style={{ borderBottom: '1px solid #f3f4f6', background: '#fffbeb' }}>
                <td style={{ ...cell, fontWeight: 'bold' }}>{b.oldCode}</td>
                <td style={{ ...cell, fontWeight: 'bold', color: '#b45309' }}>{b.newCode}</td>
                <td style={cell}>Bridge — {b.shortfallUnits}u deficit ({b.source === 'manual' ? 'manual' : 'auto'})</td>
                <td style={{ ...lastCell, textAlign: 'right' }}>0u</td>
              </tr>
            ))}
            {(data.unmappedList || []).map((u, i) => (
              <tr key={`u-${i}`} style={{ borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                <td style={{ ...cell, fontWeight: 'bold' }}>{u.oldCode}</td>
                <td style={cell}>—</td>
                <td style={cell}>Unmapped — {u.reason}</td>
                <td style={{ ...lastCell, textAlign: 'right' }}>0u</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={sectionHead}>Summary Statistics</div>
        <table className="w-full border-collapse" style={{ fontSize: '10px', border: '1px solid #d1d5db', borderTop: 'none' }}>
          <thead style={{ background: '#f3f4f6', borderBottom: '1px solid #9ca3af' }}>
            <tr>
              <th style={headCell}>Auto-Matched</th><th style={headCell}>Manually Transferred</th>
              <th style={headCell}>Bridge</th><th style={{ ...headCell, borderRight: 'none' }}>Unmapped</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...cell, fontWeight: 'bold', color: '#059669' }}>{stats.autoMatched || 0}</td>
              <td style={{ ...cell, fontWeight: 'bold', color: '#2563eb' }}>{stats.manuallyTransferred || 0}</td>
              <td style={{ ...cell, fontWeight: 'bold', color: '#b45309' }}>{stats.bridge || 0}</td>
              <td style={{ ...lastCell, fontWeight: 'bold', color: '#6b7280' }}>{stats.unmapped || 0}</td>
            </tr>
          </tbody>
        </table>
        <PageFooter page={3} />
      </div>

      {/* ================= PAGE 4: GAP ANALYSIS ================= */}
      <div className="print-page" style={{ pageBreakBefore: 'always' }}>
        <h2 style={{ ...h2, marginBottom: '8px' }}>Gap Analysis</h2>
        <p style={{ fontSize: '9px', color: '#6b7280', margin: '0 0 8px 0' }}>
          New curriculum courses with no old-curriculum equivalent assigned. The student must take these in full.
        </p>

        {gaps.length === 0 && <p style={{ fontSize: '10px', fontStyle: 'italic', color: '#6b7280' }}>No gaps — every new curriculum course is covered.</p>}

        {Object.entries(gapsByYear).map(([year, courses]) => (
          <div key={year} className="avoid-break" style={{ marginBottom: '8px' }}>
            <div style={sectionHead}>{year} — {courses.reduce((s, c) => s + c.units, 0)} Units</div>
            <table className="w-full border-collapse" style={{ ...tableStyle, marginBottom: 0, borderTop: 'none' }}>
              <thead style={{ background: '#f9fafb', borderBottom: '1px solid #d1d5db' }}>
                <tr>
                  <th style={headCell}>Code</th><th style={headCell}>Title</th>
                  <th style={headCell}>Semester Offered</th><th style={headCell}>Prerequisites</th>
                  <th style={{ ...headCell, borderRight: 'none', textAlign: 'right' }}>Units</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ ...cell, fontWeight: 'bold' }}>{g.code}</td>
                    <td style={cell}>{g.title}</td>
                    <td style={cell}>{g.semesterOffered.join(', ')}</td>
                    <td style={{ ...cell, color: '#6b7280' }}>{g.prerequisites.length > 0 ? g.prerequisites.join(', ') : 'None'}</td>
                    <td style={{ ...lastCell, textAlign: 'right' }}>{g.units}u</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <p style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '10px' }}>
          Total Gap Units: <span style={{ color: '#dc2626' }}>{gaps.reduce((s, g) => s + g.units, 0)}u</span> across {gaps.length} course(s)
        </p>
        <PageFooter page={4} />
      </div>

      {/* ================= PAGE 5: SEMESTER ENROLLMENT PLAN ================= */}
      <div className="print-page" style={{ pageBreakBefore: 'always' }}>
        <h2 style={{ ...h2, marginBottom: '8px' }}>Semester Enrollment Plan</h2>
        <p style={{ fontSize: '9px', color: '#6b7280', margin: '0 0 8px 0' }}>
          From {data.currentStanding?.label || '—'} to projected graduation. Permitted credit boundary: {data.creditBoundary?.min}–{data.creditBoundary?.max} units.
        </p>

        {plan.length === 0 && <p style={{ fontSize: '10px', fontStyle: 'italic', color: '#6b7280' }}>No remaining courses to schedule.</p>}

        <table className="w-full border-collapse" style={tableStyle}>
          <thead style={{ background: '#f3f4f6', borderBottom: '1px solid #9ca3af' }}>
            <tr>
              <th style={headCell}>Semester</th><th style={headCell}>Course Code</th><th style={headCell}>Course Title</th>
              <th style={{ ...headCell, textAlign: 'right' }}>Units</th><th style={{ ...headCell, borderRight: 'none' }}>Prerequisites</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((slot) => (
              <Fragment key={slot.slotIndex}>
                {slot.courses.map((course, cIdx) => (
                  <tr key={`${slot.slotIndex}-${cIdx}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {cIdx === 0 && (
                      <td rowSpan={slot.courses.length} style={{ ...cell, verticalAlign: 'top', background: slot.isCurrent ? '#eff6ff' : '#f9fafb', fontWeight: 'bold', width: '110px' }}>
                        {slot.yearLevel}<br />
                        <span style={{ fontWeight: 'normal', color: '#6b7280' }}>{slot.semester}</span>
                        {slot.isCurrent && <><br /><span style={{ fontSize: '8px', color: '#2563eb', fontWeight: 'bold' }}>(CURRENT)</span></>}
                      </td>
                    )}
                    <td style={{ ...cell, fontWeight: 'bold' }}>{course.code}{course.status === 'Bridge' ? ' ⚠' : ''}</td>
                    <td style={cell}>{course.title}</td>
                    <td style={{ ...cell, textAlign: 'right' }}>{course.units}u</td>
                    <td style={{ ...lastCell, color: '#6b7280' }}>
                      {course.prereqStatus.length === 0 ? 'None' : course.prereqStatus.map((p) => `${p.code} ✅`).join(', ')}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #9ca3af' }}>
                  <td style={cell} />
                  <td colSpan={2} style={{ ...cell, textAlign: 'right', fontWeight: 'bold', fontSize: '9px' }}>Subtotal</td>
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 'bold' }}>{slot.totalUnits}u</td>
                  <td style={{ ...lastCell, fontSize: '8px', color: slot.isOverloaded || slot.isUnderloaded ? '#b45309' : '#9ca3af', fontWeight: 'bold' }}>
                    {slot.isOverloaded ? `EXCEEDS ${slot.maxUnits}u LIMIT` : slot.isUnderloaded ? `BELOW ${slot.minUnits}u MINIMUM` : `max ${slot.maxUnits}u`}
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: '11px', fontWeight: 'bold' }}>
          Projected Graduation: <span style={{ color: '#2563eb' }}>{data.projectedGraduation}</span> — {data.estimatedSemesters} semester(s) remaining
        </p>
        <PageFooter page={5} />
      </div>

      {/* ================= PAGE 6: SUMMARY & RECOMMENDATION ================= */}
      <div className="print-page" style={{ pageBreakBefore: 'always' }}>
        <h2 style={{ ...h2, marginBottom: '8px' }}>Summary & Recommendation</h2>

        <div style={sectionHead}>Curriculum Progress</div>
        <table className="w-full border-collapse" style={{ fontSize: '10px', border: '1px solid #d1d5db', borderTop: 'none', marginBottom: '10px' }}>
          <tbody>
            <tr>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold', width: '160px' }}>Curriculum Progress</td>
              <td style={lastCell}>
                <strong style={{ color: '#2563eb' }}>{data.completionPercentage}%</strong> — {data.unitsEarned} of {data.totalRequiredUnits} units
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid #d1d5db' }}>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Estimated Semesters</td>
              <td style={lastCell}>{data.estimatedSemesters} (of {data.regularSlotsRemaining} remaining in normal program duration)</td>
            </tr>
            <tr style={{ borderTop: '1px solid #d1d5db' }}>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Projected Graduation</td>
              <td style={lastCell}>{data.projectedGraduation}</td>
            </tr>
            <tr style={{ borderTop: '1px solid #d1d5db' }}>
              <td style={{ ...cell, background: '#f9fafb', fontWeight: 'bold' }}>Eligibility Status</td>
              <td style={{ ...lastCell, fontWeight: 'bold', color: data.overallEligibility === 'ELIGIBLE' ? '#059669' : '#b45309' }}>
                {data.overallEligibility}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={sectionHead}>Justification</div>
        <div style={{ border: '1px solid #d1d5db', borderTop: 'none', padding: '6px 8px', marginBottom: '10px', fontSize: '10px' }}>
          {(data.reviewReasons || []).length === 0 ? (
            <p style={{ margin: 0, color: '#059669' }}>
              All completed courses resolved. Remaining requirements fit within the normal program duration at or below the permitted unit ceiling.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {data.reviewReasons.map((reason, i) => <li key={i} style={{ marginBottom: '2px' }}>{reason}</li>)}
            </ul>
          )}
        </div>

        <div style={sectionHead}>Flagged Items Requiring Manual Review</div>
        <table className="w-full border-collapse" style={{ ...tableStyle, borderTop: 'none' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #d1d5db' }}>
            <tr><th style={headCell}>Item</th><th style={headCell}>Type</th><th style={{ ...headCell, borderRight: 'none' }}>Detail</th></tr>
          </thead>
          <tbody>
            {(data.bridgeCourses || []).map((b, i) => (
              <tr key={`fb-${i}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ ...cell, fontWeight: 'bold' }}>{b.newCode}</td>
                <td style={{ ...cell, color: '#b45309' }}>Bridge</td>
                <td style={lastCell}>{b.oldCode} covers {b.covered}u of {b.units}u — {b.requirement}</td>
              </tr>
            ))}
            {(data.unmappedList || []).map((u, i) => (
              <tr key={`fu-${i}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ ...cell, fontWeight: 'bold' }}>{u.oldCode}</td>
                <td style={{ ...cell, color: '#6b7280' }}>Unmapped</td>
                <td style={lastCell}>{u.reason} — {u.oldUnits}u earns no credit</td>
              </tr>
            ))}
            {(plan.filter((s) => s.isOverloaded || s.isUnderloaded)).map((s, i) => (
              <tr key={`fo-${i}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ ...cell, fontWeight: 'bold' }}>{s.label}</td>
                <td style={{ ...cell, color: '#b45309' }}>{s.isOverloaded ? 'Overloaded' : 'Underloaded'}</td>
                <td style={lastCell}>{s.totalUnits}u against a {s.minUnits}–{s.maxUnits}u boundary</td>
              </tr>
            ))}
            {(data.bridgeCourses || []).length === 0 && (data.unmappedList || []).length === 0 && plan.every((s) => !s.isOverloaded && !s.isUnderloaded) && (
              <tr><td colSpan={3} style={{ ...lastCell, textAlign: 'center', color: '#059669' }}>No items require manual review.</td></tr>
            )}
          </tbody>
        </table>

        {/* Signature Block */}
        <table className="w-full border-collapse" style={{ marginTop: '40px', fontSize: '10px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', paddingRight: '20px' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: '3px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Evaluated By</p>
                  <p style={{ margin: 0, fontSize: '9px', color: '#6b7280' }}>{activeReportData.evaluatedBy || 'Office of the University Registrar'}</p>
                </div>
              </td>
              <td style={{ width: '50%', paddingLeft: '20px' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: '3px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Noted By — University Registrar</p>
                  <p style={{ margin: 0, fontSize: '9px', color: '#6b7280' }}>Signature over printed name</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ fontSize: '8px', color: '#9ca3af', marginTop: '18px', fontStyle: 'italic' }}>
          Legend: {MARK.Credited} Credited · {MARK.Scheduled} Scheduled · {MARK.Bridge} Bridge · {MARK.Gap} Gap
        </p>
        <PageFooter page={6} />
      </div>
    </>
  );
}
