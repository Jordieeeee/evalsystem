import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, Plus, Sparkles, Check, Info, AlertTriangle, ArrowRight, BookMarked, Search, ClipboardList, Calendar } from 'lucide-react';

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
  bsuCatalog = [] 
}) {
  // Input fields for external manual transcript entry
  const [encCode, setEncCode] = useState('');
  const [encTitle, setEncTitle] = useState('');
  const [encUnits, setEncUnits] = useState(3);
  const [encGrade, setEncGrade] = useState('1.0');
  const [encAY, setEncAY] = useState('2025-2026');
  
  // Track semester and year level when adding
  const [encSemester, setEncSemester] = useState('1st Semester');
  const [encYearLevel, setEncYearLevel] = useState('First Year');

  // Automated System Matching & Browser Picker States
  const [selectedBsuMatch, setSelectedBsuMatch] = useState(null);
  const [suggestedCandidates, setSuggestedCandidates] = useState([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  const categoriesList = [
    { id: 'All', label: 'All Catalog' },
    { id: 'General Education', label: 'Gen Ed (GED)' },
    { id: 'Major', label: 'Majors' },
    { id: 'PE', label: 'PE' },
    { id: 'NSTP', label: 'NSTP' },
    { id: 'Elective', label: 'Electives' },
    { id: 'Capstone', label: 'Capstone/OJT' }
  ];

  // FILTER FOR CANVAS VISIBILITY: Only display courses that were explicitly encoded manually
  const manualTranscriptHistoryOnly = studentSubjectsHistory.filter(s => s.isManualEntry === true);

  // Dynamic Lookup Engine that actively ranks everything and lets you pick any card instantly
  useEffect(() => {
    const cleanCode = encCode.toUpperCase().trim();
    const cleanTitle = encTitle.toUpperCase().trim();

    if (!cleanCode && !cleanTitle && !catalogSearchQuery) {
      // Filter baseline catalog via user search queries or chosen categories
      const pool = bsuCatalog.filter(sub => {
        if (activeCategoryFilter === 'All') return true;
        const cat = String(sub.category || 'Major').toLowerCase();
        const targetCat = String(activeCategoryFilter).toLowerCase();
        if (targetCat === 'capstone') {
          return cat.includes('capstone') || cat.includes('ojt') || cat.includes('practicum');
        }
        return cat === targetCat;
      });
      setSuggestedCandidates(pool.slice(0, 15));
      return;
    }

    // Context Fallback Definitions Map[cite: 1]
    const coreEquivalencyRules = {
      'MATH 101': 'MATH 101', 'MATH101': 'MATH 101',
      'PATHFIT1': 'PATHFit 1', 'PATHFIT 1': 'PATHFit 1', 'PE101': 'PATHFit 1', 'PE 101': 'PATHFit 1',
      'PATHFIT2': 'PATHFit 2', 'PATHFIT 2': 'PATHFit 2', 'PE102': 'PATHFit 2', 'PE 102': 'PATHFit 2',
      'PATHFIT3': 'PATHFit 3', 'PATHFIT 3': 'PATHFit 3', 'PE103': 'PATHFit 3', 'PE 103': 'PATHFit 3',
      'PATHFIT4': 'PATHFit 4', 'PATHFIT 4': 'PATHFit 4', 'PE104': 'PATHFit 4', 'PE 104': 'PATHFit 4',
      'COMPUTING': 'CC 100', 'INTRO TO COMPUTING': 'CC 100', 'IT 111': 'CC 100', 'IT111': 'CC 100',
      'PROGRAMMING I': 'CC 101', 'CS 111': 'CC 101', 'CS111': 'CC 101',
      'PROGRAMMING II': 'CC 102', 'CS 121': 'CC 102', 'CS121': 'CC 102',
      'DATA STRUCTURES': 'CC 103', 'CS 131': 'CC 103', 'CS131': 'CC 103',
      'INFORMATION MANAGEMENT': 'CC 104', 'IT 221': 'CC 104', 'IT221': 'CC 104',
      'DATABASE SYSTEMS': 'DB 101', 'IT 211': 'DB 101', 'IT211': 'DB 101',
      'ADVANCED DATABASE': 'DB 102', 'IT 222': 'DB 102', 'IT222': 'DB 102',
      'HCI': 'HCI 101', 'HUMAN COMPUTER INTERACTION': 'HCI 101', 'IT 321': 'HCI 101', 'IT321': 'HCI 101',
      'PROJECT MANAGEMENT': 'ITPM 101', 'IT 325': 'ITPM 101', 'IT325': 'ITPM 101',
      'CAPSTONE 1': 'CP 101', 'IT 324': 'CP 101', 'IT324': 'CP 101',
      'CAPSTONE 2': 'CP 102', 'IT 411': 'CP 102', 'IT411': 'CP 102',
      'INTERNSHIP': 'ITP 100', 'OJT': 'ITP 100', 'IT 421': 'ITP 100', 'IT421': 'ITP 100'
    };

    let targetBsuCode = null;

    if (coreEquivalencyRules[cleanCode]) {
      targetBsuCode = coreEquivalencyRules[cleanCode];
    } else if (coreEquivalencyRules[cleanTitle]) {
      targetBsuCode = coreEquivalencyRules[cleanTitle];
    } else {
      const exactCodeMatch = bsuCatalog.find(
        c => (c.courseCode || c.code || '').toUpperCase().replace(/\s+/g, '') === cleanCode.replace(/\s+/g, '')
      );
      if (exactCodeMatch) targetBsuCode = exactCodeMatch.courseCode || exactCodeMatch.code;
    }

    let pool = bsuCatalog.filter(sub => {
      if (activeCategoryFilter === 'All') return true;
      const cat = String(sub.category || 'Major').toLowerCase();
      const targetCat = String(activeCategoryFilter).toLowerCase();
      if (targetCat === 'capstone') {
        return cat.includes('capstone') || cat.includes('ojt') || cat.includes('practicum');
      }
      return cat === targetCat;
    });

    if (catalogSearchQuery.trim()) {
      const q = catalogSearchQuery.toLowerCase().trim();
      pool = pool.filter(sub => 
        (sub.courseCode || sub.code || '').toLowerCase().includes(q) ||
        (sub.courseTitle || sub.title || '').toLowerCase().includes(q)
      );
    }

    if (targetBsuCode) {
      const matchObj = bsuCatalog.find(
        c => (c.courseCode || c.code || '').toUpperCase().trim() === targetBsuCode.toUpperCase().trim()
      );
      if (matchObj) {
        setSuggestedCandidates([matchObj]);
        setSelectedBsuMatch(matchObj);
        return;
      }
    }

    // Rank matching scores
    const ranked = pool.map(subject => {
      const sCode = (subject.courseCode || subject.code || '').toUpperCase();
      const sTitle = (subject.courseTitle || subject.title || '').toUpperCase();
      let score = 0;

      if (cleanTitle === 'MATH' || cleanCode === 'MATH') {
        if (sCode === 'GED 102' || sCode.startsWith('GED')) score += 100;
      }

      if (cleanCode && sCode.replace(/\s+/g, '').includes(cleanCode.replace(/\s+/g, ''))) score += 50;
      if (cleanTitle && sTitle.includes(cleanTitle)) score += 40;

      const words = cleanTitle.split(' ').filter(w => w.length > 2);
      words.forEach(w => { if (sTitle.includes(w)) score += 15; });

      return { subject, score };
    })
    .sort((a, b) => b.score - a.score);

    const mappedCandidates = ranked.map(item => item.subject);
    setSuggestedCandidates(mappedCandidates);

    if (ranked.length > 0 && ranked[0].score > 25 && (!selectedBsuMatch || !mappedCandidates.some(c => c.id === selectedBsuMatch.id))) {
      setSelectedBsuMatch(ranked[0].subject);
    }
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
      isManualEntry: true, // Flagged correctly so it loops into your workspace filters[cite: 1]
      semesterTaken: encSemester,
      yearLevelTaken: encYearLevel,
      academicYearTaken: encAY,
      bsuEquivalentCode: selectedBsuMatch ? (selectedBsuMatch.courseCode || selectedBsuMatch.code).toUpperCase() : 'UNMAPPED',
      bsuEquivalentTitle: selectedBsuMatch ? (selectedBsuMatch.courseTitle || selectedBsuMatch.title) : 'Direct Transfer Credit Exception'
    };

    onAddManualSubject(payload);

    // Reset inputs cleanly
    setEncCode('');
    setEncTitle('');
    setEncUnits(3);
    setEncGrade('1.0');
    setSelectedBsuMatch(null);
    setCatalogSearchQuery('');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {!isTorComplete && (
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

      {/* Balanced Grid Canvas Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Refined Entry Workspace Form Block */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
            
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <BookMarked size={16} className="text-blue-600"/> Encode Transcript Course
                </h3>
                <p className="text-slate-400 text-[11px] font-medium mt-0.5">Enter old record parameters and click any equivalent candidate block below to assign it.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Previous Institution</label>
                <input type="text" value={prevSchoolName} onChange={e=>setPrevSchoolName(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white font-bold text-slate-800 text-xs outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Previous Degree Program</label>
                <input type="text" value={prevProgram} onChange={e=>setPrevProgram(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white font-bold text-slate-800 text-xs outline-none" />
              </div>
            </div>

            <form onSubmit={handleEncodingSubmit} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left side inputs block */}
                <div className="p-4 border border-slate-200 bg-slate-50/40 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b pb-1">External Course Info</span>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">External Code</label>
                    <input type="text" required value={encCode} onChange={e=>setEncCode(e.target.value)} placeholder="e.g. MATH 111" className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-xs font-black font-mono outline-none focus:border-blue-500 shadow-2xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">External Subject Title</label>
                    <input type="text" required value={encTitle} onChange={e=>setEncTitle(e.target.value)} placeholder="e.g. Math" className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-xs font-bold outline-none focus:border-blue-500 shadow-2xs" />
                  </div>
                </div>

                {/* RIGHT SIDE: Interactive Click-To-Pick Equivalence Grid Module Block */}
                <div className="p-4 border border-blue-100 bg-blue-50/10 rounded-2xl space-y-3 flex flex-col justify-between min-h-[250px]">
                  <div className="space-y-2 flex-1 flex flex-col justify-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 block border-b border-blue-50 pb-1 flex items-center gap-1">
                      <Sparkles size={12} className="text-blue-600 animate-pulse"/> 
                      <span>CLICK CHOOSE local equivalent Course</span>
                    </span>

                    <div className="grid grid-cols-2 gap-1.5">
                      <select 
                        value={activeCategoryFilter}
                        onChange={e => { setActiveCategoryFilter(e.target.value); setCatalogSearchQuery(''); }}
                        className="bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
                      >
                        {categoriesList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                      <div className="relative">
                        <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" placeholder="Filter list..." value={catalogSearchQuery} onChange={e => setCatalogSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-5 pr-1 py-1 text-[10px] font-medium outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[120px] border border-slate-100 bg-white p-1 rounded-xl shadow-inner">
                      {suggestedCandidates.length > 0 ? (
                        suggestedCandidates.slice(0, 20).map((course, idx) => {
                          const cCode = course.courseCode || course.code;
                          const cTitle = course.courseTitle || course.title;
                          const isPicked = selectedBsuMatch && selectedBsuMatch.id === course.id;

                          return (
                            <button
                              key={course.id || idx} type="button" onClick={() => setSelectedBsuMatch(course)}
                              className={`w-full p-2 rounded-xl text-left border transition-all flex items-center justify-between ${
                                isPicked 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black ring-1 ring-emerald-400 shadow-2xs' 
                                  : 'bg-slate-50/60 border-slate-200 hover:border-blue-400 text-slate-600'
                              }`}
                            >
                              <div className="truncate">
                                <span className="font-mono text-[11px] block">{cCode}</span>
                                <span className="text-[10px] opacity-80 block truncate font-medium">{cTitle}</span>
                              </div>
                               {isPicked ? (
                                <span className="bg-emerald-600 text-white p-0.5 rounded-full"><Check size={10}/></span>
                              ) : (
                                <span className="text-[8px] bg-slate-200 font-bold px-1 py-0.2 rounded text-slate-400">Select</span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-[10px] italic text-slate-400 flex items-center justify-center gap-1">
                          <AlertTriangle size={11} className="text-amber-500" />
                          <span>No cataloged matches match your query filters.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedBsuMatch && (
                    <div className="p-2 bg-slate-900 text-white rounded-xl text-[10px] font-mono flex items-center justify-between shadow-xs">
                      <span className="opacity-70 font-sans font-bold">Assigned Mapping:</span>
                      <span className="font-bold text-blue-400 flex items-center gap-1">
                        {encCode || 'External'} <ArrowRight size={10}/> {(selectedBsuMatch.courseCode || selectedBsuMatch.code)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Parameter Entry Matrix Rows */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Credit Units</label>
                  <input type="number" min="1" value={encUnits} onChange={e=>setEncUnits(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black text-center outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Grade Point</label>
                  <select value={encGrade} onChange={e=>setEncGrade(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black text-center outline-none cursor-pointer focus:ring-1 focus:ring-blue-500">
                    {['1.0', '1.25', '1.5', '1.75', '2.0', '2.25', '2.5', '2.75', '3.0', '5.0', 'INC', 'DRP', 'In Progress'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Academic Year</label>
                  <input type="text" placeholder="2025-2026" value={encAY} onChange={e=>setEncAY(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black text-center outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Semester Taken</label>
                  <select value={encSemester} onChange={e=>setEncSemester(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black outline-none cursor-pointer focus:ring-1 focus:ring-blue-500">
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Year Level</label>
                  <select value={encYearLevel} onChange={e=>setEncYearLevel(e.target.value)} className="w-full border border-slate-200 p-2 rounded-xl bg-white text-xs font-black outline-none cursor-pointer focus:ring-1 focus:ring-blue-500">
                    <option value="First Year">1st Year</option>
                    <option value="Second Year">2nd Year</option>
                    <option value="Third Year">3rd Year</option>
                    <option value="Fourth Year">4th Year</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-lg active:scale-[0.99]">
                <Plus size={15}/> Append Mapped Subject to Credentials
              </button>
            </form>
          </div>
        </div>

        {/* COLUMN 2: Analysis Hub & HIGH FIDELITY TRANSEREE MANUALLY ENCODED CANVAS CARD */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Analysis Metrics HUD */}
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

          {/* TRANSFEREE ENCODED CANVAS CARD (PRE-LOADED target course noise completely filtered out)[cite: 1] */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="border-b pb-2 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Calendar size={13} className="text-blue-500" /> Transferee Equivalency Canvas
              </span>
              <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-md font-mono shadow-3xs">
                {manualTranscriptHistoryOnly.length} Transcripts Saved
              </span>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {manualTranscriptHistoryOnly.length > 0 ? (
                manualTranscriptHistoryOnly.map((subject, index) => (
                  <div key={subject.id || index} className="p-3.5 border border-slate-200 bg-slate-50/40 rounded-2xl flex flex-col justify-between items-stretch gap-2 hover:border-slate-300 transition-all text-xs font-semibold animate-in fade-in duration-100">
                    
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wide">Previous Course Taken</span>
                        <p className="font-mono font-black text-slate-800 text-[11px] truncate">{subject.subjectCode}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{subject.subjectTitle}</p>
                      </div>

                      <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-3xs text-blue-600 shrink-0 mx-0.5">
                        <ArrowRight size={12} />
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <span className="text-[8px] font-black uppercase text-blue-400 block tracking-wide">BSU Equivalent Assigned</span>
                        <p className="font-mono font-black text-blue-700 text-[11px] truncate">{subject.bsuEquivalentCode || 'UNMAPPED'}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{subject.bsuEquivalentTitle || 'Exception Credit'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <div className="flex flex-wrap gap-x-2">
                        <span className="text-slate-700 font-black font-mono bg-white px-1.5 py-0.2 rounded border border-slate-150 shadow-3xs">Grade: {subject.grade}</span>
                        <span className="pt-0.5 opacity-60">{subject.yearLevelTaken || 'First Year'} • {subject.semesterTaken || '1st Sem'}</span>
                      </div>
                      <button type="button" onClick={() => onDeleteManualSubject(subject.id)} className="text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded-lg border border-transparent hover:border-rose-100 transition-colors flex items-center gap-0.5">
                        <Trash2 size={11} /> Strip Mapping
                      </button>
                    </div>

                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 italic text-[11px] border border-dashed border-slate-200 bg-slate-50/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5">
                  <BookOpen size={20} className="text-slate-300" />
                  <p className="font-semibold text-slate-400/90 leading-normal max-w-[180px]">No manual transferee transcript records encoded yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Recommended Enrollment Plan - Academic Sequence Semester Roadmap */}
      {auditOutput.recommendedRoadmap && auditOutput.recommendedRoadmap.length > 0 && (
        <div className="border border-slate-200 rounded-3xl bg-white p-6 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              Automated Curricular Sequence Roadmap (Official Semester Plan)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Generated Target Matrix Scope</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {auditOutput.recommendedRoadmap.map((termPlan, index) => (
              <div key={index} className="border border-slate-200 rounded-2xl bg-slate-50 p-4 space-y-3 shadow-3xs hover:border-slate-300 transition-all">
                <div className="flex justify-between items-center text-[11px] font-black text-slate-800 border-b border-slate-200 pb-1.5">
                  <span className="uppercase tracking-tight text-slate-900">{termPlan.term}</span>
                  <span className="bg-white border border-slate-200 text-blue-700 px-2 py-0.5 rounded-md font-mono text-[10px] shadow-3xs">{termPlan.totalUnits} Units</span>
                </div>
                <div className="space-y-1.5 text-[10px] font-semibold text-slate-600">
                  {termPlan.subjects.map(s => (
                    <div key={s.code} className="flex justify-between items-center bg-white border border-slate-150 p-2 rounded-xl shadow-3xs hover:shadow-2xs transition-all">
                      <div className="truncate max-w-[80%]">
                        <span className="block font-black text-slate-900 font-mono text-[11px]">{s.code}</span>
                        <span className="text-slate-400 text-[10px] font-medium truncate block mt-0.5">{s.title}</span>
                      </div>
                      <span className="text-slate-800 bg-slate-100 border px-1.5 py-0.5 rounded font-mono font-black text-[9px]">{s.units}u</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}