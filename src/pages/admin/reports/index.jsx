import { useState, useEffect } from 'react';
import { 
   Printer, CheckCircle2, Loader2
} from 'lucide-react';
import { studentService } from '../../../services/studentService';
import { evaluationService } from '../../../services/evaluationService';
import { ErrorState } from '../../../components/ui/ErrorState';

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  
  const [metrics, setMetrics] = useState({
    avgComplianceRate: '0%',
    overallPassRate: '0%',
    totalEvaluations: '0',
    pendingAudits: '0 pending',
    activePrograms: '0'
  });

  const [programData, setProgramData] = useState([]);

  // Add print-specific styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .printable-area, .printable-area * {
          visibility: visible;
        }
        .printable-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [students, evaluations] = await Promise.all([
          studentService.getAllStudents(),
          evaluationService.getAllEvaluations()
        ]);

        // 1. Overall Metrics
        const completedEvals = evaluations.filter(e => ['Passed', 'Excellent', 'Completed'].includes(e.status));
        const passedCount = completedEvals.length;
        const failedCount = evaluations.filter(e => e.status === 'Failed').length;
        const pendingCount = evaluations.filter(e => ['Assigned', 'Pending Pre-req'].includes(e.status)).length;
        
        const totalConcluded = passedCount + failedCount;
        const passRate = totalConcluded > 0 ? Math.round((passedCount / totalConcluded) * 100) : 0;
        
        const uniquePrograms = new Set(students.map(s => s.program || s.course || 'BSIT'));

        setMetrics({
          avgComplianceRate: evaluations.length > 0 ? `${Math.round((passedCount / evaluations.length) * 100)}%` : '0%',
          overallPassRate: `${passRate}%`,
          totalEvaluations: evaluations.length.toString(),
          pendingAudits: `${pendingCount} pending`,
          activePrograms: uniquePrograms.size.toString()
        });

        // 2. Program Breakdown
        const programMap = {};
        
        // Initialize map with all unique programs from students
        uniquePrograms.forEach(prog => {
          programMap[prog] = { totalStudents: 0, trackedUnits: 0, passedEvals: 0, totalEvals: 0 };
        });

        // Count students
        students.forEach(s => {
          const prog = s.program || s.course || 'BSIT';
          if (programMap[prog]) {
            programMap[prog].totalStudents += 1;
          }
        });

        // Aggregate evaluations by program (requires mapping studentId -> program)
        const studentProgramLookup = {};
        students.forEach(s => { studentProgramLookup[s.id] = s.program || s.course || 'BSIT'; });

        evaluations.forEach(e => {
          const prog = studentProgramLookup[e.studentId];
          if (prog && programMap[prog]) {
            programMap[prog].totalEvals += 1;
            programMap[prog].trackedUnits += 3; // Estimating 3 units per record for report visuals
            if (['Passed', 'Excellent', 'Completed'].includes(e.status)) {
              programMap[prog].passedEvals += 1;
            }
          }
        });

        // Format for table
        const finalProgramData = Object.entries(programMap).map(([program, data]) => {
          const compRate = data.totalEvals > 0 ? Math.round((data.passedEvals / data.totalEvals) * 100) : 0;
          return {
            program,
            totalStudents: data.totalStudents,
            trackingUnits: data.trackedUnits,
            complianceRate: `${compRate}%`,
            status: compRate >= 95 ? 'Outstanding' : compRate >= 85 ? 'Excellent' : compRate >= 75 ? 'Good' : 'Needs Review'
          };
        }).sort((a, b) => b.totalStudents - a.totalStudents);

        setProgramData(finalProgramData);

      } catch (err) {
        console.error("Report data load failed:", err);
        setError('We could not load the reports data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reloadKey]);

  const triggerPrint = () => window.print();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-[#375534]">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />;
  }

  return (
    <div className="space-y-6 text-[#0F2A1D] print:space-y-4">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2A1D]">Reports</h2>
          <p className="text-xs text-slate-400 font-medium uppercase mt-1 tracking-wider">Comprehensive academic structure and sequence reports.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={triggerPrint} className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all flex-1 sm:flex-none">
            <Printer size={14} /> Print / Export PDF
          </button>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 tracking-tight print:hidden">University Analytics</h3>

      {/* Top Summary Cards Metrics - not printed, no wrapper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:hidden">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pass/Completion Ratio</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight mt-2">{metrics.avgComplianceRate}</p>
          <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} /> Live Computed
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Pass Rate</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight mt-2">{metrics.overallPassRate}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Concluded evaluations</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tracked Evaluations</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight mt-2">{metrics.totalEvaluations}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">{metrics.pendingAudits}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Programs</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight mt-2">{metrics.activePrograms}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-1">Sourced from enrolled registry</p>
        </div>
      </div>

      {/* Program Performance Summary — THIS is the only thing that prints */}
      <div className="printable-area bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 print:bg-transparent">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">Program Performance Summary</h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Detailed evaluation metrics by degree program</p>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:table-fixed">
            <thead>
              <tr className="border-b border-slate-200/60 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/20 print:bg-transparent">
                <th className="p-4 pl-6">Program</th>
                <th className="p-4">Total Students</th>
                <th className="p-4">Tracked Units (Est)</th>
                <th className="p-4">Sequence Compliance</th>
                <th className="p-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {programData.length > 0 ? programData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 pl-6 text-slate-900 font-extrabold">{row.program}</td>
                  <td className="p-4 font-mono text-slate-500">{row.totalStudents}</td>
                  <td className="p-4 font-mono text-slate-500 pl-8">{row.trackingUnits}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-900 font-black">{row.complianceRate}</span>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block print:hidden">
                        <div className="bg-[#375534] h-full" style={{ width: row.complianceRate }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-white print:text-slate-900 print:bg-transparent print:border print:border-slate-300
                      ${row.status === 'Outstanding' ? 'bg-[#0F2A1D]' : 
                        row.status === 'Excellent' ? 'bg-[#375534]' : 'bg-slate-500'}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">No program data generated yet. Ensure students and evaluations are mapped.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}