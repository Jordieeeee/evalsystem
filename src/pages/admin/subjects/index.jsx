import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
	BookOpen,
	CheckCircle,
	Loader2,
	Plus,
	X,
	Search,
	CalendarDays,
	Trash2,
	ChevronDown,
	Pencil,
} from "lucide-react";
import { subjectService } from "../../../services/subjectService";

export default function AdminSubjectsPage() {
	const [subjects, setSubjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	// Modal states
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		id: "",
		courseTitle: "",
		creditUnits: 3,
		prerequisites: [],
		semesterOffered: [],
	});

	// Multi-select dropdown states
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [prereqSearch, setPrereqSearch] = useState("");
	const [dropdownPosition, setDropdownPosition] = useState({
		top: 0,
		left: 0,
		width: 0,
	});
	const dropdownRef = useRef(null);
	const triggerRef = useRef(null);

	useEffect(() => {
		const loadSubjects = async () => {
			try {
				const liveSubjects = await subjectService.getAllSubjects();
				setSubjects(liveSubjects);
			} catch (error) {
				console.error("Failed to fetch subjects:", error);
				setSubjects([]);
			} finally {
				setLoading(false);
			}
		};
		loadSubjects();
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSemesterToggle = (semester) => {
		setFormData((prev) => {
			const currentSemesters = prev.semesterOffered || [];
			if (currentSemesters.includes(semester)) {
				return {
					...prev,
					semesterOffered: currentSemesters.filter((s) => s !== semester),
				};
			} else {
				return { ...prev, semesterOffered: [...currentSemesters, semester] };
			}
		});
	};

	const handlePrereqToggle = (courseCode) => {
		setFormData((prev) => {
			const currentPrereqs = prev.prerequisites || [];
			if (currentPrereqs.includes(courseCode)) {
				return {
					...prev,
					prerequisites: currentPrereqs.filter((p) => p !== courseCode),
				};
			} else {
				return { ...prev, prerequisites: [...currentPrereqs, courseCode] };
			}
		});
	};

	const handleEditSubject = (subject) => {
		setFormData({
			id: subject.id,
			courseTitle: subject.courseTitle,
			creditUnits: subject.creditUnits,
			prerequisites: subject.prerequisites || [],
			semesterOffered: subject.semesterOffered || [],
		});
		setIsModalOpen(true);
	};

	const handleAddSubject = async (e) => {
		e.preventDefault();
		if (!formData.id || !formData.courseTitle)
			return alert("Course Code and Title are required.");
		if (formData.semesterOffered.length === 0)
			return alert("Please select at least one semester.");

		setIsSubmitting(true);
		try {
			// TODO: Implement circular dependency validation
			const payload = {
				id: formData.id,
				courseTitle: formData.courseTitle,
				creditUnits: Number(formData.creditUnits),
				prerequisites: formData.prerequisites,
				semesterOffered: formData.semesterOffered,
			};

			const newSubject = await subjectService.addSubject(payload);

			setSubjects((prev) => {
				const exists = prev.find((s) => s.id === newSubject.id);
				if (exists)
					return prev.map((s) => (s.id === newSubject.id ? newSubject : s));
				return [newSubject, ...prev];
			});

			setIsModalOpen(false);
			setFormData({
				id: "",
				courseTitle: "",
				creditUnits: 3,
				prerequisites: [],
				semesterOffered: [],
			});
			setPrereqSearch("");
		} catch (error) {
			console.error("Failed to add subject:", error);
			alert("Failed to save subject.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const filteredSubjects = subjects.filter(
		(sub) =>
			(sub.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			sub.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
			!(!sub.courseTitle && !sub.id) // Filter out invalid subjects
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
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h2 className="text-3xl font-extrabold tracking-tight text-[#0F2A1D]">
						Subjects
					</h2>
					<p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">
						Manage curriculum courses and prerequisites
					</p>
				</div>
				<div className="flex gap-3 w-full sm:w-auto">
					<div className="relative flex-1 sm:w-64">
						<Search
							className="absolute left-3.5 top-3 text-slate-400"
							size={15}
						/>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search subjects..."
							className="w-full border border-slate-200 bg-white pl-10 pr-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#375534]/20"
						/>
					</div>
					<button
						onClick={() => {
							setFormData({
								id: "",
								courseTitle: "",
								creditUnits: 3,
								prerequisites: [],
								semesterOffered: [],
							});
							setPrereqSearch("");
							setIsModalOpen(true);
						}}
						className="flex items-center gap-2 bg-[#0F2A1D] text-[#E3EED4] text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#375534] transition-all shadow-sm shrink-0"
					>
						<Plus size={16} /> Add Subject
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{filteredSubjects.map((item) => (
					<div
						key={item.id}
						className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-[#375534]/30 transition-colors"
					>
						<div className="space-y-3">
							<div className="flex justify-between items-start">
								<div className="inline-flex items-center justify-center p-2.5 bg-slate-50 text-slate-500 rounded-xl">
									<BookOpen size={18} className="stroke-[2.5]" />
								</div>
								<div className="flex items-center gap-2">
									<span className="px-2.5 py-1 bg-[#f4f7f4] text-[#375534] text-[10px] font-black uppercase tracking-wider rounded-lg border border-[#375534]/10">
										{item.creditUnits} Units
									</span>
									<button
										onClick={() => handleEditSubject(item)}
										className="text-slate-400 hover:text-[#375534] transition-colors p-1"
									>
										<Pencil size={16} />
									</button>
								</div>
							</div>

							<div>
								<h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
									{item.courseTitle}
								</h3>
								<p className="text-xs font-mono font-bold text-[#375534] mt-1.5 uppercase tracking-wide">
									{item.id}
								</p>
								{item.semesterOffered && (
									<div className="flex flex-wrap gap-1.5 mt-3">
										{item.semesterOffered.map((sem) => (
											<span
												key={sem}
												className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-lg border border-blue-100"
											>
												<CalendarDays size={10} /> {sem}
											</span>
										))}
									</div>
								)}
							</div>
						</div>

						<div className="mt-5 pt-5 border-t border-slate-100">
							{!item.prerequisites || item.prerequisites.length === 0 ? (
								<div className="flex items-center gap-1.5 text-emerald-700 font-black text-xs bg-emerald-50/50 border border-emerald-100/40 p-2.5 rounded-xl">
									<CheckCircle size={14} className="stroke-[2.5]" /> Open
									Sequence
								</div>
							) : (
								<div className="space-y-2">
									<p className="text-xs text-slate-600 font-semibold leading-relaxed">
										Requires:
									</p>
									<div className="flex flex-wrap gap-1.5">
										{item.prerequisites.map((codeItem) => (
											<span
												key={codeItem}
												className="font-mono text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-md"
											>
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

			{isModalOpen && (
				<div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
						<div className="bg-[#0F2A1D] text-[#E3EED4] p-5 flex justify-between items-center shrink-0">
							<h3 className="text-sm font-black uppercase tracking-wider">
								{formData.id ? "Edit Subject" : "Add New Subject"}
							</h3>
							<button
								onClick={() => {
									setIsModalOpen(false);
									setFormData({
										id: "",
										courseTitle: "",
										creditUnits: 3,
										prerequisites: [],
										semesterOffered: [],
									});
									setPrereqSearch("");
								}}
								className="text-[#AEC3B0] hover:text-white"
							>
								<X size={18} />
							</button>
						</div>
						<form
							onSubmit={handleAddSubject}
							className="p-6 space-y-4 text-xs font-bold text-slate-600 overflow-y-auto"
						>
							<div>
								<label className="block uppercase tracking-wider mb-1.5 text-slate-400">
									Course Code *
								</label>
								<input
									type="text"
									name="id"
									required
									value={formData.id}
									onChange={handleInputChange}
									className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl uppercase text-slate-800"
								/>
							</div>
							<div>
								<label className="block uppercase tracking-wider mb-1.5 text-slate-400">
									Course Title *
								</label>
								<input
									type="text"
									name="courseTitle"
									required
									value={formData.courseTitle}
									onChange={handleInputChange}
									className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-slate-800"
								/>
							</div>
							<div>
								<label className="block uppercase tracking-wider mb-1.5 text-slate-400">
									Credit Units *
								</label>
								<input
									type="number"
									name="creditUnits"
									min="1"
									max="10"
									required
									value={formData.creditUnits}
									onChange={handleInputChange}
									className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-slate-800"
								/>
							</div>
							<div ref={dropdownRef}>
								<label className="block uppercase tracking-wider mb-1.5 text-slate-400">
									Prerequisites (Optional)
								</label>
								<div className="relative">
									<div
										ref={triggerRef}
										className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl cursor-pointer min-h-[50px]"
										onClick={() => {
											if (triggerRef.current) {
												const rect = triggerRef.current.getBoundingClientRect();
												setDropdownPosition({
													top: rect.bottom + window.scrollY,
													left: rect.left + window.scrollX,
													width: rect.width,
												});
											}
											setIsDropdownOpen(!isDropdownOpen);
										}}
									>
										{formData.prerequisites.length === 0 ? (
											<span className="text-slate-400">
												Select prerequisites...
											</span>
										) : (
											<div className="flex flex-wrap gap-1">
												{formData.prerequisites.map((code) => (
													<span
														key={code}
														className="inline-flex items-center gap-1 px-2 py-1 bg-[#f4f7f4] text-[#375534] text-[10px] font-black uppercase tracking-wider rounded-md border border-[#375534]/20"
													>
														{code}
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																handlePrereqToggle(code);
															}}
															className="text-[#375534] hover:text-rose-600"
														>
															<X size={10} />
														</button>
													</span>
												))}
											</div>
										)}
										<ChevronDown
											size={16}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
										/>
									</div>
								</div>
							</div>
							{isDropdownOpen &&
								createPortal(
									<div
										ref={dropdownRef}
										style={{
											position: "absolute",
											top: dropdownPosition.top,
											left: dropdownPosition.left,
											width: dropdownPosition.width,
											zIndex: 9999,
										}}
										className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
									>
										<input
											type="text"
											value={prereqSearch}
											onChange={(e) => setPrereqSearch(e.target.value)}
											placeholder="Search subjects..."
											className="w-full p-3 border-b border-slate-200 text-xs text-slate-800 focus:outline-none"
											autoFocus
										/>
										{(() => {
											const availableSubjects = subjects.filter(
												(s) => s.id !== formData.id,
											);
											const filtered = availableSubjects.filter(
												(s) =>
													s.id
														.toLowerCase()
														.includes(prereqSearch.toLowerCase()) ||
													s.courseTitle
														.toLowerCase()
														.includes(prereqSearch.toLowerCase()),
											);

											if (availableSubjects.length === 0) {
												return (
													<div className="p-3 text-xs text-slate-400 text-center">
														No subjects available yet.
													</div>
												);
											}

											if (filtered.length === 0) {
												return (
													<div className="p-3 text-xs text-slate-400 text-center">
														No matching subjects.
													</div>
												);
											}

											return filtered.map((subject) => (
												<div
													key={subject.id}
													className={`p-3 cursor-pointer text-xs ${formData.prerequisites.includes(subject.id) ? "bg-[#f4f7f4] text-[#375534]" : "hover:bg-slate-50"}`}
													onClick={() => handlePrereqToggle(subject.id)}
												>
													{subject.id} - {subject.courseTitle}
												</div>
											));
										})()}
									</div>,
									document.body,
								)}
							<div>
								<label className="block uppercase tracking-wider mb-2 text-slate-400">
									Term Availability *
								</label>
								<div className="grid grid-cols-2 gap-2">
									{["1st Semester", "2nd Semester", "Summer Term"].map(
										(sem) => (
											<label
												key={sem}
												className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer ${formData.semesterOffered.includes(sem) ? "bg-[#f4f7f4] border-[#375534]/40 text-[#375534]" : "bg-slate-50 border-slate-200"}`}
											>
												<input
													type="checkbox"
													checked={formData.semesterOffered.includes(sem)}
													onChange={() => handleSemesterToggle(sem)}
													className="w-4 h-4 text-[#375534]"
												/>
												{sem}
											</label>
										),
									)}
								</div>
							</div>
							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full bg-[#0F2A1D] text-[#E3EED4] py-3 rounded-xl hover:bg-[#375534] transition-all flex items-center justify-center"
							>
								{isSubmitting ? (
									<Loader2 className="animate-spin" size={16} />
								) : (
									"Save Subject"
								)}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
