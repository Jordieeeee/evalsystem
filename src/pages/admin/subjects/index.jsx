import React, { useState, useEffect } from 'react';
import { subjectService } from "../../../services/subjectService";
import { 
  Plus, Layers, BookOpen, GraduationCap, Edit2, Archive, Info, 
  Search, AlertCircle, RefreshCw, Filter, Trash2, Activity, RotateCcw
} from 'lucide-react'; 

export default function CurriculumBuilder() {
  const [subjects, setSubjects] = useState([]);
  const [curriculumMappings, setCurriculumMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurriculum, setSelectedCurriculum] = useState('New Curriculum'); // 'New Curriculum' | 'Old Curriculum'
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- FILTER STATES ---
  const [yearFilter, setYearFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [viewArchivedOnly, setViewArchivedOnly] = useState(false);
  const [selectedTrackFilter, setSelectedTrackFilter] = useState('All');

  // --- DIALOG MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  
  // Tag input states
  const [prereqInput, setPrereqInput] = useState('');
  const [coreqInput, setCoreqInput] = useState('');

  // Form payload
  const [formData, setFormData] = useState({
    courseCode: '',
    courseTitle: '',
    creditUnits: 3,
    lectureUnits: 3,
    labUnits: 0,
    category: 'Major', 
    yearLevel: 'First Year',
    semesterOffered: ['First Semester'],
    prerequisites: [], 
    corequisites: [], 
    track: 'Common',
    minGradeRequirement: '3.00', 
    minGpaRequirement: '',
    actionBy: 'Admin'
  });

  // Curriculum mapping form payload
  const [curriculumForm, setCurriculumForm] = useState({
    oldCourseCode: '',
    courseTitle: '',
    newCourseCode: '',
    isCreditable: true,
    curriculumVersion: 'v1.0',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, actionType: 'SUBJECT_CREATED', entityId: 'CS 101', details: { payload: { courseTitle: 'Intro to Computing' } }, performedBy: 'Admin', timestamp: '2026-07-16T10:00:00.000Z' }
  ]);

  useEffect(() => {
    loadInitialData();
  }, [selectedCurriculum]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [subjectsData, mappingsData] = await Promise.all([
        subjectService.getAllSubjects(selectedCurriculum),
        subjectService.getCurriculumMappings()
      ]);
      setSubjects(subjectsData || []);
      setCurriculumMappings(mappingsData || []);
    } catch (err) {
      console.error("Error loading curriculum context data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (codeVal) => {
    const cleanCode = codeVal.trim().toUpperCase();
    let computedTitle = formData.courseTitle;
    
    const foundMatch = subjects.find(s => s.courseCode.toUpperCase() === cleanCode);
    if (foundMatch) {
      computedTitle = foundMatch.courseTitle;
    } else {
      const mappedRef = curriculumMappings.find(m => m.newCourseCode.replace("_", " ").toUpperCase() === cleanCode || m.newCourseCode.toUpperCase() === cleanCode);
      if (mappedRef) computedTitle = mappedRef.courseTitle;
    }

    setFormData(prev => ({
      ...prev,
      courseCode: codeVal,
      courseTitle: computedTitle
    }));
  };

  const handleTitleChange = (titleVal) => {
    let computedCode = formData.courseCode;
    const foundMatch = subjects.find(s => s.courseTitle.toLowerCase() === titleVal.toLowerCase());
    
    if (foundMatch) {
      computedCode = foundMatch.courseCode;
    } else {
      const mappedRef = curriculumMappings.find(m => m.courseTitle.toLowerCase() === titleVal.toLowerCase());
      if (mappedRef) computedCode = mappedRef.newCourseCode.replace("_", " ");
    }

    setFormData(prev => ({
      ...prev,
      courseTitle: titleVal,
      courseCode: computedCode
    }));
  };

  const getYearLabel = (sub) => {
    const rawYear = sub.yearLevel || "";
    if (rawYear.includes("1") || rawYear.toLowerCase().includes("first")) return "Year 1";
    if (rawYear.includes("2") || rawYear.toLowerCase().includes("second")) return "Year 2";
    if (rawYear.includes("3") || rawYear.toLowerCase().includes("third")) return "Year 3";
    if (rawYear.includes("4") || rawYear.toLowerCase().includes("fourth")) return "Year 4";
    return "Year 1";
  };

  const getSemesterLabel = (sub) => {
    const semArray = sub.semesterOffered || [];
    const firstSemValue = semArray[0] || "";
    const lowerVal = firstSemValue.toLowerCase();
    
    if (lowerVal.includes("2nd") || lowerVal.includes("second") || lowerVal.includes("2")) return "Semester 2";
    if (lowerVal.includes("midterm") || lowerVal.includes("midyear") || lowerVal.includes("summer")) return "Midterm";
    return "Semester 1";
  };

  const openAddModal = () => {
    setEditingSubject(null);
    setPrereqInput('');
    setCoreqInput('');
    setFormData({
      courseCode: '',
      courseTitle: '',
      creditUnits: 3,
      lectureUnits: 3,
      labUnits: 0,
      category: 'Major',
      yearLevel: 'First Year',
      semesterOffered: ['First Semester'],
      prerequisites: [],
      corequisites: [], 
      track: 'Common',
      minGradeRequirement: '3.00', 
      minGpaRequirement: '',
      actionBy: 'Admin'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setPrereqInput('');
    setCoreqInput('');
    
    setFormData({
      courseCode: subject.courseCode || '',
      courseTitle: subject.courseTitle || '',
      creditUnits: subject.creditUnits || 3,
      lectureUnits: subject.lectureUnits || subject.creditUnits || 3,
      labUnits: subject.labUnits || 0,
      category: subject.category || 'Major',
      yearLevel: subject.yearLevel || 'First Year',
      semesterOffered: subject.semesterOffered || ['First Semester'],
      prerequisites: Array.isArray(subject.prerequisites) ? subject.prerequisites : [],
      corequisites: Array.isArray(subject.corequisites) ? subject.corequisites : [], 
      track: subject.track || 'Common',
      minGradeRequirement: subject.constraints?.minGradeRequirement || '3.00', 
      minGpaRequirement: subject.constraints?.minGpaRequirement || '',
      actionBy: 'Admin'
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      constraints: {
        minGradeRequirement: formData.minGradeRequirement || '3.00',
        minGpaRequirement: formData.minGpaRequirement
      }
    };

    try {
      if (editingSubject) {
        await subjectService.editSubject(selectedCurriculum, editingSubject.id, payload);
        setAuditLogs(prev => [
          { id: Date.now(), actionType: 'SUBJECT_UPDATED', entityId: formData.courseCode, details: { payload }, performedBy: 'Admin', timestamp: new Date().toISOString() },
          ...prev
        ]);
      } else {
        await subjectService.addSubject(selectedCurriculum, payload);
        setAuditLogs(prev => [
          { id: Date.now(), actionType: 'SUBJECT_CREATED', entityId: formData.courseCode, details: { payload }, performedBy: 'Admin', timestamp: new Date().toISOString() },
          ...prev
        ]);
      }
      setIsModalOpen(false);
      loadInitialData();
    } catch (err) {
      console.error("Persistent save error:", err);
    }
  };

  const handleToggleArchive = async (subject) => {
    const isCurrentlyArchived = subject.isArchived;
    const msg = isCurrentlyArchived 
      ? `Are you sure you want to restore ${subject.courseCode}?` 
      : `Are you sure you want to archive ${subject.courseCode}?`;

    if (confirm(msg)) {
      try {
        if (isCurrentlyArchived) {
          await subjectService.restoreSubject(selectedCurriculum, subject.id);
          setAuditLogs(prev => [
            { id: Date.now(), actionType: 'SUBJECT_RESTORED', entityId: subject.courseCode, details: {}, performedBy: 'Admin', timestamp: new Date().toISOString() },
            ...prev
          ]);
        } else {
          await subjectService.archiveSubject(selectedCurriculum, subject.id);
          setAuditLogs(prev => [
            { id: Date.now(), actionType: 'SUBJECT_ARCHIVED', entityId: subject.courseCode, details: {}, performedBy: 'Admin', timestamp: new Date().toISOString() },
            ...prev
          ]);
        }
        loadInitialData();
      } catch (err) {
        console.error("Archiving processing error:", err);
      }
    }
  };

  const handleCurriculumMappingSubmit = async (e) => {
    e.preventDefault();
    try {
      await subjectService.addCurriculumMapping(curriculumForm);
      setAuditLogs(prev => [
        { id: Date.now(), actionType: 'CURRICULUM_UPDATED', entityId: curriculumForm.oldCourseCode, details: { payload: curriculumForm }, performedBy: 'Admin', timestamp: new Date().toISOString() },
        ...prev
      ]);
      setIsCurriculumModalOpen(false);
      setCurriculumForm({
        oldCourseCode: '',
        courseTitle: '',
        newCourseCode: '',
        isCreditable: true,
        curriculumVersion: 'v1.0',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      loadInitialData();
    } catch (err) {
      console.error("Error setting curriculum mapping documentation: ", err);
    }
  };

  const doesSubjectExist = (code) => {
    if (!code || code === '-') return true;
    const cleanCode = code.replace(/\s+/g, '').toUpperCase();
    return subjects.some(s => s.courseCode.replace(/\s+/g, '').toUpperCase() === cleanCode);
  };

  // --- REVISED FILTER ENGINE ---
  const getFilteredSubjects = () => {
    let list = [...subjects];
    
    // 1. Filter by archive status
    list = list.filter(s => !!s.isArchived === !!viewArchivedOnly);

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        (s.courseCode || '').toLowerCase().includes(q) || 
        (s.courseTitle || '').toLowerCase().includes(q) ||
        (s.track || '').toLowerCase().includes(q)
      );
    }

    // 3. Filter by Year Level
    if (yearFilter !== 'All') {
      list = list.filter(s => {
        const itemYear = getYearLabel(s).toLowerCase();
        const filterYearVal = yearFilter.toLowerCase();
        return itemYear === filterYearVal;
      });
    }

    // 4. Filter by Semester
    if (semesterFilter !== 'All') {
      list = list.filter(s => {
        const itemSem = getSemesterLabel(s).toLowerCase();
        const filterSemVal = semesterFilter.toLowerCase();
        return itemSem === filterSemVal;
      });
    }

    // 5. Track Filter for Old Curriculum
    if (selectedCurriculum === 'Old Curriculum' && selectedTrackFilter !== 'All') {
      list = list.filter(s => {
        const subTrack = (s.track || '').toLowerCase().trim();
        switch (selectedTrackFilter) {
          case 'Common Only':
            return subTrack === 'common';
          case 'Business Analytics Only':
            return subTrack.includes('business analytics');
          case 'Networking Technology Only':
            return subTrack.includes('networking') || subTrack.includes('network');
          case 'Service Management Only':
            return subTrack.includes('service management');
          default:
            return true;
        }
      });
    }

    return list;
  };

  const getNewCurriculumGrouped = () => {
    const grouped = {};
    getFilteredSubjects().forEach(sub => {
      const year = getYearLabel(sub);
      const semester = getSemesterLabel(sub);

      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][semester]) grouped[year][semester] = [];
      grouped[year][semester].push(sub);
    });
    return grouped;
  };

  const getOldCurriculumStructured = () => {
    const commonYears = { "Year 1": {}, "Year 2": {} };
    const trackedYears = {
      "Business Analytics": { "Year 3": {}, "Year 4": {} },
      "Service Management": { "Year 3": {}, "Year 4": {} },
      "Networking Technology": { "Year 3": {}, "Year 4": {} }
    };

    getFilteredSubjects().forEach(sub => {
      const year = getYearLabel(sub);
      const semester = getSemesterLabel(sub);

      if (year === "Year 1" || year === "Year 2") {
        if (!commonYears[year][semester]) commonYears[year][semester] = [];
        commonYears[year][semester].push(sub);
      } else if (year === "Year 3" || year === "Year 4") {
        const rawTrack = sub.track || "";
        const matchedTracks = Object.keys(trackedYears).filter(trackKey => {
          const keyNormalized = trackKey.toLowerCase();
          const dbNormalized = rawTrack.toLowerCase();
          return dbNormalized.includes(keyNormalized) || 
                 (keyNormalized === "networking technology" && dbNormalized.includes("networking"));
        });

        const finalTracks = matchedTracks.length > 0 ? matchedTracks : Object.keys(trackedYears);
        finalTracks.forEach(trackKey => {
          if (!trackedYears[trackKey][year][semester]) {
            trackedYears[trackKey][year][semester] = [];
          }
          trackedYears[trackKey][year][semester].push(sub);
        });
      }
    });

    return { commonYears, trackedYears };
  };

  // --- FILTER REMOVES EMPTY CARDS ON DEMAND ---
  const renderSemesterCard = (semKey, items, isOldCurriculum = false) => {
    // If filtered, do not render anything at all if there are zero subjects
    if (!items || items.length === 0) return null;
    
    const totalUnits = items.reduce((sum, item) => sum + (Number(item.creditUnits) || 0), 0);
    
    return (
      <div key={semKey} className="bg-white border border-slate-200/60 rounded-xl shadow-xs p-6 mb-6 text-left">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{semKey}</h3>
          <span className="text-xs font-bold text-slate-700 bg-slate-100/80 border border-slate-200/60 px-3 py-1 rounded-full shadow-2xs">
            {totalUnits} Units Recommended
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 table-fixed">
            <thead>
              <tr className="text-[10px] text-slate-400/90 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 w-[15%]">Code</th>
                <th className="pb-3 w-[30%]">Subject Title</th>
                <th className="pb-3 w-[18%]">Lec / Lab / Units</th>
                <th className="pb-3 w-[14%]">Prerequisites</th>
                <th className="pb-3 w-[14%]">Co-requisites</th>
                {!isOldCurriculum && <th className="pb-3 w-[14%]">Equivalency Status</th>}
                <th className="pb-3 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 font-semibold">
              {items.map((sub) => {
                const prereqsArray = Array.isArray(sub.prerequisites) ? sub.prerequisites : [];
                const coreqsArray = Array.isArray(sub.corequisites) ? sub.corequisites : [];
                
                const cleanedPrereqs = prereqsArray.filter(p => p && p !== '-');
                const cleanedCoreqs = coreqsArray.filter(c => c && c !== '-');

                const matchedEquivalencies = curriculumMappings.filter(
                  m => m.newCourseCode.toUpperCase() === sub.courseCode.replace(" ", "_").toUpperCase()
                );

                return (
                  <tr key={sub.id || sub.courseCode} className="hover:bg-slate-50/50 transition-all duration-150">
                    <td className="py-5.5 font-extrabold text-slate-950">
                      <div className="flex flex-col">
                        <span className="tracking-wide text-[13px]">{sub.courseCode}</span>
                        <span className="text-[9px] text-rose-500/90 font-bold tracking-tight mt-1" title="Grade Requirements">
                          Passing: {sub.constraints?.minGradeRequirement || '3.00'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-5.5 pr-4">
                      <span className="text-slate-900 font-bold text-[13px] tracking-tight block truncate" title={sub.courseTitle}>
                        {sub.courseTitle}
                      </span>
                    </td>

                    <td className="py-5.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-slate-950 font-bold text-[13px]">{sub.creditUnits} Units</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({sub.lectureUnits || sub.creditUnits}L / {sub.labUnits || 0}B)
                        </span>
                      </div>
                    </td>
                    
                    <td className="py-5.5 pr-2">
                      {cleanedPrereqs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cleanedPrereqs.map((prereq, index) => {
                            const exists = doesSubjectExist(prereq);
                            return (
                              <span 
                                key={index} 
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                  exists 
                                    ? 'bg-slate-100 text-slate-600 border-slate-200' 
                                    : 'bg-rose-50 text-rose-600 border-rose-200'
                                  }`}
                              >
                                {!exists && <AlertCircle size={8} />}
                                {prereq}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium text-[10px] italic">None</span>
                      )}
                    </td>

                    <td className="py-5.5 pr-2">
                      {cleanedCoreqs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cleanedCoreqs.map((coreq, index) => {
                            const exists = doesSubjectExist(coreq);
                            return (
                              <span 
                                key={index} 
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                  exists 
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                    : 'bg-rose-50 text-rose-600 border-rose-200'
                                }`}
                              >
                                {!exists && <AlertCircle size={8} />}
                                {coreq}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium text-[10px] italic">None</span>
                      )}
                    </td>
                    
                    {!isOldCurriculum && (
                      <td className="py-5.5 pr-2">
                        {matchedEquivalencies.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {matchedEquivalencies.map((equiv) => (
                              <div key={equiv.id} className="text-[9px] font-medium text-slate-600 bg-slate-50 border border-slate-200/50 p-1 rounded">
                                <div className="flex justify-between items-center gap-1">
                                  <span className="font-bold text-slate-700">{equiv.id}</span>
                                  <span className={`text-[8px] font-extrabold px-1 rounded ${equiv.isCreditable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {equiv.isCreditable ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-medium text-[10px] italic">None</span>
                        )}
                      </td>
                    )}

                    <td className="py-5.5 text-right">
                      <div className="flex justify-end gap-2 text-slate-300">
                        <button 
                          onClick={() => openEditModal(sub)}
                          className="p-1 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleToggleArchive(sub)}
                          className={`p-1 transition-colors ${sub.isArchived ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-rose-600'}`}
                          title={sub.isArchived ? "Restore" : "Archive"}
                        >
                          {sub.isArchived ? <RotateCcw size={13} /> : <Archive size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const oldData = getOldCurriculumStructured();

  // Helper check: does a Year structure have any matching courses in its child semesters?
  const hasCoursesInYear = (semestersObj) => {
    return Object.values(semestersObj).some(items => items && items.length > 0);
  };

  // Helper check: does a Track structure have any matching courses?
  const hasCoursesInTrack = (yearsObj) => {
    return Object.values(yearsObj).some(semesters => hasCoursesInYear(semesters));
  };

  // Verify if ANY elements matched the filter setup overall
  const matchesFound = getFilteredSubjects().length > 0;

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-800 p-8 font-sans antialiased text-left">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Curriculum Strategy Map</h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
            <Info size={13} className="text-slate-400" />
            Manage official curriculum profiles, prerequisites, equivalent transfer rules, and courses.
          </p>
        </div>
        
        {/* ACTION PANEL */}
        <div className="flex flex-wrap gap-3 mt-4 lg:mt-0 items-center">
          <button
            onClick={() => setIsCurriculumModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Layers size={14} />
            Map Equivalencies
          </button>
          
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus size={14} />
            Add New Subject
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS & UTILITY TOOLBAR */}
      <div className="max-w-7xl mx-auto bg-white border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search Box */}
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search code, title, track..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-1.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Year Level Filter */}
          <div className="flex items-center gap-2 text-xs">
            <Filter size={12} className="text-slate-400" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 outline-none hover:border-slate-300 transition-all"
            >
              <option value="All">All Year Levels</option>
              <option value="Year 1">Year 1</option>
              <option value="Year 2">Year 2</option>
              <option value="Year 3">Year 3</option>
              <option value="Year 4">Year 4</option>
            </select>
          </div>

          {/* Semester Offered Filter */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 outline-none hover:border-slate-300 transition-all"
            >
              <option value="All">All Semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
              <option value="Midterm">Midterm (Summer)</option>
            </select>
          </div>

          {/* Track Filters */}
          {selectedCurriculum === 'Old Curriculum' && (
            <select
              value={selectedTrackFilter}
              onChange={(e) => setSelectedTrackFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 outline-none hover:border-slate-300 transition-all"
            >
              <option value="All">All Tracks (Common + Spec)</option>
              <option value="Common Only">Common Only</option>
              <option value="Business Analytics Only">Business Analytics Only</option>
              <option value="Networking Technology Only">Networking Technology Only</option>
              <option value="Service Management Only">Service Management Only</option>
            </select>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewArchivedOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${!viewArchivedOnly ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'}`}
          >
            Active Subjects
          </button>
          <button
            onClick={() => setViewArchivedOnly(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${viewArchivedOnly ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-white text-slate-400 border-slate-200 hover:text-rose-600'}`}
          >
            View Archive
          </button>
        </div>
      </div>

      {/* CORE CONTROL MODULE TABS */}
      <div className="max-w-7xl mx-auto flex mb-6 border-b border-slate-200">
        <div className="flex gap-2 -mb-px">
          <button 
            onClick={() => setSelectedCurriculum('New Curriculum')}
            className={`px-4 py-2.5 text-xs font-bold tracking-wide transition-all border-b-2 flex items-center gap-1.5 ${selectedCurriculum === 'New Curriculum' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Layers size={14} /> New Curriculum
          </button>
          <button 
            onClick={() => setSelectedCurriculum('Old Curriculum')}
            className={`px-4 py-2.5 text-xs font-bold tracking-wide transition-all border-b-2 flex items-center gap-1.5 ${selectedCurriculum === 'Old Curriculum' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <BookOpen size={14} /> Old Curriculum Structure
          </button>
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE PANEL */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
            <RefreshCw className="animate-spin text-slate-300" size={24} />
            Loading Database Records...
          </div>
        ) : !matchesFound ? (
          /* GLOBAL NO RECORDS ALERT STATE FOR BOTH VIEW MODES */
          <div className="bg-white border border-slate-200/80 rounded-2xl py-16 px-6 text-center shadow-xs">
            <AlertCircle size={32} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-800">No Match Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              There are no curriculum subjects available matching your active search parameter or filters.
            </p>
          </div>
        ) : viewArchivedOnly ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-4 bg-rose-600 rounded-xs" />
                <h2 className="text-sm font-extrabold text-slate-950">Archived Curriculum Subjects ({getFilteredSubjects().length})</h2>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-4 divide-y divide-slate-100">
                {getFilteredSubjects().map(sub => (
                  <div key={sub.id} className="py-4 flex justify-between items-center text-xs font-semibold">
                    <div>
                      <span className="font-extrabold text-slate-950 block">{sub.courseCode}</span>
                      <span className="font-bold text-slate-800 block text-[11px]">{sub.courseTitle}</span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">{sub.category} | {sub.track}</span>
                    </div>
                    <button
                      onClick={() => handleToggleArchive(sub)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <RotateCcw size={11} /> Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDIT LOG PANEL */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <Activity size={15} className="text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-950">System Logs & Audits</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-normal mb-4">Historical system records for subjects and equivalencies updates.</p>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border-l-2 border-slate-300 bg-slate-50 p-2.5 rounded-r-lg text-[10px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-blue-700 uppercase tracking-wider text-[8px]">{log.actionType}</span>
                      <span className="text-[8px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                    <span className="font-bold text-slate-800 block">{log.entityId}</span>
                    <span className="text-slate-400 block text-[9px] mt-0.5">By {log.performedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedCurriculum === 'Old Curriculum' ? (
          /* OLD CURRICULUM VIEW (STRUCTURED & EMPTY YEAR GROUPS OMITTED) */
          <div className="space-y-12">
            
            {/* Common Years (1 & 2) Container */}
            {Object.values(oldData.commonYears).some(hasCoursesInYear) && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <BookOpen className="text-slate-500" size={16} />
                  <h2 className="text-sm font-extrabold text-slate-950 tracking-tight">Common Core Subjects (Years 1 & 2)</h2>
                </div>
                {Object.entries(oldData.commonYears).map(([year, semesters]) => {
                  if (!hasCoursesInYear(semesters)) return null; // Hide entire Year block if empty

                  return (
                    <div key={year} className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 px-1 mt-2">{year}</h3>
                      {["Semester 1", "Semester 2", "Midterm"].map((semKey) => 
                        renderSemesterCard(semKey, semesters[semKey] || [], true)
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Specialization Tracks (Years 3 & 4) Container */}
            {Object.values(oldData.trackedYears).some(hasCoursesInTrack) && (
              <div className="space-y-8">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Layers className="text-blue-600" size={16} />
                  <h2 className="text-sm font-extrabold text-slate-950 tracking-tight">Specialization Track Core Blocks (Years 3 & 4)</h2>
                </div>
                {Object.entries(oldData.trackedYears).map(([trackName, years]) => {
                  if (!hasCoursesInTrack(years)) return null; // Hide entire Track Section block if empty

                  return (
                    <div key={trackName} className="border border-slate-200 rounded-2xl bg-slate-50/40 p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                        <GraduationCap className="text-blue-600" size={18} />
                        <h3 className="text-xs font-black text-slate-950 tracking-tight">{trackName} Major Track Spec</h3>
                      </div>
                      {Object.entries(years).map(([year, semesters]) => {
                        if (!hasCoursesInYear(semesters)) return null; // Hide specific Year block inside Track

                        return (
                          <div key={year} className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">{year}</h4>
                            {["Semester 1", "Semester 2", "Midterm"].map((semKey) => 
                              renderSemesterCard(semKey, semesters[semKey] || [], true)
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* NEW CURRICULUM GROUPED (EMPTY MATRIX YEARS OMITTED) */
          <div className="space-y-10">
            {Object.entries(getNewCurriculumGrouped())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([year, semesters]) => {
                if (!hasCoursesInYear(semesters)) return null; // Hide Year block if empty

                return (
                  <div key={year} className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-4 bg-blue-600 rounded-xs" />
                      <h2 className="text-sm font-extrabold text-slate-950">{year} Curriculum Matrix</h2>
                    </div>
                    {["Semester 1", "Semester 2", "Midterm"].map((semKey) => 
                      renderSemesterCard(semKey, semesters[semKey] || [], false)
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* MODAL 1: SUBJECT FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-black text-slate-950 border-b border-slate-100 pb-3 mb-4">
              {editingSubject ? `Modify Subject: ${formData.courseCode}` : 'Register New Academic Course'}
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              {/* Semester & Year Planning */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Target Year Level</label>
                  <select 
                    value={formData.yearLevel} 
                    onChange={(e) => setFormData({...formData, yearLevel: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-medium outline-none"
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Fourth Year">Fourth Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Term</label>
                  <select 
                    value={formData.semesterOffered[0]} 
                    onChange={(e) => setFormData({...formData, semesterOffered: [e.target.value]})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-medium outline-none"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Midterm">Summer (Midterm)</option>
                  </select>
                </div>
              </div>

              {/* Core Code & Title Automation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Subject Code</label>
                  <input 
                    type="text" 
                    value={formData.courseCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="e.g. CC 101" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none uppercase font-medium" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Subject Title</label>
                  <input 
                    type="text" 
                    value={formData.courseTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Introduction to Computing" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none font-medium" 
                    required 
                  />
                </div>
              </div>

              {/* Unit Configuration */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Credit Units</label>
                  <input type="number" value={formData.creditUnits} onChange={(e) => setFormData({...formData, creditUnits: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Lecture Units</label>
                  <input type="number" value={formData.lectureUnits} onChange={(e) => setFormData({...formData, lectureUnits: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Laboratory Units</label>
                  <input type="number" value={formData.labUnits} onChange={(e) => setFormData({...formData, labUnits: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 font-medium outline-none" />
                </div>
              </div>

              {/* Program Bindings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Program Classification Type</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-medium outline-none"
                  >
                    <option value="General Education">General Education</option>
                    <option value="Major">Major Subjects</option>
                    <option value="Elective">Elective</option>
                    <option value="PE">PE Course</option>
                    <option value="NSTP">NSTP Binding</option>
                    <option value="OJT">OJT Practicum</option>
                    <option value="Capstone">Capstone Project</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Track Curricular Binding</label>
                  <select 
                    value={formData.track} 
                    onChange={(e) => setFormData({...formData, track: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-medium outline-none"
                  >
                    <option value="Common">Common (Core / All Tracks)</option>
                    <option value="Business Analytics">Business Analytics Only</option>
                    <option value="Networking">Networking Technology Only</option>
                    <option value="Service Management">Service Management Only</option>
                  </select>
                </div>
              </div>

              {/* Subject Dependencies Matrix */}
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subject Dependencies Matrix</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Prerequisites</label>
                    <div className="flex gap-1.5 mb-1.5">
                      <input 
                        type="text" 
                        value={prereqInput}
                        onChange={(e) => setPrereqInput(e.target.value)}
                        placeholder="e.g. IT 101"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1 outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (prereqInput.trim() && !formData.prerequisites.includes(prereqInput.trim().toUpperCase())) {
                            setFormData({ ...formData, prerequisites: [...formData.prerequisites, prereqInput.trim().toUpperCase()] });
                            setPrereqInput('');
                          }
                        }}
                        className="bg-slate-200 text-slate-700 px-2 rounded-lg text-[10px] font-bold"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.prerequisites.map(p => (
                        <span key={p} className="bg-white border border-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          {p}
                          <Trash2 size={10} className="text-rose-500 cursor-pointer" onClick={() => setFormData({ ...formData, prerequisites: formData.prerequisites.filter(item => item !== p) })} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Co-requisites</label>
                    <div className="flex gap-1.5 mb-1.5">
                      <input 
                        type="text" 
                        value={coreqInput}
                        onChange={(e) => setCoreqInput(e.target.value)}
                        placeholder="e.g. LAB 101"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1 outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (coreqInput.trim() && !formData.corequisites.includes(coreqInput.trim().toUpperCase())) {
                            setFormData({ ...formData, corequisites: [...formData.corequisites, coreqInput.trim().toUpperCase()] });
                            setCoreqInput('');
                          }
                        }}
                        className="bg-slate-200 text-slate-700 px-2 rounded-lg text-[10px] font-bold"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.corequisites.map(c => (
                        <span key={c} className="bg-white border border-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          {c}
                          <Trash2 size={10} className="text-rose-500 cursor-pointer" onClick={() => setFormData({ ...formData, corequisites: formData.corequisites.filter(item => item !== c) })} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules & Requirements */}
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subject Rules & Requirements</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Minimum Prereq Passing Grade</label>
                    <input 
                      type="text" 
                      value={formData.minGradeRequirement} 
                      onChange={(e) => setFormData({...formData, minGradeRequirement: e.target.value})}
                      placeholder="e.g. 3.00" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 outline-none font-extrabold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Minimum Track Entry GPA</label>
                    <input 
                      type="text" 
                      value={formData.minGpaRequirement} 
                      onChange={(e) => setFormData({...formData, minGpaRequirement: e.target.value})}
                      placeholder="e.g. 2.50" 
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Action Handlers */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Save Subject Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CURRICULUM MAPPING */}
      {isCurriculumModalOpen && (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-950 border-b border-slate-100 pb-3 mb-4">
              Map Curriculum Legacy Equivalency
            </h3>
            
            <form onSubmit={handleCurriculumMappingSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-slate-500 mb-1">Old Subject Code</label>
                <input 
                  type="text" 
                  value={curriculumForm.oldCourseCode}
                  onChange={(e) => setCurriculumForm({...curriculumForm, oldCourseCode: e.target.value.toUpperCase()})}
                  placeholder="e.g. CS_111" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none uppercase" 
                  required 
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Old Course Title</label>
                <input 
                  type="text" 
                  value={curriculumForm.courseTitle}
                  onChange={(e) => setCurriculumForm({...curriculumForm, courseTitle: e.target.value})}
                  placeholder="e.g. Computer Programming I" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none" 
                  required 
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Equivalent New Subject Code</label>
                <input 
                  type="text" 
                  value={curriculumForm.newCourseCode}
                  onChange={(e) => setCurriculumForm({...curriculumForm, newCourseCode: e.target.value.toUpperCase()})}
                  placeholder="e.g. CC 101" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none uppercase" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Curriculum Version</label>
                  <input 
                    type="text" 
                    value={curriculumForm.curriculumVersion} 
                    onChange={(e) => setCurriculumForm({...curriculumForm, curriculumVersion: e.target.value})}
                    placeholder="e.g. v2.1" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Effective Date</label>
                  <input 
                    type="date" 
                    value={curriculumForm.effectiveDate} 
                    onChange={(e) => setCurriculumForm({...curriculumForm, effectiveDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 outline-none" 
                  />
                </div>
              </div>

              {/* Toggle switch */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <span className="block text-slate-800 font-bold">Transfer Creditable</span>
                  <span className="block text-[10px] text-slate-400 font-normal">Allows unit balancing for incoming transfers.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurriculumForm({...curriculumForm, isCreditable: !curriculumForm.isCreditable})}
                  className={`w-11 h-6 rounded-full transition-all relative outline-none ${curriculumForm.isCreditable ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${curriculumForm.isCreditable ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCurriculumModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Save Mapping Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}