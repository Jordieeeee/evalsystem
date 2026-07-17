import SearchableSelect from './SearchableSelect';

// Student picker: thin wrapper around the shared SearchableSelect shell,
// supplying the student-specific label/filter/row rendering (name left,
// SR-Code right in muted text).
export default function StudentSearchSelect({
  students = [],
  value,
  onChange,
  placeholder = 'Select Student…',
  className = ''
}) {
  return (
    <SearchableSelect
      items={students}
      value={value}
      onChange={onChange}
      getKey={s => s.id}
      getLabel={s => `${s.lastName}, ${s.firstName} (${s.id})`}
      placeholder={placeholder}
      searchable
      searchPlaceholder="Search name or SR-Code…"
      noResultsLabel="No students found"
      showClear
      clearLabel="Clear Selection"
      filterItem={(s, q) => {
        const lastFirst = `${s.lastName || ''}, ${s.firstName || ''}`.toLowerCase();
        const firstLast = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const code = String(s.id || '').toLowerCase();
        return lastFirst.includes(q) || firstLast.includes(q) || code.includes(q);
      }}
      renderRow={s => (
        <>
          <span className="font-bold text-slate-800 truncate">{s.lastName}, {s.firstName}</span>
          <span className="text-slate-400 font-semibold shrink-0">({s.id})</span>
        </>
      )}
      className={className}
    />
  );
}
