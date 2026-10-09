import React, { useState } from 'react';
import {
  LayoutGrid,
  List,
  Search,
  BookOpen,
  CheckCircle,
  Clock,
  CircleAlert,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Phone,
  User,
  Plus,
  Edit2,
  Trash2,
  X,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { Student, Teacher } from '../types';
import { useAuth } from '../context/AuthContext';
import { TOTAL_TARGET_SURAHS } from '../data/juz30Data';
import { addStudent, updateStudent, deleteStudent } from '../services/dataService';

interface DaftarSiswaViewProps {
  students: Student[];
  teachers: Teacher[];
  onSelectStudent: (student: Student) => void;
}

export const DaftarSiswaView: React.FC<DaftarSiswaViewProps> = ({
  students,
  teachers,
  onSelectStudent,
}) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [progressFilter, setProgressFilter] = useState<'all' | 'khatam' | 'proses' | 'awal'>('all');

  // Modals for Add & Edit
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'superadmin';
  const canManageAll = user?.role === 'superadmin' || user?.role === 'admin_staf';

  // Only actual Guru Wali who have student bimbingan
  const guruWaliList = teachers.filter(
    (t) =>
      t.role !== 'pegawai_tu' &&
      !t.classes?.includes('Tata Usaha') &&
      t.nip !== '197412162025212005' &&
      t.nip !== '197508282025212006' &&
      t.nip !== '198605012025212025' &&
      t.nip !== '198009042008011007'
  );

  // Form states
  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formTeacherNip, setFormTeacherNip] = useState(
    canManageAll ? (guruWaliList[0]?.nip || '') : (user?.nip || '')
  );
  const [formParentPhone, setFormParentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Guru segregation: only their students
  const baseStudents = canManageAll
    ? students
    : students.filter((s) => s.teacherNip === user?.nip);

  // Filter students
  const filteredStudents = baseStudents.filter((s) => {
    const matchClass = selectedClass === 'all' || s.className === selectedClass;
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase());

    let matchProgress = true;
    if (progressFilter === 'khatam') matchProgress = s.totalMemorized >= TOTAL_TARGET_SURAHS;
    else if (progressFilter === 'proses') matchProgress = s.totalMemorized > 0 && s.totalMemorized < TOTAL_TARGET_SURAHS;
    else if (progressFilter === 'awal') matchProgress = s.totalMemorized === 0;

    return matchClass && matchSearch && matchProgress;
  });

  const classList = Array.from(new Set(baseStudents.map((s) => s.className).filter(Boolean)));

  const handleOpenAdd = () => {
    setFormName('');
    setFormNisn('');
    setFormClass('');
    setFormTeacherNip(canManageAll ? (guruWaliList[0]?.nip || '') : (user?.nip || ''));
    setFormParentPhone('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormName(s.name);
    setFormNisn(s.nisn);
    setFormClass(s.className);
    setFormTeacherNip(s.teacherNip);
    setFormParentPhone(s.parentPhone || '');
    setFormError(null);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formNisn.trim() || !formClass.trim()) {
      setFormError('Nama Siswa, NIS/NISN, dan Kelas wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTeacher = teachers.find((t) => t.nip === formTeacherNip);
      const teacherName = selectedTeacher ? selectedTeacher.name : user?.name || 'Guru Wali';

      if (editingStudent) {
        await updateStudent(
          editingStudent.id,
          {
            name: formName.trim(),
            nisn: formNisn.trim(),
            className: formClass.trim(),
            teacherNip: formTeacherNip,
            teacherName,
            parentPhone: formParentPhone.trim(),
          },
          {
            name: user?.name || 'Guru Wali',
            nip: user?.nip || '198205142008011005',
          }
        );
        setEditingStudent(null);
        setToastMessage(`Data siswa "${formName.trim()}" berhasil diperbarui dan disimpan ke Firebase!`);
      } else {
        await addStudent({
          name: formName.trim(),
          nisn: formNisn.trim(),
          className: formClass.trim(),
          teacherNip: formTeacherNip,
          teacherName,
          parentPhone: formParentPhone.trim(),
        });
        setShowAddModal(false);
        setToastMessage(`Siswa baru "${formName.trim()}" berhasil ditambahkan dan disimpan ke Firebase!`);
      }
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteStudent(studentToDelete.id, {
        name: user?.name || 'Guru Wali',
        nip: user?.nip || '198205142008011005',
        studentName: studentToDelete.name,
      });
      setToastMessage(`Data siswa "${studentToDelete.name}" berhasil dihapus dari Firebase.`);
      setStudentToDelete(null);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus siswa');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-3.5 h-3.5" />
            Kartu Tahfidz & Detail Hafalan Siswa
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Daftar Kartu Hafalan Juz 30 Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {canManageAll
              ? 'Memantau seluruh siswa SMKN 3 Pangkep. Anda dapat menambah, mengedit, atau menghapus data siswa.'
              : `Menampilkan daftar anak bimbingan ${user?.name}. Anda dapat menambah, mengedit (nama, NIS, kelas), atau menghapus data siswa.`}
          </p>
        </div>

        {/* Buttons: Add Student & View Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa Baru</span>
          </button>

          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'card'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Kartu Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Daftar Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Class filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          >
            <option value="all">Semua Kelas ({classList.length})</option>
            {classList.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Progress filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setProgressFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                progressFilter === 'all' ? 'bg-white font-bold text-slate-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setProgressFilter('khatam')}
              className={`px-2.5 py-1 rounded-lg transition ${
                progressFilter === 'khatam' ? 'bg-emerald-600 font-bold text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Khatam {TOTAL_TARGET_SURAHS}
            </button>
            <button
              type="button"
              onClick={() => setProgressFilter('proses')}
              className={`px-2.5 py-1 rounded-lg transition ${
                progressFilter === 'proses' ? 'bg-amber-500 font-bold text-slate-950 shadow-xs' : 'text-slate-600'
              }`}
            >
              Berproses
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Siswa atau NIS/NISN..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-9 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Main Content: Card Grid View or Table View */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">Tidak ada siswa yang sesuai kriteria.</p>
              <p className="text-xs text-slate-400 mt-1">
                Klik tombol "Tambah Siswa Baru" untuk menambahkan siswa bimbingan.
              </p>
            </div>
          ) : (
            filteredStudents.map((s) => {
              const pct = Math.round((s.totalMemorized / TOTAL_TARGET_SURAHS) * 100);
              const isKhatam = s.totalMemorized >= TOTAL_TARGET_SURAHS;

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectStudent(s)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 p-5 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top card accent line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isKhatam ? 'bg-gradient-to-r from-amber-400 to-emerald-500' : 'bg-emerald-500'
                    }`}
                  />

                  <div>
                    {/* Header info & Quick Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                          {s.className}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition">
                          {s.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">NIS/NISN: {s.nisn}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {/* Khatam badge or status */}
                        {isKhatam ? (
                          <span className="p-1.5 px-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            Khatam 30
                          </span>
                        ) : (
                          <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                            {pct}%
                          </span>
                        )}

                        {/* Quick action buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(s);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition"
                            title="Edit Data Siswa (Nama, NIS, Kelas)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentToDelete(s);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                            title="Hapus Siswa Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Guru Wali name */}
                    <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Wali: <strong className="text-slate-700">{s.teacherName}</strong></span>
                    </div>

                    {/* Progress Bar & Breakdown */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">Progres Target Hafalan</span>
                        <span className="text-emerald-700">{s.totalMemorized} dari {TOTAL_TARGET_SURAHS} Surah</span>
                      </div>

                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          style={{ width: `${(s.totalMemorized / TOTAL_TARGET_SURAHS) * 100}%` }}
                          className="bg-emerald-500 transition-all duration-300"
                        />
                        <div
                          style={{ width: `${(s.totalInProcess / TOTAL_TARGET_SURAHS) * 100}%` }}
                          className="bg-amber-400 transition-all duration-300"
                        />
                      </div>

                      {/* Breakdown badges */}
                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          {s.totalMemorized} Hafal
                        </span>
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {s.totalInProcess} Proses
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <CircleAlert className="w-3 h-3" />
                          {s.totalRemaining} Belum
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card bottom action */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                    <span>Buka {TOTAL_TARGET_SURAHS} Surah (Al-Fatihah & Juz 30)</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">NIS / NISN</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Guru Wali</th>
                  <th className="py-3 px-4 text-center">Sudah Hapal</th>
                  <th className="py-3 px-4 text-center">Proses</th>
                  <th className="py-3 px-4 text-center">Belum</th>
                  <th className="py-3 px-4 text-center">Persentase</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                      Tidak ada siswa yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const pct = Math.round((s.totalMemorized / TOTAL_TARGET_SURAHS) * 100);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => onSelectStudent(s)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">
                          {s.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{s.nisn}</td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                            {s.className}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{s.teacherName}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                          {s.totalMemorized}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-600">
                          {s.totalInProcess}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {s.totalRemaining}
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                          {pct}%
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectStudent(s);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs"
                            >
                              Buka Hafalan
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(s);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg text-xs"
                              title="Edit Data Siswa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStudentToDelete(s);
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs cursor-pointer"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Siswa Manual */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Bimbingan Baru'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Input data siswa dan simpan ke Cloud Firebase
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Siswa Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Muhammad Fauzan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NIS / NISN
                  </label>
                  <input
                    type="text"
                    required
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    placeholder="Contoh: 0071234567 atau 12345"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Nomor Induk Siswa / NISN</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    required
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    placeholder="Contoh: X DPIB 1 / X TITL 1 / X TJKT 1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Kelompok / Rombel</span>
                </div>
              </div>

              {/* Guru Wali Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Guru Wali Pembimbing
                </label>
                {canManageAll ? (
                  <select
                    value={formTeacherNip}
                    onChange={(e) => setFormTeacherNip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    {guruWaliList.map((t) => (
                      <option key={t.id} value={t.nip}>
                        {t.name} (NIP: {t.nip})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-slate-100 rounded-xl text-xs text-slate-700 font-semibold border border-slate-200">
                    {user?.name} (NIP: {user?.nip})
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  No. WhatsApp Wali Murid (Opsional)
                </label>
                <input
                  type="text"
                  value={formParentPhone}
                  onChange={(e) => setFormParentPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Siswa (In-App Dialog, Tanpa window.confirm) */}
      {studentToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-rose-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-300" />
                  Konfirmasi Hapus Siswa
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="p-1 text-rose-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <p className="text-xs font-semibold text-rose-900 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data bimbingan siswa berikut dari Firebase?
                </p>
                <div className="mt-2.5 bg-white p-3 rounded-xl border border-rose-200 text-xs space-y-1">
                  <div><strong>Nama:</strong> {studentToDelete.name}</div>
                  <div><strong>NIS / NISN:</strong> {studentToDelete.nisn}</div>
                  <div><strong>Kelas:</strong> {studentToDelete.className}</div>
                  <div><strong>Guru Wali:</strong> {studentToDelete.teacherName}</div>
                </div>
                <p className="text-[11px] text-rose-700 mt-2">
                  * Seluruh catatan hafalan 37 surah Juz 30 siswa ini juga akan dihapus permanen.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-700/20 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Siswa'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
