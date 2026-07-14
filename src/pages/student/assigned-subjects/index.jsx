import { useEffect, useState } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import { ErrorState } from '../../../components/ui/ErrorState';

export default function StudentAssignedSubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        setError(null);
        const { currentSubjects } = await studentService.getAcademicRecords(user.uid);
        setSubjects(currentSubjects.map((record) => ({
          code: record.subjectCode,
          name: record.subjectCode,
          instructor: 'Faculty Assigned',
          units: 3,
          status: record.status
        })));
      } catch (err) {
        console.error('Failed to load assigned subjects', err);
        setError('We could not load your assigned subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user, reloadKey]);

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-[#375534]" size={32} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />;
  }

  return (
    <div className="space-y-6 text-[#0F2A1D]">
      
      {/* Page Title & Description Header Layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900">Assigned Subjects</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            View and manage your academic course load for the current semester.
          </p>
        </div>

        {/* Action Controls Search & Filter Strip */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects..." 
              className="w-full bg-slate-50 border border-slate-200/70 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#375534]/30 focus:bg-white transition-all font-medium text-slate-800 placeholder-slate-400"
            />
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-slate-200/70 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      {/* Premium Content Card Table Matrix Container */}
      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                <th className="p-4 pl-6 font-semibold">Code</th>
                <th className="p-4 font-semibold">Subject Name</th>
                <th className="p-4 font-semibold">Instructor</th>
                <th className="p-4 font-semibold">Units</th>
                <th className="p-4 pr-6 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-50">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject, index) => (
                  <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-4 pl-6 font-mono font-black text-slate-400 tracking-tight">{subject.code}</td>
                    <td className="p-4 font-extrabold text-slate-900">{subject.name}</td>
                    <td className="p-4 text-slate-500 font-medium">{subject.instructor}</td>
                    <td className="p-4 text-slate-500 font-mono pl-6">{subject.units}</td>
                    <td className="p-4 pr-6 text-right">
                      <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border inline-block min-w-[80px] text-center
                        ${subject.status === 'Completed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : subject.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-blue-50/60 text-blue-700 border-blue-100/40'
                        }`}
                      >
                        {subject.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider">
                    No assigned subjects found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}