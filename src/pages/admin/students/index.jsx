import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, SlidersHorizontal, ChevronRight, X, Edit3,
  ArrowLeft, Save, User, GraduationCap, BookOpen, CheckCircle2, ShieldAlert, Trash2,
  AlertCircle, Info, Lock, BookMarked, Calendar, CheckCircle, AlertTriangle,
  Layers, FileSpreadsheet
} from 'lucide-react';
// --- FIREBASE IMPORT ---
import { db } from '../../../services/firebase';
import { systemService } from '../../../services/systemService';
import CopyOfGradesMatrix from '../../../components/CopyOfGradesMatrix';
import LoadingState from '../../../components/LoadingState';
import {
  collection, doc, setDoc, updateDoc, addDoc, deleteDoc, query, where, onSnapshot, getDoc
} from 'firebase/firestore';
// --- CONFIG & UTILS IMPORT ---
import {
  checkEnrollmentLimit, getFallbackSubjects, normalizeYear, normalizeSemester, MAX_UNITS_CONFIG,
  BATSTATEU_GRADES, SEMESTER_LIST, ACADEMIC_YEARS_LIST, getCurriculumForTerm
} from '../../../services/curriculumConfig';

const ADMISSION_TYPES = ['Freshman', 'Transferee', 'Shiftee', 'Returnee'];
const COURSE_LIST = ['BSIT', 'BSCS', 'BSEMC', 'BSIS'];
const SECTION_LIST = ['A', 'B', 'C', 'D'];
const YEAR_LEVELS =['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

// Detailed Student Statuses mapping
const STUDENT_STATUSES = [
  { value: 'Active', label: 'Active', desc: 'The student is currently enrolled and eligible for evaluation and enrollment.' },
  { value: 'Regular', label: 'Regular', desc: 'The student is following the prescribed curriculum and is taking subjects according to the recommended semester plan.' },
  { value: 'Irregular', label: 'Irregular', desc: 'The student is not following the regular curriculum sequence due to failed subjects, credited subjects, shifting, transferring, or curriculum adjustments.' },
  { value: 'Returning', label: 'Returning', desc: 'The student has resumed studies after a leave of absence, dropping out, or being inactive.' },
  { value: 'Graduating Candidate', label: 'Graduating Candidate', desc: 'The student has completed (or is expected to complete) all remaining academic requirements and is eligible for Graduation Evaluation.' },
  { value: 'Graduated', label: 'Graduated', desc: 'The student has successfully completed all curriculum requirements and has officially graduated.' },
  { value: 'Inactive', label: 'Inactive', desc: 'The student is temporarily not enrolled but may return in the future.' },
  { value: 'Dropped', label: 'Dropped', desc: 'The student officially withdrew or discontinued enrollment during the semester.' },
  { value: 'Transferred Out', label: 'Transferred Out', desc: 'The student has transferred to another institution and is no longer active in the university.' }
];

export default function StudentManagement() {
  // --- APPLICATION DATA STATES ---
  const [students, setStudents] = useState([]);
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // --- LIVE FIRESTORE CURRICULUM STATES ---
  const [newSubjectsCatalog, setNewSubjectsCatalog] = useState([]);
  // First-snapshot tracking per catalog, so the manual-entry modal can tell
  // "still streaming" apart from "genuinely empty".
  const [catalogsLoaded, setCatalogsLoaded] = useState({ NEW: false, OLD: false });
  const [oldSubjectsCatalog, setOldSubjectsCatalog] = useState([]);
  const [curriculumMappings, setCurriculumMappings] = useState({});
  // --- INTERACTIVE VIEW CONTROLLERS ---
  const [view, setView] = useState('directory');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('Summary');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isPopulateModalOpen, setIsPopulateModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // --- SEARCH ENGINE AND FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCurriculum, setFilterCurriculum] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAdmission, setFilterAdmission] = useState('All');
  const [filterClassification, setFilterClassification] = useState('All');
  const [filterTrack, setFilterTrack] = useState('All');
  // --- UI FEEDBACK ALERTS ---
  const [toast, setToast] = useState(null);
  const [srCodeChecking, setSrCodeChecking] = useState(false);
  const [srCodeError, setSrCodeError] = useState('');
  // Inline Grading States
  const [gradingSubjectId, setGradingSubjectId] = useState(null);
  const [selectedInlineGrade, setSelectedInlineGrade] = useState('1.00');
  // --- LOCAL PRELOAD PREVIEW STATE FOR NEW STUDENTS ---
  const [previewCourseLoad, setPreviewCourseLoad] = useState([]);
  const [maxAllowedPreviewUnits, setMaxAllowedPreviewUnits] = useState(21);

  // --- SECTIONS EXPAND/COLLAPSE IN COPY OF GRADES ---

  // Helper to trigger toast notifications
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- FORM STATES ---
  const [newStudent, setNewStudent] = useState({
    studentId: '', email: '', firstName: '', middleInitial: '', lastName: '',
    course: 'BSIT', track: '', curriculum: 'NEW', yearLevel: 'First Year', semester: '1st Semester',
    section: 'A', admissionType: 'Freshman', classification: 'regular', status: 'Active', academicYear: '2026-2027',
    phoneNumber: '', guardianContact: '', admissionDate: new Date().toISOString().split('T')[0], photoUrl: ''
  });

  // The registrar-configured active A.Y. (system_settings/academic), shown read-only
  // on the Academic Block. Same fallback the dashboard and Settings page use.
  const [activeAcademicYear, setActiveAcademicYear] = useState('2026-2027');

  const [editStudentForm, setEditStudentForm] = useState({
    firstName: '', middleInitial: '', lastName: '', email: '', course: 'BSIT', track: '',
    curriculum: 'NEW', yearLevel: 'First Year', semester: '1st Semester', section: 'A', admissionType: 'Freshman', classification: 'regular', status: 'Active', academicYear: '2026-2027',
    phoneNumber: '', guardianContact: '', admissionDate: '', photoUrl: ''
  });

  // Manual Subject Entry Form State
  const [newSubjectRecord, setNewSubjectRecord] = useState({
    subjectCode: '', subjectTitle: '', units: 3, term: '2026-2027', yearLevel: 'First Year', semester: '1st Semester', grade: 'In Progress'
  });

  // The catalog the manual-entry modal reads from, chosen purely by its term.
  // Both catalogs are already streamed above, so this selects rather than refetches.
  const manualEntryCurriculum = getCurriculumForTerm(newSubjectRecord.term);
  const isManualCatalogLoading = !catalogsLoaded[manualEntryCurriculum];

  // Layered: term picks the collection, then year level + semester narrow it.
  // Both sides of every comparison go through the shared normalizers, so UI
  // labels ('Fourth Year' / '1st Semester') match stored variants ('4th Year',
  // 'First Semester') without relying on string equality.
  const manualEntryCatalog = useMemo(() => {
    const source = manualEntryCurriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog;
    const targetYear = normalizeYear(newSubjectRecord.yearLevel);
    const targetSem = normalizeSemester(newSubjectRecord.semester);
    return source
      .filter(sub => {
        const subYear = normalizeYear(sub.yearLevel || sub.year);
        // semesterOffered is an array on most docs but a bare string on some;
        // handlePopulateSemester already has to cope with both.
        const offered = sub.semesterOffered ?? sub.semester;
        const matchesSem = Array.isArray(offered)
          ? offered.some(s => normalizeSemester(s) === targetSem)
          : normalizeSemester(offered) === targetSem;
        return subYear === targetYear && matchesSem;
      })
      .map(sub => ({
        // Same defensive field fallbacks the rest of this page already applies,
        // since documents are not uniformly shaped across the two collections.
        code: String(sub.courseCode || sub.code || sub.subjectCode || '').toUpperCase(),
        title: sub.courseTitle || sub.descriptiveTitle || sub.subjectTitle || '',
        units: parseInt(sub.creditUnits || sub.units || 3, 10)
      }))
      .filter(sub => sub.code)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [manualEntryCurriculum, newSubjectsCatalog, oldSubjectsCatalog, newSubjectRecord.yearLevel, newSubjectRecord.semester]);

  // Term, year level and semester are the three controlling fields: changing any
  // of them invalidates a selection made under the previous scope.
  const handleManualScopeChange = (patch) => {
    setNewSubjectRecord(prev => ({ ...prev, ...patch, subjectCode: '', subjectTitle: '', units: 3 }));
  };

  const handleManualSubjectCodeChange = (code) => {
    const match = manualEntryCatalog.find(sub => sub.code === code);
    setNewSubjectRecord(prev => ({
      ...prev,
      subjectCode: code,
      subjectTitle: match ? match.title : '',
      units: match ? match.units : prev.units
    }));
  };

  // Semester Template Populater State
  const [populateForm, setPopulateForm] = useState({
    yearLevel: 'First Year', semester: '1st Semester', term: '2026-2027'
  });

  // Toggle Section Helper
  // Side Effect: Auto-reset Track value if Year Level is lower than 3rd Year
  useEffect(() => {
    const numericYear = normalizeYear(newStudent.yearLevel);
    if (numericYear === '1' || numericYear === '2') {
      if (newStudent.track !== '') {
        setNewStudent(prev => ({ ...prev, track: '' }));
      }
    }
  }, [newStudent.yearLevel]);

  useEffect(() => {
    const numericYear = normalizeYear(editStudentForm.yearLevel);
    if (numericYear === '1' || numericYear === '2') {
      if (editStudentForm.track !== '') {
        setEditStudentForm(prev => ({ ...prev, track: '' }));
      }
    }
  }, [editStudentForm.yearLevel]);

  // Pull the live active A.Y. so the locked field tracks the registrar's setting
  // rather than a value hardcoded per page.
  useEffect(() => {
    let isMounted = true;
    const fetchActiveYear = async () => {
      try {
        const config = await systemService.getAcademicConfig();
        if (isMounted && config?.activeYear) setActiveAcademicYear(config.activeYear);
      } catch (error) {
        console.error('Failed to load active academic year', error);
      }
    };
    fetchActiveYear();
    return () => { isMounted = false; };
  }, []);

  // Enforces curriculum timeline profiles
  useEffect(() => {
    if (newStudent.admissionType === 'Freshman') {
      setNewStudent(prev => ({
        ...prev,
        academicYear: '2026-2027',
        curriculum: 'NEW',
        yearLevel: 'First Year',
        semester: '1st Semester'
      }));
    } else if (['Transferee', 'Shiftee', 'Returnee'].includes(newStudent.admissionType)) {
      const startYear = parseInt(newStudent.academicYear.split('-')[0], 10);
      const resolvedCurriculum = startYear <= 2025 ? 'OLD' : 'NEW';
      setNewStudent(prev => ({
        ...prev,
        curriculum: resolvedCurriculum
      }));
    }
  }, [newStudent.admissionType, newStudent.academicYear]);

  useEffect(() => {
    if (editStudentForm.admissionType === 'Freshman') {
      setEditStudentForm(prev => ({
        ...prev,
        academicYear: '2026-2027',
        curriculum: 'NEW',
        yearLevel: 'First Year',
        semester: '1st Semester'
      }));
    } else if (['Transferee', 'Shiftee', 'Returnee'].includes(editStudentForm.admissionType)) {
      const startYear = parseInt(editStudentForm.academicYear.split('-')[0], 10);
      const resolvedCurriculum = startYear <= 2025 ? 'OLD' : 'NEW';
      setEditStudentForm(prev => ({
        ...prev,
        curriculum: resolvedCurriculum
      }));
    }
  }, [editStudentForm.admissionType, editStudentForm.academicYear]);

  // STREAM LIVE STUDENTS FROM FIRESTORE
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setStudents(list);
      setLoading(false);
    }, (err) => {
      setError("Database stream connection dropped.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // STREAM LIVE SUBJECT CATALOGS AND MAPPINGS
  useEffect(() => {
    const unsubNew = onSnapshot(collection(db, 'new_subjects'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => { list.push({ code: doc.id, ...doc.data() }); });
      setNewSubjectsCatalog(list);
      setCatalogsLoaded(prev => ({ ...prev, NEW: true }));
    });
    const unsubOld = onSnapshot(collection(db, 'old_subjects'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({ code: data.courseCode || doc.id, ...data });
      });
      setOldSubjectsCatalog(list);
      setCatalogsLoaded(prev => ({ ...prev, OLD: true }));
    });
    const unsubMappings = onSnapshot(collection(db, 'curriculum_mappings'), (snapshot) => {
      const mappingObj = {};
      snapshot.forEach((doc) => { mappingObj[doc.id] = doc.data(); });
      setCurriculumMappings(mappingObj);
    });
    return () => { unsubNew(); unsubOld(); unsubMappings(); };
  }, []);

  // STREAM STUDENT-SPECIFIC SUBJECT RECORDS
  useEffect(() => {
    if (!selectedStudent || !selectedStudent.studentId) {
      setStudentSubjects([]);
      return;
    }
    const q = query(collection(db, 'studentSubjects'), where('studentId', '==', selectedStudent.studentId));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));

      // Auto-load current semester layout if empty
      if (list.length === 0) {
        const catalog = selectedStudent.curriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog;

        let matchingSubjects = catalog.filter(sub => {
          const subYear = normalizeYear(sub.yearLevel || sub.year);
          const targetYear = normalizeYear(selectedStudent.yearLevel);
          let matchesSem = false;
          const targetSem = normalizeSemester(selectedStudent.semester);
          if (Array.isArray(sub.semesterOffered)) {
            matchesSem = sub.semesterOffered.some(s => normalizeSemester(s) === targetSem);
          } else {
            matchesSem = normalizeSemester(sub.semesterOffered || sub.semester) === targetSem;
          }
          const subTrack = String(sub.track || '').toLowerCase().trim();
          const studentTrack = String(selectedStudent.track || '').toLowerCase().trim();
          const matchesTrack = subTrack === 'common' || subTrack === '' || studentTrack.includes(subTrack) || subTrack.includes(studentTrack);
          return subYear === targetYear && matchesSem && matchesTrack;
        });
        if (matchingSubjects.length === 0) {
          matchingSubjects = getFallbackSubjects(selectedStudent.course, selectedStudent.yearLevel, selectedStudent.semester);
        }
        if (matchingSubjects.length > 0) {
          const timestamp = new Date().toISOString();
          for (const sub of matchingSubjects) {
            await addDoc(collection(db, 'studentSubjects'), {
              studentId: selectedStudent.studentId,
              subjectCode: (sub.courseCode || sub.code || sub.subjectCode || '').toUpperCase(),
              subjectTitle: sub.courseTitle || sub.title || sub.subjectTitle || 'Curriculum Core Course',
              grade: 'In Progress',
              term: selectedStudent.academicYear || '2026-2027',
              yearLevel: selectedStudent.yearLevel || 'First Year',
              semester: selectedStudent.semester || '1st Semester',
              status: 'in progress',
              units: parseInt(sub.creditUnits || sub.units || 3, 10),
              remarks: 'Pending for Evaluation',
              recordedAt: timestamp
            });
          }
          return;
        }
      }
      setStudentSubjects(list);
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [selectedStudent, newSubjectsCatalog, oldSubjectsCatalog]);

  // PRELOAD DYNAMIC PREVIEW IN NEW ENTRY FORM
  useEffect(() => {
    if (view !== 'add-student') return;

    const catalog = newStudent.curriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog;

    let matchingSubjects = catalog.filter(sub => {
      const subYear = normalizeYear(sub.yearLevel || sub.year);
      const targetYear = normalizeYear(newStudent.yearLevel);
      let matchesSem = false;
      const targetSem = normalizeSemester(newStudent.semester);
      if (Array.isArray(sub.semesterOffered)) {
        matchesSem = sub.semesterOffered.some(s => normalizeSemester(s) === targetSem);
      } else {
        matchesSem = normalizeSemester(sub.semesterOffered || sub.semester) === targetSem;
      }
      const subTrack = String(sub.track || '').toLowerCase().trim();
      const studentTrack = String(newStudent.track || '').toLowerCase().trim();
      const matchesTrack = subTrack === 'common' || subTrack === '' || studentTrack.includes(subTrack) || subTrack.includes(studentTrack);
      return subYear === targetYear && matchesSem && matchesTrack;
    });
    if (matchingSubjects.length === 0) {
      matchingSubjects = getFallbackSubjects(newStudent.course, newStudent.yearLevel, newStudent.semester);
    }
    const mappedPreview = matchingSubjects.map((course, idx) => ({
      id: course.id || `${course.courseCode || course.code || course.subjectCode || idx}`,
      academicYear: newStudent.academicYear || '2026-2027',
      semester: newStudent.semester || '1st Semester',
      subjectCode: (course.courseCode || course.code || course.subjectCode || '').toUpperCase(),
      descriptiveTitle: course.courseTitle || course.title || course.subjectTitle || 'Curriculum Core Course',
      units: parseInt(course.creditUnits || course.units || 3, 10),
      grade: 'In Progress'
    }));
    setPreviewCourseLoad(mappedPreview);
    const dummySum = mappedPreview.reduce((acc, curr) => acc + curr.units, 0);
    const limitCheck = checkEnrollmentLimit(newStudent.curriculum, newStudent.yearLevel, newStudent.semester, dummySum);
    setMaxAllowedPreviewUnits(limitCheck.maxAllowed || 21);
  }, [newStudent.curriculum, newStudent.yearLevel, newStudent.semester, newStudent.academicYear, newStudent.course, newStudent.track, newSubjectsCatalog, oldSubjectsCatalog, view]);

  // Dynamic KPI Metric Engine
  const getCalculatedMetrics = () => {
    const evaluated = studentSubjects.filter(sub => sub && sub.grade && !['Inc', 'Drop', 'W', 'In Progress'].includes(sub.grade));
    const passed = studentSubjects.filter(sub => sub && (sub.status === 'passed' || (parseFloat(sub.grade) >= 1.0 && parseFloat(sub.grade) <= 3.0)));
    let computedGwa = '0.00';
    if (evaluated.length > 0) {
      let totalWeightedGrades = 0, totalUnits = 0;
      evaluated.forEach(sub => {
        const gradeVal = parseFloat(sub.grade);
        const unitVal = parseFloat(sub.units || 3);
        if (!isNaN(gradeVal)) { totalWeightedGrades += (gradeVal * unitVal); totalUnits += unitVal; }
      });
      if (totalUnits > 0) computedGwa = (totalWeightedGrades / totalUnits).toFixed(2);
    }
    return { gwa: computedGwa, totalAssigned: studentSubjects.length, evaluatedCount: evaluated.length, passedCount: passed.length };
  };
  const metrics = getCalculatedMetrics();

  const handleNameStrFilter = (value) => value.replace(/[^a-zA-Z\s]/g, '');
  const handleIdStrFilter = (value) => value.replace(/[^0-9\-]/g, '');

  // Structured Audit Report / Master Plan Generator
  const generateStructuredAuditReport = () => {
    if (!selectedStudent) return [];

    const catalog = selectedStudent.curriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog;
    const passedCollection = studentSubjects.filter(s => s && (s.status === 'passed' || (parseFloat(s.grade) >= 1.0 && parseFloat(s.grade) <= 3.0)));

    const structuredStructure = {};
    catalog.forEach(course => {
      const mappedYear = normalizeYear(course.yearLevel || course.year);
      let yearLabel = `${mappedYear === '1' ? 'First Year' : mappedYear === '2' ? 'Second Year' : mappedYear === '3' ? 'Third Year' : 'Fourth Year'}`;
      let semLabel = "1st Semester";
      if (Array.isArray(course.semesterOffered)) {
        if (course.semesterOffered.some(s => normalizeSemester(s) === '2nd')) semLabel = "2nd Semester";
        else if (course.semesterOffered.some(s => normalizeSemester(s) === 'summer')) semLabel = "Summer/Midyear Term";
      } else {
        const semClean = normalizeSemester(course.semesterOffered || course.semester);
        if (semClean === '2nd') semLabel = "2nd Semester";
        else if (semClean === 'summer') semLabel = "Summer/Midyear Term";
      }
      const courseTrack = String(course.track || '').toLowerCase().trim();
      const studentTrack = String(selectedStudent.track || '').toLowerCase().trim();
      if (courseTrack !== 'common' && courseTrack !== '' && courseTrack !== 'no track assigned') {
        if (!studentTrack.includes(courseTrack) && !courseTrack.includes(studentTrack)) {
          return;
        }
      }

      // --- FIX: Normalize both codes for comparison (strips spaces, underscores, dashes, and ignores case) ---
      const cleanCatalogCode = String(course.courseCode || course.code || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      const matchedRecord = studentSubjects.find(s => {
        if (!s) return false;
        const cleanStudentCode = String(s.subjectCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return cleanStudentCode === cleanCatalogCode;
      });

      // Consider a course completed if it was matched and is either explicitly marked "passed" or has a passing numerical grade
      const isCompleted = matchedRecord && (
        matchedRecord.status === 'passed' ||
        (parseFloat(matchedRecord.grade) >= 1.0 && parseFloat(matchedRecord.grade) <= 3.0)
      );

      let prerequisitesMet = true;
      let missingPrereqs = [];
      const prereqsArray = Array.isArray(course.prerequisites) ? course.prerequisites : (course.prerequisites ? [course.prerequisites] : []);

      prereqsArray.forEach(pCode => {
        if (pCode && pCode !== '-') {
          const completedPrereq = passedCollection.some(s => s && s.subjectCode.replace(/[^a-zA-Z0-9]/g, '') === pCode.replace(/[^a-zA-Z0-9]/g, ''));
          if (!completedPrereq) {
            prerequisitesMet = false;
            missingPrereqs.push(pCode);
          }
        }
      });
      if (!structuredStructure[yearLabel]) structuredStructure[yearLabel] = {};
      if (!structuredStructure[yearLabel][semLabel]) structuredStructure[yearLabel][semLabel] = [];
      structuredStructure[yearLabel][semLabel].push({
        code: course.courseCode || course.code,
        title: course.courseTitle || course.title,
        units: course.creditUnits || course.units || 3,
        status: isCompleted ? 'EVALUATED' : 'DEFICIENT',
        grade: isCompleted ? matchedRecord.grade : '-',
        prereqs: prereqsArray.filter(p => p && p !== '-'),
        prereqsMet: prerequisitesMet,
        missingPrereqs
      });
    });
    return structuredStructure;
  };

  // Pre-load semester courses template checklist in one click
  const handlePopulateSemester = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const catalog = selectedStudent.curriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog;

    let matchingSubjects = catalog.filter(sub => {
      const subYear = normalizeYear(sub.yearLevel || sub.year);
      const targetYear = normalizeYear(populateForm.yearLevel);
      let matchesSem = false;
      const targetSem = normalizeSemester(populateForm.semester);
      if (Array.isArray(sub.semesterOffered)) {
        matchesSem = sub.semesterOffered.some(s => normalizeSemester(s) === targetSem);
      } else {
        matchesSem = normalizeSemester(sub.semesterOffered || sub.semester) === targetSem;
      }
      const subTrack = String(sub.track || '').toLowerCase().trim();
      const studentTrack = String(selectedStudent.track || '').toLowerCase().trim();
      const matchesTrack = subTrack === 'common' || subTrack === '' || studentTrack.includes(subTrack) || subTrack.includes(studentTrack);
      return subYear === targetYear && matchesSem && matchesTrack;
    });

    if (matchingSubjects.length === 0) {
      matchingSubjects = getFallbackSubjects(selectedStudent.course, populateForm.yearLevel, populateForm.semester);
    }

    if (matchingSubjects.length === 0) {
      showToast("No courses found in catalog for this selected semester.", "error");
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      let addedCount = 0;
      for (const sub of matchingSubjects) {
        const alreadyExists = studentSubjects.some(
          existing => existing && existing.subjectCode === (sub.courseCode || sub.code || '').toUpperCase()
        );

        if (!alreadyExists) {
          await addDoc(collection(db, 'studentSubjects'), {
            studentId: selectedStudent.studentId,
            subjectCode: (sub.courseCode || sub.code || '').toUpperCase(),
            subjectTitle: sub.courseTitle || sub.title || 'Curriculum Course',
            grade: 'In Progress',
            status: 'in progress',
            term: populateForm.term,
            yearLevel: populateForm.yearLevel,
            semester: populateForm.semester,
            units: parseInt(sub.creditUnits || sub.units || 3, 10),
            recordedAt: timestamp
          });
          addedCount++;
        }
      }
      showToast(`Populated ${addedCount} new course nodes into ${populateForm.yearLevel} - ${populateForm.semester}!`);
      setIsPopulateModalOpen(false);
    } catch (err) {
      showToast("Failed to populate curriculum checklist.", "error");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.studentId) return;
    if (!newStudent.email.toLowerCase().endsWith('@g.tlsu.edu.ph')) {
      showToast("Registration rejected. Email must use domain: @g.tlsu.edu.ph", "error");
      return;
    }
    const startYear = parseInt(newStudent.academicYear.split('-')[0], 10);
    if (isNaN(startYear)) {
      showToast("Invalid academic year format.", "error");
      return;
    }

    if (newStudent.admissionType === 'Freshman' && startYear < 2026) {
      showToast("Freshman students cannot be admitted into academic years prior to 2026-2027.", "error");
      return;
    }
    const totalPreviewUnits = previewCourseLoad.reduce((acc, curr) => acc + curr.units, 0);
    const limitCheck = checkEnrollmentLimit(newStudent.curriculum, newStudent.yearLevel, newStudent.semester, totalPreviewUnits);
    if (!limitCheck.success) { showToast(limitCheck.message, "error"); return; }
    const isUnique = await checkSrCodeUniqueness(newStudent.studentId);
    if (!isUnique) { showToast("Duplicate SR-Code detected.", "error"); return; }
    try {
      const timestamp = new Date().toISOString();
      await setDoc(doc(db, 'students', newStudent.studentId), { ...newStudent, createdAt: timestamp, updatedAt: timestamp, id: newStudent.studentId });

      for (const course of previewCourseLoad) {
        await addDoc(collection(db, 'studentSubjects'), {
          studentId: newStudent.studentId,
          subjectCode: course.subjectCode,
          subjectTitle: course.descriptiveTitle,
          grade: course.grade,
          status: 'in progress',
          term: course.academicYear,
          yearLevel: newStudent.yearLevel,
          semester: course.semester,
          units: course.units,
          remarks: 'Pending for Evaluation',
          recordedAt: timestamp
        });
      }
      showToast("Student profile created and courses loaded successfully!");
      setView('directory');
      setNewStudent({
        studentId: '', email: '', firstName: '', middleInitial: '', lastName: '',
        course: 'BSIT', track: '', curriculum: 'NEW', yearLevel: 'First Year', semester: '1st Semester',
        section: 'A', admissionType: 'Freshman', classification: 'regular', status: 'Active', academicYear: '2026-2027'
      });
    } catch (err) { showToast("Failed to write student parameters.", "error"); }
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    if (!editStudentForm.email.toLowerCase().endsWith('@g.tlsu.edu.ph')) {
      showToast("Email address must use domain: @g.tlsu.edu.ph", "error");
      return;
    }
    const startYear = parseInt(editStudentForm.academicYear.split('-')[0], 10);
    if (isNaN(startYear)) {
      showToast("Invalid academic year format.", "error");
      return;
    }

    if (editStudentForm.admissionType === 'Freshman' && startYear < 2026) {
      showToast("Freshman students cannot be admitted into academic years prior to 2026-2027.", "error");
      return;
    }
    try {
      await updateDoc(doc(db, 'students', selectedStudent.studentId), { ...editStudentForm, updatedAt: new Date().toISOString() });
      setSelectedStudent({ ...selectedStudent, ...editStudentForm });
      setIsEditModalOpen(false);
      showToast("Student profile updated.");
    } catch (err) { showToast("Database core update was rejected.", "error"); }
  };

  const handleStatusUpdate = async (nextStatus) => {
    if (!nextStatus) return;
    try {
      await updateDoc(doc(db, 'students', selectedStudent.studentId), { status: nextStatus, updatedAt: new Date().toISOString() });
      setSelectedStudent(prev => ({ ...prev, status: nextStatus }));
      showToast(`Status modified to ${nextStatus.toUpperCase()}`);
    } catch (err) { console.error(err); showToast("Failed to update status", "error"); }
  };

  const handleAddManualSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectRecord.subjectCode || !selectedStudent) return;
    const currentSemUnits = studentSubjects.filter(sub => sub && sub.semester === newSubjectRecord.semester).reduce((acc, curr) => acc + (parseInt(curr.units) || 0), 0);
    const totalUnitsWithNew = currentSemUnits + parseInt(newSubjectRecord.units, 10);
    const limitCheck = checkEnrollmentLimit(selectedStudent.curriculum, selectedStudent.yearLevel, newSubjectRecord.semester, totalUnitsWithNew);
    if (!limitCheck.success) { showToast(limitCheck.message, "error"); return; }
    try {
      await addDoc(collection(db, 'studentSubjects'), {
        studentId: selectedStudent.studentId,
        subjectCode: newSubjectRecord.subjectCode.toUpperCase(),
        subjectTitle: newSubjectRecord.subjectTitle || 'Manual Entry Course',
        grade: newSubjectRecord.grade,
        status: newSubjectRecord.grade === 'In Progress' ? 'in progress' : 'passed',
        term: newSubjectRecord.term,
        yearLevel: newSubjectRecord.yearLevel,
        semester: newSubjectRecord.semester,
        units: parseInt(newSubjectRecord.units, 10) || 3,
        recordedAt: new Date().toISOString()
      });
      setIsManageModalOpen(false);
      showToast("Course node loaded successfully!");
    } catch (err) { showToast("Failed to link course load.", "error"); }
  };

  const handleInputGradeSubmit = async (subjectId) => {
    const statusText = selectedInlineGrade === '5.00' ? 'failed' : ['Inc', 'Drop', 'W'].includes(selectedInlineGrade) ? 'incomplete' : 'passed';
    try {
      await updateDoc(doc(db, 'studentSubjects', subjectId), { grade: selectedInlineGrade, status: statusText, recordedAt: new Date().toISOString() });
      setGradingSubjectId(null);
      showToast("Grade updated successfully!");
    } catch (err) { showToast("Failed to record grade.", "error"); }
  };

  const checkSrCodeUniqueness = async (srCode) => {
    if (!srCode) return true;
    setSrCodeChecking(true);
    try {
      const docSnap = await getDoc(doc(db, 'students', srCode));
      if (docSnap.exists()) { setSrCodeChecking(false); return false; }
    } catch (err) { console.error(err); }
    setSrCodeChecking(false);
    return true;
  };

  const handleDeleteRecord = async (docId) => {
    if (confirm("Permanently strip this academic record item?")) {
      await deleteDoc(doc(db, 'studentSubjects', docId));
      showToast("Record successfully deleted.");
    }
  };

  const openEditModal = () => {
    if (!selectedStudent) return;
    setEditStudentForm({ ...selectedStudent });
    setIsEditModalOpen(true);
  };

  const directoryFilteredList = students.filter(s => {
    const stringBlock = `${s.firstName || ''} ${s.lastName || ''} ${s.studentId || ''}`.toLowerCase();
    const matchSearch = stringBlock.includes(searchQuery.toLowerCase());
    const matchCurr = filterCurriculum === 'All' || s.curriculum === filterCurriculum;
    const matchYear = filterYear === 'All' || normalizeYear(s.yearLevel) === normalizeYear(filterYear);
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    const matchAdmin = filterAdmission === 'All' || s.admissionType === filterAdmission;
    const matchClass = filterClassification === 'All' || s.classification === filterClassification;
    const matchTrack = filterTrack === 'All' || s.track === filterTrack;
    return matchSearch && matchCurr && matchYear && matchStatus && matchAdmin && matchClass && matchTrack;
  });


  // `loading` is only true until the first students snapshot lands, so this
  // gates the initial load without flashing on later stream updates.
  if (loading) {
    return (
      <div className="p-8 bg-[#f8fafc] min-h-screen text-slate-800 font-sans antialiased relative">
        <LoadingState label="Loading Student Directory..." />
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen text-slate-800 font-sans antialiased relative">

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl border shadow-xl transition-all duration-300 ${toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          } text-xs font-bold`}>
          <span>{toast.message}</span>
        </div>
      )}
      {/* ================= VIEW 1: DIRECTORY WORKBENCH ================= */}
      {view === 'directory' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Students Directory</h1>
              <p className="text-slate-500 text-sm mt-0.5">Automated curriculum tracing and transcript management matrix.</p>
            </div>
            <button onClick={() => setView('add-student')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-sm flex items-center gap-1.5">
              <Plus size={16} /> Add New Student
            </button>
          </div>
          {/* Filter Bar Controls */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 min-w-[320px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text" placeholder="Search by SR-Code or student name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-2.5">
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-600 font-medium focus:outline-none">
                  <option value="All">All Year Levels</option>
                  <option value="First Year">1st Year</option>
                  <option value="Second Year">2nd Year</option>
                  <option value="Third Year">3rd Year</option>
                  <option value="Fourth Year">4th Year</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-600 font-medium focus:outline-none">
                  <option value="All">All Statuses</option>
                  {STUDENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`border p-2.5 rounded-xl ${showAdvancedFilters ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-600'}`}><SlidersHorizontal size={18} /></button>
              </div>
            </div>
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left text-xs font-bold text-slate-400">
                <div><label className="mb-1 block uppercase">Curriculum Version</label>
                  <select value={filterCurriculum} onChange={e => setFilterCurriculum(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2 font-medium text-slate-600 outline-none"><option value="All">All Curriculums</option><option value="NEW">New Curriculum</option><option value="OLD">Old Curriculum</option></select>
                </div>
                <div><label className="mb-1 block uppercase">Admission Type</label>                   <select value={filterAdmission} onChange={e => setFilterAdmission(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2 font-medium text-slate-600 outline-none"><option value="All">All Admissions</option>{ADMISSION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}</select>
                </div>
                <div><label className="mb-1 block uppercase">Classification</label>                   <select value={filterClassification} onChange={e => setFilterClassification(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2 font-medium text-slate-600 outline-none"><option value="All">All Classifications</option><option value="regular">Regular</option><option value="irregular">Irregular</option></select>
                </div>
                <div><label className="mb-1 block uppercase">Track specialization</label>                   <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2 font-medium text-slate-600 outline-none"><option value="All">All Tracks</option><option value="Business Analytics">Business Analytics</option><option value="Service Management">Service Management</option><option value="Networking Technology">Networking Technology</option></select>
                </div>
              </div>
            )}
          </div>
          {/* Main List Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Student Info</th>
                    <th className="px-6 py-4">SR-Code</th>
                    <th className="px-6 py-4">Current Placement</th>
                    <th className="px-6 py-4">Track Matrix</th>
                    <th className="px-6 py-4">Curriculum Plan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {directoryFilteredList.map((student) => (
                    <tr key={student.id} onClick={() => { setSelectedStudent(student); setView('student-details'); setActiveTab('Summary'); }} className="hover:bg-slate-50/50 cursor-pointer transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{student.lastName}, {student.firstName}</td>
                      <td className="px-6 py-4 font-bold text-blue-600">{student.studentId}</td>
                      <td className="px-6 py-4 text-slate-500">AY {student.academicYear || 'N/A'}   {student.semester || '1st Semester'}   {student.yearLevel}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{student.track || 'Unassigned'}</td>
                      <td className="px-6 py-4"><span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{student.course}   {student.curriculum === 'NEW' ? 'New' : 'Old'} Curriculum</span></td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700">
                          {student.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right"><ChevronRight size={18} className="text-slate-300" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* ================= VIEW 2: PROFILE EVALUATION WORKBENCH ================= */}
      {view === 'student-details' && selectedStudent && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">

          {/* Main Top Header Block */}
          <div className="bg-white p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => { setView('directory'); setSelectedStudent(null); }} className="w-10 h-10 flex items-center justify-center border hover:bg-slate-50 rounded-xl transition text-slate-600"><ArrowLeft size={16} /></button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-[#0f172a]">{selectedStudent.lastName}, {selectedStudent.firstName}</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#e2fbf1] text-[#0e9f6e] rounded-md uppercase">{selectedStudent.status || 'Active'}</span>
                </div>
                <p className="text-slate-400 text-[13px] mt-1 font-semibold flex items-center gap-2">
                  <span>{selectedStudent.studentId}</span><span> </span>
                  <span>{selectedStudent.course} ({selectedStudent.yearLevel})</span><span> </span>
                  <span>AY {selectedStudent.academicYear} ({selectedStudent.semester})</span>
                </p>
              </div>
            </div>

            {/* Real-time Custom Student Status Selector */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black tracking-wider block uppercase text-slate-400">Choose Student Status</label>
              <div className="flex gap-2">
                <select
                  value={selectedStudent.status || 'Active'}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="px-4 py-2 border bg-white text-xs font-bold text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                >
                  {STUDENT_STATUSES.map((status) => (
                    <option key={status.value} value={status.value} title={status.desc}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button onClick={openEditModal} className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition">Manage Profile Configuration</button>
              </div>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-normal italic">
                {STUDENT_STATUSES.find(s => s.value === (selectedStudent.status || 'Active'))?.desc}
              </p>
            </div>
          </div>
          {/* Sub Tab Navigation Selection Bar */}
          <div className="flex gap-2 border-b border-slate-100 pb-0.5">
            {['Summary', 'Copy of Grades', 'Semester Plan'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 text-xs font-bold rounded-xl transition ${activeTab === tab ? 'bg-white text-[#0f172a] shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{tab}</button>
            ))}
          </div>
          <div className="space-y-6">
            {/* --- TAB: SUMMARY --- */}
            {activeTab === 'Summary' && (
              <div className="space-y-6 text-left animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border"><p className="text-slate-400 text-xs font-bold uppercase">GWA</p><p className="text-3xl font-extrabold mt-2">{metrics.gwa}</p></div>
                  <div className="bg-white p-5 rounded-2xl border"><p className="text-slate-400 text-xs font-bold uppercase">Assigned Subjects</p><p className="text-3xl font-extrabold mt-2">{metrics.totalAssigned}</p></div>
                  <div className="bg-white p-5 rounded-2xl border"><p className="text-slate-400 text-xs font-bold uppercase">Evaluated Count</p><p className="text-3xl font-extrabold mt-2">{metrics.evaluatedCount}</p></div>
                  <div className="bg-white p-5 rounded-2xl border"><p className="text-slate-400 text-xs font-bold uppercase">Passed Checklist</p><p className="text-3xl font-extrabold text-[#10b981] mt-2">{metrics.passedCount}</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border space-y-4">
                  <h3 className="text-sm font-bold">Academic Portfolio Registry</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2 border-t">
                    <div className="flex justify-between py-1 border-b"> <span className="text-slate-500">Degree Course Map</span> <span className="font-bold text-slate-900">{selectedStudent.course}</span> </div>
                    <div className="flex justify-between py-1 border-b"> <span className="text-slate-500">Curriculum Tracking Version</span> <span className="font-bold text-slate-900">{selectedStudent.curriculum === 'NEW' ? 'New Curriculum' : 'Old Curriculum'}</span> </div>
                    <div className="flex justify-between py-1 border-b"> <span className="text-slate-500">Classification</span> <span className="font-bold text-slate-900 capitalize">{selectedStudent.classification}</span> </div>
                    <div className="flex justify-between py-1 border-b"> <span className="text-slate-500">Assigned Track Specialization</span> <span className="font-bold text-slate-900">{selectedStudent.track || 'Unassigned'}</span> </div>
                  </div>
                </div>
              </div>
            )}
            {/* --- TAB: COPY OF GRADES --- */}
            {activeTab === 'Copy of Grades' && (
              <CopyOfGradesMatrix
                subjects={studentSubjects}
                fallbackYearLevel={selectedStudent?.yearLevel}
                gradingSubjectId={gradingSubjectId}
                selectedInlineGrade={selectedInlineGrade}
                onSelectedInlineGradeChange={setSelectedInlineGrade}
                onStartGrading={(sub) => { setGradingSubjectId(sub.id); setSelectedInlineGrade(sub.grade); }}
                onSubmitGrade={handleInputGradeSubmit}
                onCancelGrading={() => setGradingSubjectId(null)}
                onDeleteRecord={handleDeleteRecord}
                headerActions={
                  <>
                    <button onClick={() => setIsPopulateModalOpen(true)} className="px-4 py-1.5 border hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition">
                      <FileSpreadsheet size={14} /> Populate Semester Form
                    </button>
                    <button onClick={() => setIsManageModalOpen(true)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition">
                      <Plus size={14} /> Add Single Subject
                    </button>
                  </>
                }
              />
            )}
            {/* --- TAB: SEMESTER PLAN (STRIPPED CLEAN VERSION FOR DIRECT SYSTEM ALIGNMENT) --- */}
            {activeTab === 'Semester Plan' && (
              <div className="space-y-8 text-left animate-fadeIn">

                {/* Global Summary Badge Block */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Layers size={20} /></div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Course Curriculum Semester Blueprint</h3>
                      <p className="text-slate-400 text-xs mt-0.5 font-medium">Standardized complete degree requirements layout.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <span className="text-[10px] font-black tracking-wider block uppercase text-slate-400">Master Checklist Progress</span>
                      <span className="text-base font-black text-slate-900">
                        {(() => {
                          const catalog = selectedStudent.curriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog;
                          const passed = studentSubjects.filter(s => s && (s.status === 'passed' || (parseFloat(s.grade) >= 1.0 && parseFloat(s.grade) <= 3.0)));
                          return `${passed.length} / ${catalog.length} Finished`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unified Structured Semesters (Removed outer Card panels) */}
                {Object.entries(generateStructuredAuditReport())
                  .sort(([a], [b]) => {
                    const yA = a.toLowerCase().includes('first') ? 1 : a.toLowerCase().includes('second') ? 2 : a.toLowerCase().includes('third') ? 3 : 4;
                    const yB = b.toLowerCase().includes('first') ? 1 : b.toLowerCase().includes('second') ? 2 : b.toLowerCase().includes('third') ? 3 : 4;
                    return yA - yB;
                  })
                  .map(([yearKey, semesters]) => (
                    <div key={yearKey} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                        <span className="w-1.5 h-4 bg-slate-900 rounded-xs" />
                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{yearKey} Master Outline</h4>
                      </div>
                      {Object.entries(semesters).map(([semKey, courses]) => {
                        const currYearClean = normalizeYear(yearKey);
                        const semShort = semKey.includes('2nd') ? '2' : semKey.includes('Summer') ? 'mid' : '1';
                        const maxUnitsPermitted = MAX_UNITS_CONFIG[selectedStudent.curriculum === 'NEW' ? 'new_curriculum' : 'old_curriculum'][`y${currYearClean}_s${semShort}`] || 21;
                        const activelyTakenUnits = courses.filter(c => c.status === 'EVALUATED').reduce((sum, c) => sum + c.units, 0);
                        return (
                          <div key={semKey} className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                            <div className="px-5 py-4 bg-slate-50/50 border-b flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                <span className="font-bold text-slate-900 text-xs tracking-tight">{semKey} Template Allocation</span>
                              </div>
                              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border px-2.5 py-0.5 rounded-full shadow-3xs">
                                Capacity: {activelyTakenUnits} / {maxUnitsPermitted} Units Taken
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/20 border-b">
                                    <th className="px-5 py-3 w-[15%]">Subject Code</th>
                                    <th className="px-5 py-3 w-[45%]">Descriptive Course Title</th>
                                    <th className="px-5 py-3 text-center w-[10%]">Units</th>
                                    <th className="px-5 py-3 w-[15%]">Prerequisites Audit</th>
                                    <th className="px-5 py-3 text-center w-[15%]">Completion Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y font-semibold text-slate-600/90">
                                  {courses.map((c, i) => (
                                    <tr key={i} className={`hover:bg-slate-50/30 ${c.status === 'EVALUATED' ? 'bg-emerald-50/5' : 'bg-red-50/5'}`}>
                                      <td className="px-5 py-3.5 font-black text-slate-950 tracking-wide">{c.code}</td>
                                      <td className="px-5 py-3.5 font-medium text-slate-600">{c.title}</td>
                                      <td className="px-5 py-3.5 text-center text-slate-950 font-black">{c.units}</td>

                                      <td className="px-5 py-3.5">
                                        {c.prereqs.length > 0 ? (
                                          <div className="space-y-1">
                                            <div className="flex flex-wrap gap-1">
                                              {c.prereqs.map((p, idx) => (
                                                <span key={idx} className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${c.missingPrereqs.includes(p) ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                  {p}
                                                </span>
                                              ))}
                                            </div>
                                            {!c.prereqsMet && (
                                              <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                                <AlertTriangle size={10} /> Prerequisite Unmet
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 font-medium italic text-[11px]">None</span>
                                        )}
                                      </td>
                                      <td className="px-5 py-3.5 text-center">
                                        <span className={`text-[10px] font-black border px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-3xs ${c.status === 'EVALUATED'
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                          : 'bg-red-50 border-red-200 text-red-600'
                                          }`}>
                                          {c.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ================= VIEW 3: ADMIT NEW STUDENT ENTRY FORM ================= */}
      {view === 'add-student' && (
        <div className="max-w-5xl mx-auto space-y-6 text-left animate-fadeIn">
          <button onClick={() => setView('directory')} className="text-slate-500 hover:text-slate-800 font-semibold text-sm flex items-center gap-2"><ArrowLeft size={16} /> Back to Directory</button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Plus size={24} /></div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Admit New Student</h1>
              <p className="text-slate-500 text-sm font-medium">Verify structural placement variables. Missing items pull from system catalogs.</p>
            </div>
          </div>
          <form onSubmit={handleAddStudent} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border space-y-4 shadow-sm">
              <h2 className="text-base font-bold flex items-center gap-2 border-b pb-2"><GraduationCap size={18} className="text-blue-500" /> Academic Block</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Program / Course Map</label>
                  <select value={newStudent.course} onChange={e => setNewStudent({ ...newStudent, course: e.target.value })} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold outline-none">
                    {COURSE_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    Year Level Placement *
                    {newStudent.admissionType === 'Freshman' && <Lock size={12} className="text-slate-400" />}
                  </label>
                  <select
                    disabled={newStudent.admissionType === 'Freshman'}
                    value={newStudent.yearLevel}
                    onChange={e => setNewStudent({ ...newStudent, yearLevel: e.target.value })}
                    className={`w-full ${newStudent.admissionType === 'Freshman' ? 'bg-slate-100 text-slate-500 border-slate-100 cursor-not-allowed shadow-none' : 'bg-slate-50 border-slate-200'} border rounded-xl p-2.5 text-xs font-semibold outline-none`}
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Fourth Year">Fourth Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    Assigned Semester Target *
                    {newStudent.admissionType === 'Freshman' && <Lock size={12} className="text-slate-400" />}
                  </label>
                  <select
                    disabled={newStudent.admissionType === 'Freshman'}
                    value={newStudent.semester}
                    onChange={e => setNewStudent({ ...newStudent, semester: e.target.value })}
                    className={`w-full ${newStudent.admissionType === 'Freshman' ? 'bg-slate-100 text-slate-500 border-slate-100 cursor-not-allowed shadow-none' : 'bg-slate-50 border-slate-200'} border rounded-xl p-2.5 text-xs font-semibold outline-none`}
                  >
                    {SEMESTER_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Specialization Track */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    Specialization Track
                    {(normalizeYear(newStudent.yearLevel) === '1' || normalizeYear(newStudent.yearLevel) === '2') && <Lock size={12} className="text-slate-400" />}
                  </label>
                  <select
                    value={newStudent.track}
                    disabled={normalizeYear(newStudent.yearLevel) === '1' || normalizeYear(newStudent.yearLevel) === '2'}
                    onChange={e => setNewStudent({ ...newStudent, track: e.target.value })}
                    className={`w-full ${normalizeYear(newStudent.yearLevel) === '1' || normalizeYear(newStudent.yearLevel) === '2' ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed shadow-none' : 'bg-slate-50 text-amber-700 font-bold border-slate-200'} border rounded-xl p-2.5 text-xs font-semibold outline-none`}
                  >
                    <option value="">Select Specialization Track</option>
                    <option value="Business Analytics">Business Analytics</option>
                    <option value="Service Management">Service Management</option>
                    <option value="Networking Technology">Networking Technology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    Curriculum Version Profile
                    <Lock size={12} className="text-slate-400" />
                  </label>
                  <select
                    disabled
                    value={newStudent.curriculum}
                    className="w-full bg-slate-100 text-slate-500 border border-slate-100 rounded-xl p-2.5 text-xs font-bold outline-none cursor-not-allowed shadow-none"
                  >
                    <option value="NEW">New Curriculum</option>
                    <option value="OLD">Old Curriculum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    Started School Year *
                    {newStudent.admissionType === 'Freshman' && <Lock size={12} className="text-slate-400" />}
                  </label>
                  <select
                    disabled={newStudent.admissionType === 'Freshman'}
                    value={newStudent.academicYear}
                    onChange={e => setNewStudent({ ...newStudent, academicYear: e.target.value })}
                    className={`w-full ${newStudent.admissionType === 'Freshman' ? 'bg-slate-100 text-slate-500 border-slate-100 cursor-not-allowed shadow-none' : 'bg-slate-50 text-slate-900 border-slate-200'} border rounded-xl p-2.5 text-xs font-semibold outline-none`}
                  >
                    {ACADEMIC_YEARS_LIST.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    Academic Year *
                    <Lock size={12} className="text-slate-400" />
                  </label>
                  {/* Read-only mirror of the registrar's active A.Y. (Settings > Academic Year). */}
                  <select
                    disabled
                    value={activeAcademicYear}
                    className="w-full bg-slate-100 text-slate-500 border border-slate-100 rounded-xl p-2.5 text-xs font-bold outline-none cursor-not-allowed shadow-none"
                  >
                    <option value={activeAcademicYear}>{activeAcademicYear}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Admission Type *</label>
                  <select
                    value={newStudent.admissionType}
                    onChange={e => setNewStudent({ ...newStudent, admissionType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none"
                  >
                    {ADMISSION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Initial Status *</label>
                  <select
                    value={newStudent.status}
                    onChange={e => setNewStudent({ ...newStudent, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none"
                  >
                    {STUDENT_STATUSES.map(s => (
                      <option key={s.value} value={s.value} title={s.desc}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border space-y-4 shadow-sm">
              <h2 className="text-base font-bold border-b pb-2 flex items-center gap-2"><User size={18} className="text-blue-500" /> Identity Block</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">SR-Code identifier *</label>
                  <input
                    type="text" required placeholder="e.g. 23-08214"
                    value={newStudent.studentId}
                    onBlur={e => checkSrCodeUniqueness(e.target.value)}
                    onChange={e => {
                      setNewStudent({ ...newStudent, studentId: handleIdStrFilter(e.target.value) });
                      setSrCodeError('');
                    }}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-medium outline-none"
                  />
                  {srCodeError && <p className="text-red-500 mt-1 text-[11px] font-bold">{srCodeError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Official Email Address *</label>
                  <input
                    type="text" required placeholder="username@g.tlsu.edu.ph"
                    value={newStudent.email}
                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value.trim() })}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 md:col-span-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">First Name *</label>
                    <input type="text" required value={newStudent.firstName} onChange={e => setNewStudent({ ...newStudent, firstName: handleNameStrFilter(e.target.value) })} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">M.I.</label>
                    <input type="text" maxLength={2} value={newStudent.middleInitial} onChange={e => setNewStudent({ ...newStudent, middleInitial: handleNameStrFilter(e.target.value) })} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs text-center outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Last Name *</label>
                    <input type="text" required value={newStudent.lastName} onChange={e => setNewStudent({ ...newStudent, lastName: handleNameStrFilter(e.target.value) })} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs outline-none" />
                  </div>
                </div>
              </div>
            </div>
            {/* ================= PREVIEW COMPONENT ================= */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm">Course Load Pre-loaded Matrix Preview</h3>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 border px-3 py-1 rounded-full">
                  {previewCourseLoad.reduce((acc, curr) => acc + curr.units, 0)} / {maxAllowedPreviewUnits} Units
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b font-bold uppercase">
                    <th className="pb-2">Semester Placement</th>
                    <th className="pb-2">Subject Code</th>
                    <th className="pb-2 text-left">Descriptive Title Map Target</th>
                    <th className="pb-2 text-center">Units</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-600">
                  {previewCourseLoad.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-slate-50/50">
                      <td className="py-3 text-slate-400">{item.semester}</td>
                      <td className="py-3 font-extrabold text-slate-950">{item.subjectCode}</td>
                      <td className="py-3 text-left">{item.descriptiveTitle}</td>
                      <td className="py-3 text-center text-slate-950 font-bold">{item.units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setView('directory')} className="px-5 py-2 border rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-xs hover:bg-blue-700">Admit Student Profile</button>
            </div>
          </form>
        </div>
      )}
      {/* ================= MODAL: EDIT INFORMATION ================= */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 animate-fadeIn text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Edit3 size={18} className="text-blue-600" /> Edit Student Records Configuration</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditStudentSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-bold text-slate-55 uppercase mb-1">First Name</label>
                  <input type="text" required value={editStudentForm.firstName} onChange={e => setEditStudentForm({ ...editStudentForm, firstName: handleNameStrFilter(e.target.value) })} className="w-full bg-slate-50 border rounded-xl p-2.5 text-sm focus:outline-none" />
                </div>
                <div><label className="block text-xs font-bold text-slate-55 uppercase mb-1">M.I.</label>
                  <input type="text" value={editStudentForm.middleInitial} onChange={e => setEditStudentForm({ ...editStudentForm, middleInitial: handleNameStrFilter(e.target.value) })} className="w-full bg-slate-50 border rounded-xl p-2.5 text-sm focus:outline-none" />
                </div>
                <div><label className="block text-xs font-bold text-slate-55 uppercase mb-1">Last Name</label>
                  <input type="text" required value={editStudentForm.lastName} onChange={e => setEditStudentForm({ ...editStudentForm, lastName: handleNameStrFilter(e.target.value) })} className="w-full bg-slate-50 border rounded-xl p-2.5 text-sm focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 mb-1 flex items-center gap-1">Academic Year *
                    {editStudentForm.admissionType === 'Freshman' && <Lock size={12} className="text-slate-400" />}
                  </label>
                  <select
                    disabled={editStudentForm.admissionType === 'Freshman'}
                    value={editStudentForm.academicYear}
                    onChange={e => setEditStudentForm({ ...editStudentForm, academicYear: e.target.value })}
                    className={`w-full ${editStudentForm.admissionType === 'Freshman' ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed shadow-none' : 'bg-slate-50 border-slate-200'} border rounded-xl p-2.5 text-sm outline-none`}
                  >
                    {ACADEMIC_YEARS_LIST.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 flex items-center gap-1">Semester
                    {editStudentForm.admissionType === 'Freshman' && <Lock size={12} className="text-slate-400" />}
                  </label>
                  <select
                    disabled={editStudentForm.admissionType === 'Freshman'}
                    value={editStudentForm.semester}
                    onChange={e => setEditStudentForm({ ...editStudentForm, semester: e.target.value })}
                    className={`w-full ${editStudentForm.admissionType === 'Freshman' ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed shadow-none' : 'bg-slate-50 border-slate-200'} border rounded-xl p-2.5 text-sm outline-none`}
                  >
                    {SEMESTER_LIST.map(sem => <option key={sem} value={sem}>{sem}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-55 uppercase mb-1 flex items-center gap-1">Year Level
                    {editStudentForm.admissionType === 'Freshman' && <Lock size={12} className="text-slate-400" />}
                  </label>
                  <select
                    disabled={editStudentForm.admissionType === 'Freshman'}
                    value={editStudentForm.yearLevel}
                    onChange={e => setEditStudentForm({ ...editStudentForm, yearLevel: e.target.value })}
                    className={`w-full ${editStudentForm.admissionType === 'Freshman' ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed shadow-none' : 'bg-white border-slate-200'} border rounded-xl p-2.5 text-sm focus:outline-none cursor-pointer`}
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Fourth Year">Fourth Year</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-slate-55 uppercase mb-1">Section</label>
                  <select value={editStudentForm.section} onChange={e => setEditStudentForm({ ...editStudentForm, section: e.target.value })} className="w-full bg-white border rounded-xl p-2.5 text-sm focus:outline-none cursor-pointer">
                    {SECTION_LIST.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-slate-55 uppercase mb-1">Classification</label>
                  <select value={editStudentForm.classification} onChange={e => setEditStudentForm({ ...editStudentForm, classification: e.target.value })} className="w-full bg-white border rounded-xl p-2.5 text-sm cursor-pointer">
                    {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs font-semibold">
                <div>
                  <label className="block mb-1">Admission Type *</label>
                  <select value={editStudentForm.admissionType} onChange={e => setEditStudentForm({ ...editStudentForm, admissionType: e.target.value })} className="w-full border rounded-xl p-2.5 outline-none bg-white font-medium">
                    {ADMISSION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Status Profile *</label>
                  <select value={editStudentForm.status} onChange={e => setEditStudentForm({ ...editStudentForm, status: e.target.value })} className="w-full border rounded-xl p-2.5 outline-none bg-white font-medium">
                    {STUDENT_STATUSES.map(status => <option key={status.value} value={status.value} title={status.desc}>{status.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 flex items-center gap-1">Curriculum Version Profile
                    <Lock size={12} className="text-slate-400" />
                  </label>
                  <select
                    disabled
                    value={editStudentForm.curriculum}
                    className="w-full bg-slate-100 text-slate-500 border border-slate-100 rounded-xl p-2.5 text-sm outline-none cursor-not-allowed shadow-none font-medium"
                  >
                    <option value="NEW">New Curriculum</option>
                    <option value="OLD">Old Curriculum</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-55 uppercase mb-1">Official Email Address *</label>
                <input type="text" required value={editStudentForm.email} onChange={e => setEditStudentForm({ ...editStudentForm, email: e.target.value.trim() })} className="w-full border rounded-xl p-2.5 text-sm outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-55 uppercase mb-1 flex items-center gap-1">
                  Assigned Track Specialization
                  {(normalizeYear(editStudentForm.yearLevel) === '1' || normalizeYear(editStudentForm.yearLevel) === '2') && <Lock size={12} className="text-slate-400" />}
                </label>
                <select
                  value={editStudentForm.track}
                  disabled={normalizeYear(editStudentForm.yearLevel) === '1' || normalizeYear(editStudentForm.yearLevel) === '2'}
                  onChange={e => setEditStudentForm({ ...editStudentForm, track: e.target.value })}
                  className={`w-full ${normalizeYear(editStudentForm.yearLevel) === '1' || normalizeYear(editStudentForm.yearLevel) === '2' ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed shadow-none' : 'bg-white text-slate-900'} border rounded-xl p-2.5 text-sm outline-none`}
                >
                  <option value="">Select Specialization Track</option>
                  <option value="Business Analytics">Business Analytics</option>
                  <option value="Service Management">Service Management</option>
                  <option value="Networking Technology">Networking Technology</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"><Save size={16} /> Save Profiles</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL: ADD MANUAL SUBJECT ================= */}
      {isManageModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border shadow-xl text-left">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3 mb-4">Manual Course Load Addition Matrix</h3>
            <form onSubmit={handleAddManualSubject} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Subject Code *</label>
                <select
                  required
                  disabled={isManualCatalogLoading || manualEntryCatalog.length === 0}
                  value={newSubjectRecord.subjectCode}
                  onChange={e => handleManualSubjectCodeChange(e.target.value)}
                  className={`w-full border p-2.5 rounded-xl outline-none font-medium ${isManualCatalogLoading || manualEntryCatalog.length === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}`}
                >
                  <option value="">
                    {isManualCatalogLoading
                      ? 'Loading subjects...'
                      : manualEntryCatalog.length === 0
                        ? `No subjects found for ${newSubjectRecord.yearLevel} - ${newSubjectRecord.semester}`
                        : 'Select Subject Code'}
                  </option>
                  {manualEntryCatalog.map(sub => <option key={sub.code} value={sub.code}>{sub.code}</option>)}
                </select>
                {!isManualCatalogLoading && manualEntryCatalog.length === 0 && (
                  <p className="text-amber-600 mt-1 font-medium">
                    No subjects found for {newSubjectRecord.yearLevel} - {newSubjectRecord.semester}.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Descriptive Title</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Networks"
                  readOnly={Boolean(newSubjectRecord.subjectCode)}
                  value={newSubjectRecord.subjectTitle}
                  onChange={e => setNewSubjectRecord({ ...newSubjectRecord, subjectTitle: e.target.value })}
                  className={`w-full border p-2.5 rounded-xl outline-none ${newSubjectRecord.subjectCode ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Units *</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    required
                    readOnly={Boolean(newSubjectRecord.subjectCode)}
                    value={newSubjectRecord.units}
                    onChange={e => setNewSubjectRecord({ ...newSubjectRecord, units: e.target.value })}
                    className={`w-full border p-2.5 rounded-xl outline-none ${newSubjectRecord.subjectCode ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Academic Year Term</label>
                  <select value={newSubjectRecord.term} onChange={e => handleManualScopeChange({ term: e.target.value })} className="w-full border p-2.5 rounded-xl outline-none bg-white font-medium">
                    {ACADEMIC_YEARS_LIST.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Year Level Placement</label>
                  <select value={newSubjectRecord.yearLevel} onChange={e => handleManualScopeChange({ yearLevel: e.target.value })} className="w-full border p-2.5 rounded-xl outline-none bg-white font-medium">
                    {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Target Semester</label>
                  <select value={newSubjectRecord.semester} onChange={e => handleManualScopeChange({ semester: e.target.value })} className="w-full border p-2.5 rounded-xl outline-none bg-white font-medium">
                    {SEMESTER_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Initial Grade Rating</label>
                <select value={newSubjectRecord.grade} onChange={e => setNewSubjectRecord({ ...newSubjectRecord, grade: e.target.value })} className="w-full border p-2.5 rounded-xl outline-none bg-white font-medium">
                  <option value="In Progress">In Progress</option>
                  {BATSTATEU_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsManageModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl">Append Node</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL: POPULATE SEMESTER CHECKSHEET FORM ================= */}
      {isPopulateModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border shadow-xl text-left">
            <h3 className="text-sm font-extrabold text-slate-900 border-b pb-3 mb-4 flex items-center gap-1.5">
              <FileSpreadsheet className="text-blue-600" size={18} /> Populate Semester Subjects Form
            </h3>
            <p className="text-slate-500 text-[11px] mb-4">
              Select an Academic Year, Year Level, and Semester. This will automatically pull the curriculum matching subjects from the database catalog to create blank "In Progress" courses for this student.
            </p>
            <form onSubmit={handlePopulateSemester} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Select Year Level</label>
                <select value={populateForm.yearLevel} onChange={e => setPopulateForm({ ...populateForm, yearLevel: e.target.value })} className="w-full border p-2.5 rounded-xl outline-none bg-white font-medium">
                  {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Select Semester</label>
                <select value={populateForm.semester} onChange={e => setPopulateForm({ ...populateForm, semester: e.target.value })} className="w-full border p-2.5 rounded-xl outline-none bg-white font-medium">
                  {SEMESTER_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Academic Year Term</label>
                <select value={populateForm.term} onChange={e => setPopulateForm({ ...populateForm, term: e.target.value })} className="w-full border p-2.5 rounded-xl outline-none bg-white font-medium">
                  {ACADEMIC_YEARS_LIST.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsPopulateModalOpen(false)} className="px-4 py-2 border rounded-xl text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">Load Template</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}