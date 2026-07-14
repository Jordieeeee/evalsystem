import { useEffect, useState, useRef } from 'react';
import { UserPlus, Search, Filter, Edit3, Trash2, X, Loader2, ChevronDown } from 'lucide-react';
import { studentService } from '../../../services/studentService';
import { ErrorState } from '../../../components/ui/ErrorState';

// Helper function to generate academic year options
// Philippine academic calendar: June-March, so if current month is before June, academic year starts previous year
const getAcademicYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11 (January is 0)

  // If current month is before June (0-5), academic year starts previous year
  // If current month is June or later (6-11), academic year starts current year
  const startYear = currentMonth < 6 ? currentYear - 1 : currentYear;

  // Generate options: 5 years back through 5 years forward (11 total options)
  const options = [];
  for (let i = -5; i <= 5; i++) {
    const year = startYear + i;
    options.push(`${year}-${year + 1}`);
  }

  return options;
};

// Get current academic year as default
const getCurrentAcademicYear = () => {
  const options = getAcademicYearOptions();
  return options[5]; // The 6th option is the current academic year (index 5 in -5 to +5 range)
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', email: '', course: 'BSIT', year: '1', school_year: getCurrentAcademicYear(), student_type: 'Regular', status: 'active' });

  // TODO: Student Type should eventually be derived from actual subject completion vs. curriculum sequence, not manually entered
  
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    program: 'all',
    year: 'all',
    status: 'all'
  });
  const filterRef = useRef(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    let active = true;
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getAllStudents();
        if (active) {
          setStudents(data);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
        if (active) {
          setError('We could not load the student directory. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadStudents();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({ id: '', name: '', email: '', course: 'BSIT', year: '1', school_year: getCurrentAcademicYear(), student_type: 'Regular', status: 'active' });
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student.id);
    setFormData({
      id: student.studentId || student.id || '',
      name: student.name || '',
      email: student.email || '',
      course: student.program || student.course || 'BSIT',
      year: student.year || '1',
      school_year: student.school_year || getCurrentAcademicYear(),
      student_type: student.student_type || 'Regular',
      status: student.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you certain you want to remove this student entry from the directory?')) {
      return;
    }

    try {
      await studentService.deleteStudentProfile(id);
      setStudents((prev) => prev.filter((student) => student.id !== id));
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('Unable to delete the selected student.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.email || !formData.school_year || !formData.student_type) {
      alert('Please complete the required student information.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        studentId: formData.id,
        id: formData.id,
        name: formData.name,
        email: formData.email,
        program: formData.course,
        course: formData.course,
        year: formData.year,
        yearSection: `${formData.year}${['1', '2', '3', '4'].includes(formData.year) ? ['st', 'nd', 'rd', 'th'][Number(formData.year) - 1] : 'th'} Year`,
        school_year: formData.school_year,
        student_type: formData.student_type,
        status: formData.status,
        createdAt: new Date().toISOString()
      };

      if (editingStudent) {
        await studentService.updateStudentProfile(editingStudent, payload);
        setStudents((prev) => prev.map((student) => (
          student.id === editingStudent
            ? { ...student, ...payload, id: editingStudent }
            : student
        )));
      } else {
        const exists = students.some((student) =>
          (student.studentId || student.id) === formData.id
        );
        if (exists) {
          alert('This Student Number is already taken.');
          return;
        }

        const created = await studentService.createStudentProfile(formData.id, payload);
        setStudents((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
      setFormData({ id: '', name: '', email: '', course: 'BSIT', year: '1', school_year: getCurrentAcademicYear(), student_type: 'Regular', status: 'active' });
    } catch (error) {
      console.error('Failed to save student:', error);
      alert('Unable to save the student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = (
      (student.name || '').toLowerCase().includes(search) ||
      (student.studentId || student.id || '').toLowerCase().includes(search) ||
      (student.program || student.course || '').toLowerCase().includes(search)
    );
    
    const matchesProgram = filters.program === 'all' || 
      (student.program || student.course || '') === filters.program;
    
    const matchesYear = filters.year === 'all' || 
      (student.year || '') === filters.year;
    
    const matchesStatus = filters.status === 'all' || 
      (student.status || 'active') === filters.status;
    
    return matchesSearch && matchesProgram && matchesYear && matchesStatus;
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const resetFilters = () => {
    setFilters({
      program: 'all',
      year: 'all',
      status: 'all'
    });
  };

  const hasActiveFilters = filters.program !== 'all' || filters.year !== 'all' || filters.status !== 'all';

  const getInitials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-[#375534]">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />;
  }

  return (
    <div className="space-y-6 text-[#0F2A1D]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F2A1D]">Students</h2>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#0F2A1D] text-[#E3EED4] text-xs font-bold uppercase tracking-wider px-5 py-3.5 rounded-2xl hover:bg-[#375534] transition-all shadow-sm active:scale-[0.98]"
        >
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name or ID..."
            className="w-full bg-slate-50 border border-slate-200 text-sm pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center justify-center gap-2 border text-slate-700 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-2xl transition-all
              ${hasActiveFilters ? 'bg-[#0F2A1D] text-[#E3EED4] border-[#0F2A1D]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
          >
            <Filter size={16} /> Filter {hasActiveFilters && `(${Object.values(filters).filter(f => f !== 'all').length})`}
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-64 z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Filters</h4>
                <button 
                  onClick={resetFilters}
                  className="text-[10px] font-bold text-[#375534] hover:text-[#0F2A1D] uppercase tracking-wider"
                >
                  Reset
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Program</label>
                  <select
                    value={filters.program}
                    onChange={(e) => handleFilterChange('program', e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-xs font-bold text-slate-800"
                  >
                    <option value="all">All Programs</option>
                    <option value="BSIT">BSIT</option>
                    <option value="BSCS">BSCS</option>
                    <option value="BSBA">BSBA</option>
                    <option value="BSN">BSN</option>
                    <option value="BSED">BSED</option>
                    <option value="BSA">BSA</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Year Level</label>
                  <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-xs font-bold text-slate-800"
                  >
                    <option value="all">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-xs font-bold text-slate-800"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/70 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Student</th>
                <th className="p-4">Student No.</th>
                <th className="p-4">Program</th>
                <th className="p-4">Year Level</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#375534]/10 text-[#375534] font-black text-[11px] flex items-center justify-center uppercase shrink-0">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 transition-colors">{student.name || 'Unnamed Student'}</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{student.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-500 tracking-tight">{student.studentId || student.id}</td>
                    <td className="p-4 text-slate-900 font-extrabold">{student.program || student.course || '—'}</td>
                    <td className="p-4 text-slate-600 font-extrabold pl-6">{student.year || '—'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {student.status || 'active'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-2 text-slate-500 hover:text-[#0F2A1D] hover:bg-slate-100 rounded-xl transition-all"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider">
                    No records found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F2A1D]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0F2A1D] text-[#E3EED4] p-5 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-wider">
                {editingStudent ? 'Edit Student Configuration' : 'Register New Student Profile'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#AEC3B0] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-600">
              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-slate-400">Student Number</label>
                <input
                  type="text"
                  name="id"
                  required
                  disabled={!!editingStudent}
                  value={formData.id}
                  onChange={handleInputChange}
                  placeholder="e.g., TLSU-2026-0001"
                  className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-slate-800 disabled:opacity-50 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-slate-400">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Maria Santos"
                  className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-slate-400">Institutional Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g., m.santos@tlsu.edu.ph"
                  className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-slate-400">Program</label>
                  <select
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-slate-800"
                  >
                    <option value="BSIT">BSIT</option>
                    <option value="BSCS">BSCS</option>
                    <option value="BSBA">BSBA</option>
                    <option value="BSN">BSN</option>
                    <option value="BSED">BSED</option>
                    <option value="BSA">BSA</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-slate-400">Year Level</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-slate-800"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-slate-400">School Year</label>
                  <div className="relative">
                    <select
                      name="school_year"
                      value={formData.school_year}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-slate-800 appearance-none pr-10"
                    >
                      {getAcademicYearOptions().map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1.5 text-slate-400">Student Type</label>
                  <div className="relative">
                    <select
                      name="student_type"
                      value={formData.student_type}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-slate-800 appearance-none pr-10"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Irregular">Irregular</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5 text-slate-400">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all text-slate-800"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0F2A1D] text-[#E3EED4] px-5 py-2.5 rounded-xl hover:bg-[#375534] transition-all disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editingStudent ? 'Save Changes' : 'Register Entry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}