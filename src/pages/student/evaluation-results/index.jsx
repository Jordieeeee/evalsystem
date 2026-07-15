import { useEffect, useState } from 'react';
import { Download, Award, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';

export default function StudentEvaluationResultsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({ cumulativeGpa: '-', totalCredits: 0 });
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const { completedHistory } = await studentService.getAcademicRecords(user.uid);
        const passedCount = completedHistory.filter((record) => record.status === 'Passed' || record.status === 'Excellent').length;
        setMetrics({
          cumulativeGpa: passedCount > 0 ? (passedCount / Math.max(completedHistory.length, 1)).toFixed(2) : '-',
          totalCredits: completedHistory.length * 3
        });
        setEvaluations(completedHistory.map((record) => ({
          date: record.assignedDate ? new Date(record.assignedDate).toLocaleDateString() : 'N/A',
          subject: record.subjectCode,
          grade: record.grade || '-',
          remarks: record.remarks || 'Recorded from evaluation',
          status: record.status
        })));
      } catch (error) {
        console.error('Failed to load evaluation results', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-[#375534]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#7D1924]">
      
      {/* Page Title & Download Transcript Action Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900">Evaluation Results</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Track your academic performance across all completed evaluations.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-2xs active:scale-[0.98]">
          <Download size={14} /> Download Transcript
        </button>
      </div>

      {/* Row 1: Summary Metric Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Cumulative GPA Highlights Card */}
        <div className="bg-[#7D1924] text-[#FCEEEF] rounded-3xl p-6 shadow-sm border border-white/5 flex items-center gap-5">
          <div className="p-4 bg-white/10 rounded-2xl text-white">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#FCEEEF] uppercase tracking-wider">Cumulative GPA</p>
            <p className="text-4xl font-serif font-black text-white mt-1 tracking-tight">{metrics.cumulativeGpa}</p>
          </div>
        </div>

        {/* Total Credits Earned Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex items-center gap-5">
          <div className="p-4 bg-[#f4f7f3] text-blue-600 rounded-2xl">
            <FileText size={24} className="text-[#375534]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Credits Earned</p>
            <p className="text-4xl font-black text-slate-900 mt-1 tracking-tight">{metrics.totalCredits}</p>
          </div>
        </div>

      </div>

      {/* Row 2: Evaluation Results History Logs Table Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                <th className="p-4 pl-6 font-semibold">Date</th>
                <th className="p-4 font-semibold">Subject</th>
                <th className="p-4 font-semibold">Grade</th>
                <th className="p-4 font-semibold">Remarks</th>
                <th className="p-4 pr-6 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-50">
              {evaluations.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 pl-6 text-slate-400 font-medium whitespace-nowrap">{item.date}</td>
                  <td className="p-4 font-extrabold text-slate-900">{item.subject}</td>
                  <td className="p-4 font-serif font-black text-slate-900 text-sm">{item.grade}</td>
                  <td className="p-4 text-slate-500 font-medium normal-case max-w-xs truncate">{item.remarks}</td>
                  <td className="p-4 pr-6 text-right">
                    <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border inline-block min-w-[85px] text-center
                      ${item.status === 'Excellent' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200/60' 
                        : item.status === 'Passed' ? 'bg-[#801818] text-[#7D1924] border-[#cbe6bf]'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}