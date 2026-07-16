import React from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, Printer, Save } from 'lucide-react';

export default function GeneralWorkspaceView({ 
  auditOutput, minAllowedUnits, maxAllowedUnits, evaluationStrategy, triggerReportModalOpen, handleFinalizeEvaluationMatrix, isSubmitting 
}) {
  if (!auditOutput) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 text-left animate-fadeIn">
      <div className="space-y-4 lg:col-span-1">
        <div className="bg-slate-50/60 border border-slate-200/60 p-4 rounded-2xl space-y-3.5 text-xs font-semibold">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="font-black text-slate-900">Curriculum Progress</span>
            <span className="text-blue-600 font-extrabold">{auditOutput.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${auditOutput.completionPercentage}%` }} />
          </div>
          <div className="space-y-1.5 pt-1 text-slate-500 text-[11px]">
            <p className="flex justify-between"><span>Units Earned Mapped</span><span className="font-bold text-slate-900">{auditOutput.unitsEarned} Units</span></p>
            <p className="flex justify-between"><span>Units Deficient Remaining</span><span className="font-bold text-slate-900">{auditOutput.unitsRemaining} Units</span></p>
            <p className="flex justify-between"><span>Permitted Credit Boundary</span><span className="font-bold text-slate-900">{minAllowedUnits} – {maxAllowedUnits} Max Units</span></p>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-3xs space-y-3 text-xs">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="text-xs font-black text-slate-900 uppercase">Sequential Priority Plan</h4>
            <span className="bg-slate-100 text-slate-800 text-[9px] px-2 py-0.5 rounded-full font-black">
              {auditOutput.recommendedStudyPlan?.reduce((total, item) => total + parseInt(item.units || 3, 10), 0) || 0} Units Assigned
            </span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 font-semibold">
            {auditOutput.recommendedStudyPlan?.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                <div className="space-y-0.5 max-w-[75%] text-left"><p className="font-bold text-slate-900 truncate">{item.code}</p><p className="text-slate-400 font-semibold truncate text-[10px]">{item.title}</p></div>
                <span className="font-extrabold text-slate-500 bg-white border border-slate-100 px-1.5 py-0.5 rounded font-mono">{item.units}u</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
            <span className="text-xs font-black text-slate-950 uppercase">Analysis Logs & Rule Results</span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
              auditOutput.overallEligibility === 'ELIGIBLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>{auditOutput.overallEligibility}</span>
          </div>

          <div className="p-4 space-y-4">
            {auditOutput.alerts?.length > 0 && (
              <div className="space-y-2">
                {auditOutput.alerts.map((alertText, index) => (
                  <div key={index} className="bg-amber-50/50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5"/><p className="font-semibold leading-relaxed">{alertText}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 font-semibold">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide">Target Requirement Checksheet</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto text-left">
                {auditOutput.deficiencies?.map((def, idx) => (
                  <div key={idx} className="bg-rose-50/20 border border-rose-100 p-2.5 rounded-xl flex items-start gap-2 text-[11px]">
                    <ShieldAlert size={14} className="text-rose-600 shrink-0 mt-0.5"/><p className="text-slate-700 font-semibold leading-relaxed">{def}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
              <button type="button" onClick={() => triggerReportModalOpen(evaluationStrategy)} className="border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-xl flex items-center gap-1.5"><Printer size={13}/> Preview Checksheet PDF</button>
              <button type="button" onClick={handleFinalizeEvaluationMatrix} disabled={isSubmitting} className="bg-slate-950 hover:bg-slate-850 text-white px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md">
                {isSubmitting ? "Finalizing Pipeline..." : "Finalize & Record Evaluation"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}