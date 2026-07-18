import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, ClipboardCheck, GraduationCap, ArrowUpRight, 
  Layers, Activity, Calendar, ShieldCheck 
} from 'lucide-react';
import { studentService } from '../../../services/studentService';
import { evaluationService } from '../../../services/evaluationService';
import { systemService } from '../../../services/systemService';
import LoadingState from '../../../components/LoadingState';

export default function AdminDashboardView() {
  const [loading, setLoading] = useState(true);
  const [academicConfig, setAcademicConfig] = useState({ activeYear: '2026-2027', activeSemester: '1st Semester' }); //[cite: 1]
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalEvaluations: 0,
    graduatingCount: 0,
    irregularCount: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        const [studentsList, evaluationsList, config] = await Promise.all([
          studentService.getAllStudents(), //[cite: 1]
          evaluationService.getAllEvaluations(), //[cite: 1]
          systemService.getAcademicConfig() //[cite: 1]
        ]);

        if (config) {
          setAcademicConfig(config); //[cite: 1]
        }

        // Compute administrative analytics loops
        let graduating = 0;
        let irregular = 0;
        studentsList.forEach(s => {
          if (s.status === 'Graduating Candidate' || String(s.yearLevel).toLowerCase().includes('fourth')) graduating++; //[cite: 1]
          if (s.classification === 'irregular') irregular++; //[cite: 1]
        });

        setMetrics({
          totalStudents: studentsList.length, //[cite: 1]
          totalEvaluations: evaluationsList.length, //[cite: 1]
          graduatingCount: graduating, //[cite: 1]
          irregularCount: irregular
        });

        // Slice latest 5 active student rows for summary display
        setRecentStudents(studentsList.slice(-5).reverse());

      } catch (error) {
        console.error("Failed loading administrative workbench metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  if (loading) {
    return <LoadingState label="Compiling Institutional Roster Metrics..." />; //[cite: 1]
  }

  return (
    <div className="space-y-6 text-slate-800 font-sans antialiased text-left max-w-7xl mx-auto">
      {/* Upper Strategy Identification Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-[#7D1924] uppercase">
            <Activity size={14} className="stroke-[2.5]" />
            <span>Operational Summary Control</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Portal Control Center
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Institutional quality evaluations dashboard core workspace framework.
          </p>
        </div>

        {/* Global Academic Target Lock Status */}
        <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs">
          <div className="p-2 bg-[#f4f7f3] text-[#375534] rounded-lg"><Calendar size={16} /></div> {/*[cite: 1] */}
          <div className="text-xs">
            <p className="font-black text-slate-400 uppercase tracking-wider text-[9px] leading-none">Active Matrix Scope</p>
            <p className="font-extrabold text-slate-900 mt-1 font-mono">{academicConfig.activeYear} • {academicConfig.activeSemester}</p> {/*[cite: 1] */}
          </div>
        </div>
      </div>

      {/* Main KPI Statistical Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Enrolled Registry", value: metrics.totalStudents, label: "Total Students Mapped", color: "text-blue-600", icon: <Users size={20} /> }, //[cite: 1]
          { title: "Evaluations Logged", value: metrics.totalEvaluations, label: "Pipeline Operations", color: "text-emerald-600", icon: <ClipboardCheck size={20} /> }, //[cite: 1]
          { title: "Grad Candidates", value: metrics.graduatingCount, label: "Checklist Clear Hold", color: "text-amber-600", icon: <GraduationCap size={20} />, highlight: true }, //[cite: 1]
          { title: "Irregular Tracking", value: metrics.irregularCount, label: "Program Path Shifts", color: "text-indigo-600", icon: <Layers size={20} /> }
        ].map((card, idx) => (
          <div 
            key={idx} 
            className={`p-5 rounded-2xl border transition-all duration-200 shadow-2xs ${
              card.highlight 
                ? 'bg-gradient-to-br from-[#7D1924] to-[#5a1018] border-transparent text-white hover:scale-[1.01]' 
                : 'bg-white border-slate-200/60 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-black uppercase tracking-wider ${card.highlight ? 'text-rose-200' : 'text-slate-400'}`}>
                {card.title}
              </span>
              <div className={`p-2 rounded-xl shrink-0 ${card.highlight ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-500'}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-2">
              <h3 className={`text-3xl font-black tracking-tight ${card.highlight ? 'text-white' : 'text-slate-900'}`}>
                {card.value}
              </h3>
              <p className={`text-[10px] font-bold mt-1 ${card.highlight ? 'text-rose-200/70' : 'text-slate-400/80'}`}>
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Split Workbench Main Row Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Recent Student Ingress Records */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Recent Admissions Registry</h3>
              <p className="text-[11px] text-slate-400 font-medium">Latest incoming student entries requiring verification checksheets.</p>
            </div>
            <Link 
              to="/admin/students" 
              className="text-xs font-bold text-[#7D1924] hover:text-rose-700 flex items-center gap-1 transition-colors"
            >
              <span>Directory Workbench</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/40">
                  <th className="p-3 pl-4">Student Identity</th>
                  <th className="p-3">Placement</th>
                  <th className="p-3">Curriculum version</th>
                  <th className="p-3 pr-4 text-right">Action status</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-600">
                {recentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 pl-4 font-black text-slate-900">
                      {student.lastName}, {student.firstName} {/*[cite: 1] */}
                      <span className="block font-mono text-[10px] text-slate-400 font-bold mt-0.5">{student.studentId}</span> {/*[cite: 1] */}
                    </td>
                    <td className="p-3 text-slate-500">
                      {student.course} • {student.yearLevel} {/*[cite: 1] */}
                    </td>
                    <td className="p-3">
                      <span className="text-[9px] font-extrabold font-mono bg-slate-100 px-2 py-0.5 border rounded text-slate-600">
                        {student.curriculum || 'NEW'} PLAN {/*[cite: 1] */}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <span className="text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {student.status || 'Active'} {/*[cite: 1] */}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Portal Strategy Quick Access Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">Module Engine Anchors</h3>
            <p className="text-[11px] text-slate-400 font-medium">Administrative bypass controls to perform framework mutations.</p>
          </div>

          <div className="flex flex-col gap-2 pt-2 text-xs font-bold text-slate-700">
            <Link 
              to="/admin/evaluation" 
              className="p-3 bg-slate-50 hover:bg-rose-50 border hover:border-rose-100 rounded-xl flex justify-between items-center transition group"
            >
              <div>
                <p className="text-slate-900 font-extrabold group-hover:text-[#7D1924] transition-colors">Launch Evaluation Pipelines</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Execute regular or legacy plan bridging checks.</p>
              </div>
              <ArrowUpRight size={14} className="text-slate-400 group-hover:text-[#7D1924] transition-colors" />
            </Link>

            <Link 
              to="/admin/subjects" 
              className="p-3 bg-slate-50 hover:bg-blue-50 border hover:border-blue-100 rounded-xl flex justify-between items-center transition group"
            >
              <div>
                <p className="text-slate-900 font-extrabold group-hover:text-blue-600 transition-colors">Curriculum Mapping strategy</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Edit course nodes catalog rules and exemptions.</p>
              </div>
              <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link 
              to="/admin/reports" 
              className="p-3 bg-slate-50 hover:bg-emerald-50 border hover:border-emerald-100 rounded-xl flex justify-between items-center transition group"
            >
              <div>
                <p className="text-slate-900 font-extrabold group-hover:text-emerald-600 transition-colors">Institutional Audits Console</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Generate verified transcript ledgers certificates.</p>
              </div>
              <ArrowUpRight size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </Link>
          </div>

          {/* Locked Security Notice */}
          <div className="border border-dashed border-slate-200 p-3 rounded-xl bg-slate-50/50 flex items-center gap-2.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            <ShieldCheck size={14} className="text-slate-400 shrink-0 stroke-[2.5]" />
            <span>Cryptographic signature trail verification is active</span>
          </div>
        </div>
      </div>
    </div>
  );
}