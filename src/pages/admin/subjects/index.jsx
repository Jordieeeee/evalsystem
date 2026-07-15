import React, { useState, useEffect } from 'react';
import { subjectService } from "../../../services/subjectService";
import { Plus, Layers, BookOpen, GraduationCap, Edit2, Archive, Info } from 'lucide-react'; 

export default function CurriculumBuilder() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurriculum, setSelectedCurriculum] = useState('New Curriculum'); 

  // --- MANAGEMENT STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    courseCode: '',
    courseTitle: '',
    creditUnits: 3,
    lectureHours: 2,
    labHours: 3,
    yearLevel: 'First Year',
    semesterOffered: ['First Semester'],
    prerequisites: [], 
    equivalencies: [], 
    track: 'Common',
    isArchived: false
  });

  const [curriculumMappings] = useState([
    { id: "map1", courseTitle: "Computer Programming", newCourseCode: "CC_101" },
    { id: "map2", courseTitle: "Introduction to Computing", newCourseCode: "CC_100" },
    { id: "map3", courseTitle: "Advanced Computer Programming", newCourseCode: "CC_102" }
  ]);

  useEffect(() => {
    loadSubjects();
  }, [selectedCurriculum]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const data = await subjectService.getAllSubjects(selectedCurriculum);
      setSubjects(data || []);
    } catch (err) {
      console.error("Error loading subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- AUTOMATION: Code ↔ Title Sync ---
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
    setFormData({
      courseCode: '',
      courseTitle: '',
      creditUnits: 3,
      lectureHours: 2,
      labHours: 3,
      yearLevel: 'First Year',
      semesterOffered: ['First Semester'],
      prerequisites: [],
      equivalencies: [],
      track: 'Common',
      isArchived: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    const dynamicEquiv = curriculumMappings
      .filter(m => m.newCourseCode.toUpperCase() === subject.courseCode.replace(" ", "_").toUpperCase())
      .map(m => `${m.courseTitle} (${m.newCourseCode})`);

    setFormData({
      courseCode: subject.courseCode || '',
      courseTitle: subject.courseTitle || '',
      creditUnits: subject.creditUnits || 3,
      lectureHours: subject.lectureHours || 2,
      labHours: subject.labHours || 3,
      yearLevel: subject.yearLevel || 'First Year',
      semesterOffered: subject.semesterOffered || ['First Semester'],
      prerequisites: Array.isArray(subject.prerequisites) ? subject.prerequisites : [subject.prerequisites || '-'],
      equivalencies: dynamicEquiv.length > 0 ? dynamicEquiv : (subject.equivalencies || []),
      track: subject.track || 'Common',
      isArchived: subject.isArchived || false
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await subjectService.updateSubject(editingSubject.id, formData);
      } else {
        await subjectService.addSubject(formData);
      }
      setIsModalOpen(false);
      loadSubjects();
    } catch (err) {
      console.error("Persistent save error:", err);
    }
  };

  const handleToggleArchive = async (subject) => {
    const updatedStatus = !subject.isArchived;
    if (confirm(`Are you sure you want to ${updatedStatus ? 'Archive' : 'Restore'} ${subject.courseCode}?`)) {
      try {
        await subjectService.updateSubject(subject.id, { ...subject, isArchived: updatedStatus });
        loadSubjects();
      } catch (err) {
        console.error("Archiving processing error:", err);
      }
    }
  };

  const getNewCurriculumGrouped = () => {
    const grouped = {};
    subjects.filter(sub => !sub.isArchived).forEach(sub => {
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

    subjects.filter(sub => !sub.isArchived).forEach(sub => {
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

  // --- PRESENTATION BADGE MATCHERS ---
  const getTypeBadgeClass = (subject) => {
    const trackVal = (subject.track || '').toLowerCase();
    if (trackVal !== 'common' && trackVal !== '') {
      return 'bg-blue-50 text-blue-600 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs';
    }
    const code = (subject.courseCode || '').toUpperCase();
    if (code.startsWith('GE')) return 'bg-amber-50 text-amber-600 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs';
    if (code.startsWith('NSTP')) return 'bg-slate-50 text-slate-500 border border-slate-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs';
    return 'bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs';
  };

  const getTypeLabel = (subject) => {
    const trackVal = (subject.track || '').toLowerCase();
    if (trackVal !== 'common' && trackVal !== '') return subject.track;
    const code = (subject.courseCode || '').toUpperCase();
    if (code.startsWith('GE')) return 'GE';
    if (code.startsWith('NSTP')) return 'NSTP';
    return 'Core';
  };

  // Sub-component Helper: Renders Semester Card
  const renderSemesterCard = (semKey, items, isOldCurriculum = false) => {
    if (items.length === 0 && semKey === "Midterm") return null;
    const totalUnits = items.reduce((sum, item) => sum + (Number(item.creditUnits) || 0), 0);
    
    return (
      <div key={semKey} className="bg-white border border-slate-200/60 rounded-xl shadow-xs p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-slate-900 text-md tracking-tight">{semKey}</h3>
          <span className="text-xs font-bold text-slate-700 bg-slate-100/80 border border-slate-200/60 px-3 py-1 rounded-full shadow-2xs">
            {totalUnits} Units
          </span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic font-medium">No scheduled courses.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="text-[10px] text-slate-400/90 font-bold uppercase tracking-wider border-b border-slate-100 pb-3">
                  <th className="pb-3 w-[15%]">Code</th>
                  <th className="pb-3 w-[35%]">Title</th>
                  <th className="pb-3 text-center w-[10%]">Units</th>
                  <th className="pb-3 w-[25%]">Prerequisites</th>
                  {!isOldCurriculum && <th className="pb-3 text-center w-[12%]">Type</th>}
                  <th className="pb-3 text-right w-[8%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 font-semibold">
                {items.map((sub) => {
                  const prereqsArray = Array.isArray(sub.prerequisites) 
                    ? sub.prerequisites 
                    : (sub.prerequisites ? [sub.prerequisites] : []);
                  const cleanedPrereqs = prereqsArray.filter(p => p && p !== '-');

                  return (
                    <tr key={sub.id || sub.courseCode} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 font-extrabold text-slate-950">{sub.courseCode}</td>
                      <td className="py-4 text-slate-600 font-medium">{sub.courseTitle}</td>
                      <td className="py-4 text-center text-slate-950 font-extrabold">{sub.creditUnits}</td>
                      <td className="py-4">
                        {cleanedPrereqs.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {cleanedPrereqs.map((prereq, index) => (
                              <span key={index} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                                {prereq}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px] italic">None</span>
                        )}
                      </td>
                      {!isOldCurriculum && (
                        <td className="py-4 text-center">
                          <span className={getTypeBadgeClass(sub)}>
                            {getTypeLabel(sub)}
                          </span>
                        </td>
                      )}
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-1.5 text-slate-300">
                          <button 
                            onClick={() => openEditModal(sub)}
                            className="p-1 hover:text-blue-600 transition-colors"
                            title="Edit Subject"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleToggleArchive(sub)}
                            className="p-1 hover:text-rose-600 transition-colors"
                            title="Archive Subject"
                          >
                            <Archive size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const oldData = getOldCurriculumStructured();

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-800 p-8 font-sans antialiased">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Curriculum Builder</h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
            <Info size={13} className="text-slate-400" />
            Batangas State University College of Informatics and Computing Sciences[cite: 2]
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus size={15} />
            Add New Subject
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="max-w-7xl mx-auto flex mb-8 border-b border-slate-200">
        <div className="flex gap-1 -mb-px">
          <button 
            onClick={() => setSelectedCurriculum('New Curriculum')}
            className={`px-5 py-2.5 text-xs font-bold tracking-wide transition-all border-b-2 ${selectedCurriculum === 'New Curriculum' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            New Curriculum Layout
          </button>
          <button 
            onClick={() => setSelectedCurriculum('Old Curriculum')}
            className={`px-5 py-2.5 text-xs font-bold tracking-wide transition-all border-b-2 ${selectedCurriculum === 'Old Curriculum' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Old Curriculum Structure
          </button>
        </div>
      </div>

      {/* Workspace Wrapper */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-medium">Loading curriculum schedules...</div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs font-medium border-2 border-dashed border-slate-200 rounded-2xl">
            No active subjects mapped to this structure.
          </div>
        ) : selectedCurriculum === 'Old Curriculum' ? (
          <div className="space-y-12">
            {/* Old Curriculum Layout blocks */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <BookOpen className="text-slate-500" size={16} />
                <h2 className="text-md font-extrabold text-slate-950 tracking-tight">Common General Core (Years 1 & 2)</h2>
              </div>
              {Object.entries(oldData.commonYears).map(([year, semesters]) => (
                <div key={year} className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 px-1 mt-2">{year}</h3>
                  {["Semester 1", "Semester 2", "Midterm"].map((semKey) => 
                    renderSemesterCard(semKey, semesters[semKey] || [], true)
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <Layers className="text-blue-600" size={16} />
                <h2 className="text-md font-extrabold text-slate-950 tracking-tight">Specialization Track Blocks (Years 3 & 4)</h2>
              </div>
              {Object.entries(oldData.trackedYears).map(([trackName, years]) => (
                <div key={trackName} className="border border-slate-200 rounded-2xl bg-slate-50/40 p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                    <GraduationCap className="text-blue-600" size={18} />
                    <h3 className="text-sm font-black text-slate-950 tracking-tight">{trackName} Track Spec</h3>
                  </div>
                  {Object.entries(years).map(([year, semesters]) => (
                    <div key={year} className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">{year}</h4>
                      {["Semester 1", "Semester 2", "Midterm"].map((semKey) => 
                        renderSemesterCard(semKey, semesters[semKey] || [], true)
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* New Curriculum Frame (Full width stacks) */
          <div className="space-y-10">
            {Object.entries(getNewCurriculumGrouped())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([year, semesters]) => (
                <div key={year} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-4 bg-blue-600 rounded-xs" />
                    <h2 className="text-md font-extrabold text-slate-950">{year} Master Schedule</h2>
                  </div>
                  {["Semester 1", "Semester 2", "Midterm"].map((semKey) => 
                    renderSemesterCard(semKey, semesters[semKey] || [], false)
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* FORM DIALOG POPUP PANEL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-950 mb-4">
              {editingSubject ? `Modify Subject: ${formData.courseCode}` : 'Register New Academic Course'}
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
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
                  <label className="block text-slate-500 mb-1">Target Assigned Semester</label>
                  <select 
                    value={formData.semesterOffered[0]} 
                    onChange={(e) => setFormData({...formData, semesterOffered: [e.target.value]})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs font-medium outline-none"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Midterm">Midterm Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Course Code</label>
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
                <label className="block text-slate-500 mb-1">Course Official Title</label>
                <input 
                  type="text" 
                  value={formData.courseTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Computer Programming" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none font-medium" 
                  required 
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Credit Units</label>
                  <input type="number" value={formData.creditUnits} onChange={(e) => setFormData({...formData, creditUnits: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Lec Hours</label>
                  <input type="number" value={formData.lectureHours} onChange={(e) => setFormData({...formData, lectureHours: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Lab Hours</label>
                  <input type="number" value={formData.labHours} onChange={(e) => setFormData({...formData, labHours: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 font-medium outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Prerequisites (Comma Separated)</label>
                <input 
                  type="text" 
                  value={formData.prerequisites.join(', ')} 
                  onChange={(e) => setFormData({...formData, prerequisites: e.target.value.split(',').map(v => v.trim())})}
                  placeholder="e.g. CC 100, CC 101" 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 font-medium outline-none" 
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Evaluation Credit Mappings Reference</label>
                <input 
                  type="text" 
                  value={formData.equivalencies.join('; ')} 
                  disabled
                  placeholder="Transferee mappings derived from database rules..." 
                  className="w-full border border-slate-100 rounded-lg px-3 py-2 bg-slate-50 text-slate-400 font-normal cursor-not-allowed" 
                />
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
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
