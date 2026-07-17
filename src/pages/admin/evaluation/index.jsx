<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X, Printer, FileText, LayoutDashboard, ShieldAlert, Award, Sparkles, ClipboardList, CheckCircle2, History, AlertTriangle, User, Calendar, RefreshCw, Check, Ban
=======
import { useCallback, useEffect, useState, useRef } from 'react';
import { 
  Award, ClipboardList, Calendar, User, Search, ChevronDown
>>>>>>> 1ab297b (reports)
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { evaluationService } from '../../../services/evaluationService';
import { studentService } from '../../../services/studentService';

// --- CONFIG & UTILS IMPORT ---
import { MAX_UNITS_CONFIG, normalizeYear, normalizeSemester } from '../../../services/curriculumConfig';
import { collection, onSnapshot, addDoc, query, where } from 'firebase/firestore';
import { db } from '../../../services/firebase';

// --- DECOUPLED CHILD UI LAYOUT IMPORTS ---
import GraduationPipelineView from './components/GraduationPipelineView';
import TransfereeShifteeView from './components/TransfereeShifteeView';
import GeneralWorkspaceView from './components/GeneralWorkspaceView';
import CurriculumShiftView from './components/CurriculumShiftView';
import CourseEntryPanel from './components/CourseEntryPanel';
import TransferReviewPanel from './components/TransferReviewPanel';
import { createEntryRow, validateEntries } from './utils/courseEntryValidation';
import PrintReportModal from './components/PrintReportModal';

export default function AdminEvaluationPage() {
<<<<<<< HEAD
  const { user } = useAuth();
  // --- CORE MODULE VIEW LAYER MANAGER ---
  const [moduleView, setModuleView] = useState('workspace'); // 'dashboard' | 'workspace' | 'history-logs'
  // --- CORE DATA REGISTRIES ---
=======
  const [moduleView, setModuleView] = useState('workspace'); // 'workspace' | 'history-logs'
>>>>>>> 1ab297b (reports)
  const [evaluations, setEvaluations] = useState([]);
  const [students, setStudents] = useState([]);
  const [newSubjectsCatalog, setNewSubjectsCatalog] = useState([]);
  const [oldSubjectsCatalog, setOldSubjectsCatalog] = useState([]);
  const [curriculumMappings, setCurriculumMappings] = useState({});
  const [auditTrails, setAuditTrailLogs] = useState([]);
  
  // Searchable Select States
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef(null);

  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const strategyRef = useRef(null);
  
  const [studentSubjectsHistory, setStudentSubjectsHistory] = useState([]);
  const [evaluationStrategy, setEvaluationStrategy] = useState('regular');
  const [registrarRemarks, setRegistrarRemarks] = useState('');
  const [manualOverrides, setManualOverrides] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeReportData, setActiveReportData] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState('equivalence');

  const selectedStudentData = students.find(s => s.id === selectedStudentId) || null;

  const activeStudentCurriculum = selectedStudentData
    ? (() => {
      const startYear = parseInt(selectedStudentData.academicYear?.split('-')[0], 10);
      return (!isNaN(startYear) && startYear <= 2025) ? 'Old Curriculum' : 'New Curriculum';
    })()
    : 'New Curriculum';

  const strategyMap = {
    regular: { label: 'Regular Evaluation (Semester Checking)', desc: 'Standard semester progression check' },
    graduation: { label: 'Graduation Evaluation (Final Checklist Audit)', desc: 'Final graduation clearance check' },
    transferee: { label: 'Transferee Evaluation (TOR Comparative Hub)', desc: 'Incoming unit mapping validation' },
    shiftee: { label: 'Shiftee Evaluation (BSU Program Comparison)', desc: 'Internal shift credit adjustment' },
    'curr-shift': { label: 'Curriculum Shift Evaluation (Plan Bridging)', desc: 'Transition checks for catalog phase shifts' },
    returning: { label: 'Returning Student Evaluation (LOA Progression Resume)', desc: 'Re-entry checklist checks' }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (strategyRef.current && !strategyRef.current.contains(event.target)) setIsStrategyOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedStudentData) {
      const type = String(selectedStudentData.admissionType || 'freshman').toLowerCase();
      if (type === 'freshman' || type === 'regular') setEvaluationStrategy('regular');
      else if (type === 'transferee') setEvaluationStrategy('transferee');
      else if (type === 'shiftee') setEvaluationStrategy('shiftee');
      else if (type === 'returnee') setEvaluationStrategy('returning');
    }
  }, [selectedStudentId, selectedStudentData]);

  const maxAllowedUnits = (() => {
    if (!selectedStudentData) return 21;
    const cKey = activeStudentCurriculum === 'New Curriculum' ? 'new_curriculum' : 'old_curriculum';
    const cleanYear = normalizeYear(selectedStudentData.yearLevel);
    const cleanSemesterVal = normalizeSemester(selectedStudentData.semester);
    const semShort = cleanSemesterVal === '2nd' ? '2' : cleanSemesterVal === 'summer' ? 'mid' : '1';
    return MAX_UNITS_CONFIG[cKey]?.[`y${cleanYear}_s${semShort}`] || 21;
  })();

  const minAllowedUnits = (() => {
    if (!selectedStudentData) return 15;
    const cleanSemesterVal = normalizeSemester(selectedStudentData.semester);
    return cleanSemesterVal === 'summer' ? 3 : 15;
  })();

  const loadPageData = useCallback(async () => {
    try {
      const [evalsData, studentsData] = await Promise.all([
        evaluationService.getAllEvaluations(),
        studentService.getAllStudents()
      ]);
      setEvaluations(evalsData);
      setStudents(studentsData);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    const unsubNew = onSnapshot(collection(db, 'new_subjects'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
      setNewSubjectsCatalog(list);
    });
    const docOld = onSnapshot(collection(db, 'old_subjects'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
      setOldSubjectsCatalog(list);
    });
    const unsubMappings = onSnapshot(collection(db, 'curriculum_mappings'), (snapshot) => {
      const mappingObj = {};
      snapshot.forEach((doc) => { mappingObj[doc.id] = doc.data(); });
      setCurriculumMappings(mappingObj);
    });
    const unsubAudit = onSnapshot(collection(db, 'evaluation_history'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
      setAuditTrailLogs(list.sort((a, b) => b.evaluationDate.localeCompare(a.evaluationDate)));
    });
    return () => { unsubNew(); docOld(); unsubAudit(); };
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    const unsubHistory = onSnapshot(
      query(collection(db, 'studentSubjects'), where('studentId', '==', selectedStudentId)),
      (snapshot) => {
        const hist = [];
        snapshot.forEach(doc => hist.push({ id: doc.id, ...doc.data() }));
        setStudentSubjectsHistory(hist);
      }
    );
    return () => { unsubHistory(); };
  }, [selectedStudentId]);

  const handleStudentSelect = (id) => {
    setSelectedStudentId(id);
    setManualOverrides({});
<<<<<<< HEAD
    // The keyed transcript belongs to the previous student: never carry it across.
    setBridgingEntries([createEntryRow()]);
    setBridgingRun(null);
    setBridgingOverrides({ rejectedMatches: [], manualTransfers: {} });
    setTransfersConfirmed(false);
    if (!val) {
=======
    setIsDropdownOpen(false);
    setDropdownSearch('');
    if (!id) {
>>>>>>> 1ab297b (reports)
      setStudentSubjectsHistory([]);
      setRegistrarRemarks('');
    }
  };

<<<<<<< HEAD
  const handleAddOverride = (e) => {
    e.preventDefault();
    if (!overrideForm.extCode) return alert("Select an external subject code.");

    setManualOverrides(prev => ({
      ...prev,
      [overrideForm.extCode.toUpperCase()]: {
        action: overrideForm.action,
        bsuCode: overrideForm.action === 'approve' ? overrideForm.bsuCode.toUpperCase() : '',
        reason: overrideForm.reason
      }
    }));
    setOverrideForm({ extCode: '', action: 'approve', bsuCode: '', reason: '' });
  };

  const handleRemoveOverride = (extCode) => {
    const updated = { ...manualOverrides };
    delete updated[extCode.toUpperCase()];
    setManualOverrides(updated);
  };

  // FIXED: Added bsuEquivalentCode and bsuEquivalentTitle to ensure fields write properly to database[cite: 2]
  const handleAddManualSubjectFromTransferee = async (subjectPayload) => {
    if (!selectedStudentId) return;
    try {
      await addDoc(collection(db, 'studentSubjects'), {
        studentId: selectedStudentId,
        subjectCode: subjectPayload.subjectCode.toUpperCase(),
        subjectTitle: subjectPayload.subjectTitle,
        units: subjectPayload.units,
        grade: subjectPayload.grade,
        status: subjectPayload.status,
        termSaved: subjectPayload.termSaved,
        isManualEntry: true,
        semesterTaken: subjectPayload.semesterTaken || '1st Semester',
        yearLevelTaken: subjectPayload.yearLevelTaken || 'First Year',
        academicYearTaken: subjectPayload.academicYearTaken || '2025-2026',
        bsuEquivalentCode: subjectPayload.bsuEquivalentCode || 'UNMAPPED',
        bsuEquivalentTitle: subjectPayload.bsuEquivalentTitle || 'Exception Credit',
        recordedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to add manual entry to Firestore: ", err);
      alert("Failed to save transcript entry.");
    }
  };

  const handleDeleteManualSubjectFromTransferee = async (subjectId) => {
    try {
      await deleteDoc(doc(db, 'studentSubjects', subjectId));
    } catch (err) {
      console.error("Failed to delete transcript entry: ", err);
      alert("Failed to delete entry.");
    }
  };

=======
>>>>>>> 1ab297b (reports)
  const handleFinalizeEvaluationMatrix = async () => {
    if (!selectedStudentId || !auditOutput) return;
    if (isCurrentEvaluationFinalized) return;
    if (evaluationStrategy === 'curr-shift' && isBridgingStale) {
      return alert('The transcript has changed since this evaluation was run. Re-run the evaluation before finalizing.');
    }
    if (evaluationStrategy === 'curr-shift' && !transfersConfirmed) {
      return alert('Confirm the transfer decisions before finalizing this evaluation.');
    }
    setIsSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const payload = {
        evaluationDate: timestamp,
<<<<<<< HEAD
        evaluatedBy: user?.email || "Registrar Executive Terminal Office",
        finalizedBy: { uid: user?.uid || null, email: user?.email || null },
        evaluationType: strategyLabel(evaluationStrategy),
=======
        evaluatedBy: "Registrar Executive Terminal Office",
        evaluationType: String(evaluationStrategy).toUpperCase().replace('-', '_'),
>>>>>>> 1ab297b (reports)
        studentId: selectedStudentId,
        result: auditOutput.overallEligibility,
        remarks: registrarRemarks || `Executed systematic evaluation pipeline path: ${evaluationStrategy}.`,
        recordedLoadUnits: auditOutput.simulatedLoad || 0,
        deficienciesLog: auditOutput.deficiencies || [],
<<<<<<< HEAD
        prevSchool: evaluationStrategy === 'transferee' ? prevSchoolName : 'Batangas State University',
        prevProgram: evaluationStrategy === 'shiftee' ? selectedStudentData?.program || 'BSIT (Software Engineering)' : prevProgram,
        newProgram: evaluationStrategy === 'shiftee' ? newShifteeProgram : null,
        manualOverrides: manualOverrides,
        // Immutable once written: firestore.rules denies update/delete on evaluation_history.
        isFinalized: true,
        finalizedAt: timestamp
      };
      const studentProfileUpdates = {};
      if (['transferee', 'shiftee', 'returning'].includes(evaluationStrategy)) {
        studentProfileUpdates.classification = 'irregular';
      }
      if (evaluationStrategy === 'shiftee' && newShifteeProgram) {
        studentProfileUpdates.program = newShifteeProgram;
      }
      if (Object.keys(studentProfileUpdates).length > 0) {
        await studentService.updateStudent(selectedStudentId, studentProfileUpdates);
      }
      if (evaluationStrategy === 'transferee' && auditOutput.creditedList?.length > 0) {
        const batchPromises = auditOutput.creditedList.map(subject => {
          const exists = studentSubjectsHistory.some(s => s.subjectCode === subject.code.toUpperCase());
          if (exists) return Promise.resolve();
          return addDoc(collection(db, 'studentSubjects'), {
            studentId: selectedStudentId,
            subjectCode: subject.code.toUpperCase(),
            subjectTitle: subject.title,
            units: subject.units,
            grade: subject.grade || '3.0',
            status: 'credited',
            termSaved: 'Transferred/Credited',
            dateEvaluated: timestamp
          });
        });
        await Promise.all(batchPromises);
      }
      await addDoc(collection(db, 'evaluation_history'), payload);
      alert(`Evaluation completed. Student status finalized as: ${auditOutput.overallEligibility}. Student master record has been synchronized.`);
      await loadPageData();
      if (evaluationStrategy !== 'curr-shift') setModuleView('dashboard');
=======
        manualOverrides: manualOverrides
      };

      await addDoc(collection(db, 'evaluation_history'), payload);
      alert(`Evaluation completed. Student status finalized as: ${auditOutput.overallEligibility}.`);
      await loadPageData();
      setModuleView('workspace');
>>>>>>> 1ab297b (reports)
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerReportModalOpen = (typeLabel) => {
    if (!selectedStudentData || !auditOutput) return alert('Select student profile first.');
    setActiveReportData({
      type: typeLabel,
      studentId: selectedStudentId,
      srCode: selectedStudentData.srCode || selectedStudentId,
      name: `${selectedStudentData.lastName}, ${selectedStudentData.firstName}`,
      curriculum: activeStudentCurriculum === 'New Curriculum' ? 'NEW' : 'OLD',
      eligibility: auditOutput.overallEligibility,
      evaluatedBy: user?.email || 'Office of the University Registrar',
      timestamp: new Date().toLocaleString(),
      summary: auditOutput
    });
    setIsReportModalOpen(true);
  };

  const runCurriculumEvaluationSummary = () => {
    if (!selectedStudentData) return null;
    const catalog = activeStudentCurriculum === 'New Curriculum' ? newSubjectsCatalog : oldSubjectsCatalog;
    
    const completedSubjectsList = studentSubjectsHistory.filter(s => s.status === 'passed' || (parseFloat(s.grade) >= 1.0 && parseFloat(s.grade) <= 3.0));
    const failedSubjectsList = studentSubjectsHistory.filter(s => s.grade === '5.00' || s.status === 'failed' || s.status === 'failed-retake' || s.status === 'incomplete');
    const remainingSubjectsList = catalog.filter(catItem => !completedSubjectsList.some(comp => comp.subjectCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === catItem.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()));

    return {
      completionPercentage: catalog.length > 0 ? ((completedSubjectsList.length / catalog.length) * 100).toFixed(1) : '0.0',
      totalRequired: catalog.length,
      recommendedStudyPlan: remainingSubjectsList.slice(0, 6), // Simple recommendation projection path
      simulatedLoad: remainingSubjectsList.slice(0, 6).reduce((acc, c) => acc + (parseInt(c.creditUnits || c.units) || 3), 0),
      completedSubjectsList,
      failedSubjectsList,
      remainingSubjectsList
    };
  };

  const auditOutput = runCurriculumEvaluationSummary();
  const filteredHistoryLogs = auditTrails.filter(log => log.studentId?.toLowerCase().includes(historySearchQuery.toLowerCase()));
  const filteredStudents = students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(dropdownSearch.toLowerCase()) || s.id.toLowerCase().includes(dropdownSearch.toLowerCase()));

  return (
    <div className="p-6 bg-[#f8faf7] min-h-screen text-slate-800 font-sans antialiased space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="text-[#7D1924]" size={24}/> Evaluation Processing Matrix
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Automated rule verification console across multiple dynamic entry paths.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border gap-1">
          <button onClick={() => setModuleView('workspace')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${moduleView === 'workspace' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}>Audit Workspace</button>
          <button onClick={() => setModuleView('history-logs')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${moduleView === 'history-logs' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}>History Trails</button>
        </div>
      </div>
      
      {moduleView === 'workspace' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">1. Target Profile Student Node</label>
              <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full border border-slate-200 bg-slate-50/50 p-3 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:bg-white hover:border-slate-300 transition-all min-h-[42px]">
                <span className={selectedStudentData ? 'text-slate-900' : 'text-slate-400'}>{selectedStudentData ? `${selectedStudentData.lastName}, ${selectedStudentData.firstName} (${selectedStudentData.id})` : 'Select Student...'}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 flex flex-col overflow-hidden max-h-64">
                  <div className="p-2 border-b flex items-center gap-2 bg-slate-50/50">
                    <Search size={12} className="text-slate-400 shrink-0" />
                    <input type="text" placeholder="Search name or SR-Code..." value={dropdownSearch} onChange={(e) => setDropdownSearch(e.target.value)} className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-slate-800" autoFocus />
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y max-h-48 text-xs font-bold">
                    <div onClick={() => handleStudentSelect('')} className="p-3 text-slate-400 hover:bg-slate-50 cursor-pointer">Clear Selection</div>
                    {filteredStudents.map(s => (
                      <div key={s.id} onClick={() => handleStudentSelect(s.id)} className="p-3 text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                        <span>{s.lastName}, {s.firstName}</span><span className="text-[10px] text-slate-400">({s.id})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col relative" ref={strategyRef}>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">2. Choose Strategic Evaluation Track Pipeline</label>
              <div onClick={() => setIsStrategyOpen(!isStrategyOpen)} className="w-full border border-slate-200 bg-slate-50/50 p-3 rounded-xl text-xs font-black text-[#7D1924] flex items-center justify-between cursor-pointer hover:bg-white hover:border-slate-300 transition-all min-h-[42px]">
                <span>{strategyMap[evaluationStrategy]?.label || 'Regular Evaluation'}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isStrategyOpen ? 'rotate-180' : ''}`} />
              </div>
              {isStrategyOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
                  <div className="overflow-y-auto flex-1 divide-y max-h-72">
                    {Object.entries(strategyMap).map(([key, config]) => (
                      <div key={key} onClick={() => { setEvaluationStrategy(key); setIsStrategyOpen(false); }} className={`p-3.5 cursor-pointer flex flex-col gap-0.5 ${evaluationStrategy === key ? 'bg-slate-50 border-l-4 border-[#7D1924] pl-2.5' : 'hover:bg-slate-50 pl-3.5'}`}>
                        <span className="text-xs font-black">{config.label}</span><span className="text-[10px] text-slate-400 font-medium">{config.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedStudentData ? (
            <div className="space-y-6">
              <div className="bg-slate-50 border p-4 rounded-xl flex flex-wrap gap-x-6 gap-y-2 items-center text-xs font-bold text-slate-600 shadow-3xs">
                <div>Profile Target: <span className="text-slate-900 font-extrabold">{selectedStudentData.lastName}, {selectedStudentData.firstName}</span></div>
                <div>Admission Type: <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded uppercase font-black">{selectedStudentData.admissionType || 'Freshman'}</span></div>
                <div>Assigned Standing: <span className="text-slate-900">{selectedStudentData.yearLevel} ({selectedStudentData.semester})</span></div>
              </div>

              {evaluationStrategy === 'graduation' ? (
                <GraduationPipelineView auditOutput={auditOutput} handleTriggerReportModalOpen={handleTriggerReportModalOpen} handleFinalizeEvaluationMatrix={handleFinalizeEvaluationMatrix} isSubmitting={isSubmitting} />
              ) : ['transferee', 'shiftee'].includes(evaluationStrategy) ? (
                <TransfereeShifteeView evaluationStrategy={evaluationStrategy} selectedStudentData={selectedStudentData} studentSubjectsHistory={studentSubjectsHistory} auditOutput={auditOutput} handleTriggerReportModalOpen={handleTriggerReportModalOpen} handleFinalizeEvaluationMatrix={handleFinalizeEvaluationMatrix} isSubmitting={isSubmitting} />
              ) : (
                <GeneralWorkspaceView 
                  auditOutput={auditOutput} 
                  minAllowedUnits={minAllowedUnits} 
                  maxAllowedUnits={maxAllowedUnits} 
                  evaluationStrategy={evaluationStrategy}
                  handleTriggerReportModalOpen={handleTriggerReportModalOpen} // Explicit mapping to child view props
                  handleFinalizeEvaluationMatrix={handleFinalizeEvaluationMatrix} 
                  isSubmitting={isSubmitting} 
                  registrarRemarks={registrarRemarks}
                  setRegistrarRemarks={setRegistrarRemarks}
                  selectedStudentData={selectedStudentData}
                  studentSubjectsHistory={studentSubjectsHistory}
                  newSubjectsCatalog={newSubjectsCatalog}
                  oldSubjectsCatalog={oldSubjectsCatalog}
                />
              )}
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
              Please select a student record index above to initiate the unique track evaluation engine.
            </div>
          )}
        </div>
      )}

      {moduleView === 'history-logs' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4 text-left animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Historical Evaluation Checkpoints</h2>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Committed evaluation audit trails retrieved from the ledger.</p>
            </div>
            <input type="text" placeholder="Search Student ID..." value={historySearchQuery} onChange={e=>setHistorySearchQuery(e.target.value)} className="border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 focus:ring-1 focus:ring-slate-950 outline-none w-full sm:w-64 bg-slate-50/50" />
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b">
                <tr>
                  <th className="p-3">Committed Timestamp</th>
                  <th className="p-3">Target Student</th>
                  <th className="p-3">Pipeline Pathway</th>
                  <th className="p-3 text-center">Simulated Load</th>
                  <th className="p-3">Status Result</th>
                  <th className="p-3 pr-4">Remarks Log</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700 divide-y">
                {filteredHistoryLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50/40">
                    <td className="p-3 text-slate-400 font-mono">{log.evaluationDate ? new Date(log.evaluationDate).toLocaleString() : 'N/A'}</td>
                    <td className="p-3 font-bold text-slate-950">{log.studentId}</td>
                    <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase font-black">{log.evaluationType}</span></td>
                    <td className="p-3 text-center font-bold text-slate-900">{log.recordedLoadUnits || 0} U</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${log.result?.includes('ELIGIBLE') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>{log.result || 'ELIGIBLE'}</span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{log.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PrintReportModal isReportModalOpen={isReportModalOpen} activeReportData={activeReportData} setIsReportModalOpen={setIsReportModalOpen} />
    </div>
  );
}