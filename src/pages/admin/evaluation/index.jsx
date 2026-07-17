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
import CopyOfGradesMatrix from '../../../components/CopyOfGradesMatrix';
import PlanBridgingView from './components/PlanBridgingView';
import { evaluationService } from '../../../services/evaluationService';
import { studentService } from '../../../services/studentService';

// --- CONFIG & UTILS IMPORT ---
import { MAX_UNITS_CONFIG, normalizeYear, normalizeSemester } from '../../../services/curriculumConfig';
import { collection, onSnapshot, addDoc, query, where } from 'firebase/firestore';
import { db } from '../../../services/firebase';
<<<<<<< HEAD
// --- DECOUPLED INDEPENDENT UTILITY PIPELINES IMPORTS ---
import { runRegularEvaluation } from './utils/runRegularEvaluation';
import { runGraduationEvaluation } from './utils/runGraduationEvaluation';
import { runTransfereeEvaluation } from './utils/runTransfereeEvaluation';
import { runShifteeEvaluation } from './utils/runShifteeEvaluation';
import { runReturningStudentEvaluation } from './utils/runReturningStudentEvaluation';
import { runCurriculumShiftEvaluation } from './utils/runCurriculumShiftEvaluation';
=======

>>>>>>> dbf1f70a43f679a3a5368bb1972856fc189f8efd
// --- DECOUPLED CHILD UI LAYOUT IMPORTS ---
import GraduationPipelineView from './components/GraduationPipelineView';
import TransfereeShifteeView from './components/TransfereeShifteeView';
import GeneralWorkspaceView from './components/GeneralWorkspaceView';
import PrintReportModal from './components/PrintReportModal';

// Single source for the six pipeline tracks: drives the dropdown options and the
// section header, so a label can never drift between the two.
// `audit` names the track-specific work for the not-yet-implemented notice.
const EVALUATION_TRACKS = [
  { value: 'regular', label: 'Regular Evaluation (Semester Checking)', audit: 'Semester checking' },
  { value: 'graduation', label: 'Graduation Evaluation (Final Checklist Audit)', audit: 'Graduation checklist audit' },
  { value: 'transferee', label: 'Transferee Evaluation (TOR Comparative Hub)', audit: 'TOR comparative audit' },
  { value: 'shiftee', label: 'Shiftee Evaluation (BSU Program Comparison)', audit: 'BSU program comparison' },
  { value: 'curr-shift', label: 'Curriculum Shift Evaluation (Plan Bridging)', audit: 'Plan bridging audit' },
  { value: 'returning', label: 'Returning Student Evaluation (LOA Progression Resume)', audit: 'LOA progression resume' }
];

// Tracks with no track-specific audit wired up yet. These render the shared
// read-only grades base plus an explicit placeholder -- never invented numbers.
const UNIMPLEMENTED_TRACKS = [];

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
<<<<<<< HEAD
  // Guards finalize against a duplicate write once a snapshot has been
  // committed for this student + pipeline pairing.
  const [finalizedSnapshotKey, setFinalizedSnapshotKey] = useState('');
  // --- MANUAL OVERRIDES STATE FOR TRANSFEREES ---
  const [manualOverrides, setManualOverrides] = useState({}); // { [extCode]: { action: 'approve'|'reject', bsuCode: string, reason: string } }
  const [overrideForm, setOverrideForm] = useState({ extCode: '', action: 'approve', bsuCode: '', reason: '' });
  // --- UI TOGGLE VISIBILITY CONTROLS ---
=======
  const [manualOverrides, setManualOverrides] = useState({});
>>>>>>> dbf1f70a43f679a3a5368bb1972856fc189f8efd
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
=======
<<<<<<< HEAD
    // The keyed transcript belongs to the previous student: never carry it across.
    setBridgingEntries([createEntryRow()]);
    setBridgingRun(null);
    setBridgingOverrides({ rejectedMatches: [], manualTransfers: {} });
    setTransfersConfirmed(false);
>>>>>>> dbf1f70a43f679a3a5368bb1972856fc189f8efd
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

<<<<<<< HEAD
  const activeTrack = EVALUATION_TRACKS.find(t => t.value === evaluationStrategy) || EVALUATION_TRACKS[0];
  const isTrackUnimplemented = UNIMPLEMENTED_TRACKS.includes(evaluationStrategy);

  const evaluationSnapshotKey = `${selectedStudentId}::${evaluationStrategy}`;
  const isCurrentEvaluationFinalized = Boolean(selectedStudentId) && finalizedSnapshotKey === evaluationSnapshotKey;

