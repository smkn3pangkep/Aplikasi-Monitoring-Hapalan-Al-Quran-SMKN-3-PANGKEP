import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  Plus,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Image,
  Video,
  FileCheck,
  Folder,
  CheckCircle2,
  AlertCircle,
  X,
  Share2,
  School,
  User,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Teacher, Student, DocumentationRecord, MediaCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  addDocumentation,
  updateDocumentation,
  deleteDocumentation,
} from '../services/dataService';
import {
  exportDocumentationsToExcel,
  exportDocumentationsToPDF,
  formatMediaTypeLabel,
} from '../utils/documentationExport';

interface DokumentasiHafalanViewProps {
  teachers: Teacher[];
  students: Student[];
  documentations: DocumentationRecord[];
}

export const DokumentasiHafalanView: React.FC<DokumentasiHafalanViewProps> = ({
  teachers,
  students,
  documentations,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const canManageAll = user?.role === 'superadmin' || user?.role === 'admin_staf';

  // Filters
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>(
    canManageAll ? 'all' : user?.nip || 'all'
  );
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedMediaTypeFilter, setSelectedMediaTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentationRecord | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentationRecord | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTeacherNip, setFormTeacherNip] = useState(user?.nip || '');
  const [formClassName, setFormClassName] = useState(user?.classes?.split(',')[0]?.trim() || '');
  const [formStudentId, setFormStudentId] = useState('');
  const [formMediaType, setFormMediaType] = useState<MediaCategory>('foto');
  const [formDriveUrl, setFormDriveUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unique Classes list for filters
  const uniqueClasses = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.className).filter(Boolean)));
    return list.sort();
  }, [students]);

  // Filtered Documentations
  const filteredDocs = useMemo(() => {
    return documentations.filter((doc) => {
      // Filter Teacher
      if (selectedTeacherFilter !== 'all' && doc.teacherNip !== selectedTeacherFilter) {
        return false;
      }
      // Filter Class
      if (selectedClassFilter !== 'all' && doc.className !== selectedClassFilter) {
        return false;
      }
      // Filter Media Type
      if (selectedMediaTypeFilter !== 'all' && doc.mediaType !== selectedMediaTypeFilter) {
        return false;
      }
      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title?.toLowerCase().includes(q);
        const matchTeacher = doc.teacherName?.toLowerCase().includes(q);
        const matchClass = doc.className?.toLowerCase().includes(q);
        const matchStudent = doc.studentName?.toLowerCase().includes(q);
        const matchDesc = doc.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchTeacher && !matchClass && !matchStudent && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [documentations, selectedTeacherFilter, selectedClassFilter, selectedMediaTypeFilter, searchQuery]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingDoc(null);
    setFormTitle('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTeacherNip(user?.role === 'guru_wali' ? (user?.nip || '') : (teachers[0]?.nip || ''));
    setFormClassName(user?.classes?.split(',')[0]?.trim() || uniqueClasses[0] || 'X TKJ 1');
    setFormStudentId('');
    setFormMediaType('foto');
    setFormDriveUrl('');
    setFormDescription('');
    setFormError(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (doc: DocumentationRecord) => {
    setEditingDoc(doc);
    setFormTitle(doc.title);
    setFormDate(doc.date || new Date().toISOString().slice(0, 10));
    setFormTeacherNip(doc.teacherNip);
    setFormClassName(doc.className);
    setFormStudentId(doc.studentId || '');
    setFormMediaType(doc.mediaType);
    setFormDriveUrl(doc.driveUrl);
    setFormDescription(doc.description || '');
    setFormError(null);
    setShowAddModal(true);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('Judul kegiatan wajib diisi.');
      return;
    }
    if (!formDriveUrl.trim()) {
      setFormError('Link Google Drive wajib diisi.');
      return;
    }

    // Validate Drive link format
    const urlPattern = /^https?:\/\//i;
    if (!urlPattern.test(formDriveUrl.trim())) {
      setFormError('Link Google Drive harus diawali dengan http:// atau https://');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTeacher = teachers.find((t) => t.nip === formTeacherNip);
      const teacherName =
        user?.role === 'guru_wali' && user?.nip === formTeacherNip
          ? user.name
          : selectedTeacher?.name || user?.name || 'Guru Wali';

      const payload: any = {
        title: formTitle.trim(),
        date: formDate,
        teacherNip: formTeacherNip,
        teacherName,
        className: formClassName,
        driveUrl: formDriveUrl.trim(),
        mediaType: formMediaType,
      };

      if (formStudentId) {
        payload.studentId = formStudentId;
        const selectedStudent = students.find((s) => s.id === formStudentId);
        if (selectedStudent?.name) {
          payload.studentName = selectedStudent.name;
        }
      }

      if (formDescription.trim()) {
        payload.description = formDescription.trim();
      }

      const actor = {
        nip: user?.nip || 'admin',
        name: user?.name || 'Pengguna',
        role: user?.role || 'guru_wali',
      };

      if (editingDoc) {
        await updateDocumentation(editingDoc.id, payload, actor);
        setToastMessage(`Dokumentasi "${formTitle}" berhasil diperbarui.`);
      } else {
        await addDocumentation(payload, actor);
        setToastMessage(`Bukti monitoring "${formTitle}" berhasil disimpan ke sistem.`);
      }

      setShowAddModal(false);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan dokumentasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocumentation(docToDelete.id, docToDelete.title, {
        nip: user?.nip || 'admin',
        name: user?.name || 'Pengguna',
        role: user?.role || 'guru_wali',
      });
      setToastMessage(`Dokumentasi "${docToDelete.title}" berhasil dihapus.`);
      setDocToDelete(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert('Gagal menghapus dokumentasi: ' + err?.message);
    }
  };

  // Media icon helper
  const renderMediaIcon = (type: MediaCategory) => {
    switch (type) {
      case 'foto':
        return <Image className="w-4 h-4 text-emerald-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'folder_drive':
        return <Folder className="w-4 h-4 text-amber-600" />;
      case 'dokumen':
        return <FileCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <FolderOpen className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getMediaBadgeColor = (type: MediaCategory) => {
    switch (type) {
      case 'foto':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'video':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'folder_drive':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'dokumen':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <FolderOpen className="w-3.5 h-3.5" />
            Bukti Fisik & Digital Monitoring Tahfidz SMKN 3 PANGKEP
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dokumentasi Hafalan Siswa
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
            Wadah bagi Guru Wali untuk menyematkan link Google Drive berupa <strong>foto kegiatan, rekaman video setoran, maupun folder arsip</strong> bimbingan siswa. Setiap pengunggahan link langsung tercatat pada riwayat aktivitas sistem.
          </p>

          {/* Action Toolbar */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-900/40 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Masukkan Link Google Drive</span>
            </button>

            {/* Admin Export Buttons */}
            <button
              type="button"
              onClick={() =>
                exportDocumentationsToExcel(filteredDocs, {
                  teacherFilterName:
                    selectedTeacherFilter === 'all'
                      ? 'Semua Guru'
                      : teachers.find((t) => t.nip === selectedTeacherFilter)?.name || selectedTeacherFilter,
                  classFilterName: selectedClassFilter,
                  mediaTypeFilterName: selectedMediaTypeFilter,
                })
              }
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
              title="Unduh rekapitulasi link dokumentasi dalam format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Rekap Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                exportDocumentationsToPDF(filteredDocs, {
                  teacherFilterName:
                    selectedTeacherFilter === 'all'
                      ? 'Semua Guru'
                      : teachers.find((t) => t.nip === selectedTeacherFilter)?.name || selectedTeacherFilter,
                  classFilterName: selectedClassFilter,
                  mediaTypeFilterName: selectedMediaTypeFilter,
                })
              }
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
              title="Cetak & Unduh dokumen resmi PDF ber-kop SMKN 3 Pangkep"
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Rekap PDF Resmi (.pdf)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Teacher Filter */}
          {canManageAll && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">Semua Guru Wali ({teachers.length})</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.nip}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <School className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">Semua Kelas</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Media Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMediaTypeFilter}
              onChange={(e) => setSelectedMediaTypeFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">Semua Jenis Media</option>
              <option value="foto">Foto Bukti</option>
              <option value="video">Video Bukti</option>
              <option value="folder_drive">Folder Drive</option>
              <option value="dokumen">Dokumen / PDF</option>
            </select>
          </div>
        </div>

        {/* Search & View Mode */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Cari judul, guru, siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'card'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kartu
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Card View or Table View */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Belum Ada Dokumentasi</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            {searchQuery || selectedClassFilter !== 'all' || selectedTeacherFilter !== 'all'
              ? 'Tidak ditemukan dokumentasi yang cocok dengan filter pencarian.'
              : 'Guru Wali belum mengunggah link Google Drive bukti monitoring hafalan. Klik tombol di bawah untuk menambahkan bukti pertama.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Masukkan Link Bukti Google Drive</span>
          </button>
        </div>
      ) : viewMode === 'card' ? (
        /* CARD GALLERY VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const isOwner = user?.nip === doc.teacherNip || canManageAll;
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getMediaBadgeColor(
                        doc.mediaType
                      )}`}
                    >
                      {renderMediaIcon(doc.mediaType)}
                      <span>{formatMediaTypeLabel(doc.mediaType)}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{doc.date || '-'}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition">
                    {doc.title}
                  </h3>

                  {/* Teacher & Class Meta */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Guru Wali:</span>
                      <strong className="text-slate-800 truncate max-w-[170px]">
                        {doc.teacherName}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Kelas:</span>
                      <span className="font-bold text-emerald-700">{doc.className}</span>
                    </div>
                    {doc.studentName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Siswa Khusus:</span>
                        <span className="font-semibold text-slate-700">{doc.studentName}</span>
                      </div>
                    )}
                  </div>

                  {/* Description note if any */}
                  {doc.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      "{doc.description}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions: Open Link & Edit/Delete */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={doc.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-800/20 cursor-pointer"
                    title="Buka file atau folder bukti di Google Drive"
                  >
                    <span>Buka Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {isOwner && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(doc)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition cursor-pointer"
                        title="Edit data dokumentasi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
                        title="Hapus dokumentasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE RECAP VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Guru Wali</th>
                  <th className="py-3 px-4">Kelas / Siswa</th>
                  <th className="py-3 px-4">Judul Kegiatan</th>
                  <th className="py-3 px-4 text-center">Jenis</th>
                  <th className="py-3 px-4">Link Google Drive</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc, idx) => {
                  const isOwner = user?.nip === doc.teacherNip || canManageAll;
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                        {doc.date || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{doc.teacherName}</div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          NIP: {doc.teacherNip}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {doc.className}
                        </span>
                        {doc.studentName && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {doc.studentName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{doc.title}</span>
                        {doc.description && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {doc.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getMediaBadgeColor(
                            doc.mediaType
                          )}`}
                        >
                          {formatMediaTypeLabel(doc.mediaType)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={doc.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 font-medium underline flex items-center gap-1 truncate max-w-[220px]"
                        >
                          <span className="truncate">{doc.driveUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={doc.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                            title="Buka Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {isOwner && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(doc)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDocToDelete(doc)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: INPUT / EDIT DOKUMENTASI GOOGLE DRIVE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingDoc ? 'Edit Link Dokumentasi' : 'Masukkan Link Google Drive'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs text-slate-700">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Judul Kegiatan */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Judul Kegiatan / Bimbingan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bimbingan Tahfidz Surah An-Naba X TKJ 1"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Tanggal Pelaksanaan & Jenis Media */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Bentuk / Jenis Media <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formMediaType}
                    onChange={(e) => setFormMediaType(e.target.value as MediaCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="foto">Foto Kegiatan / Dokumentasi</option>
                    <option value="video">Video Setoran / Monitoring</option>
                    <option value="folder_drive">Folder Google Drive (Arsip)</option>
                    <option value="dokumen">Dokumen Laporan / PDF</option>
                  </select>
                </div>
              </div>

              {/* Guru Wali (Only selectable if SuperAdmin or Admin Staf) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Guru Wali</label>
                  {canManageAll ? (
                    <select
                      value={formTeacherNip}
                      onChange={(e) => setFormTeacherNip(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.nip}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={`${user?.name} (NIP: ${user?.nip})`}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                    />
                  )}
                </div>

                {/* Kelas */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Kelas Bimbingan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formClassName}
                    onChange={(e) => setFormClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {uniqueClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Siswa Spesifik (Opsional) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Siswa Tertentu <span className="text-slate-400 font-normal">(Opsional, jika video/foto setoran pribadi)</span>
                </label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Seluruh Siswa Kelas --</option>
                  {students
                    .filter((s) => !formClassName || s.className === formClassName)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (NISN: {s.nisn})
                      </option>
                    ))}
                </select>
              </div>

              {/* Link Google Drive */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">
                    Link Google Drive <span className="text-rose-500">*</span>
                  </label>
                  {formDriveUrl && (
                    <a
                      href={formDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Uji Buka Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/drive/folders/... atau https://drive.google.com/file/d/..."
                  value={formDriveUrl}
                  onChange={(e) => setFormDriveUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono text-xs"
                />
                <span className="text-[11px] text-slate-400 block">
                  Pastikan izin akses Google Drive disetel ke <em>"Siapa saja yang memiliki link dapat melihat"</em>.
                </span>
              </div>

              {/* Catatan / Keterangan */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Catatan / Keterangan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Siswa telah menyelesaikan setoran hafalan Surah An-Naba dan An-Nazi'at dengan predikat Mumtaz..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Link Dokumentasi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-xs text-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Hapus Dokumentasi Ini?</h3>
              <p className="text-slate-500 text-xs">
                Apakah Anda yakin ingin menghapus data bukti monitoring:{' '}
                <strong className="text-slate-800 block mt-1">"{docToDelete.title}"</strong>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md shadow-rose-900/20 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
