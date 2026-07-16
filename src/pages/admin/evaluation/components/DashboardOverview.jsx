import React from 'react';
import { LayoutDashboard, ClipboardList, CheckCircle2, History } from 'lucide-react';

export default function DashboardOverview({ dashboardStats, auditTrails, filteredHistoryLogs }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Total History Evaluated</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{dashboardStats.totalEvaluated}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Pending Active Assesses</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{dashboardStats.pendingEvaluations}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Students with Deficiencies</p>
          <p className="text-3xl font-black text-amber-600 mt-1">{dashboardStats.studentsWithDeficiencies}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Graduation Candidates</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{dashboardStats.graduationCandidates}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border space-y-4 lg:col-span-1 shadow-md">
          <h3 className="text-sm font-black flex items-center gap-2 border-b pb-2 text-slate-900 uppercase tracking-wide">
            <ClipboardList size={14} className="text-slate-500"/> Specialty Pipelines Registry
          </h3>
          <div className="text-xs font-bold space-y-3 text-slate-600">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span>Transferees Pending Evaluation</span>
              <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-black text-[10px]">{dashboardStats.transfereesPending} profiles</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span>Shiftees Credit Mappings</span>
              <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-black text-[10px]">{dashboardStats.shifteesPending} profiles</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span>Returning Student Resumptions</span>
              <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-black text-[10px]">{dashboardStats.returningStudents} profiles</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border lg:col-span-2 space-y-4 shadow-md">
          <h3 className="text-sm font-black flex items-center gap-2 border-b pb-2 text-slate-900 uppercase tracking-wide">
            <History size={14} className="text-slate-500"/> Recent Operations Logs Overview
          </h3>
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b">
                <tr>
                  <th className="p-2.5">Date Checked</th>
                  <th className="p-2.5">Student ID Reference</th>
                  <th className="p-2.5">System Finding Node</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-slate-700 divide-y">
                {filteredHistoryLogs.slice(0, 5).map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/40">
                    <td className="p-2.5 text-slate-400 font-mono">{log.evaluationDate ? new Date(log.evaluationDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-2.5 font-bold text-slate-950">{log.studentId}</td>
                    <td className="p-2.5 flex items-center gap-1.5 text-slate-600">
                      <CheckCircle2 size={12} className="text-emerald-500"/>
                      <span>Verified Cleared Core Node Allocation</span>
                    </td>
                  </tr>
                ))}
                {auditTrails.length === 0 && (
                  <tr><td colSpan="3" className="p-8 text-center text-slate-400 italic">No historical snapshots saved yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}