=======
=======
>>>>>>> 1ab297b (reports)
>>>>>>> dbf1f70a43f679a3a5368bb1972856fc189f8efd
  const handleFinalizeEvaluationMatrix = async () => {
    if (!selectedStudentId || !auditOutput) return;
    if (isCurrentEvaluationFinalized) return;
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
      setFinalizedSnapshotKey(evaluationSnapshotKey);
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
<<<<<<< HEAD

    // --- CURRICULUM SHIFT LOGIC (3-YEAR LOA RULE) ---
    const CURRICULUM_SHIFT_LIMIT_YEARS = 3;
    const currentYear = new Date().getFullYear();
    const academicYearStr = selectedStudentData.academicYear || '';
    const lastActiveYear = parseInt(academicYearStr.split('-')[0], 10) || currentYear;
    const yearsSinceLastActive = currentYear - lastActiveYear;

    const storedCurriculumIsOld = selectedStudentData.curriculum !== 'NEW';
    const shouldForceNewCurriculum =
      evaluationStrategy === 'returning' &&
      storedCurriculumIsOld &&
      yearsSinceLastActive >= CURRICULUM_SHIFT_LIMIT_YEARS &&
      newSubjectsCatalog.length > 0;

    const effectiveCurriculum = shouldForceNewCurriculum ? 'NEW' : (selectedStudentData.curriculum || 'OLD');
    const catalog = effectiveCurriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog;

    const getCode = (course) => (course.courseCode || course.code || course.id || '').toUpperCase();
    const getTitle = (course) => course.courseTitle || course.title || course.id;
    const getUnits = (course) => parseInt(course.creditUnits || course.units || 3, 10);

    const subjectStatuses = {};
    const passedCodes = [];
    const activeCodes = [];

    // Helper utility to strictly strip punctuation, spaces, and capitalize (e.g. "GEd_102" & "GED 102" -> "GED102")
    const normalizeSubjectCode = (code) => {
      return String(code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
    };

    studentSubjectsHistory.forEach(s => {
      const rawCode = String(s.subjectCode || '').toUpperCase();
      // Normalize code so we can match it accurately against curriculum templates regardless of spacing or symbols
      const code = normalizeSubjectCode(rawCode);

      let determinedStatus = 'Not Taken';
      if (s.termSaved === 'Transferred/Credited' || s.status === 'credited' || s.isManualEntry) {
        determinedStatus = 'Credited';
        passedCodes.push(code);
      } else if (s.status === 'passed' || (parseFloat(s.grade) >= 1.0 && parseFloat(s.grade) <= 3.0)) {
        determinedStatus = 'Completed';
        passedCodes.push(code);
      } else if (['in progress', 'assigned', 'pending'].includes(String(s.status).toLowerCase())) {
        determinedStatus = 'In Progress';
        activeCodes.push(code);
      } else if (s.grade === '5.0' || s.status === 'failed' || s.status === 'failed-retake') {
        determinedStatus = 'Failed';
      } else if (String(s.grade).toUpperCase() === 'INC' || s.status === 'incomplete') {
        determinedStatus = 'Incomplete';
      } else if (['drop', 'w', 'withdrawn'].includes(String(s.grade).toLowerCase())) {
        determinedStatus = 'Withdrawn';
      }
      subjectStatuses[code] = { status: determinedStatus, grade: s.grade || '-', source: s.isManualEntry ? 'Transferred' : 'BSU' };
    });

    let pipelineResult;
    if (evaluationStrategy === 'curr-shift') {
      // Plan bridging reads the student's recorded grades directly -- the engine's
      // `enteredCourses` contract, sourced from Copy of Grades rather than keyed in.
      pipelineResult = runCurriculumShiftEvaluation({
        newSubjectsCatalog,
        oldSubjectsCatalog,
        curriculumMappings,
        enteredCourses: studentSubjectsHistory.map(s => ({
          courseCode: s.subjectCode,
          courseTitle: s.subjectTitle,
          units: s.units,
          grade: s.grade,
          academicYear: s.term,
          semester: s.semester
        })),
        studentData: selectedStudentData,
        creditBoundary: { min: minAllowedUnits, max: maxAllowedUnits }
      });
    } else if (evaluationStrategy === 'graduation') {
      pipelineResult = runGraduationEvaluation(catalog, subjectStatuses);
    } else if (evaluationStrategy === 'transferee') {
      pipelineResult = runTransfereeEvaluation(
        catalog,
        studentSubjectsHistory,
        selectedStudentData.semester,
        selectedStudentData.academicYear || "2026-2027",
        minAllowedUnits,
        maxAllowedUnits,
        manualOverrides
      );
    } else if (evaluationStrategy === 'shiftee') {
      pipelineResult = runShifteeEvaluation(catalog, subjectStatuses, passedCodes, selectedStudentData, newShifteeProgram);
    } else if (evaluationStrategy === 'returning') {
      pipelineResult = runReturningStudentEvaluation(catalog, subjectStatuses);
    } else {
      pipelineResult = runRegularEvaluation(catalog, subjectStatuses, passedCodes);
    }

    if (shouldForceNewCurriculum) {
      pipelineResult.alerts = [
        `Curriculum Shift Applied: Student has been inactive for ${yearsSinceLastActive} year(s), exceeding the ${CURRICULUM_SHIFT_LIMIT_YEARS}-year limit. The old curriculum is no longer available — this evaluation now uses the New Curriculum.`,
        ...(pipelineResult.alerts || [])
      ];
    }

    let recommendedStudyPlan = [];
    let simulatedLoad = 0;
    const targets = pipelineResult.subjectList || [];

    const getSubjectYearLevel = (code) => {
      const numberPart = code.match(/\d+/);
      if (numberPart) {
        const firstDigit = parseInt(numberPart[0].charAt(0), 10);
        return firstDigit >= 1 && firstDigit <= 4 ? firstDigit : 1;
      }
      return 1;
    };

    const studentAssignedYear = normalizeYear(selectedStudentData.yearLevel);
    const numericStudentYear = parseInt(studentAssignedYear, 10) || 1;
    const retakeableStatuses = evaluationStrategy === 'returning'
      ? ['Not Taken', 'Failed', 'Withdrawn', 'Incomplete']
      : ['Not Taken'];
    const sortedTargets = [...targets].filter(t => retakeableStatuses.includes(t.status)).sort((a, b) => getSubjectYearLevel(a.code) - getSubjectYearLevel(b.code));

    sortedTargets.forEach(rec => {
      const courseYear = getSubjectYearLevel(rec.code);
      const isAlreadyRecommended = recommendedStudyPlan.some(r => r.code === rec.code);
      const satisfiesSequencing = evaluationStrategy === 'returning'
        ? true
        : courseYear <= (numericStudentYear + 1);
      if (rec.prereqsCleared && satisfiesSequencing && !isAlreadyRecommended) {
        if (simulatedLoad + rec.units <= maxAllowedUnits) {
          recommendedStudyPlan.push(rec);
          simulatedLoad += rec.units;
        }
      }
    });

    // --- MULTI-TERM ROADMAP GENERATOR (RETURNING STUDENTS) ---
    // Groups catalog subjects by their ACTUAL curriculum yearLevel + semesterOffered
    // (e.g. "2nd Year - 1st Semester"), in curriculum order, but SKIPS any
    // year/semester group that has zero remaining subjects (i.e. already fully
    // completed/credited) — so the roadmap starts at wherever the student
    // actually still has work left, not always at 1st Year.
    let recommendedRoadmap = [];
    if (evaluationStrategy === 'returning') {
      const yearOrder = { '1st year': 1, '2nd year': 2, '3rd year': 3, '4th year': 4 };
      const semOrder = { '1st semester': 1, '2nd semester': 2, 'summer': 3, 'mid year': 3 };

      const groupsMap = new Map(); // key: "y-s" -> { yearLabel, semLabel, subjects: [] }

      catalog.forEach(course => {
        const code = getCode(course);
        const info = subjectStatuses[code] || { status: 'Not Taken' };
        if (!retakeableStatuses.includes(info.status)) return; // skip already completed/credited

        const yearLabelRaw = String(course.yearLevel || '1st Year').trim();
        const yearKey = yearLabelRaw.toLowerCase();
        const semArray = Array.isArray(course.semesterOffered) ? course.semesterOffered : [course.semesterOffered || '1st Semester'];
        const semLabelRaw = String(semArray[0] || '1st Semester').trim();
        const semKey = semLabelRaw.toLowerCase();

        const groupKey = `${yearKey}__${semKey}`;
        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            yearLabel: yearLabelRaw,
            semLabel: semLabelRaw,
            yearOrderVal: yearOrder[yearKey] ?? 99,
            semOrderVal: semOrder[semKey] ?? 99,
            subjects: []
          });
        }
        groupsMap.get(groupKey).subjects.push({
          code,
          title: getTitle(course),
          units: getUnits(course)
        });
      });

      recommendedRoadmap = Array.from(groupsMap.values())
        .filter(g => g.subjects.length > 0) // <-- skip fully-completed groups entirely
        .sort((a, b) => (a.yearOrderVal - b.yearOrderVal) || (a.semOrderVal - b.semOrderVal))
        .map(g => ({
          term: `${g.yearLabel} - ${g.semLabel}`,
          totalUnits: g.subjects.reduce((sum, s) => sum + s.units, 0),
          subjects: g.subjects
        }));
    }

    let warningAlerts = [...(pipelineResult.alerts || [])];
    if (simulatedLoad < minAllowedUnits && recommendedStudyPlan.length > 0) {
      warningAlerts.push(`Academic Warning: Load counter evaluates underload (${simulatedLoad} units). Minimum standard is ${minAllowedUnits} units.`);
    }

    const totalRequired = catalog.length;
    const passedOrCreditedCount = targets.filter(t => ['Completed', 'Credited'].includes(t.status)).length;
    const completionPercentage = totalRequired > 0 ? ((passedOrCreditedCount / totalRequired) * 100).toFixed(1) : pipelineResult.completionPercentage || '0.0';
