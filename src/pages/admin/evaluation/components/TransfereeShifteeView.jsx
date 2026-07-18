import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, Plus, Sparkles, Check, Info, AlertTriangle, ArrowRight, BookMarked, Search, ClipboardList, Calendar, ChevronDown } from 'lucide-react';

export default function TransfereeShifteeView({
  isTorComplete,
  torValidationErrors,
  evaluationStrategy,
  prevSchoolName,
  setPrevSchoolName,
  prevProgram,
  setPrevProgram,
  studentSubjectsHistory,
  auditOutput,
  triggerReportModalOpen,
  handleFinalizeEvaluationMatrix,
  isSubmitting,
  onAddManualSubject,
  onDeleteManualSubject,
  bsuCatalog = [],
  selectedStudentData = null
}) {
  // Input fields for external manual transcript entry
  const [encCode, setEncCode] = useState('');
  const [encTitle, setEncTitle] = useState('');
  const [encUnits, setEncUnits] = useState(3);
  const [encGrade, setEncGrade] = useState('1.0');

  // Track semester, year level, and academic year when adding
  const [encSemester, setEncSemester] = useState('1st Semester');
  const [encYearLevel, setEncYearLevel] = useState('First Year');
  const [encAY, setEncAY] = useState('2025-2026');

  // Automated System Matching & Browser Picker States
  const [selectedBsuMatch, setSelectedBsuMatch] = useState(null);
  const [suggestedCandidates, setSuggestedCandidates] = useState([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  // Queue state for historical required subjects
  const [historicalQueue, setHistoricalQueue] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});

  const categoriesList = [
    { id: 'All', label: 'All Catalog' },
    { id: 'General Education', label: 'Gen Ed (GED)' },
    { id: 'Major', label: 'Majors' },
    { id: 'PE', label: 'PE' },
    { id: 'NSTP', label: 'NSTP' },
    { id: 'Elective', label: 'Electives' },
    { id: 'Capstone', label: 'Capstone/OJT' }
  ];

  const YEAR_LEVELS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year', 'Unassigned Year'];
  const SEMESTER_LIST = ['1st Semester', '2nd Semester', 'Summer', 'Unassigned Semester'];

  // Helper normalizers for automated mapping sequence checks
  const getYearOrderIndex = (yearStr) => {
    const y = String(yearStr).toLowerCase();
    if (y.includes('first') || y.includes('1')) return 1;
    if (y.includes('second') || y.includes('2')) return 2;
    if (y.includes('third') || y.includes('3')) return 3;
    if (y.includes('fourth') || y.includes('4')) return 4;
    if (y.includes('fifth') || y.includes('5')) return 5;
    return 1;
  };

  const getSemOrderIndex = (semStr) => {
    const s = String(semStr).toLowerCase();
    if (s.includes('1st') || s.includes('first')) return 1;
    if (s.includes('2nd') || s.includes('second')) return 2;
    if (s.includes('summer') || s.includes('mid')) return 3;
    return 1;
  };

  // AUTOMATION: Computes the precise historical subject queue the student should have completed before entry[cite: 1]
  useEffect(() => {
    if (!selectedStudentData || bsuCatalog.length === 0) return;
    const studentYearIdx = getYearOrderIndex(selectedStudentData.yearLevel || 'First Year');
    const studentSemIdx = getSemOrderIndex(selectedStudentData.semester || '1st Semester');
    const studentBaseAY = parseInt(selectedStudentData.academicYear?.split('-')[0], 10) || 2025;

    // Filter catalog down to find subjects that are scheduled BEFORE the student's active semester placement[cite: 1]
    const priorRequiredSubjects = bsuCatalog.filter(sub => {
      const subYearIdx = getYearOrderIndex(sub.yearLevel);
      
      let rawSemOffered = sub.semesterOffered || [];
      const semArray = Array.isArray(rawSemOffered) ? rawSemOffered : [rawSemOffered];
      const firstSemText = semArray[0] || '1st Semester';
      const subSemIdx = getSemOrderIndex(firstSemText);

      if (subYearIdx < studentYearIdx) return true;
      if (subYearIdx === studentYearIdx && subSemIdx < studentSemIdx) return true;
      return false;
    }).map(sub => {
      const subYearIdx = getYearOrderIndex(sub.yearLevel);
      const yearDiff = studentYearIdx - subYearIdx;
      const targetHistoricalStart = studentBaseAY - yearDiff;
      const computedHistoricalAY = `${targetHistoricalStart}-${targetHistoricalStart + 1}`;
      const semArray = Array.isArray(sub.semesterOffered) ? sub.semesterOffered : [sub.semesterOffered];
      const normalizedSemLabel = semArray[0] || '1st Semester';
      return {
        ...sub,
        computedAY: computedHistoricalAY,
        computedSemester: normalizedSemLabel,
        computedYearLevel: sub.yearLevel || 'First Year'
      };
    });

    setHistoricalQueue(priorRequiredSubjects);
    if (priorRequiredSubjects.length > 0) {
      const firstItem = priorRequiredSubjects[0];
      setEncAY(firstItem.computedAY);
      setEncYearLevel(firstItem.computedYearLevel);
      setEncSemester(firstItem.computedSemester);
    }
  }, [selectedStudentData, bsuCatalog]);

  // Handler to auto-populate form properties instantly when a queue badge is clicked[cite: 1]
  const handleSelectQueueItem = (course) => {
    setEncCode(course.courseCode || course.code || '');
    setEncTitle(course.courseTitle || course.title || '');
    setEncUnits(Number(course.creditUnits || course.units || 3));
    setEncAY(course.computedAY);
    setEncYearLevel(course.computedYearLevel);
    setEncSemester(course.computedSemester);
    setSelectedBsuMatch(course);
  };

  const manualTranscriptHistoryOnly = studentSubjectsHistory.filter(s => s.isManualEntry === true);

  // Group transcripts dynamically by Year Level and Semester matching the Student Management approach[cite: 1]
  const getGroupedCanvasHistory = () => {
    const groups = {};
    YEAR_LEVELS.forEach(y => {
      groups[y] = {};
      SEMESTER_LIST.forEach(s => {
        groups[y][s] = [];
      });
    });

    manualTranscriptHistoryOnly.forEach(sub => {
      const rawYear = sub.yearLevelTaken || 'First Year';
      const rawSem = sub.semesterTaken || '1st Semester';

      let matchedYear = YEAR_LEVELS.find(y => y.toLowerCase() === rawYear.toLowerCase()) || 'Unassigned Year';
      let matchedSem = SEMESTER_LIST.find(s => s.toLowerCase() === rawSem.toLowerCase()) || 'Unassigned Semester';

      if (!groups[matchedYear]) groups[matchedYear] = {};
      if (!groups[matchedYear][matchedSem]) groups[matchedYear][matchedSem] = [];
      groups[matchedYear][matchedSem].push(sub);
    });
    return groups;
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Dynamic Lookup Engine that ranks catalog targets using standardized institutional matching criteria[cite: 1]
  useEffect(() => {
    const cleanCode = encCode.toUpperCase().trim();
    const cleanTitle = encTitle.toUpperCase().trim();
    const searchVal = catalogSearchQuery.toUpperCase().trim();

    // 1. Initial Filtering by Category and Manual Search Query Box
    let pool = bsuCatalog.filter(sub => {
      const cCode = (sub.courseCode || sub.code || '').toUpperCase();
      const cTitle = (sub.courseTitle || sub.title || '').toUpperCase();
      const cat = String(sub.category || '').toLowerCase().trim();

      // Flexible Category Filter Processing Logic
      if (activeCategoryFilter !== 'All') {
        if (activeCategoryFilter === 'General Education') {
          const isGenEd = cat.includes('general') || cat.includes('ged') || cCode.startsWith('GED') || cCode.startsWith('GEd');
          if (!isGenEd) return false;
        } else if (activeCategoryFilter === 'Major') {
          const isMajor = cat.includes('major') || cat.includes('core') || (!cCode.startsWith('GED') && !cCode.startsWith('GEd') && !cCode.startsWith('PE') && !cCode.startsWith('PATHFIT') && !cCode.startsWith('NSTP'));
          if (!isMajor) return false;
        } else if (activeCategoryFilter === 'PE') {
          const isPE = cat.includes('pe') || cat.includes('physical') || cat.includes('pathfit') || cCode.startsWith('PE') || cCode.startsWith('PATHFIT');
          if (!isPE) return false;
        } else if (activeCategoryFilter === 'NSTP') {
          const isNSTP = cat.includes('nstp') || cCode.startsWith('NSTP');
          if (!isNSTP) return false;
        } else if (activeCategoryFilter === 'Elective') {
          const isElective = cat.includes('elective') || cCode.includes('EL') || cTitle.includes('ELECTIVE');
          if (!isElective) return false;
        } else if (activeCategoryFilter === 'Capstone') {
          const isCapstone = cat.includes('capstone') || cat.includes('ojt') || cat.includes('practicum') || cTitle.includes('CAPSTONE') || cTitle.includes('OJT');
          if (!isCapstone) return false;
        }
      }

      // Live Search Box Query Rule[cite: 1]
      if (searchVal) {
        if (!cCode.includes(searchVal) && !cTitle.includes(searchVal)) return false;
      }

      return true;
    });

    // 2. Score ranking adjustments when user types in external code/title parameters[cite: 1]
    if (!cleanCode && !cleanTitle) {
      setSuggestedCandidates(pool.slice(0, 25));
      return;
    }

    const coreEquivalencyRules = {
      'MATH 101': 'MATH 101', 'MATH101': 'MATH 101', 'GED 102': 'GED 102', 'GED102': 'GED 102',
      'PATHFIT 1': 'PATHFit 1', 'PATHFIT1': 'PATHFit 1', 'PE 101': 'PE 101', 'PE101': 'PE 101',
      'PATHFIT 2': 'PATHFit 2', 'PATHFIT2': 'PATHFit 2', 'PE 102': 'PE 102', 'PE102': 'PE 102',
      'CC 100': 'CC 100', 'CC100': 'CC 100', 'IT 111': 'IT 111', 'IT111': 'IT 111',
      'CC 101': 'CC 101', 'CC101': 'CC 101', 'CS 111': 'CS 111', 'CS111': 'CS 111'
    };

    let targetBsuCode = null;
    if (coreEquivalencyRules[cleanCode]) targetBsuCode = coreEquivalencyRules[cleanCode];
    else if (coreEquivalencyRules[cleanTitle]) targetBsuCode = coreEquivalencyRules[cleanTitle];

    if (targetBsuCode) {
      const matchObj = pool.find(c => (c.courseCode || c.code || '').toUpperCase().trim() === targetBsuCode.toUpperCase().trim());
      if (matchObj) {
        setSelectedBsuMatch(matchObj);
        setSuggestedCandidates(pool);
        return;
      }
    }

    const ranked = pool.map(subject => {
      const sCode = (subject.courseCode || subject.code || '').toUpperCase();
      const sTitle = (subject.courseTitle || subject.title || '').toUpperCase();
      let score = 0;
      if (cleanCode && sCode.replace(/[^A-Z0-9]/g, '').includes(cleanCode.replace(/[^A-Z0-9]/g, ''))) score += 50;
      if (cleanTitle && sTitle.includes(cleanTitle)) score += 40;
      return { subject, score };
    })
    .sort((a, b) => b.score - a.score);

    const sortedList = ranked.map(item => item.subject);
    setSuggestedCandidates(sortedList);
    if (ranked.length > 0 && ranked[0].score > 10) setSelectedBsuMatch(ranked[0].subject);
  }, [encCode, encTitle, activeCategoryFilter, catalogSearchQuery, bsuCatalog]);

  const handleEncodingSubmit = (e) => {
    e.preventDefault();
    if (!encCode || !encTitle) return;

    const payload = {
      subjectCode: encCode.toUpperCase().trim(),
      subjectTitle: encTitle.trim(),
      units: parseInt(encUnits, 10),
      grade: encGrade,
      termSaved: 'Transferred/Credited',
      status: 'credited',
      isManualEntry: true,
      semesterTaken: encSemester,
      yearLevelTaken: encYearLevel,
      academicYearTaken: encAY,
      bsuEquivalentCode: selectedBsuMatch ? (selectedBsuMatch.courseCode || selectedBsuMatch.code).toUpperCase() : 'UNMAPPED',
      bsuEquivalentTitle: selectedBsuMatch ? (selectedBsuMatch.courseTitle || selectedBsuMatch.title) : 'Direct Exception Credit'
    };

    onAddManualSubject(payload);
    setEncCode('');
    setEncTitle('');
    setEncUnits(3);
    setEncGrade('1.0');
    setSelectedBsuMatch(null);
  };

  const groupedCanvasHistory = getGroupedCanvasHistory();

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {isTorComplete === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-900 flex items-start gap-3 shadow-2xs">
          <div className="bg-amber-600 shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold">!</div>
          <div>
            <h4 className="font-black uppercase text-amber-950">Transcript Validation Notice (Review Required)</h4>
            <ul className="list-disc pl-4 mt-1.5 space-y-1 font-mono text-[11px] text-amber-950/80">
              {torValidationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Encode Transcript Course with Selection Queue */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Form Entry Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm w-full">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <BookMarked size={16} className="text-blue-600"/> Encode Transcript Course
                </h3>
                <p className="text-slate-400 text-[11px] font-medium mt-0.5">Click any pending pre-course target below to instantly auto-fill data fields accurately.</p>
              </div>
            </div>

            {/* PENDING PRE-COURSE REQUIREMENTS QUEUE */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <ClipboardList size={12} className="text-blue-500" /> Pending Pre-Course Requirements Queue
              </span>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-150 rounded-2xl max-h-[110px] overflow-y-auto">
              {historicalQueue.length > 0 ? (
                historicalQueue.map((course, idx) => {
                  const code = course.courseCode || course.code || course.id || '';
                  const isCleared = manualTranscriptHistoryOnly.some(s => s.bsuEquivalentCode === code.toUpperCase());
                    
                    return (
                      <button
                        key={idx} type="button" disabled={isCleared}
                        onClick={() => handleSelectQueueItem(course)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                          isCleared 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-not-allowed opacity-60'
                            : 'bg-white border-slate-200 hover:border-blue-400 text-slate-700 shadow-3xs'
                        }`}
                      >
                        <span className="font-mono font-black">{code}</span>
                        <span className="text-[9px] opacity-70 font-medium font-sans mt-0.5">{course.computedYearLevel} • {course.computedSemester}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-[11px] italic text-slate-400 py-1 pl-1">No preceding timeline courses required for this entry tier setup placement.</p>
                )}
              </div>
            </div>

            <form onSubmit={handleEncodingSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 bg-slate-50/40 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b pb-1">External Course Info</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">External Code</label>
                      <input type="text" required value={encCode} onChange={e=>setEncCode(e.target.value)} placeholder="e.g. MATH 111" className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-xs font-black font-mono outline-none focus:border-blue-500 shadow-2xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">External Title</label>
                      <input type="text" required value={encTitle} onChange={e=>setEncTitle(e.target.value)} placeholder="e.g. Math" className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-xs font-bold outline-none focus:border-blue-500 shadow-2xs" />
                    </div>
                  </div>
                </div>

                {/* VISUAL MATCH SELECT PANEL */}
                <div className="p-4 border border-blue-100 bg-blue-50/10 rounded-2xl space-y-3 flex flex-col justify-between min-h-[220px]">
                  <div className="space-y-2 flex-1 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 block border-b border-blue-50 pb-1 flex items-center gap-1">
                      <Sparkles size={12} className="text-blue-600 animate-pulse"/> 
                      <span>Live Match Selection Target</span>
                    </span>

                    {/* LIVE SEARCH BOX */}
                    <div className="relative">
                      <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
                      <input 
                        type="text" 
                        value={catalogSearchQuery} 
                        onChange={e => setCatalogSearchQuery(e.target.value)} 
                        placeholder="Search institutional catalog courses..." 
                        className="w-full border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl bg-white text-[10px] font-bold outline-none focus:border-blue-500 shadow-3xs" 
                      />
                    </div>

                    {/* DYNAMIC CATEGORY FILTER PILLS ROW */}
                    <div className="flex gap-1 overflow-x-auto pb-1 max-w-full scrollbar-thin">
                      {categoriesList.map(cat => (
                        <button
                          key={cat.id} type="button" 
                          onClick={() => {
                            setActiveCategoryFilter(cat.id);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wide border whitespace-nowrap transition-all ${
                            activeCategoryFilter === cat.id
                              ? 'bg-blue-600 border-blue-600 text-white shadow-3xs'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* LIST OF DISCOVERED CANDIDATES */}
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[120px] border border-slate-100 bg-white p-1 rounded-xl shadow-inner">
                      {suggestedCandidates.length > 0 ? (
                        suggestedCandidates.map((course, idx) => {
                          const cCode = course.courseCode || course.code;
                          const cTitle = course.courseTitle || course.title;
                          const isPicked = selectedBsuMatch && selectedBsuMatch.id === course.id;
                          return (
                            <button
                              key={idx} type="button" onClick={() => setSelectedBsuMatch(course)}
                              className={`w-full p-2 rounded-xl text-left border transition-all flex items-center justify-between ${
                                isPicked ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black' : 'bg-slate-50/60 border-slate-200 hover:border-blue-400 text-slate-600'
                              }`}
                            >
                              <div className="truncate">
                                <span className="font-mono text-[11px] block">{cCode}</span>
                                <span className="text-[10px] opacity-80 block truncate font-medium">{cTitle}</span>
                              </div>
                              {isPicked && <span className="bg-emerald-600 text-white p-0.5 rounded-full"><Check size={10}/></span>}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-slate-400 italic p-4 text-center">No matching catalog courses discovered for selected filters.</p>
                      )}
                    </div>
                  </div>

                  {selectedBsuMatch && (
                    <div className="p-2 bg-slate-900 text-white rounded-xl text-[10px] font-mono flex items-center justify-between shadow-xs animate-fadeIn">
                      <span className="opacity-70 font-sans font-bold">Assigned Roadmap Target Link:</span>
                      <span className="font-bold text-blue-400 flex items-center gap-1">
                        {encCode || 'External'} <ArrowRight size={10}/> {(selectedBsuMatch.courseCode || selectedBsuMatch.code)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AUTOMATED TIME VARIABLE BLOCKS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Credit Units</label>
                  <input type="number" min="1" value={encUnits} onChange={e=>setEncUnits(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black text-center outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Grade Point</label>
                  <select value={encGrade} onChange={e=>setEncGrade(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black text-center outline-none cursor-pointer">
                    {['1.0', '1.25', '1.5', '1.75', '2.0', '2.25', '2.5', '2.75', '3.0', '5.0', 'INC', 'DRP', 'In Progress'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Academic Year</label>
                  <input type="text" value={encAY} onChange={e=>setEncAY(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black text-center outline-none text-blue-600 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Semester Taken</label>
                  <select value={encSemester} onChange={e=>setEncSemester(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black outline-none cursor-pointer text-blue-600">
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Year Level</label>
                  <select value={encYearLevel} onChange={e=>setEncYearLevel(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black outline-none cursor-pointer text-blue-600">
                    <option value="First Year">1st Year</option>
                    <option value="Second Year">2nd Year</option>
                    <option value="Third Year">3rd Year</option>
                    <option value="Fourth Year">4th Year</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md">
                <Plus size={15}/> Append Mapped Subject to Credentials
              </button>
            </form>
          </div>

          {/* UPGRADED DYNAMIC RE-GROUPED INTERACTIVE EQUIVALENCY MATRIX CANVAS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 w-full">
            <div className="border-b pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Transferee Equivalency Canvas (Curriculum Grouped Grid)
                </span>
              </div>
              <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black px-3 py-1 rounded-xl font-mono shadow-3xs">
                {manualTranscriptHistoryOnly.length} Transcripts Recorded
              </span>
            </div>

            {manualTranscriptHistoryOnly.length > 0 ? (
              <div className="space-y-5">
                {YEAR_LEVELS.map(year => {
                  const hasYearData = SEMESTER_LIST.some(sem => groupedCanvasHistory[year]?.[sem]?.length > 0);
                  if (!hasYearData) return null;

                  return (
                    <div key={year} className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <span className="w-1 h-3.5 bg-slate-900 rounded-xs" />
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">{year} Placement Blocks</h4>
                      </div>

                      {SEMESTER_LIST.map(sem => {
                        const subjects = groupedCanvasHistory[year]?.[sem] || [];
                        if (subjects.length === 0) return null;
                        const sectionKey = `canvas-${year}-${sem}`;
                        const isCollapsed = expandedSections[sectionKey] || false;

                        return (
                          <div key={sem} className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/30 shadow-3xs">
                            <div
                              onClick={() => toggleSection(sectionKey)}
                              className="px-4 py-3 bg-slate-50/80 border-b flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                                <span className="font-extrabold text-slate-800 text-xs">{sem} • <span className="text-slate-400 font-medium normal-case">Staging Load</span></span>
                              </div>
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                {subjects.length} Mapped Item{subjects.length > 1 ? 's' : ''}
                              </span>
                            </div>

                            {!isCollapsed && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse table-fixed text-xs min-w-[600px] bg-white">
                                  <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                      <th className="p-3 pl-4 w-[42%]">Previous External Course Taken</th>
                                      <th className="p-3 w-[12%] text-center">Reference Mark</th>
                                      <th className="p-3 w-[36%]">BSU Equivalent Assigned Target</th>
                                      <th className="p-3 w-[10%] text-right pr-4">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                    {subjects.map((sub, idx) => (
                                      <tr key={sub.id || idx} className="hover:bg-slate-50/20 align-middle">
                                        <td className="p-3.5 pl-4 space-y-0.5 text-left">
                                          <span className="font-mono font-black text-slate-900 text-xs tracking-wide block">{sub.subjectCode}</span>
                                          <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[220px]">{sub.subjectTitle}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                          <span className="bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-black text-[10px]">
                                            {sub.grade} (AY {sub.academicYearTaken})
                                          </span>
                                        </td>
                                        <td className="p-3.5 space-y-0.5 text-left">
                                          <span className="font-mono font-black text-blue-700 text-xs tracking-wide block">{sub.bsuEquivalentCode || 'UNMAPPED'}</span>
                                          <span className="text-[11px] text-slate-500 font-medium block truncate max-w-[220px]">{sub.bsuEquivalentTitle}</span>
                                        </td>
                                        <td className="p-3 text-right pr-4">
                                          <button type="button" onClick={() => onDeleteManualSubject(sub.id)} className="text-rose-600 hover:text-rose-700 font-black text-[10px] uppercase">
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 italic text-[11px] border border-dashed border-slate-200 bg-slate-50/30 rounded-3xl p-6 flex flex-col items-center justify-center gap-2">
                <BookOpen size={24} className="text-slate-300" />
                <p className="font-bold text-slate-400/80 leading-normal max-w-[220px]">No manual transferee transcript records encoded or queued yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: Symmetrical Right Analysis Overview Hub */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 text-xs font-semibold shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <ClipboardList size={14} className="text-slate-600"/> Analysis Hub Overview
            </h3>
            
            <div className="space-y-2 border-b border-slate-200 pb-3 text-slate-600">
              <div className="flex justify-between"><span>Credited Count</span><span className="font-bold text-emerald-600 text-sm font-mono">{auditOutput.creditedList?.length || 0}</span></div>
              <div className="flex justify-between"><span>Missing Gaps</span><span className="font-bold text-amber-600 text-sm font-mono">{auditOutput.missingSubjects?.length || 0}</span></div>
              <div className="flex justify-between"><span>Total Earned Scope</span><span className="font-bold text-blue-700 text-sm font-mono">{auditOutput.unitsEarned || 0}u</span></div>
              <div className="flex justify-between"><span>Progress Rate</span><span className="font-black text-slate-900 font-mono text-sm">{auditOutput.completionPercentage}%</span></div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">Audit Conclusion:</span>
              <p className={`text-xs font-black uppercase tracking-wide ${auditOutput.overallEligibility?.includes('Review') ? 'text-amber-600' : 'text-emerald-600'}`}>
                {auditOutput.overallEligibility}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2 font-bold">
              <button type="button" onClick={() => triggerReportModalOpen(evaluationStrategy)} className="w-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 p-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-3xs transition-all">
                Print Portrait Reports
              </button>
              <button type="button" onClick={handleFinalizeEvaluationMatrix} disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-850 text-white p-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all">
                {isSubmitting ? "Processing..." : "Commit Matrix Updates"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}