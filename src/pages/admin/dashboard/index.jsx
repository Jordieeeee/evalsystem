import { useState, useEffect } from 'react';
import { 
  Users, BookOpen, ClipboardCheck,
  PlusCircle, CheckCircle2, FileSpreadsheet, UserCheck, Loader2
} from 'lucide-react';
import { studentService } from '../../../services/studentService';
import { subjectService } from '../../../services/subjectService';
import { evaluationService } from '../../../services/evaluationService';
import { systemService } from '../../../services/systemService';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    pendingEvaluations: 0,
    completedEvaluations: 0,
  });

  const [academicTerm, setAcademicTerm] = useState({
    activeYear: 'Loading...',
    activeSemester: 'Loading...'
  });

  const [courseAssignments, setCourseAssignments] = useState([]);
  const [completionMetrics, setCompletionMetrics] = useState({
    clearedSequences: 0,
    incompleteSequences: 0,
    pendingAudits: 0,
    totalEvaluationsMapped: 0
  });

  const [recentAssignments, setRecentAssignments] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all data in parallel including global academic config
        const [students, subjects, evaluations, config] = await Promise.all([
          studentService.getAllStudents(),
          subjectService.getAllSubjects(),
          evaluationService.getAllEvaluations(),
          systemService.getAcademicConfig()
        ]);

        if (config) {
          setAcademicTerm(config);
        }

        // 1. Calculate Stats
        const pendingEvals = evaluations.filter(e => ['Assigned', 'Pending Pre-req', 'Pending'].includes(e.status));
        const completedEvals = evaluations.filter(e => ['Passed', 'Excellent', 'Completed'].includes(e.status));
        
        setStats({
          totalStudents: students.length,
          totalSubjects: subjects.length,
          pendingEvaluations: pendingEvals.length,
          completedEvaluations: completedEvals.length,
        });

        // 2. Course Assignments Distribution
        const programCounts = {};
        students.forEach(s => {
          const prog = s.program || s.course || 'Unassigned';
          programCounts[prog] = (programCounts[prog] || 0) + 1;
        });
        
        const assignmentsData = Object.entries(programCounts).map(([course, count]) => ({
          course,
          assignedCount: count,
          percentage: students.length ? Math.round((count / students.length) * 100) : 0
        })).sort((a, b) => b.assignedCount - a.assignedCount).slice(0, 4); // Top 4 programs
        setCourseAssignments(assignmentsData);

        // 3. Completion Metrics
        setCompletionMetrics({
          clearedSequences: completedEvals.length,
          incompleteSequences: evaluations.filter(e => e.status === 'Failed').length,
          pendingAudits: pendingEvals.length,
          totalEvaluationsMapped: evaluations.length
        });

        // 4. Recent Assignments Table
        const recent = evaluations
          .sort((a, b) => new Date(b.assignedDate || 0) - new Date(a.assignedDate || 0))
          .slice(0, 5)
          .map((ev, index) => {
            const student = students.find(s => s.id === ev.studentId);
            return {
              id: ev.id || index,
              student: student ? student.name : ev.studentId,
              subject: ev.subjectCode,
              status: ev.status === 'Passed' ? 'completed' : ev.status === 'Assigned' ? 'assigned' : 'pending',
              date: ev.assignedDate ? new Date(ev.assignedDate).toLocaleDateString() : 'N/A'
            };
          });
        setRecentAssignments(recent);

        // 5. Activity Feed (Mocked dynamically based on recent evaluations)
        const recentActivities = recent.map((r, i) => ({
          id: i,
          text: `Administrator updated evaluation for ${r.student} (${r.subject})`,
          time: r.date
        }));
        setActivityFeed(recentActivities.length ? recentActivities : [{ id: 1, text: 'No recent activity.', time: '' }]);

      } catch (err) {
        console.error("Dashboard data load failed:", err);
        setError('We could not load the dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [reloadKey]);

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
    <div className="space-y-6 text-[#0F2A1D]">
       {/* Top Title Head */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2A1D]">Dashboard</h2>
      </div>

      {/* Formal Welcome Banner */}
      <div className="bg-[#0F2A1D] text-[#E3EED4] rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg border border-white/10 relative overflow-hidden">
        <div className="space-y-1 z-10">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, Administrator
          </h2>
          <p className="text-[#AEC3B0] text-sm font-medium">
            Here's an overview of today's academic activities, curricular tracking, and evaluations.
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 bg-[#375534]/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-left md:text-right z-10 min-w-[220px]">
          <p className="font-bold text-base text-white tracking-wide">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div className="flex gap-2 mt-2 text-[10px] font-black tracking-wider justify-start md:justify-end uppercase">
            <span className="bg-[#0F2A1D] text-[#E3EED4] px-2.5 py-1 rounded-lg border border-white/5">A.Y. {academicTerm.activeYear}</span>
            <span className="bg-[#0F2A1D] text-[#E3EED4] px-2.5 py-1 rounded-lg border border-white/5">{academicTerm.activeSemester}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users size={22} /></div>
          </div>
          <div className="mt-6">
            <span className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalStudents}</span>
            <p className="text-xs font-bold text-slate-400 mt-1 tracking-wider uppercase">Total Students</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><BookOpen size={22} /></div>
          </div>
          <div className="mt-6">
            <span className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalSubjects}</span>
            <p className="text-xs font-bold text-slate-400 mt-1 tracking-wider uppercase">Total Subjects</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><ClipboardCheck size={22} /></div>
          </div>
          <div className="mt-6">
            <span className="text-4xl font-black text-slate-900 tracking-tight">{stats.pendingEvaluations}</span>
            <p className="text-xs font-bold text-slate-400 mt-1 tracking-wider uppercase">Pending Evaluations</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={22} /></div>
          </div>
          <div className="mt-6">
            <span className="text-4xl font-black text-slate-900 tracking-tight">{stats.completedEvaluations}</span>
            <p className="text-xs font-bold text-slate-400 mt-1 tracking-wider uppercase">Completed Evaluations</p>
          </div>
        </div>
      </div>

      {/* Main Structural Row Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Recent Assignments</h3>
            <Link to="/admin/evaluation" className="text-xs font-bold text-[#375534] hover:underline">View All</Link>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Subject</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-50">
                {recentAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-bold text-slate-900">{assignment.student}</td>
                    <td className="py-3 text-slate-600">{assignment.subject}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-white
                        ${assignment.status === 'completed' ? 'bg-[#375534]' : 
                          assignment.status === 'assigned' ? 'bg-blue-600' : 'bg-amber-500'}`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-right font-mono">{assignment.date}</td>
                  </tr>
                ))}
                {recentAssignments.length === 0 && (
                   <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">No recent assignments found.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 text-center h-full">
            <Link to="/admin/evaluation" className="p-4 bg-slate-50 hover:bg-[#E3EED4]/30 hover:border-[#6B9071]/40 border border-slate-200/60 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
              <PlusCircle size={20} className="text-[#375534] group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-wide uppercase">Assign Subject</span>
            </Link>
            <Link to="/admin/evaluation" className="p-4 bg-slate-50 hover:bg-[#E3EED4]/30 hover:border-[#6B9071]/40 border border-slate-200/60 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
              <UserCheck size={20} className="text-amber-600 group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-wide uppercase">Evaluate Student</span>
            </Link>
            <Link to="/admin/reports" className="p-4 bg-slate-50 hover:bg-[#E3EED4]/30 hover:border-[#6B9071]/40 border border-slate-200/60 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
              <FileSpreadsheet size={20} className="text-blue-600 group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-wide uppercase">Generate Report</span>
            </Link>
            <Link to="/admin/students" className="p-4 bg-slate-50 hover:bg-[#E3EED4]/30 hover:border-[#6B9071]/40 border border-slate-200/60 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
              <Users size={20} className="text-emerald-600 group-hover:scale-105 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-wide uppercase">Manage Students</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Feed Footer Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Students by Course</h3>
          <div className="flex-1 space-y-3.5">
            {courseAssignments.length > 0 ? courseAssignments.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="truncate max-w-[180px]">{item.course}</span>
                  <span className="text-slate-400 font-mono">{item.assignedCount} students ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#375534] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            )) : <p className="text-sm text-slate-400">No students registered yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Evaluation Overview</h3>
          <div className="flex-1 flex flex-col justify-center space-y-3 text-xs font-bold">
            <div className="flex justify-between items-center p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <span className="text-emerald-800">Cleared Sequences</span>
              <span className="font-mono text-base font-black text-emerald-900">{completionMetrics.clearedSequences}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
              <span className="text-amber-800">Failed / Incomplete</span>
              <span className="font-mono text-base font-black text-amber-900">{completionMetrics.incompleteSequences}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
              <span className="text-blue-800">Pending Sequence Audits</span>
              <span className="font-mono text-base font-black text-blue-900">{completionMetrics.pendingAudits}</span>
            </div>
            <div className="pt-1 flex justify-between text-[11px] uppercase tracking-wider text-slate-400 pl-1">
              <span>Total Tracked Scope</span>
              <span className="font-mono font-extrabold">{completionMetrics.totalEvaluationsMapped} Mapped</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Activity Feed</h3>
          </div>
          
          <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1 text-[11px] leading-relaxed">
            {activityFeed.map((log) => (
              <div key={log.id} className="flex gap-3 items-start border-l-2 border-[#375534]/30 pl-3 py-0.5">
                <div>
                  <p className="text-slate-800 font-bold">{log.text}</p>
                  <p className="text-slate-400 font-semibold font-mono mt-0.5 text-[9px]">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}