import { CheckCircle2, ShieldAlert, ArrowRight, Undo2, X, Lock, GitBranch } from 'lucide-react';
import { TRANSFER_NO_CREDIT } from '../utils/runCurriculumShiftEvaluation';

// --- PHASE 3: MANUAL TRANSFER & OVERRIDE ---
// Section A: auto-credited matches the admin may reject.
// Section B: unmapped old courses the admin may transfer onto a Gap course.
// Section C: the gaps that remain once decisions settle.

export default function TransferReviewPanel({
  auditOutput, overrides, onRejectMatch, onRestoreMatch, onTransferChange,
  onConfirmTransfers, transfersConfirmed
}) {
  if (!auditOutput) return null;

  const { autoMatchedList = [], manualTransferList = [], bridgeCourses = [], unmappedList = [], gapCourses = [] } = auditOutput;
  const rejected = overrides.rejectedMatches || [];

  // Auto-matched bridges are shown alongside auto-credited: both are system matches
  // the admin may want to reject.
  const autoBridges = bridgeCourses.filter((b) => b.source === 'auto');
  const manualBridges = bridgeCourses.filter((b) => b.source === 'manual');
  const sectionARows = [...autoMatchedList, ...autoBridges];

  // A gap course is a valid transfer destination for any unmapped old course.
  const transferTargets = gapCourses;

  return (
    <div className="space-y-4 animate-fadeIn text-left">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-sm font-black uppercase text-slate-900">Transfer Review & Credit Decisions</h3>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
            Reject any incorrect auto-match, then transfer unmapped courses onto the new curriculum requirements they satisfy.
          </p>
        </div>
        <button
          type="button"
          onClick={onConfirmTransfers}
          disabled={transfersConfirmed}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:bg-emerald-600 disabled:cursor-default"
        >
          {transfersConfirmed ? <><Lock size={13} /> Transfers Confirmed</> : <><CheckCircle2 size={13} /> Confirm Transfers</>}
        </button>
      </div>

      {/* ============ SECTION A: AUTO-CREDITED ============ */}
      <div className="border border-emerald-200 rounded-2xl overflow-hidden bg-white">
        <div className="bg-emerald-50 p-3 border-b border-emerald-200 flex justify-between items-center">
          <span className="text-xs font-black text-emerald-900 uppercase flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Section A — Auto-Credited (System Matches)
          </span>
          <span className="text-[10px] font-black text-emerald-700">{sectionARows.length} match(es) · {rejected.length} rejected</span>
        </div>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b sticky top-0">
              <tr>
                <th className="p-2.5">Old Code</th><th className="p-2.5">Old Title</th><th className="p-2.5 text-right">Old Units</th>
                <th className="p-2.5 text-center">→</th>
                <th className="p-2.5">New Code</th><th className="p-2.5">New Title</th><th className="p-2.5 text-right">New Units</th>
                <th className="p-2.5">Status</th><th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-slate-700 divide-y">
              {sectionARows.length === 0 && (
                <tr><td colSpan={9} className="p-4 text-center text-slate-400 font-semibold">No automatic matches were found.</td></tr>
              )}
              {sectionARows.map((row, i) => (
                <tr key={i} className={row.shortfallUnits > 0 ? 'bg-amber-50/30' : 'hover:bg-emerald-50/30'}>
                  <td className="p-2.5 font-extrabold text-slate-900">{row.oldCode}</td>
                  <td className="p-2.5 text-slate-500">{row.oldTitle}</td>
                  <td className="p-2.5 text-right font-mono">{row.oldUnits}u</td>
                  <td className="p-2.5 text-center text-slate-300"><ArrowRight size={12} className="inline" /></td>
                  <td className="p-2.5 font-extrabold text-emerald-800">{row.newCode}</td>
                  <td className="p-2.5 text-slate-500">{row.newTitle}</td>
                  <td className="p-2.5 text-right font-mono">{row.units}u</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${row.shortfallUnits > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {row.shortfallUnits > 0 ? `Bridge · ${row.shortfallUnits}u short` : 'Credited'}
                    </span>
                    {row.matchType === 'direct' && (
                      <span className="block mt-0.5 text-[8px] font-bold text-slate-400 uppercase" title="Same course code exists in new_subjects — carried over unchanged between curricula">
                        Direct match
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onRejectMatch(row.newCode)}
                      disabled={transfersConfirmed}
                      title={`Reject this match — ${row.newCode} returns to Gap`}
                      className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition disabled:text-slate-300 disabled:hover:bg-transparent"
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rejected.length > 0 && (
          <div className="border-t bg-rose-50/30 p-3 space-y-1.5">
            <p className="text-[10px] font-black uppercase text-rose-800">Rejected Matches — returned to Gap</p>
            <div className="flex flex-wrap gap-1.5">
              {rejected.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onRestoreMatch(code)}
                  disabled={transfersConfirmed}
                  className="bg-white border border-rose-200 text-rose-800 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-rose-50 transition disabled:opacity-50"
                >
                  <Undo2 size={10} /> {code} — restore
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============ SECTION B: UNMAPPED — MANUAL TRANSFER ============ */}
      <div className="border border-amber-200 rounded-2xl overflow-hidden bg-white">
        <div className="bg-amber-50 p-3 border-b border-amber-200 flex justify-between items-center">
          <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
            <GitBranch size={14} /> Section B — Unmapped Old Courses (Manual Transfer)
          </span>
          <span className="text-[10px] font-black text-amber-700">{unmappedList.length} awaiting decision · {manualTransferList.length + manualBridges.length} transferred</span>
        </div>

        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
          {unmappedList.length === 0 && manualTransferList.length === 0 && manualBridges.length === 0 && (
            <p className="text-[11px] text-slate-400 font-semibold py-4 text-center">Every entered course was matched automatically.</p>
          )}

          {/* Courses still needing a decision */}
          {unmappedList.map((item, i) => (
            <div key={`u-${i}`} className={`p-2.5 border rounded-xl grid grid-cols-1 md:grid-cols-12 gap-2 items-center ${item.decided ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/30 border-amber-200'}`}>
              <div className="md:col-span-5 min-w-0">
                <p className="font-extrabold text-slate-900 text-[11px]">{item.oldCode} <span className="font-mono text-slate-400">({item.oldUnits}u · {item.grade})</span></p>
                <p className="text-[10px] text-slate-500 font-semibold truncate">{item.oldTitle}</p>
                <p className="text-[9px] text-slate-400 italic">{item.reason}</p>
              </div>
              <div className="md:col-span-2 text-center text-slate-300 hidden md:block"><ArrowRight size={12} className="inline" /></div>
              <div className="md:col-span-5">
                <label className="text-[9px] font-black text-slate-400 block mb-0.5 uppercase">Transfer To</label>
                <select
                  value={overrides.manualTransfers[item.oldCode] || ''}
                  onChange={(e) => onTransferChange(item.oldCode, e.target.value)}
                  disabled={transfersConfirmed}
                  className="w-full bg-white border p-1.5 rounded text-[11px] font-bold outline-none focus:ring-1 focus:ring-slate-950 disabled:bg-slate-100"
                >
                  <option value="">-- Choose a new curriculum course --</option>
                  <option value={TRANSFER_NO_CREDIT}>No Credit — no new equivalent</option>
                  {transferTargets.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.code} — {t.title} ({t.units}u){item.oldUnits < t.units ? ` · bridge, ${t.units - item.oldUnits}u short` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {/* Courses the admin already transferred */}
          {[...manualTransferList, ...manualBridges].map((item, i) => {
            const isBridge = item.shortfallUnits > 0;
            return (
              <div key={`t-${i}`} className={`p-2.5 border rounded-xl grid grid-cols-1 md:grid-cols-12 gap-2 items-center ${isBridge ? 'bg-amber-50/40 border-amber-200' : 'bg-emerald-50/40 border-emerald-200'}`}>
                <div className="md:col-span-5 min-w-0">
                  <p className="font-extrabold text-slate-900 text-[11px]">{item.oldCode} <span className="font-mono text-slate-400">({item.oldUnits}u)</span></p>
                  <p className="text-[10px] text-slate-500 font-semibold truncate">{item.oldTitle}</p>
                </div>
                <div className="md:col-span-2 text-center text-slate-300 hidden md:block"><ArrowRight size={12} className="inline" /></div>
                <div className="md:col-span-5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`font-extrabold text-[11px] ${isBridge ? 'text-amber-800' : 'text-emerald-800'}`}>{item.newCode}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.newTitle} ({item.units}u)</p>
                    <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${isBridge ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {isBridge ? `Bridge · ${item.shortfallUnits}u deficit` : 'Credited — manual'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTransferChange(item.oldCode, '')}
                    disabled={transfersConfirmed}
                    title="Undo this transfer"
                    className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition disabled:text-slate-300 disabled:hover:bg-transparent shrink-0"
                  >
                    <Undo2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ SECTION C: GAPS ============ */}
      <div className="border border-rose-200 rounded-2xl overflow-hidden bg-white">
        <div className="bg-rose-50 p-3 border-b border-rose-200 flex justify-between items-center">
          <span className="text-xs font-black text-rose-900 uppercase flex items-center gap-1.5">
            <ShieldAlert size={14} /> Section C — Gap Courses (Nothing To Transfer)
          </span>
          <span className="text-[10px] font-black text-rose-700">{gapCourses.length} course(s) · {gapCourses.reduce((s, c) => s + c.units, 0)} units</span>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b sticky top-0">
              <tr>
                <th className="p-2.5">New Code</th><th className="p-2.5">New Title</th><th className="p-2.5 text-right">Units</th>
                <th className="p-2.5">Year Level</th><th className="p-2.5">Semester</th><th className="p-2.5">Prerequisites</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-slate-700 divide-y">
              {gapCourses.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-slate-400 font-semibold">No gaps — every new curriculum course is covered.</td></tr>
              )}
              {gapCourses.map((g, i) => (
                <tr key={i} className="hover:bg-rose-50/20">
                  <td className="p-2.5 font-extrabold text-slate-900">{g.code}</td>
                  <td className="p-2.5 text-slate-500">{g.title}</td>
                  <td className="p-2.5 text-right font-mono font-black">{g.units}u</td>
                  <td className="p-2.5 text-slate-500">{g.yearLevel}</td>
                  <td className="p-2.5 text-slate-500">{g.semesterOffered.join(', ')}</td>
                  <td className="p-2.5 text-slate-400 text-[10px]">{g.prerequisites.length > 0 ? g.prerequisites.join(', ') : 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
