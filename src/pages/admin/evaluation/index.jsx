import { useCallback, useEffect, useState } from 'react';
import { Search, Plus, X, CheckCircle2, Loader2, Printer, FileText } from 'lucide-react';
import { evaluationService } from '../../../services/evaluationService';
import { studentService } from '../../../services/studentService';

export default function AdminEvaluationPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [eligibilityData, setEligibilityData] = useState({ passed: [], eligible: [] });
  const [selectedSubjectsToAssign, setSelectedSubjectsToAssign] = useState([]);
  const [activeTab, setActiveTab] = useState('auto');
  const [isSummaryView, setIsSummaryView] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [manualTorEntries, setManualTorEntries] = useState([{ subjectCode: '', grade: '', status: 'Passed' }]);
  const [manualTorStudentId, setManualTorStudentId] = useState('');
  const [manualTorSubmitting, setManualTorSubmitting] = useState(false);

  const loadPageData = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const [evalsData, studentsData] = await Promise.all([
        evaluationService.getAllEvaluations(),
        studentService.getAllStudents()
      ]);

      setEvaluations(evalsData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await loadPageData();
    };
    void run();
    return () => {
      active = false;
    };
  }, [loadPageData]);

  useEffect(() => {
    if (!selectedStudentId) {
      return;
    }

    let cancelled = false;
    const runPreEvaluation = async () => {
      setIsCheckingEligibility(true);
      try {
        const data = await evaluationService.getEligibleSubjectsForStudent(selectedStudentId);
        if (!cancelled) {
          setEligibilityData(data);
          setSelectedSubjectsToAssign([]);
        }
      } catch (error) {
        console.error("Eligibility check failed:", error);
      } finally {
        if (!cancelled) {
          setIsCheckingEligibility(false);
        }
      }
    };

    void runPreEvaluation();
    return () => {
      cancelled = true;
    };
  }, [selectedStudentId]);

  // 3. Handle Checkbox Toggles
  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjectsToAssign(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // 4. Submit Batch Assignments
  const handleDispatchAssignments = async (e) => {
    e.preventDefault();
    const studentId = selectedStudentId.trim();
    if (!studentId) return alert('Please select a student first.');
    if (selectedSubjectsToAssign.length === 0) return alert('Select at least one subject.');

    setIsSubmitting(true);
    try {
      await evaluationService.dispatchMultipleAssignments(studentId, selectedSubjectsToAssign);
      const selectedStudent = students.find((student) => student.id === studentId);
      setSummaryData({
        studentName: selectedStudent?.name || studentId,
        subjects: selectedSubjectsToAssign
      });
      setSelectedSubjectsToAssign([]);
      setIsSummaryView(true);
      await loadPageData();
    } catch (error) {
      console.error('Error assigning subjects:', error);
      alert('Failed to assign subjects. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateManualTorEntry = (index, field, value) => {
    setManualTorEntries((prev) => prev.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    )));
  };

  const addManualTorEntryRow = () => {
    setManualTorEntries((prev) => [...prev, { subjectCode: '', grade: '', status: 'Passed' }]);
  };

  const removeManualTorEntryRow = (index) => {
    setManualTorEntries((prev) => prev.filter((_, entryIndex) => entryIndex !== index));
  };

  const handleManualTorSubmit = async (e) => {
    e.preventDefault();
    const studentId = (manualTorStudentId.trim() || selectedStudentId).trim();
    if (!studentId) return alert('Please enter a student ID.');

    const validEntries = manualTorEntries.filter((entry) => entry.subjectCode.trim());
    if (validEntries.length === 0) return alert('Please add at least one subject.');

    const normalizedEntries = validEntries.map((entry) => ({
      subjectCode: entry.subjectCode.trim().toUpperCase(),
      grade: entry.grade.trim(),
      status: entry.status || 'Passed',
      remarks: entry.status === 'Failed' ? 'Manual TOR Entry - Failed' : 'Manual TOR Entry'
    }));

    setManualTorSubmitting(true);
    try {
      await evaluationService.addManualTORRecords(studentId, normalizedEntries);
      const selectedStudent = students.find((student) => student.id === studentId);
      setSummaryData({
        studentName: selectedStudent?.name || studentId,
        subjects: normalizedEntries.map((entry) => `${entry.subjectCode} (${entry.status}${entry.grade ? `, ${entry.grade}` : ''})`)
      });
      setManualTorEntries([{ subjectCode: '', grade: '', status: 'Passed' }]);
      setManualTorStudentId('');
      setSelectedStudentId(studentId);
      setActiveTab('auto');
      setIsSummaryView(false);

      const refreshedEligibility = await evaluationService.getEligibleSubjectsForStudent(studentId);
      setEligibilityData(refreshedEligibility);
      setSelectedSubjectsToAssign([]);
    } catch (error) {
      console.error('Manual TOR entry failed:', error);
      alert('Failed to save manual TOR records.');
    } finally {
      setManualTorSubmitting(false);
    }
  };

  const filteredEvals = evaluations.filter(ev => 
    ev.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#375534] space-y-4">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#0F2A1D]">
      
      {/* Header section... */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900">Evaluation Records</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Manage academic assessments and subject assignments.</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
            {filteredEvals.length} matching record{filteredEvals.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records"
              className="w-full border border-slate-200 bg-white pl-10 pr-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#375534]/20"
            />
          </div>
          <button 
            onClick={() => {
              setSelectedStudentId('');
              setIsModalOpen(true);
            }}
            className="bg-[#7D1924] text-[#FCEEEF] px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#962230] transition-all font-bold text-xs shadow-sm"
          >
            <Plus size={16} className="stroke-[2.5]" /> Run Pre-Evaluation
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden min-h-[240px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/70 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Student ID</th>
                <th className="p-4">Subject Code</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {filteredEvals.length > 0 ? (
                filteredEvals.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 pl-6 font-extrabold text-slate-900">{ev.studentId}</td>
                    <td className="p-4 text-slate-600">{ev.subjectCode}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${ev.status === 'Assigned' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono tracking-tight">
                      {ev.assignedDate ? new Date(ev.assignedDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-16 text-center text-slate-400">No evaluation records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PRE-EVALUATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Student Pre-Evaluation</h3>
                <p className="text-xs text-slate-500 font-medium">Verify prerequisites and assign eligible subjects.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/50">
              <div className="flex p-2 bg-slate-100 rounded-2xl mb-6">
                <button 
                  onClick={() => {
                    setActiveTab('auto');
                    setIsSummaryView(false);
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'auto' ? 'bg-white shadow-sm' : ''}`}
                >
                  AUTO-ELIGIBILITY
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('manual');
                    setIsSummaryView(false);
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${activeTab === 'manual' ? 'bg-white shadow-sm' : ''}`}
                >
                  MANUAL TOR ENTRY
                </button>
              </div>

              {isSummaryView ? (
                <div className="bg-white p-8 border border-emerald-100 rounded-3xl" id="print-summary">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-serif font-black">Pre-Assessment Summary</h2>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Certification of Eligible Subjects</p>
                  </div>
                  <div className="border-t border-b border-slate-100 py-4 mb-4">
                    <p className="text-sm font-bold text-slate-800">Student: {summaryData?.studentName || selectedStudentId}</p>
                    <p className="text-xs text-slate-500">Date Issued: {new Date().toLocaleDateString()}</p>
                  </div>
                  <ul className="space-y-2">
                    {(summaryData?.subjects || []).map((subject) => (
                      <li key={subject} className="text-sm font-medium text-slate-700">• {subject}</li>
                    ))}
                  </ul>
                  <div className="mt-8 flex gap-2">
                    <button onClick={() => window.print()} className="flex-1 bg-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs">
                      <Printer size={16} /> Print / Save PDF
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Step 1: Select Student */}
                  <div className="mb-6">
                    <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-500">1. Select Student</label>
                    <select 
                      value={selectedStudentId} 
                      onChange={(e) => setSelectedStudentId(e.target.value)} 
                      className="w-full border border-slate-200 bg-white p-3.5 rounded-xl font-bold focus:ring-2 focus:ring-[#375534]/20 focus:outline-none text-slate-800"
                    >
                      <option value="">-- Choose a Student --</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeTab === 'auto' && selectedStudentId && (
                    <div className="space-y-4 animate-in fade-in">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500">2. Eligible Subjects Checklist</label>
                      
                      {isCheckingEligibility ? (
                        <div className="p-8 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
                          <Loader2 className="animate-spin text-[#375534]" size={24} />
                          Analyzing Academic History...
                        </div>
                      ) : (
                        <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
                          <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-600"/> 
                              Prerequisites Cleared
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-md">
                              {eligibilityData.eligible.length} Available
                            </span>
                          </div>

                          <div className="p-2 max-h-[300px] overflow-y-auto">
                            {eligibilityData.eligible.length === 0 ? (
                              <div className="p-6 text-center text-slate-400 text-sm font-bold">
                                No eligible subjects available. (Student may have completed the curriculum).
                              </div>
                            ) : (
                              eligibilityData.eligible.map(subject => (
                                <label 
                                  key={subject.id} 
                                  className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all border border-transparent
                                    ${selectedSubjectsToAssign.includes(subject.id) ? 'bg-[#f4f7f4] border-[#cbe6bf]' : 'hover:bg-slate-50'}`}
                                >
                                  <div className="pt-0.5">
                                    <input 
                                      type="checkbox" 
                                      className="w-4 h-4 rounded text-[#375534] focus:ring-[#375534]"
                                      checked={selectedSubjectsToAssign.includes(subject.id)}
                                      onChange={() => handleSubjectToggle(subject.id)}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">{subject.id} - {subject.courseTitle}</h4>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 flex gap-2">
                                      <span>{subject.creditUnits} Units</span>
                                      {subject.prerequisites?.length > 0 ? (
                                        <span className="text-emerald-600">Requires: {subject.prerequisites.join(', ')}</span>
                                      ) : (
                                        <span className="text-slate-400">Open Sequence</span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'manual' && (
                    <form onSubmit={handleManualTorSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                      <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                        <FileText size={16} className="text-[#375534]" /> Manual TOR Entry
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Enter the student’s subjects with grades and mark each one as passed or failed. These records are saved and then used to re-run prerequisite eligibility.</p>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider mb-2 text-slate-500">Student ID</label>
                        <input
                          type="text"
                          value={manualTorStudentId}
                          onChange={(e) => setManualTorStudentId(e.target.value)}
                          placeholder="Leave blank to use the selected student"
                          className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl font-bold focus:ring-2 focus:ring-[#375534]/20 focus:outline-none text-slate-800"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Subject / Grade Entries</label>
                          <button
                            type="button"
                            onClick={addManualTorEntryRow}
                            className="text-[11px] font-black text-[#375534] border border-[#cbe6bf] rounded-lg px-3 py-1.5 hover:bg-[#f4f7f4] transition-all"
                          >
                            + Add Subject
                          </button>
                        </div>

                        <div className="space-y-2">
                          {manualTorEntries.map((entry, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] gap-2">
                              <input
                                type="text"
                                value={entry.subjectCode}
                                onChange={(e) => updateManualTorEntry(index, 'subjectCode', e.target.value)}
                                placeholder="Subject Code"
                                className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl font-bold focus:ring-2 focus:ring-[#375534]/20 focus:outline-none text-slate-800"
                              />
                              <input
                                type="text"
                                value={entry.grade}
                                onChange={(e) => updateManualTorEntry(index, 'grade', e.target.value)}
                                placeholder="Grade"
                                className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl font-bold focus:ring-2 focus:ring-[#375534]/20 focus:outline-none text-slate-800"
                              />
                              <select
                                value={entry.status}
                                onChange={(e) => updateManualTorEntry(index, 'status', e.target.value)}
                                className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl font-bold focus:ring-2 focus:ring-[#375534]/20 focus:outline-none text-slate-800"
                              >
                                <option value="Passed">Passed</option>
                                <option value="Failed">Failed</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => removeManualTorEntryRow(index)}
                                className="border border-slate-200 bg-white text-slate-500 rounded-xl px-3 hover:bg-slate-50 transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={manualTorSubmitting}
                          className="bg-[#7D1924] text-[#FCEEEF] px-5 py-2.5 rounded-xl hover:bg-[#962230] transition-all font-bold text-xs shadow-sm disabled:opacity-50"
                        >
                          {manualTorSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save and Re-check Eligibility'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-2 bg-white">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-200 transition-all font-bold text-xs">
                Cancel
              </button>
              <button 
                onClick={handleDispatchAssignments}
                disabled={isSubmitting || selectedSubjectsToAssign.length === 0}
                className="bg-[#7D1924] text-[#FCEEEF] px-6 py-2.5 rounded-xl hover:bg-[#962230] transition-all flex items-center justify-center font-bold text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : `Assign Selected (${selectedSubjectsToAssign.length})`}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}