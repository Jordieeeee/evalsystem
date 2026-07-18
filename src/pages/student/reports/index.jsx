import { useEffect, useState } from 'react';
import { Printer, Download } from 'lucide-react';
import universitySeal from '../../../assets/logo/logo.png';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import LoadingState from '../../../components/LoadingState';

export default function StudentReportsPage() {
  const { user, profile } = useAuth();
  const [reportMetadata, setReportMetadata] = useState({
    dateIssued: new Date().toLocaleDateString(),
    studentName: 'Student',
    studentNumber: '',
    program: 'BSIT',
    yearSection: '1st Year',
    academicYear: '2025-2026',
    semester: '1st Semester',
    gwa: '-'
  });
  const [evaluationRecords, setEvaluationRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      // Records are keyed by SR-Code (profile.id), not the Firebase uid.
      if (!profile?.id) return;
      try {
        setLoading(true);
        const { currentSubjects, completedHistory } = await studentService.getAcademicRecords(profile.id);
        const records = [...currentSubjects, ...completedHistory].map((record) => ({
          code: record.subjectCode,
          name: record.subjectCode,
          units: 3,
          grade: record.grade || (record.status === 'Assigned' ? 'PENDING' : '-'),
          remarks: record.remarks || record.status
        }));
        setEvaluationRecords(records);
        setReportMetadata((prev) => ({
          ...prev,
          studentName: profile?.name || user.displayName || 'Student',
          studentNumber: profile?.studentId || profile?.id || user.uid,
          program: profile?.program || profile?.course || 'BSIT',
          yearSection: profile?.yearSection || `${profile?.year || '1'}st Year`,
          academicYear: profile?.academicYear || '2025-2026',
          semester: profile?.semester || '1st Semester',
          gwa: records.length > 0 ? (records.filter((record) => record.grade && record.grade !== 'PENDING' && record.grade !== '-').length / Math.max(records.length, 1)).toFixed(2) : '-'
        }));
      } catch (error) {
        console.error('Failed to load reports', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [profile, user]);

  const triggerPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <LoadingState label="Compiling Your Reports..." accent="#375534" />
    );
  }

  return (
    <div className="space-y-6 text-[#0F2A1D] max-w-[1000px] mx-auto antialiased">
      
      {/* Dynamic Top Action Command Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 print:hidden">
        <div>
          <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900">Academic Report</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Official evaluation summary for the current academic period.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={triggerPrint}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-2xs active:scale-[0.98] flex-1 sm:flex-none"
          >
            <Printer size={14} /> Print
          </button>
          <button className="flex items-center justify-center gap-2 bg-[#7D1924] text-[#FCEEEF] text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#375534] transition-all shadow-sm active:scale-[0.98] flex-1 sm:flex-none">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Primary Sheet Paper Wrapper Document */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xs relative print:border-none print:p-0">
        
        {/* Document Header Metadata Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
          <div className="space-y-4">
            <div className="space-y-0.5">
              <h3 className="text-2xl font-serif font-black text-slate-900 tracking-tight">The Last Salle</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">University</p>
            </div>
            <div className="text-xs text-slate-500 space-y-1 font-medium">
              <p className="font-bold text-slate-700">Office of the University Registrar</p>
              <p>Student Academic Evaluation Report</p>
              <p>Date Issued: {reportMetadata.dateIssued}</p>
            </div>
          </div>

          {/* Premium University Stamp Seal Graphic Integration */}
          <div className="w-24 h-24 rounded-full border border-slate-200/100 p-1 flex items-center justify-center overflow-hidden shrink-0 bg-slate-50 shadow-2xs self-center sm:self-start">
            <img 
              src={universitySeal} 
              alt="The Last Salle University Seal" 
              className="w-full h-full object-contain brightness-105 contrast-105"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div class="text-center font-serif font-black text-[11px] text-[#7D1924] leading-tight">TLSU<br/><span class="text-[8px] tracking-tighter text-slate-400">MALVAR</span></div>`;
              }}
            />
          </div>
        </div>

        {/* Informational Parameter Block Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 py-6 text-xs border-b border-slate-100">
          <div className="space-y-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</p>
              <p className="text-sm font-black text-slate-900">{reportMetadata.studentName}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Program</p>
              <p className="text-xs font-extrabold text-slate-800">{reportMetadata.program}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academic Year</p>
              <p className="text-xs font-extrabold text-slate-800">{reportMetadata.academicYear}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Number</p>
              <p className="text-sm font-mono font-black text-slate-900">{reportMetadata.studentNumber}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Year & Section</p>
              <p className="text-xs font-extrabold text-slate-800">{reportMetadata.yearSection}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Semester</p>
              <p className="text-xs font-extrabold text-slate-800">{reportMetadata.semester}</p>
            </div>
          </div>
        </div>

        {/* Tabular Evaluation Results Sheet Matrix */}
        <div className="py-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-serif font-black text-slate-900">
            <div className="w-1 h-4 bg-[#7D1924] rounded-full" />
            <h4>Evaluation Results</h4>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="p-3.5 pl-4 font-semibold">Subject Code/Name</th>
                  <th className="p-3.5 font-semibold text-center">Units</th>
                  <th className="p-3.5 font-semibold text-center">Grade</th>
                  <th className="p-3.5 pr-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
                {evaluationRecords.map((rec, i) => (
                  <tr key={i} className="align-top">
                    <td className="p-4 pl-4 space-y-0.5">
                      <p className="font-mono text-slate-900 font-black">{rec.code}</p>
                      <p className="text-slate-400 font-medium text-[11px]">{rec.name}</p>
                    </td>
                    <td className="p-4 text-center font-mono font-medium text-slate-500">{rec.units}</td>
                    <td className="p-4 text-center font-serif font-black text-slate-900 text-sm">{rec.grade}</td>
                    <td className="p-4 text-slate-400 font-semibold uppercase text-[10px] tracking-wide pt-4.5 max-w-xs">{rec.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cumulative General Weighted Average Row Banner */}
          <div className="bg-[#eaf0eb] border border-[#cbe6bf]/50 rounded-2xl p-4 flex justify-between items-center px-6">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#7D1924]">
              General Weighted Average (GWA)
            </span>
            <span className="text-2xl font-serif font-black text-[#7D1924] tracking-tight">
              {reportMetadata.gwa}
            </span>
          </div>
        </div>

        {/* Official Validation Footer Attestation Section */}
        <div className="pt-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <p className="italic font-medium normal-case">* Not valid without university seal.</p>
          
          <div className="text-center w-full sm:w-64 space-y-1.5 border-t border-slate-200 pt-3 self-end">
            <p className="font-black text-slate-800 text-xs tracking-wide">University Registrar</p>
            <p className="font-medium text-[9px]">Authorized Signature</p>
          </div>
        </div>

      </div>
    </div>
  );
}