=======
    const catalog = activeStudentCurriculum === 'New Curriculum' ? newSubjectsCatalog : oldSubjectsCatalog;
    
    const completedSubjectsList = studentSubjectsHistory.filter(s => s.status === 'passed' || (parseFloat(s.grade) >= 1.0 && parseFloat(s.grade) <= 3.0));
    const failedSubjectsList = studentSubjectsHistory.filter(s => s.grade === '5.00' || s.status === 'failed' || s.status === 'failed-retake' || s.status === 'incomplete');
    const remainingSubjectsList = catalog.filter(catItem => !completedSubjectsList.some(comp => comp.subjectCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === catItem.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()));
>>>>>>> dbf1f70a43f679a3a5368bb1972856fc189f8efd

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
<<<<<<< HEAD
              <select value={evaluationStrategy} onChange={e => setEvaluationStrategy(e.target.value)} className="w-full border border-slate-200 bg-white p-3 rounded-xl text-xs font-black text-blue-700 outline-none">
                {EVALUATION_TRACKS.map(track => (
                  <option key={track.value} value={track.value}>{track.label}</option>
                ))}
              </select>
=======
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
>>>>>>> dbf1f70a43f679a3a5368bb1972856fc189f8efd
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
<<<<<<< HEAD
          )}

          {/* SHARED READ-ONLY GRADES BASE -- rendered for every track.
              Keyed by track so switching pipelines remounts it and no collapse
              state survives from the previous track. */}
          {selectedStudentData && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 pb-1 border-b">
                <span className="w-1 h-3.5 bg-blue-600 rounded-xs" />
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">{activeTrack.label}</h4>
              </div>
              <CopyOfGradesMatrix
                key={evaluationStrategy}
                readOnly
                subjects={studentSubjectsHistory}
                fallbackYearLevel={selectedStudentData.yearLevel}
                subtitle="Read-only academic record grouped by Year Level and Semester."
                emptyMessage="No course records found for this student."
              />
              {evaluationStrategy === 'curr-shift' && auditOutput && (
                <PlanBridgingView auditOutput={auditOutput} />
              )}
              {isTrackUnimplemented && (
                <div className="text-center py-16 text-slate-400 font-semibold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ClipboardList className="mx-auto text-slate-300 mb-3" size={36} />
                  <p>{activeTrack.audit} is not yet implemented.</p>
                  <p className="mt-1 text-slate-300">The grades above are the student's recorded history only. No credited subjects, completion percentage, or required-units math has been computed for this track.</p>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC PIPELINE TEMPLATES DIRECT MOUNT ROUTER */}
          {selectedStudentData && evaluationStrategy === 'graduation' && auditOutput && (
            <GraduationPipelineView
              selectedStudentData={selectedStudentData}
              auditOutput={auditOutput}
              newSubjectsCatalog={newSubjectsCatalog}
              oldSubjectsCatalog={oldSubjectsCatalog}
              studentSubjectsHistory={studentSubjectsHistory}
              triggerReportModalOpen={handleTriggerReportModalOpen}
              handleFinalizeEvaluationMatrix={handleFinalizeEvaluationMatrix}
              isSubmitting={isSubmitting}
            />
          )}

          {/* NEW TRANSFEREE HIGH-PERFORMANCE WORKSPACE SPLIT-VIEW (HCI DESIGN)[cite: 2] */}
          {selectedStudentData && evaluationStrategy === 'transferee' && auditOutput && (
            <TransfereeShifteeView
              isTorComplete={isTorComplete}
              torValidationErrors={torValidationErrors}
              evaluationStrategy={evaluationStrategy}
              prevSchoolName={prevSchoolName}
              setPrevSchoolName={setPrevSchoolName}
              prevProgram={prevProgram}
              setPrevProgram={setPrevProgram}
              studentSubjectsHistory={studentSubjectsHistory}
              auditOutput={auditOutput}
              triggerReportModalOpen={handleTriggerReportModalOpen}
              handleFinalizeEvaluationMatrix={handleFinalizeEvaluationMatrix}
              isSubmitting={isSubmitting}
              onAddManualSubject={handleAddManualSubjectFromTransferee}
              onDeleteManualSubject={handleDeleteManualSubjectFromTransferee}
              bsuCatalog={activeStudentCurriculum === 'New Curriculum' ? newSubjectsCatalog : oldSubjectsCatalog}
              selectedStudentData={selectedStudentData}
            />
          )}

          {selectedStudentData && (evaluationStrategy === 'shiftee') && auditOutput && (
            <TransfereeShifteeView
              isTorComplete={isTorComplete}
              torValidationErrors={torValidationErrors}
              evaluationStrategy={evaluationStrategy}
              prevSchoolName={prevSchoolName}
              setPrevSchoolName={setPrevSchoolName}
              prevProgram={prevProgram}
              setPrevProgram={setPrevProgram}
              studentSubjectsHistory={studentSubjectsHistory}
              auditOutput={auditOutput}
              newShifteeProgram={newShifteeProgram}
              setNewShifteeProgram={setNewShifteeProgram}
              selectedStudentData={selectedStudentData}
              triggerReportModalOpen={handleTriggerReportModalOpen}
              handleFinalizeEvaluationMatrix={handleFinalizeEvaluationMatrix}
              isSubmitting={isSubmitting}
              onAddManualSubject={handleAddManualSubjectFromTransferee}
              onDeleteManualSubject={handleDeleteManualSubjectFromTransferee}
              bsuCatalog={activeStudentCurriculum === 'New Curriculum' ? newSubjectsCatalog : oldSubjectsCatalog}
            />
          )}

          {/* curr-shift owns its own read-only view (PlanBridgingView) and must not
              also mount the general workspace: that would render bridging output
              through a regular-evaluation lens and expose finalize controls. */}
          {selectedStudentData && !isTrackUnimplemented && evaluationStrategy !== 'curr-shift' && evaluationStrategy !== 'transferee' && evaluationStrategy !== 'shiftee' && evaluationStrategy !== 'graduation' && auditOutput && (
            <GeneralWorkspaceView
              auditOutput={auditOutput}
              minAllowedUnits={minAllowedUnits}
              maxAllowedUnits={maxAllowedUnits}
              evaluationStrategy={evaluationStrategy}
              triggerReportModalOpen={handleTriggerReportModalOpen}
              handleFinalizeEvaluationMatrix={handleFinalizeEvaluationMatrix}
              isSubmitting={isSubmitting}
              catalog={selectedStudentData.curriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog}
              studentSubjectsHistory={studentSubjectsHistory}
              onAddManualSubject={handleAddManualSubjectFromTransferee}
              onDeleteManualSubject={handleDeleteManualSubjectFromTransferee}
            />
          )}

          {!selectedStudentId && (
            <div className="text-center py-16 text-slate-400 font-semibold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ClipboardList className="mx-auto text-slate-300 mb-3" size={36} />
              <p>Please select a student record index above to initiate the unique track evaluation engine.</p>
=======
          ) : (
            <div className="border border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
              Please select a student record index above to initiate the unique track evaluation engine.
>>>>>>> dbf1f70a43f679a3a5368bb1972856fc189f8efd
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