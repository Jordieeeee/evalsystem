import React, { useState, useEffect } from 'react';
import { 
  BookOpen, ClipboardList, Trash2, Plus
} from 'lucide-react';

export default function TransfereeShifteeView({ 
  isTorComplete, torValidationErrors, evaluationStrategy, prevSchoolName, setPrevSchoolName, 
  prevProgram, setPrevProgram, studentSubjectsHistory, auditOutput, 
  triggerReportModalOpen, handleFinalizeEvaluationMatrix, 
  isSubmitting, onAddManualSubject, onDeleteManualSubject 
}) {
  
  // States for the manual subject encoding fields
  const [encCode, setEncCode] = useState('');
  const [encTitle, setEncTitle] = useState('');
  const [encUnits, setEncUnits] = useState(3);
  const [encGrade, setEncGrade] = useState('1.0');
  const [encSem] = useState('First Semester');
  const [encAY, setEncAY] = useState('2025-2026');

  // Intelligent equivalency autocomplete lookup
  const [suggestedEquivalent, setSuggestedEquivalent] = useState(null);

  const systemEquivalencyRules = {
    'PATHFIT 1': { code: 'PE 101', title: 'Physical Activities Toward Health and Fitness 1' },
    'PATHFIT 2': { code: 'PE 102', title: 'Physical Activities Toward Health and Fitness 2' },
    'PROGRAMMING I': { code: 'CC101', title: 'Introduction to Computing' },
    'PROGRAMMING II': { code: 'CC102', title: 'Computer Programming 1' },
    'DATABASE SYSTEMS': { code: 'CC205', title: 'Database Management Systems 1' },
    'DATABASE I': { code: 'CC205', title: 'Database Management Systems 1' },
    'CALCULUS': { code: 'MATH102', title: 'Calculus for IT' },
    'DATA STRUCTURES': { code: 'CC201', title: 'Data Structures and Algorithms' },
    'HUMAN COMPUTER INTERACTION': { code: 'CS321', title: 'Human Computer Interaction' }
  };

  // Perform realtime lookup suggestion while the user is typing
  useEffect(() => {
    const searchKey = encCode.toUpperCase().trim();
    const searchTitleKey = encTitle.toUpperCase().trim();

    if (systemEquivalencyRules[searchKey]) {
      setSuggestedEquivalent(systemEquivalencyRules[searchKey]);
    } else if (systemEquivalencyRules[searchTitleKey]) {
      setSuggestedEquivalent(systemEquivalencyRules[searchTitleKey]);
    } else {
      setSuggestedEquivalent(null);
    }
  }, [encCode, encTitle]);

  const handleApplySuggestion = () => {
    if (suggestedEquivalent) {
      setEncCode(suggestedEquivalent.code);
      setEncTitle(suggestedEquivalent.title);
      setSuggestedEquivalent(null);
    }
  };

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
      semesterTaken: encSem,
      academicYearTaken: encAY,
      isManualEntry: true
    };

    onAddManualSubject(payload);
    // Reset inputs
    setEncCode('');
    setEncTitle('');
    setEncUnits(3);
    setEncGrade('1.0');
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      
      {/* Policy Warning alerts */}
      {!isTorComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-900 flex items-start gap-3">
          <div className="bg-amber-600 shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white">!</div>
          <div>
            <h4 className="font-black uppercase text-amber-950">Transcript Validation Notice (Review Required)</h4>
            <p className="mt-1">We discovered incomplete/invalid academic records inside this student's uploaded profiles database reference:</p>
            <ul className="list-disc pl-4 mt-2 space-y-1 font-mono text-[11px]">
              {torValidationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Main UI Layout Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Transcript Manual Entry Form & Inputted History */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-3xs">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <BookOpen size={13} className="text-blue-600"/> 1. Transferee Credentials Entry
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Previous School</label>
                <input type="text" value={prevSchoolName} onChange={e=>setPrevSchoolName(e.target.value)} className="w-full border p-2 rounded bg-slate-50 font-bold text-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Previous Program</label>
                <input type="text" value={prevProgram} onChange={e=>setPrevProgram(e.target.value)} className="w-full border p-2 rounded bg-slate-50 font-bold text-slate-900 outline-none" />
              </div>
            </div>

            <form onSubmit={handleEncodingSubmit} className="border-t pt-4 space-y-3">
              <span className="block text-[10px] font-black text-slate-500 uppercase">Encode Completed Course</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Subject Code</label>
                  <input type="text" required value={encCode} onChange={e=>setEncCode(e.target.value)} placeholder="e.g. PATHFIT 1" className="w-full border p-2 rounded bg-white text-xs font-bold font-mono outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Subject Title</label>
                  <input type="text" required value={encTitle} onChange={e=>setEncTitle(e.target.value)} placeholder="e.g. Wellness Movement" className="w-full border p-2 rounded bg-white text-xs font-bold outline-none" />
                </div>
              </div>

              {/* Autocomplete Suggestion alert box */}
              {suggestedEquivalent && (
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg flex justify-between items-center text-[10px] font-semibold text-blue-900 animate-slideDown">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-blue-500">Mapping Suggestion Found</span>
                    <span>Maps to: <strong className="font-mono">{suggestedEquivalent.code}</strong> - {suggestedEquivalent.title}</span>
                  </div>
                  <button type="button" onClick={handleApplySuggestion} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[9px] font-bold transition">Accept</button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Units</label>
                  <input type="number" min="1" value={encUnits} onChange={e=>setEncUnits(e.target.value)} className="w-full border p-2 rounded bg-white text-xs font-bold text-center outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Grade Obtained</label>
                  <select value={encGrade} onChange={e=>setEncGrade(e.target.value)} className="w-full border p-2 rounded bg-white text-xs font-bold text-center outline-none">
                    {['1.0', '1.25', '1.5', '1.75', '2.0', '2.25', '2.5', '2.75', '3.0', '5.0', 'INC', 'DRP'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">AY Taken</label>
                  <input type="text" placeholder="2025-2026" value={encAY} onChange={e=>setEncAY(e.target.value)} className="w-full border p-2 rounded bg-white text-xs font-bold text-center outline-none" />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                <Plus size={14}/> Add Subject to Credentials
              </button>
            </form>

            {/* Input list with delete mechanics */}
            <div className="border-t pt-3 space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Currently Encoded Credentials ({studentSubjectsHistory.length})</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {studentSubjectsHistory.map((s, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border text-[11px] font-semibold flex justify-between items-center">
                    <div className="truncate pr-1">
                      <p className="text-slate-900 font-black font-mono truncate">{s.subjectCode}</p>
                      <p className="text-slate-400 truncate text-[9px]">{s.subjectTitle || "External Entry"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white border text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">{s.grade}</span>
                      <button type="button" onClick={() => onDeleteManualSubject(s.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Comparative Transition Ledger Mappings List */}
        <div className="xl:col-span-5 space-y-4">
          <div className="border rounded-2xl bg-white overflow-hidden shadow-3xs">
            <div className="bg-slate-50 p-3.5 border-b flex justify-between items-center">
              <span className="text-xs font-black text-slate-950 uppercase tracking-wider">2. BSU Mapping & Policy Clearance Ledgers</span>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-semibold">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold border-b">
                    <tr>
                      <th className="p-2">Deficient Equivalent</th>
                      <th className="p-2 text-center">Encoded Node</th>
                      <th className="p-2">Bsu Mapped Target</th>
                      <th className="p-2 text-right">Status Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700 font-semibold">
                    {/* Credited items */}
                    {auditOutput.creditedList?.map((cr, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/20">
                        <td className="p-2 text-slate-900 font-bold font-mono">{cr.code}</td>
                        <td className="p-2 text-center font-mono text-emerald-600">✓ {cr.originalSubject}</td>
                        <td className="p-2 font-black text-blue-700 font-mono">{cr.code}</td>
                        <td className="p-2 text-right"><span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Credited</span></td>
                      </tr>
                    ))}
                    {/* Rejected items */}
                    {auditOutput.obsoleteList?.map((obs, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/20 bg-rose-50/5">
                        <td className="p-2 text-slate-400 font-mono font-bold">{obs.code}</td>
                        <td className="p-2 text-center text-rose-500">✗</td>
                        <td className="p-2 text-slate-400 font-mono">—</td>
                        <td className="p-2 text-right">
                          <span className="text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Not Credited</span>
                          <span className="block text-[8px] text-rose-400 font-normal truncate max-w-[120px]">{obs.reason}</span>
                        </td>
                      </tr>
                    ))}
                    {/* Remaining required courses */}
                    {auditOutput.missingSubjects?.map((rem, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/20">
                        <td className="p-2 text-amber-700 font-mono font-bold">{rem.code}</td>
                        <td className="p-2 text-center text-slate-400">—</td>
                        <td className="p-2 text-slate-500 font-mono font-bold">{rem.code}</td>
                        <td className="p-2 text-right"><span className="text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Remaining</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Live Transfer Credit Summary Panel */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-slate-50 border rounded-2xl p-4 space-y-4 text-xs font-semibold shadow-3xs">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList size={13} className="text-slate-600"/> 3. Credit Analysis Hub
            </h3>
            
            <div className="space-y-2 border-b pb-3">
              <div className="flex justify-between"><span>Transferred Total</span><span className="font-bold text-slate-950">{(auditOutput.creditedList?.length || 0) + (auditOutput.obsoleteList?.length || 0)}</span></div>
              <div className="flex justify-between"><span>Credited Subjects</span><span className="font-bold text-emerald-600">{auditOutput.creditedList?.length || 0}</span></div>
              <div className="flex justify-between"><span>Rejected Subjects</span><span className="font-bold text-rose-600">{auditOutput.obsoleteList?.length || 0}</span></div>
              <div className="flex justify-between"><span>Remaining Subjects</span><span className="font-bold text-amber-600">{auditOutput.missingSubjects?.length || 0}</span></div>
              <div className="flex justify-between"><span>Credited Units</span><span className="font-bold text-blue-700">{auditOutput.unitsEarned || 0} Units</span></div>
              <div className="flex justify-between"><span>Remaining Units</span><span className="font-bold text-slate-900">{auditOutput.unitsRemaining || 0} Units</span></div>
              <div className="flex justify-between"><span>Curriculum Progress</span><span className="font-bold text-blue-700">{auditOutput.completionPercentage}%</span></div>
              <div className="flex justify-between"><span>Estimated Semesters</span><span className="font-bold text-slate-900">{auditOutput.recommendedRoadmap?.length || 0} Terms</span></div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Evaluation Process Result:</span>
              <p className={`text-xs font-black uppercase ${auditOutput.overallEligibility?.includes('Review') ? 'text-amber-600' : 'text-emerald-600'}`}>
                {auditOutput.overallEligibility}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2 font-bold">
              <button type="button" onClick={() => triggerReportModalOpen(evaluationStrategy)} className="w-full border bg-white hover:bg-slate-100 text-slate-800 p-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-3xs transition">
                Print Portrait Reports
              </button>
              <button type="button" onClick={handleFinalizeEvaluationMatrix} disabled={isSubmitting} className="w-full bg-slate-950 hover:bg-slate-850 text-white p-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition">
                {isSubmitting ? "Processing..." : "Commit Matrix Updates"}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Recommended Semesterly Sequence Plan - Graduation Roadmap */}
      {auditOutput.recommendedRoadmap && auditOutput.recommendedRoadmap.length > 0 && (
        <div className="border rounded-2xl bg-white p-5 space-y-4 shadow-3xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            📅 Automated Curricular Sequence Roadmap (Semester Recommended Plan)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {auditOutput.recommendedRoadmap.map((termPlan, index) => (
              <div key={index} className="border rounded-xl bg-slate-50 p-3 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-black text-slate-800 border-b pb-1">
                  <span>Term {index + 1}: {termPlan.term}</span>
                  <span className="bg-white border text-blue-700 px-1.5 py-0.5 rounded text-[9px]">{termPlan.totalUnits} Units</span>
                </div>
                <div className="space-y-1 text-[10px] font-semibold text-slate-600">
                  {termPlan.subjects.map(s => (
                    <div key={s.code} className="flex justify-between items-center bg-white border p-1.5 rounded">
                      <div>
                        <span className="block font-black text-slate-900 font-mono">{s.code}</span>
                        <span className="text-slate-400 text-[9px] truncate max-w-[150px] inline-block align-bottom">{s.title}</span>
                      </div>
                      <span className="text-slate-500">{s.units} u</span>
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