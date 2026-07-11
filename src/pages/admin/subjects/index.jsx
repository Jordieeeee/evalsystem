import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { subjectService } from '../../../services/subjectService';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery] = useState('');

  // 1. Fetch live data on component mount
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const liveSubjects = await subjectService.getAllSubjects();
        setSubjects(liveSubjects);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, []);

  const filteredSubjects = subjects.filter(sub => 
    sub.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-[#375534]">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#0F2A1D]">
      {/* ... Keep your existing header and search bar ... */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSubjects.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-[#375534]/30 transition-colors">
            
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="inline-flex items-center justify-center p-2.5 bg-slate-50 text-slate-500 rounded-xl">
                  <BookOpen size={18} className="stroke-[2.5]" />
                </div>
                <span className="px-2.5 py-1 bg-[#f4f7f4] text-[#375534] text-[10px] font-black uppercase tracking-wider rounded-lg border border-[#375534]/10">
                  {item.creditUnits} Units
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{item.courseTitle}</h3>
                <p className="text-xs font-mono font-bold text-[#375534] mt-1.5 uppercase tracking-wide">
                  {item.id}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              {(!item.prerequisites || item.prerequisites.length === 0) ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-black text-xs bg-emerald-50/50 border border-emerald-100/40 p-2.5 rounded-xl">
                  <CheckCircle size={14} className="stroke-[2.5]" /> Open Sequence — No prerequisites
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    Requires prior completion of:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.prerequisites.map((codeItem) => (
                      <span key={codeItem} className="font-mono text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-md">
                        {codeItem}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}