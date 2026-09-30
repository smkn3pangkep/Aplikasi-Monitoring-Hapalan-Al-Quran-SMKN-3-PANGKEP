import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Search,
  Filter,
  Users,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  FileCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { Teacher, Student } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  addStudent,
  deleteStudent,
  updateStudent,
  downloadExcelTemplate,
  processExcelUpload,
  clearAllDummyData,
} from '../services/dataService';

interface DataBimbinganViewProps {
  teachers: Teacher[];
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

export const DataBimbinganView: React.FC<DataBimbinganViewProps> = ({
  teachers,
  students,
  onSelectStudent,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = user?.role === 'superadmin';

  // Filters
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>(
    isSuperAdmin ? 'all' : user?.nip || ''
  );
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Purge modal state
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  // Add form fields
  const [formName, setFormName] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formTeacherNip, setFormTeacherNip] = useState(
    isSuperAdmin ? (teachers[0]?.nip || '') : (user?.nip || '')
  );
  const [formParentPhone, setFormParentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Excel import status
  const [importStatus, setImportStatus] = useState<{
    loading: boolean;
    success?: string;
    errors?: string[];
  }>({ loading: false });

  // Data segregation:
  // If Guru Wali, strict filter to their own NIP.
  const baseStudents = isSuperAdmin
    ? students
    : students.filter((s) => s.teacherNip === user?.nip);

  // Applied filter
  const displayedStudents = baseStudents.filter((s) => {
    const matchTeacher =
      selectedTeacherFilter === 'all' || s.teacherNip === selectedTeacherFilter;
    const matchClass =
      selectedClassFilter === 'all' || s.className === selectedClassFilter;
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTeacher && matchClass && matchSearch;
  });

  // Unique classes for filter
  const classList = Array.from(new Set(baseStudents.map((s) => s.className).filter(Boolean)));

  const handleOpenAdd = () => {
    setFormName('');
    setFormNisn('');
    setFormClass('');
    setFormTeacherNip(isSuperAdmin ? (teachers[0]?.nip || '') : (user?.nip || ''));
    setFormParentPhone('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormNisn(student.nisn);
    setFormClass(student.className);
    setFormTeacherNip(student.teacherNip);
    setFormParentPhone(student.parentPhone || '');
    setFormError(null);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formNisn.trim() || !formClass.trim()) {
      setFormError('Nama, NISN, dan Kelas wajib diisi.');
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
        setSuccessToast(`Data siswa "${formName.trim()}" berhasil diperbarui dan disimpan ke Firebase!`);
        setTimeout(() => setSuccessToast(null), 3500);
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
        setSuccessToast(`Siswa "${formName.trim()}" berhasil ditambahkan dan disimpan ke Firebase!`);
        setTimeout(() => setSuccessToast(null), 3500);
      }
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
      setSuccessToast(`Data siswa "${studentToDelete.name}" berhasil dihapus dari Firebase.`);
      setStudentToDelete(null);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus data siswa.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePurgeAllDummyData = async () => {
    setIsPurging(true);
    try {
      const res = await clearAllDummyData();
      setSuccessToast(`Berhasil membersihkan data dummy (${res.deletedTeachers} data guru dan ${res.deletedStudents} data siswa). Database kini kosong.`);
      setShowPurgeModal(false);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setDeleteError('Gagal membersihkan data: ' + (err.message || String(err)));
    } finally {
      setIsPurging(false);
    }
  };

  // Process Excel File
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ loading: true });
    try {
      const actorInfo = {
        name: user?.name || 'Admin',
        nip: user?.nip || 'superadmin',
        role: user?.role || 'superadmin',
      };
      const result = await processExcelUpload(file, actorInfo);
      setImportStatus({
        loading: false,
        success: `Berhasil menambahkan ${result.added} siswa dari file ${file.name}.`,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportStatus({
        loading: false,
        errors: [err.message || 'Gagal memproses file Excel'],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action cards & summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            Data Bimbingan Guru Wali
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Daftar Siswa Bimbingan Tahfidz
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Kelola data seluruh siswa dan pemetaan Guru Wali di SMKN 3 Pangkep.'
              : `Menampilkan khusus daftar anak bimbingan ${user?.name} (NIP: ${user?.nip}).`}
          </p>
        </div>

        {/* Action Buttons: Template, Import, Add */}
        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (students.length > 0 || teachers.length > 0) && (
            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Bersihkan Seluruh Data Dummy Guru & Siswa di Firebase"
            >
              <Trash2 className="w-4 h-4" />
              <span>Bersihkan Data Dummy</span>
            </button>
          )}

          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Download Template Excel untuk Pengisian Siswa"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh Template Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setImportStatus({ loading: false });
              setShowImportModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import Data Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa Manual</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Guru Wali Filter (Available for Super Admin) */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Guru Wali:</span>
              <select
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option value="all">Semua Guru ({teachers.length})</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.nip}>
                    {t.name} (NIP: {t.nip})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Kelas:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              <option value="all">Semua Kelas</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Siswa, NISN, atau Kelas..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pl-9 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Main Table: Data Bimbingan Guru Wali dan Siswa */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-4">NISN</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Guru Wali</th>
                <th className="py-3.5 px-4">NIP Guru</th>
                <th className="py-3.5 px-4 text-center">Capaian Juz 30</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada data siswa bimbingan yang ditemukan.
                  </td>
                </tr>
              ) : (
                displayedStudents.map((s, idx) => {
                  const pct = Math.round((s.totalMemorized / 37) * 100);
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 transition group cursor-pointer"
                    >
                      <td
                        onClick={() => onSelectStudent(s)}
                        className="py-3.5 px-4 text-center font-bold text-slate-400"
                      >
                        {idx + 1}
                      </td>
                      <td onClick={() => onSelectStudent(s)} className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition block">
                          {s.name}
                        </span>
                        {s.parentPhone && (
                          <span className="text-[11px] text-slate-400">
                            WA Wali: {s.parentPhone}
                          </span>
                        )}
                      </td>
                      <td
                        onClick={() => onSelectStudent(s)}
                        className="py-3.5 px-4 font-mono font-medium text-slate-600"
                      >
                        {s.nisn}
                      </td>
                      <td onClick={() => onSelectStudent(s)} className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                          {s.className}
                        </span>
                      </td>
                      <td onClick={() => onSelectStudent(s)} className="py-3.5 px-4 font-medium text-slate-800">
                        {s.teacherName}
                      </td>
                      <td
                        onClick={() => onSelectStudent(s)}
                        className="py-3.5 px-4 font-mono text-slate-500 text-[11px]"
                      >
                        {s.teacherNip}
                      </td>
                      <td onClick={() => onSelectStudent(s)} className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-emerald-700">
                            {s.totalMemorized} / 37 Surah
                          </span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudent(s);
                            }}
                            className="p-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
                            title="Buka Kartu & 37 Surah Hafalan Siswa"
                          >
                            Buka Hafalan
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(s);
                            }}
                            className="p-1.5 px-2 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-700 transition flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                            title="Edit Data Siswa (Nama, NIS/NISN, Kelas)"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentToDelete(s);
                            }}
                            className="p-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                            title="Hapus Siswa Bimbingan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hapus</span>
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

        {/* Table footer with count */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>
            Total menampilkan <strong>{displayedStudents.length}</strong> siswa bimbingan
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">
            Format sesuai template Excel SMKN 3 Pangkep
          </span>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Siswa Manual */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Bimbingan Manual'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Input data siswa beserta Guru Wali pembimbing
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
                {isSuperAdmin ? (
                  <select
                    value={formTeacherNip}
                    onChange={(e) => setFormTeacherNip(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    {teachers.map((t) => (
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                  Import Data Bimbingan dari Excel (.xlsx)
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Format kolom: Nama Guru, NIP, Nama Siswa, NISN, Kelas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Download className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-emerald-900">
                      Gunakan Template Resmi
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Pastikan judul kolom sesuai agar pembacaan otomatis tidak terjadi kendala.
                    </p>
                    <button
                      type="button"
                      onClick={downloadExcelTemplate}
                      className="mt-2 text-xs font-bold text-emerald-800 underline hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Klik di sini untuk unduh Template Excel (.xlsx)
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-500 transition bg-slate-50/60">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excelFileInput"
                />
                <label
                  htmlFor="excelFileInput"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    Klik untuk pilih file Excel (.xlsx / .xls)
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Mendukung berkas bimbingan SMKN 3 Pangkep
                  </span>
                </label>
              </div>

              {/* Loading & Status feedback */}
              {importStatus.loading && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Memproses dan menyimpan data ke Firebase...</span>
                </div>
              )}

              {importStatus.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{importStatus.success}</span>
                </div>
              )}

              {importStatus.errors && importStatus.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Peringatan / Catatan Baris:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5">
                    {importStatus.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
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
      {/* MODAL: Bersihkan Seluruh Data Dummy */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-rose-950 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  Bersihkan Seluruh Data Dummy
                </h3>
                <p className="text-xs text-rose-300 mt-0.5">
                  Reset database guru & siswa menjadi kosong
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="p-1 text-rose-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-900">
                <p className="font-bold">
                  Peringatan: Tindakan ini akan menghapus permanen:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                  <li>Seluruh data Guru Wali ({teachers.length} guru)</li>
                  <li>Seluruh data Siswa Bimbingan ({students.length} siswa)</li>
                  <li>Seluruh catatan riwayat hafalan Juz 30</li>
                  <li>Akun Super Admin tetap aman dan tidak terhapus</li>
                </ul>
                <p className="text-[11px] text-slate-500 pt-1">
                  Fitur ini berguna untuk menghapus data dummy sehingga database menjadi bersih dan siap untuk mengimpor atau menginput data riil SMKN 3 Pangkep.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPurgeModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPurging}
                  onClick={handlePurgeAllDummyData}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-900/30 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isPurging ? 'Membersihkan...' : 'Ya, Bersihkan Semua Data'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
