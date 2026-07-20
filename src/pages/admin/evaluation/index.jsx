    import { useCallback, useEffect, useMemo, useState } from 'react';
    import {
      X, Printer, FileText, LayoutDashboard, ShieldAlert, Award, Sparkles, ClipboardList, CheckCircle2, History, AlertTriangle, User, Calendar, RefreshCw, Check, Ban
    } from 'lucide-react';
    import { useAuth } from '../../../context/AuthContext';
    import CopyOfGradesMatrix from '../../../components/CopyOfGradesMatrix';
    import PlanBridgingView from './components/PlanBridgingView';
    import { runCurriculumShiftEvaluation } from './utils/runCurriculumShiftEvaluation';
    import { evaluationService } from '../../../services/evaluationService';
    import { studentService } from '../../../services/studentService';
    // --- CONFIG & UTILS IMPORT ---
    import { MAX_UNITS_CONFIG, normalizeYear, normalizeSemester } from '../../../services/curriculumConfig';
    import { collection, onSnapshot, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
    import { db } from '../../../services/firebase';
    // --- DECOUPLED INDEPENDENT UTILITY PIPELINES IMPORTS ---
    import { runRegularEvaluation } from './utils/runRegularEvaluation';
    import { runGraduationEvaluation } from './utils/runGraduationEvaluation';
    import { runTransfereeEvaluation } from './utils/runTransfereeEvaluation';
    import { runShifteeEvaluation } from './utils/runShifteeEvaluation';
    import { runReturningStudentEvaluation } from './utils/runReturningStudentEvaluation';
    // --- DECOUPLED CHILD UI LAYOUT IMPORTS ---
    import DashboardOverview from './components/DashboardOverview';
    import GraduationPipelineView from './components/GraduationPipelineView';
    import TransfereeShifteeView from './components/TransfereeShifteeView';
    import GeneralWorkspaceView from './components/GeneralWorkspaceView';
    import PrintReportModal from './components/PrintReportModal';
    import StudentSearchSelect from '../../../components/ui/StudentSearchSelect';
    import SearchableSelect from '../../../components/ui/SearchableSelect';

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
      const { user } = useAuth();
      // --- CORE MODULE VIEW LAYER MANAGER ---
      const [moduleView, setModuleView] = useState('workspace'); // 'dashboard' | 'workspace' | 'history-logs'
      // --- CORE DATA REGISTRIES ---
      const [evaluations, setEvaluations] = useState([]);
      const [students, setStudents] = useState([]);
      const [newSubjectsCatalog, setNewSubjectsCatalog] = useState([]);
      const [oldSubjectsCatalog, setOldSubjectsCatalog] = useState([]);
      const [curriculumMappings, setCurriculumMappings] = useState({});
      const [auditTrails, setAuditTrailLogs] = useState([]);
      // --- SELECTED STUDENT ASSESSMENT TARGET STATES ---
      const [selectedStudentId, setSelectedStudentId] = useState('');
      const [studentSubjectsHistory, setStudentSubjectsHistory] = useState([]);
      // Evaluation Strategy Track Pipeline
      const [evaluationStrategy, setEvaluationStrategy] = useState('regular');
      const [registrarRemarks, setRegistrarRemarks] = useState('');
      // Guards finalize against a duplicate write once a snapshot has been
      // committed for this student + pipeline pairing.
      const [finalizedSnapshotKey, setFinalizedSnapshotKey] = useState('');
      // --- MANUAL OVERRIDES STATE FOR TRANSFEREES ---
      const [manualOverrides, setManualOverrides] = useState({}); // { [extCode]: { action: 'approve'|'reject', bsuCode: string, reason: string } }
      const [overrideForm, setOverrideForm] = useState({ extCode: '', action: 'approve', bsuCode: '', reason: '' });
      // --- UI TOGGLE VISIBILITY CONTROLS ---
      const [isSubmitting, setIsSubmitting] = useState(false);
      // --- REPORT GENERATION SUMMARY PREVIEWS ---
      const [activeReportData, setActiveReportData] = useState(null);
      const [isReportModalOpen, setIsReportModalOpen] = useState(false);
      // Search History State
      const [historySearchQuery, setHistorySearchQuery] = useState('');
      // Transferee / Shiftee Transcript Validation States
      const [prevSchoolName, setPrevSchoolName] = useState('Aparri State College');
      const [prevProgram, setPrevProgram] = useState('BS in Computer Science');
      const [newShifteeProgram, setNewShifteeProgram] = useState('BS in Information Technology (Business Analytics)');
      const [isTorComplete, setIsTorComplete] = useState(true);
      const [torValidationErrors, setTorValidationErrors] = useState([]);
      // Workspace sub-tabs
      const [workspaceTab, setWorkspaceTab] = useState('equivalence'); // 'equivalence' | 'curriculum' | 'optimizer'

      // Find selected student details on-the-fly to bypass cascading re-render effect warnings
      const selectedStudentData = students.find(s => s.id === selectedStudentId) || null;

      // AUTOMATED CURRICULUM ROUTING: Resolves context strictly from student profile timeline configuration
      const activeStudentCurriculum = selectedStudentData
        ? (() => {
          const startYear = parseInt(selectedStudentData.academicYear?.split('-')[0], 10);
          return (!isNaN(startYear) && startYear <= 2025) ? 'Old Curriculum' : 'New Curriculum';
        })()
        : 'New Curriculum';

      // Auto-switch evaluation strategy dropdown option based on selected student profile metadata admissionType[cite: 2]
      useEffect(() => {
        if (selectedStudentData) {
          const type = String(selectedStudentData.admissionType || 'freshman').toLowerCase();
          if (type === 'freshman' || type === 'regular') setEvaluationStrategy('regular');
          else if (type === 'transferee') setEvaluationStrategy('transferee');
          else if (type === 'shiftee') setEvaluationStrategy('shiftee');
          else if (type === 'returnee') setEvaluationStrategy('returning');
        }
      }, [selectedStudentId, selectedStudentData]);

      // Compute Allowed Units based on selected student details on-the-fly[cite: 2]
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

      // Load baseline collection data streams
      const loadPageData = useCallback(async () => {
        try {
          const [evalsData, studentsData] = await Promise.all([
            evaluationService.getAllEvaluations(),
            studentService.getAllStudents()
          ]);
          setEvaluations(evalsData);
          setStudents(studentsData);
        } catch (error) {
          console.error("Failed to load background verification dependencies:", error);
        }
      }, []);

      useEffect(() => {
        let active = true;
        const run = async () => { if (active) await loadPageData(); };
        void run();
        return () => { active = false; };
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

      // Compute Dashboard Statistics dynamically[cite: 2]
      const dashboardStats = (() => {
        let activeEnrollments = 0;
        let deficienciesCount = 0;
        let gradCandidates = 0;
        let transfereeCount = 0;
        let shifteeCount = 0;
        let returningCount = 0;
        students.forEach(s => {
          if (s.status === 'active') activeEnrollments++;
          if (s.classification === 'irregular') deficienciesCount++;
          if (normalizeYear(s.yearLevel) === '4') gradCandidates++;
          if (String(s.admissionType).toLowerCase() === 'transferee') transfereeCount++;
          if (String(s.admissionType).toLowerCase() === 'shiftee') shifteeCount++;
          if (String(s.admissionType).toLowerCase() === 'returnee' || s.status === 'loa') returningCount++;
        });
        return {
          totalEvaluated: evaluations.length,
          pendingEvaluations: activeEnrollments,
          studentsWithDeficiencies: deficienciesCount,
          graduationCandidates: gradCandidates,
          transfereesPending: transfereeCount,
          shifteesPending: shifteeCount,
          returningStudents: returningCount
        };
      })();

      // Sync historical database logs on student selection switch[cite: 2]
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

      // Run initial TOR verification on history payload changes[cite: 2]
      useEffect(() => {
        if ((evaluationStrategy === 'transferee' || evaluationStrategy === 'shiftee') && studentSubjectsHistory.length > 0) {
          const errors = [];
          studentSubjectsHistory.forEach(s => {
            if (!s.grade || s.grade === 'INC') {
              errors.push(`Incomplete grade or active hold discovered on code [${s.subjectCode || 'UNKNOWN'}]`);
            }
            if (parseFloat(s.units) <= 0 || isNaN(parseFloat(s.units))) {
              errors.push(`Invalid units value mapping on code [${s.subjectCode || 'UNKNOWN'}]`);
            }
          });
          setTorValidationErrors(errors);
          setIsTorComplete(errors.length === 0);
        }
      }, [studentSubjectsHistory, evaluationStrategy]);

      // Handle student resetting change selection[cite: 2]
      const handleStudentSelectChange = (val) => {
        setSelectedStudentId(val);
        setManualOverrides({});
        if (!val) {
          setStudentSubjectsHistory([]);
          setRegistrarRemarks('');
        }
      };

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

      const activeTrack = EVALUATION_TRACKS.find(t => t.value === evaluationStrategy) || EVALUATION_TRACKS[0];
      const isTrackUnimplemented = UNIMPLEMENTED_TRACKS.includes(evaluationStrategy);

      const evaluationSnapshotKey = `${selectedStudentId}::${evaluationStrategy}`;
      const isCurrentEvaluationFinalized = Boolean(selectedStudentId) && finalizedSnapshotKey === evaluationSnapshotKey;

      const handleFinalizeEvaluationMatrix = async () => {
        if (!selectedStudentId || !auditOutput) return;
        if (isCurrentEvaluationFinalized) return;
        setIsSubmitting(true);
        try {
          const timestamp = new Date().toISOString();
          const payload = {
            evaluationDate: timestamp,
            evaluatedBy: user?.email || "Registrar Executive Terminal Office",
            finalizedBy: { uid: user?.uid || null, email: user?.email || null },
            evaluationType: strategyLabel(evaluationStrategy),
            studentId: selectedStudentId,
            result: auditOutput.overallEligibility,
            remarks: registrarRemarks || `Executed systematic evaluation pipeline path: ${evaluationStrategy}.`,
            recordedLoadUnits: auditOutput.simulatedLoad || 0,
              deficienciesLog: auditOutput.deficiencies || [],
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
          await studentService.updateStudentProfile(selectedStudentId, studentProfileUpdates);
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
      } catch (err) {
        console.error("Critical error in evaluation workflow submission:", err);
        alert("Failed to complete system evaluation flow.");
      } finally {
        setIsSubmitting(false);
      }
    };

    const strategyLabel = (strategy) => {
      return String(strategy).toUpperCase().replace('-', '_');
    };

    const handleTriggerReportModalOpen = (typeLabel) => {
      // The curr-shift track has its own independently-computed summary
      // (bridgingOutput) -- auditOutput for that track is the unrelated regular-
      // evaluation pipeline result and would print the wrong data entirely.
      const reportSummary = typeLabel === 'curr-shift' ? bridgingOutput : auditOutput;
      if (!selectedStudentData || !reportSummary) return alert('Select target profile node context entry first.');
      setActiveReportData({
        type: typeLabel,
        studentId: selectedStudentId,
        srCode: selectedStudentData.srCode || selectedStudentId,
        name: `${selectedStudentData.lastName}, ${selectedStudentData.firstName}`,
        student: selectedStudentData,
        curriculum: activeStudentCurriculum === 'New Curriculum' ? 'NEW' : 'OLD',
        eligibility: reportSummary.overallEligibility,
        evaluatedBy: user?.email || 'Office of the University Registrar',
        timestamp: new Date().toLocaleString(),
        summary: reportSummary,
        prevSchool: evaluationStrategy === 'shiftee' ? 'Batangas State University' : prevSchoolName,
        prevProgram: evaluationStrategy === 'shiftee' ? selectedStudentData.program || 'BSIT (Software Engineering)' : prevProgram,
        newProgram: evaluationStrategy === 'shiftee' ? newShifteeProgram : null
        });
    setIsReportModalOpen(true);
      };

    // --- AUTOMATED EVALUATION PIPELINE CENTRAL ROUTER DISPATCHER ---
    const runCurriculumEvaluationSummary = () => {
      if (!selectedStudentData) return null;

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
  return String(code || '').trim().toUpperCase();
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
      if (evaluationStrategy === 'graduation') {
        pipelineResult = runGraduationEvaluation(catalog, subjectStatuses);
} else if (evaluationStrategy === 'transferee') {
      pipelineResult = runTransfereeEvaluation(
        catalog, 
        studentSubjectsHistory, 
        selectedStudentData.semester, 
        selectedStudentData.academicYear || "2026-2027", 
        minAllowedUnits,
        maxAllowedUnits,
        manualOverrides,
        '', // studentTrack (unused here)
        selectedStudentData.yearLevel
      );
      } else if (evaluationStrategy === 'shiftee') {
        pipelineResult = runShifteeEvaluation(catalog, subjectStatuses, passedCodes, selectedStudentData, newShifteeProgram);
  } else if (evaluationStrategy === 'returning') {
        pipelineResult = runReturningStudentEvaluation(
          catalog,
          subjectStatuses,
          {
            lastActiveYear,
            currentYearLevel: selectedStudentData.yearLevel,
            currentSemester: selectedStudentData.semester,
            maxAllowedUnits
          },
          {
            oldCatalog: oldSubjectsCatalog,
            newCatalog: newSubjectsCatalog,
            mappings: curriculumMappings
          }
        );
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

   // --- MULTI-TERM ROADMAP GENERATOR (RETURNING / SHIFTEE / REGULAR) ---
    // Schedules remaining subjects into REAL, sequential semesters (never a
    // fabricated "Part 2" of the same term). If a term is full, the overflow
    // rolls forward into the next actual semester.
let recommendedRoadmap = [];
if (['returning', 'shiftee', 'regular'].includes(evaluationStrategy)) {
      const normalizeCatalogYearNum = (raw) => {
        const s = String(raw || '').trim().toLowerCase();
        if (s.includes('4th') || s.includes('fourth')) return 4;
        if (s.includes('3rd') || s.includes('3nd') || s.includes('third')) return 3;
        if (s.includes('2nd') || s.includes('second')) return 2;
        return 1;
      };
      const normalizeCatalogSemKey = (raw) => {
        const s = String(raw || '').trim().toLowerCase();
        if (s.includes('sum') || s.includes('mid')) return 'summer';
        if (s.includes('2nd') || s.includes('second')) return '2nd';
        return '1st';
      };
      const YEAR_LABELS_MAP = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };
      const SEM_LABELS_MAP = { '1st': '1st Semester', '2nd': '2nd Semester', 'summer': 'Summer' };

      const pool = [];
      catalog.forEach(course => {
        const code = getCode(course);
        const info = subjectStatuses[code] || { status: 'Not Taken' };
        if (!retakeableStatuses.includes(info.status)) return;

        const yearNum = normalizeCatalogYearNum(course.yearLevel);
        const semArray = Array.isArray(course.semesterOffered) ? course.semesterOffered : [course.semesterOffered || '1st Semester'];
        const offeredKeys = semArray.map(s => normalizeCatalogSemKey(s));

        pool.push({
          code,
          title: getTitle(course),
          units: getUnits(course),
          catalogYear: yearNum,
          catalogSemKey: normalizeCatalogSemKey(semArray[0]),
          offeredKeys
        });
      });

      const normalizeStudentYearNum = (val) => {
        const s = String(val || '').trim().toLowerCase();
        if (s.includes('4th') || s.includes('fourth')) return 4;
        if (s.includes('3rd') || s.includes('third')) return 3;
        if (s.includes('2nd') || s.includes('second')) return 2;
        return 1;
      };
      const normalizeStudentSemKey = (val) => {
        const s = String(val || '').trim().toLowerCase();
        if (s.includes('summer') || s.includes('mid')) return 'summer';
        if (s.includes('2nd') || s.includes('second')) return '2nd';
        return '1st';
      };

      let curYear = normalizeStudentYearNum(selectedStudentData.yearLevel);
      let curSemKey = normalizeStudentSemKey(selectedStudentData.semester);

      const semOrderForSort = { '1st': 1, '2nd': 2, 'summer': 3 };
      pool.sort((a, b) => {
        const yearDiff = a.catalogYear - b.catalogYear;
        if (yearDiff !== 0) return yearDiff;
        return (semOrderForSort[a.catalogSemKey] || 1) - (semOrderForSort[b.catalogSemKey] || 1);
      });

      let remaining = [...pool];
      let safetyGuard = 0;
      const maxIterations = remaining.length * 3 + 20;

      const advanceRealTerm = () => {
        if (curSemKey === '1st') {
          curSemKey = '2nd';
        } else if (curSemKey === '2nd') {
          // Only detour through Summer if something still waiting actually
          // needs it — otherwise skip straight to next year's 1st Semester.
          const summerNeeded = remaining.some(s => s.offeredKeys.includes('summer'));
          curSemKey = summerNeeded ? 'summer' : '1st';
          if (!summerNeeded) curYear += 1;
        } else {
          curSemKey = '1st';
          curYear += 1;
        }
      };

      while (remaining.length > 0 && safetyGuard < maxIterations) {
        safetyGuard++;

        const eligible = remaining.filter(s =>
          s.offeredKeys.includes(curSemKey) && s.catalogYear <= curYear
        );

        console.log(`Term check: Year ${curYear}, Sem ${curSemKey} — eligible: ${eligible.length}, remaining total: ${remaining.length}`);

        let bucketUnits = 0;
        const bucketItems = [];
        eligible.forEach(s => {
          if (bucketUnits + s.units <= maxAllowedUnits) {
            bucketItems.push(s);
            bucketUnits += s.units;
          }
        });

        if (bucketItems.length > 0) {
          recommendedRoadmap.push({
            term: `${YEAR_LABELS_MAP[curYear] || `${curYear}th Year`} - ${SEM_LABELS_MAP[curSemKey]}`,
            totalUnits: bucketUnits,
            subjects: bucketItems.map(s => ({ code: s.code, title: s.title, units: s.units }))
          });
          const placedCodes = new Set(bucketItems.map(s => s.code));
          remaining = remaining.filter(s => !placedCodes.has(s.code));
        }

        advanceRealTerm();
        if (curYear > 10) break;
      }

      // Anything still stuck after the loop exits (e.g. a subject whose
      // prerequisite never actually gets satisfied) gets surfaced as its
      // own catch-all term instead of silently vanishing from the roadmap.
      if (remaining.length > 0) {
        recommendedRoadmap.push({
          term: 'Unscheduled — Requires Manual Review',
          totalUnits: remaining.reduce((sum, s) => sum + s.units, 0),
          subjects: remaining.map(s => ({ code: s.code, title: s.title, units: s.units }))
        });
      }
    }
    let warningAlerts = [...(pipelineResult.alerts || [])];
    if (simulatedLoad < minAllowedUnits && recommendedStudyPlan.length > 0) {
      warningAlerts.push(`Academic Warning: Load counter evaluates underload (${simulatedLoad} units). Minimum standard is ${minAllowedUnits} units.`);
    }

const completionPercentage = pipelineResult.totalRequired > 0
  ? ((pipelineResult.unitsEarned / pipelineResult.totalRequired) * 100).toFixed(1)
  : '0.0';

    return {
      ...pipelineResult,
      completionPercentage,
      recommendedStudyPlan,
          // Only override pipelineResult's recommendedRoadmap for the 'returning'
          // track (which computes its own year/semester-grouped roadmap above).
          // Other tracks (e.g. transferee) already return a correct, fully-built
          // recommendedRoadmap from their own pipeline function (runTransfereeEvaluation,
          // etc.) — overwriting it here with the empty local variable would blank it out.
recommendedRoadmap: ['returning', 'shiftee', 'regular'].includes(evaluationStrategy) ? recommendedRoadmap : (pipelineResult.recommendedRoadmap || []),
          simulatedLoad,
          alerts: warningAlerts,
          effectiveCurriculum,
          curriculumShifted: shouldForceNewCurriculum,
          yearsSinceLastActive
        };
      };

    const auditOutput = runCurriculumEvaluationSummary();

    // --- PLAN BRIDGING: INDEPENDENT READ-ONLY PIPELINE ---
    // Bridging owns its own engine and result shape, so it is computed separately
    // from the general audit summary rather than routed through it. Source is the
    // student's recorded Copy of Grades -- nothing is keyed in, nothing is written.
    const bridgingOutput = useMemo(() => {
      if (evaluationStrategy !== 'curr-shift' || !selectedStudentData) return null;
      return runCurriculumShiftEvaluation({
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
    }, [evaluationStrategy, selectedStudentData, studentSubjectsHistory, newSubjectsCatalog, oldSubjectsCatalog, curriculumMappings, minAllowedUnits, maxAllowedUnits]);
    const filteredHistoryLogs = auditTrails.filter(log => log.studentId?.toLowerCase().includes(historySearchQuery.toLowerCase()));
    const handleIdStrFilterLogs = (value) => value.replace(/[^0-9-]/g, '');

    return (
      <div className="p-8 bg-[#f8fafc] min-h-screen text-slate-800 font-sans antialiased text-left space-y-6 relative">
        {/* ================= HEADER CONTROL BAR ================= */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="text-slate-950" size={28} /> Evaluation Processing Matrix
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">Automated rule processing frameworks across multiple dynamic student admission tracking tracks.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setModuleView('dashboard')} className={`px-4 py-2 text-xs font-bold rounded-xl border ${moduleView === 'dashboard' ? 'bg-slate-950 text-white shadow-sm' : 'bg-white hover:bg-slate-50'}`}>Dashboard Overview</button>
            <button onClick={() => setModuleView('workspace')} className={`px-4 py-2 text-xs font-bold rounded-xl border ${moduleView === 'workspace' ? 'bg-slate-950 text-white shadow-sm' : 'bg-white hover:bg-slate-50'}`}>Audit Workspace</button>
            <button onClick={() => setModuleView('history-logs')} className={`px-4 py-2 text-xs font-bold rounded-xl border ${moduleView === 'history-logs' ? 'bg-slate-950 text-white shadow-sm' : 'bg-white hover:bg-slate-50'}`}>History Trails</button>
          </div>
        </div>

        {/* ================= DASHBOARD SUMMARY VIEW ================= */}
        {moduleView === 'dashboard' && <DashboardOverview dashboardStats={dashboardStats} auditTrails={auditTrails} filteredHistoryLogs={filteredHistoryLogs} />}

        {/* ================= MAIN INTERACTIVE AUDITING WORKSPACE ================= */}
        {moduleView === 'workspace' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6 animate-fadeIn text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1.5">1. Targeting Profile Node Context</label>
                <StudentSearchSelect
                  students={students}
                  value={selectedStudentId}
                  onChange={handleStudentSelectChange}
                  placeholder="Select Student…"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">2. Choose Strategic Evaluation Track Pipeline</label>
                <SearchableSelect
                  items={EVALUATION_TRACKS}
                  value={evaluationStrategy}
                  onChange={setEvaluationStrategy}
                  getKey={track => track.value}
                  getLabel={track => track.label}
                  searchable={false}
                  showClear={false}
                  triggerLabelClassName="font-black text-blue-700 truncate"
                  renderRow={(track, { isSelected }) => (
                    <>
                      <span className="font-bold text-slate-800 truncate">{track.label}</span>
                      {isSelected && <Check size={14} className="text-blue-700 shrink-0" />}
                    </>
                  )}
                />
              </div>
            </div>

            {/* Student Profile Info Preview Block Header Banner */}
            {selectedStudentData && (
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-wrap gap-x-6 gap-y-2 items-center text-xs font-bold text-slate-600 shadow-3xs animate-fadeIn">
                <div className="flex items-center gap-1.5"><User size={14} className="text-slate-400" /><span>Profile Target:</span><span className="text-slate-900 font-extrabold">{selectedStudentData.lastName}, {selectedStudentData.firstName}</span></div>
                <div className="flex items-center gap-1.5"><ClipboardList size={14} className="text-slate-400" /><span>Admission Type:</span><span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded uppercase font-black">{selectedStudentData.admissionType || 'Freshman'}</span></div>
                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /><span>Assigned Standing:</span><span className="text-slate-900">{selectedStudentData.yearLevel} ({selectedStudentData.semester})</span></div>
                <div className="ml-auto">
                  <span className={`text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-wide ${auditOutput?.effectiveCurriculum === 'NEW'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                    Active Profile Track: {auditOutput?.effectiveCurriculum === 'NEW' ? 'New Curriculum' : 'Old Curriculum'}
                    {auditOutput?.curriculumShifted && ' (Auto-Shifted)'}
                  </span>
                </div>
              </div>
            )}

            {/* SHARED READ-ONLY GRADES BASE -- rendered for every track.
                Keyed by track so switching pipelines remounts it and no collapse
                state can survive from the previous track. */}
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
                {evaluationStrategy === 'curr-shift' && bridgingOutput && (
                  <div className="space-y-4">
                    <PlanBridgingView auditOutput={bridgingOutput} />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleTriggerReportModalOpen('curr-shift')}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Printer size={13} /> Print Bridging Checksheet
                      </button>
                    </div>
                  </div>
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
                effectiveCurriculum={auditOutput.effectiveCurriculum}
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

            {selectedStudentData && !isTrackUnimplemented && evaluationStrategy !== 'curr-shift' && evaluationStrategy !== 'transferee' && evaluationStrategy !== 'shiftee' && evaluationStrategy !== 'graduation' && auditOutput && (
              <GeneralWorkspaceView
                auditOutput={auditOutput}
                minAllowedUnits={minAllowedUnits}
                maxAllowedUnits={maxAllowedUnits}
                evaluationStrategy={evaluationStrategy}
                triggerReportModalOpen={handleTriggerReportModalOpen}
                handleFinalizeEvaluationMatrix={handleFinalizeEvaluationMatrix}
                isSubmitting={isSubmitting}
                catalog={activeStudentCurriculum === 'New Curriculum' ? newSubjectsCatalog : oldSubjectsCatalog}
                studentSubjectsHistory={studentSubjectsHistory}
                onAddManualSubject={handleAddManualSubjectFromTransferee}
                onDeleteManualSubject={handleDeleteManualSubjectFromTransferee}
                studentYearLevel={selectedStudentData.yearLevel}
                studentSemester={selectedStudentData.semester}
              />
            )}

            {!selectedStudentId && (
              <div className="text-center py-16 text-slate-400 font-semibold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ClipboardList className="mx-auto text-slate-300 mb-3" size={36} />
                <p>Please select a student record index above to initiate the unique track evaluation engine.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= AUDIT SNAPS HISTORY LIST ================= */}
        {moduleView === 'history-logs' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 animate-fadeIn text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Historical Evaluation Checkpoints</h2>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Committed evaluation audit trails retrieved from the ledger.</p>
              </div>
              <input type="text" placeholder="Search logs by student ID..." value={historySearchQuery} onChange={e => setHistorySearchQuery(handleIdStrFilterLogs(e.target.value))} className="border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 focus:ring-1 focus:ring-slate-950 outline-none w-full sm:w-64" />
            </div>
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b">
                  <tr>
                    <th className="p-3">Committed Timestamp</th>
                    <th className="p-3">Target Student</th>
                    <th className="p-3">Pipeline Pathway</th>
                    <th className="p-3">Finalized Result Status</th>
                    <th className="p-3">Audit Logs & Notes</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700 divide-y">
                  {filteredHistoryLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-slate-50/40">
                      <td className="p-3 text-slate-400 font-mono">{log.evaluationDate ? new Date(log.evaluationDate).toLocaleString() : 'N/A'}</td>
                      <td className="p-3 font-bold text-slate-950">{log.studentId}</td>
                      <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-[10px] uppercase font-black">{log.evaluationType}</span></td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${log.result === 'ELIGIBLE' || log.result?.includes('Complete') || log.result?.includes('ELIGIBLE') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          log.result === 'CONDITIONALLY ELIGIBLE' || log.result?.includes('Review') ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>{log.result}</span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{log.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <PrintReportModal isReportModalOpen={isReportModalOpen} activeReportData={activeReportData} setIsReportModalOpen={setIsReportModalOpen} prevSchoolName={prevSchoolName} prevProgram={prevProgram} newShifteeProgram={newShifteeProgram} />
      </div>
    );
    }