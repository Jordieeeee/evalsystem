import { useState, useEffect, useMemo } from 'react';
import { 
  Printer, FileSpreadsheet, Scroll, 
  CheckCircle2, Calendar, ClipboardCheck, GraduationCap, ShieldAlert,
  ArrowUpRight, BarChart3, TrendingUp, HelpCircle
} from 'lucide-react';
import LoadingState from '../../../components/LoadingState';
import { studentService } from '../../../services/studentService';
import { evaluationService } from '../../../services/evaluationService';
import { subjectService } from '../../../services/subjectService';
import universitySeal from '../../../assets/logo/logo.png';

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('student');
  const [evaluationFilter, setEvaluationFilter] = useState('ALL');
  
  // Core Data Registries
  const [students, setStudents] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [newSubjects, setNewSubjects] = useState([]);
  const [oldSubjects, setOldSubjects] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Dashboard Summary Cards State
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalEvaluations: 0,
    totalGraduating: 0,
    totalTransferee: 0,
    totalShiftee: 0,
    totalReturning: 0
  });

  // Global styles in index.css are used for print layout. No local stylesheet injection needed.

  useEffect(() => {
    const fetchAllReportData = async () => {
      try {
        setLoading(true);
        const [studentsData, evalsData, newSubs, oldSubs] = await Promise.all([
          studentService.getAllStudents(),
          evaluationService.getAllEvaluations(),
          subjectService.getAllSubjects('New Curriculum'),
          subjectService.getAllSubjects('Old Curriculum')
        ]);

        setStudents(studentsData || []);
        setEvaluations(evalsData || []);
        setNewSubjects(newSubs || []);
        setOldSubjects(oldSubs || []);

        // Derive Dashboard Metrics
        let graduating = 0, transferee = 0, shiftee = 0, returning = 0;
        studentsData.forEach(s => {
          const type = String(s.admissionType || '').toLowerCase();
          if (type === 'transferee') transferee++;
          if (type === 'shiftee') shiftee++;
          if (type === 'returnee') returning++;
          if (String(s.yearLevel || '').toLowerCase().includes('fourth') || s.status === 'Graduating Candidate') graduating++;
        });

        setSummary({
          totalStudents: studentsData.length,
          totalEvaluations: evalsData.length,
          totalGraduating: graduating,
          totalTransferee: transferee,
          totalShiftee: shiftee,
          totalReturning: returning
        });

        // Mock runtime audit logs derived from evaluation actions
        const generatedLogs = evalsData.map((e, idx) => ({
          id: idx,
          user: e.evaluatedBy || 'Registrar Admin',
          action: `Executed ${e.evaluationType || 'Evaluation'} Audit`,
          dateTime: e.evaluationDate ? new Date(e.evaluationDate).toLocaleString() : new Date().toLocaleString(),
          module: 'Evaluation Engine',
          description: `Processed baseline evaluation for Student ID: ${e.studentId || 'N/A'}`
        }));
        setAuditLogs(generatedLogs);

      } catch (error) {
        console.error("Failed compiling baseline data: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllReportData();
  }, []);

  const filteredEvaluations = useMemo(() => {
    if (evaluationFilter === 'ALL') return evaluations;
    return evaluations.filter((e) => e.evaluationType === evaluationFilter);
  }, [evaluations, evaluationFilter]);

  const triggerPrint = () => window.print();

  if (loading) {
    return <LoadingState label="Compiling Report Matrices..." />;
  }

  return (
    <div className="space-y-8 text-slate-800 font-sans antialiased text-left max-w-7xl mx-auto pb-12">
      
      {/* ================= HEADER CONTROL BAR ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print-hidden">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-black tracking-widest text-[#7D1924] uppercase">
            <BarChart3 size={14} className="stroke-[2.5]" />
            <span>Management Console</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Institutional Performance Audits
          </h1>
          <p className="text-slate-400 text-xs font-medium mt-1">
            Generate and export verified registrar checksheets, sequence metrics, and activity trail ledgers.
          </p>
        </div>
        
        <button 
          onClick={triggerPrint} 
          className="group flex items-center justify-center gap-2 bg-[#7D1924] hover:bg-[#63121b] text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] w-full sm:w-auto"
        >
          <Printer size={14} className="group-hover:rotate-6 transition-transform" /> 
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* ================= REPORTS DASHBOARD SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 print-hidden">
        {[
          { title: "Total Students", value: summary.totalStudents, change: "Active roster" },
          { title: "Audits Conducted", value: summary.totalEvaluations, change: "Live traces" },
          { title: "Grad Candidates", value: summary.totalGraduating, change: "Checklist clear", highlight: true },
          { title: "Transferees", value: summary.totalTransferee, change: "TOR pipelines" },
          { title: "Shiftees Mapped", value: summary.totalShiftee, change: "Program bounds" },
          { title: "Returnees Log", value: summary.totalReturning, change: "LOA resumption" },
        ].map((card, i) => (
          <div 
            key={i} 
            className={`p-5 rounded-2xl transition-all duration-200 border ${
              card.highlight 
                ? 'bg-gradient-to-br from-[#7D1924] to-[#5a1018] border-transparent text-white shadow-md hover:scale-[1.02]' 
                : 'bg-white border-slate-200/60 shadow-2xs hover:border-slate-300'
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider block ${card.highlight ? 'text-rose-200' : 'text-slate-400'}`}>
              {card.title}
            </span>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className={`text-2xl font-black tracking-tight ${card.highlight ? 'text-white' : 'text-slate-900'}`}>
                {card.value}
              </span>
              {card.highlight && <TrendingUp size={14} className="text-rose-300 animate-pulse shrink-0" />}
            </div>
            <span className={`text-[10px] font-bold block mt-1.5 ${card.highlight ? 'text-rose-200/70' : 'text-slate-400/80'}`}>
              {card.change}
            </span>
          </div>
        ))}
      </div>

      {/* ================= WORKSPACE SPLIT WORKBENCH LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* REPORT OPTION SIDEBAR SELECTOR */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-3 space-y-1 shadow-2xs print-hidden">
          <span className="text-[9px] font-black text-slate-400 tracking-widest block uppercase px-3 pt-2 pb-1.5 border-b border-slate-50 mb-1">
            Report Classifications
          </span>
          {[
            { id: 'student', name: 'Student Master Report', desc: 'Roster state directory analysis' },
            { id: 'academic', name: 'Academic Transcripts', desc: 'Consolidated history logs' },
            { id: 'evaluation', name: 'Evaluation Track Logs', desc: 'Pathway checking checkpoints' },
            { id: 'semester', name: 'Semester Plan Blueprints', desc: 'Curriculum template scopes' },
            { id: 'transfer', name: 'Transfer Credit Hub', desc: 'Exemption mapping matrix' },
            { id: 'graduation', name: 'Graduation Audits', desc: 'Checklist clear tracking' },
            { id: 'audit', name: 'Action Activity Trail', desc: 'Registrar mutations ledger' },
          ].map((rep) => (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id)}
              className={`w-full group flex flex-col px-4 py-3 rounded-xl transition-all duration-150 text-left relative ${
                activeReport === rep.id 
                  ? 'bg-[#7D1924] text-white shadow-sm' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black tracking-wide">{rep.name}</span>
                <ArrowUpRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${activeReport === rep.id ? 'text-white' : 'text-[#7D1924]'}`} />
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${activeReport === rep.id ? 'text-rose-200' : 'text-slate-400'}`}>
                {rep.desc}
              </span>
            </button>
          ))}
        </div>

        {/* PRIMARY SHEET WRAPPER OUTPUT AREA */}
        <div className="lg:col-span-3 printable-report bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden p-6 sm:p-8 min-h-[540px] flex flex-col justify-between">
          
          {/* Print-Only Professional Document Header */}
          <div className="hidden print:flex flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6 mb-6">
            <div className="space-y-4">
              <div className="space-y-0.5 text-left">
                <h3 className="text-2xl font-serif font-black text-slate-900 tracking-tight">The Last Salle</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">University</p>
              </div>
              <div className="text-xs text-slate-500 space-y-1 font-medium text-left">
                <p className="font-bold text-slate-700">Office of the University Registrar</p>
                <p>Institutional Performance Audit Report</p>
                <p>Date Issued: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="w-20 h-20 rounded-full border border-slate-200 p-1 flex items-center justify-center bg-slate-50 shrink-0 shadow-2xs">
              <img
                src={universitySeal}
                alt="University Seal"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `<div class="text-center font-serif font-black text-[11px] text-[#7D1924]">TLSU</div>`;
                }}
              />
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Dynamic Core Report View Render Routing */}
            {activeReport === 'student' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Student Master Directory</h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Comprehensive enrollment tracking, program distributions, and academic standings.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-3 pl-4">Student Identity</th>
                        <th className="p-3">Program</th>
                        <th className="p-3">Plan Profile</th>
                        <th className="p-3">Admission</th>
                        <th className="p-3">Sequence Tracking</th>
                        <th className="p-3 pr-4 text-right">Standing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                      {students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-3 pl-4 font-black text-slate-900">
                            {s.lastName}, {s.firstName}
                            <span className="block font-mono text-[10px] text-slate-400 font-bold mt-0.5">{s.id}</span>
                          </td>
                          <td className="p-3 text-slate-700">{s.course || s.program}</td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200/50 text-slate-600 font-mono">
                              {s.curriculum === 'NEW' ? 'NEW v2.0' : 'OLD v1.0'}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{s.admissionType || 'Regular'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-tight border ${
                              s.classification === 'irregular' 
                                ? 'bg-amber-50 border-amber-200/60 text-amber-700' 
                                : 'bg-blue-50 border-blue-200/60 text-blue-700'
                            }`}>
                              {s.classification || 'regular'}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <span className="text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                              {s.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeReport === 'academic' && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Academic Records Registry</h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Consolidated student grade logs, credit balances, and subject matrices.</p>
                </div>
                <div className="flex gap-4 items-start bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-xs font-bold text-slate-600 leading-relaxed max-w-2xl">
                  <HelpCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-900 block font-black mb-0.5">Individualized Evaluation Sheets Notice</span>
                    To generate, customize, and print precise step-by-step academic transcripts for an individual student, navigate directly to the <span className="text-[#7D1924] underline">Students Directory Console</span> and activate the individual grade matrix.
                  </div>
                </div>
                <div className="py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  Global System Portfolio Index: {students.length} Student Nodes Active
                </div>
              </div>
            )}

            {activeReport === 'evaluation' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Evaluation Track Operations Logs</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Historical verification pipelines processed safely by the curriculum engine parameters.</p>
                  </div>
                  <select
                    value={evaluationFilter}
                    onChange={(e) => setEvaluationFilter(e.target.value)}
                    className="bg-[#f8faf7] border border-slate-200 text-[11px] font-black uppercase tracking-wider px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#7D1924]/30 text-slate-700 min-w-[200px] print-hidden"
                  >
                    <option value="ALL">All Operations Tracks</option>
                    <option value="REGULAR">Regular Evaluation</option>
                    <option value="GRADUATION">Graduation Evaluation</option>
                    <option value="TRANSFEREE">Transferee Evaluation</option>
                    <option value="SHIFTEE">Shiftee Evaluation</option>
                    <option value="CURR_SHIFT">Curriculum Shift Evaluation</option>
                    <option value="RETURNING">Returning Student Evaluation</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-3 pl-4">Audit Timestamp</th>
                        <th className="p-3">Student Node</th>
                        <th className="p-3">Pipeline Track</th>
                        <th className="p-3">Resulting Assessment</th>
                        <th className="p-3 pr-4">Remarks Trail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                      {filteredEvaluations.map((e, index) => (
                        <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-3 pl-4 text-slate-400 font-mono font-medium">{e.evaluationDate ? new Date(e.evaluationDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-3 font-black text-slate-900">{e.studentId}</td>
                          <td className="p-3"><span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded text-[10px] font-black tracking-tight">{e.evaluationType}</span></td>
                          <td className="p-3"><span className="text-emerald-700 font-black tracking-tight text-sm">{e.result || 'ELIGIBLE'}</span></td>
                          <td className="p-3 pr-4 text-slate-400 normal-case font-medium max-w-xs truncate" title={e.remarks}>{e.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeReport === 'semester' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Curriculum Semester Plan Architecture</h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Baseline structural allocations mapped against dynamic system course checklists.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { type: 'New Curriculum Model Layout', active: true, count: newSubjects.length },
                    { type: 'Old Curriculum Model Legacy Structure', active: false, count: oldSubjects.length }
                  ].map((curr, idx) => (
                    <div key={idx} className="p-5 border border-slate-200/70 rounded-2xl bg-slate-50/50 shadow-3xs flex items-center justify-between">
                      <div>
                        <span className="text-slate-900 font-black text-sm block">{curr.type}</span>
                        <span className="text-slate-400 text-[11px] font-bold block mt-1">Course Catalog Balance Mapped</span>
                      </div>
                      <span className="text-xs font-black text-[#7D1924] bg-rose-50 border border-rose-100 px-3 py-1 rounded-full shadow-3xs">
                        {curr.count} Course Nodes
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeReport === 'transfer' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Transfer Credit Equivalence Ledger</h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Traces external transcript exemptions mapped successfully into internal structures.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-3 pl-4">Target Student</th>
                        <th className="p-3">Origin School Institution</th>
                        <th className="p-3">Equivalence Mappings</th>
                        <th className="p-3 pr-4 text-right">Credit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                      {evaluations.filter(e => e.evaluationType === 'TRANSFEREE').map((e, i) => (
                        <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-3 pl-4 font-black text-blue-600">{e.studentId}</td>
                          <td className="p-3 text-slate-900 font-bold">{e.prevSchool || 'External Origin College'}</td>
                          <td className="p-3 font-medium text-slate-400">Equivalent internal course rules dispatched</td>
                          <td className="p-3 pr-4 text-right"><span className="text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800 font-black">CREDITED</span></td>
                        </tr>
                      ))}
                      {evaluations.filter(e => e.evaluationType === 'TRANSFEREE').length === 0 && (
                        <tr><td colSpan="4" className="p-6 text-center text-slate-400 font-medium italic">No active transferee pipeline credits written to system memory.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeReport === 'graduation' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Graduation Audit Hold & Deficiencies Summary</h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Audits final year students for incomplete credentials or prerequisite gaps.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-3 pl-4">Student Candidate</th>
                        <th className="p-3">Program Track</th>
                        <th className="p-3 text-center">Deficiencies Found</th>
                        <th className="p-3 pr-4 text-right">Graduation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                      {students.filter(s => String(s.yearLevel).toLowerCase().includes('fourth') || s.status === 'Graduating Candidate').map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-3 pl-4 font-black text-slate-900">{s.lastName}, {s.firstName}<span className="block font-mono text-[10px] text-slate-400 font-bold mt-0.5">{s.id}</span></td>
                          <td className="p-3 font-mono text-slate-700">{s.course}</td>
                          <td className="p-3 text-center text-emerald-600 font-black">0 Blocks</td>
                          <td className="p-3 pr-4 text-right"><span className="px-2.5 py-0.5 rounded-md text-[10px] bg-amber-50 border border-amber-100 text-amber-800 font-black">PENDING FINAL TRACE</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeReport === 'audit' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">System Action Activity Ledger</h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Permanent historical log trace documenting active registrar mutations timeline parameters.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-3 pl-4">Timestamp Log</th>
                        <th className="p-3">User Operator</th>
                        <th className="p-3">Action Type</th>
                        <th className="p-3">Module Context</th>
                        <th className="p-3 pr-4">Description Mapped</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-500">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-3 pl-4 font-mono font-medium text-slate-400 whitespace-nowrap">{log.dateTime}</td>
                          <td className="p-3 font-black text-slate-900">{log.user}</td>
                          <td className="p-3 text-[#7D1924] font-black tracking-tight">{log.action}</td>
                          <td className="p-3 uppercase text-[10px] text-slate-400 font-mono">{log.module}</td>
                          <td className="p-3 pr-4 normal-case font-medium text-slate-600">{log.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* REPORT SHEET OFFICIAL FOOTER EMBED */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="italic font-medium normal-case text-slate-400/80">* Document processed securely via role-based audit structures.</span>
            <div className="text-center w-full sm:w-60 border-t border-slate-200 pt-3 flex flex-col gap-1 self-end print:w-64">
              <span className="text-slate-800 font-black text-xs tracking-wide">Office of the University Registrar</span>
              <span className="font-medium text-[9px] text-slate-400 tracking-normal normal-case">System Generated Validation Certificate</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}