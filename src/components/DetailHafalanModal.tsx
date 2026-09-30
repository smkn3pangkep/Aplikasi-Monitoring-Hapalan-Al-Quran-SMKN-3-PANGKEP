import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  CircleAlert,
  Calendar,
  Share2,
  Copy,
  Check,
  Edit3,
  Edit2,
  Award,
  BookOpen,
  Filter,
  Search,
  MessageSquareQuote,
  Sparkles,
  Phone,
  UserCheck,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Student, MemorizationRecord, MemorizationStatus } from '../types';
import { JUZ_30_SURAHS, TOTAL_TARGET_SURAHS } from '../data/juz30Data';
import { subscribeStudentHafalan, updateHafalanRecord, updateStudent, deleteStudent } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface DetailHafalanModalProps {
  student: Student;
  onClose: () => void;
}

export const DetailHafalanModal: React.FC<DetailHafalanModalProps> = ({ student, onClose }) => {
  const { user } = useAuth();
  const [currentStudent, setCurrentStudent] = useState<Student>(student);
  const [records, setRecords] = useState<MemorizationRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | MemorizationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing student profile (Nama, NIS, Kelas)
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [editName, setEditName] = useState(student.name);
  const [editNisn, setEditNisn] = useState(student.nisn);
  const [editClass, setEditClass] = useState(student.className);
  const [editPhone, setEditPhone] = useState(student.parentPhone || '');
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [studentSaveNotice, setStudentSaveNotice] = useState<string | null>(null);

  // Deleting student from inside modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  // Editing state for updating a specific surah
  const [editingSurah, setEditingSurah] = useState<MemorizationRecord | null>(null);
  const [statusInput, setStatusInput] = useState<MemorizationStatus>('belum_hapal');
  const [ayatRangeInput, setAyatRangeInput] = useState('');
  const [targetDateInput, setTargetDateInput] = useState('');
  const [completedDateInput, setCompletedDateInput] = useState('');
  const [gradeInput, setGradeInput] = useState<'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | ''>('');
  const [notesInput, setNotesInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // WhatsApp notification modal
  const [showWaModal, setShowWaModal] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    setCurrentStudent(student);
    setEditName(student.name);
    setEditNisn(student.nisn);
    setEditClass(student.className);
    setEditPhone(student.parentPhone || '');
    setProfileError(null);
  }, [student]);

  const handleSaveStudentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    if (!editName.trim() || !editNisn.trim() || !editClass.trim()) {
      setProfileError('Nama Siswa, NIS/NISN, dan Kelas wajib diisi.');
      return;
    }

    setIsSavingStudent(true);
    try {
      await updateStudent(
        currentStudent.id,
        {
          name: editName.trim(),
          nisn: editNisn.trim(),
          className: editClass.trim(),
          parentPhone: editPhone.trim(),
        },
        {
          name: user?.name || 'Guru Wali',
          nip: user?.nip || '198205142008011005',
        }
      );
      setCurrentStudent((prev) => ({
        ...prev,
        name: editName.trim(),
        nisn: editNisn.trim(),
        className: editClass.trim(),
        parentPhone: editPhone.trim(),
      }));
      setShowEditStudent(false);
      setStudentSaveNotice('Data profil siswa berhasil diperbarui dan tersimpan ke Firebase!');
      setTimeout(() => setStudentSaveNotice(null), 3500);
    } catch (err: any) {
      setProfileError(err.message || 'Gagal menyimpan perubahan profil siswa');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteCurrentStudent = async () => {
    setIsDeletingStudent(true);
    try {
      await deleteStudent(currentStudent.id, {
        name: user?.name || 'Guru Wali',
        nip: user?.nip || '198205142008011005',
        studentName: currentStudent.name,
      });
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      setProfileError(err.message || 'Gagal menghapus data siswa');
    } finally {
      setIsDeletingStudent(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeStudentHafalan(student.id, (list) => {
      setRecords(list);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [student.id]);

  // Open edit modal for a surah
  const handleOpenEdit = (rec: MemorizationRecord) => {
    setEditingSurah(rec);
    setStatusInput(rec.status);
    setAyatRangeInput(rec.ayatRange || `1 - ${rec.totalAyat}`);
    setTargetDateInput(rec.targetDate || '');
    setCompletedDateInput(rec.completedDate || (rec.status === 'sudah_hapal' ? new Date().toISOString().split('T')[0] : ''));
    setGradeInput(rec.grade || (rec.status === 'sudah_hapal' ? 'Jayyid Jiddan' : ''));
    setNotesInput(rec.notes || '');
  };

  const handleSaveHafalan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSurah) return;
    setIsSaving(true);
    try {
      await updateHafalanRecord(
        student.id,
        editingSurah.surahNumber,
        {
          status: statusInput,
          ayatRange: ayatRangeInput,
          targetDate: targetDateInput,
          completedDate: statusInput === 'sudah_hapal' ? completedDateInput || new Date().toISOString().split('T')[0] : '',
          grade: statusInput === 'sudah_hapal' ? gradeInput : '',
          notes: notesInput,
        },
        {
          name: user?.name || 'Guru Wali SMKN 3 Pangkep',
          nip: user?.nip || '198205142008011005',
          role: user?.role === 'superadmin' ? 'Super Admin' : 'Guru Wali',
          studentName: student.name,
        }
      );
      setEditingSurah(null);
    } catch (err) {
      console.error('Failed to update memorization:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle helper
  const handleQuickStatus = async (rec: MemorizationRecord, nextStatus: MemorizationStatus) => {
    await updateHafalanRecord(
      student.id,
      rec.surahNumber,
      {
        status: nextStatus,
        completedDate: nextStatus === 'sudah_hapal' ? new Date().toISOString().split('T')[0] : '',
        grade: nextStatus === 'sudah_hapal' ? (rec.grade || 'Jayyid Jiddan') : '',
      },
      {
        name: user?.name || 'Guru Wali',
        nip: user?.nip || '198205142008011005',
        role: user?.role === 'superadmin' ? 'Super Admin' : 'Guru Wali',
        studentName: student.name,
      }
    );
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesCat = selectedCategory === 'all' || r.status === selectedCategory;
    const matchesSearch =
      r.surahName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.surahNumber.toString().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  // Count stats
  const totalSudah = records.filter((r) => r.status === 'sudah_hapal').length;
  const totalProses = records.filter((r) => r.status === 'proses_hapal').length;
  const totalBelum = Math.max(0, TOTAL_TARGET_SURAHS - totalSudah - totalProses);
  const percentCompleted = Math.round((totalSudah / TOTAL_TARGET_SURAHS) * 100);

  // In-process surahs list for WhatsApp preview
  const inProcessSurahs = records
    .filter((r) => r.status === 'proses_hapal')
    .map((r) => `${r.surahName} (${r.ayatRange || 'Ayat 1-' + r.totalAyat})`)
    .join(', ');

  const recentDoneSurahs = records
    .filter((r) => r.status === 'sudah_hapal')
    .slice(-3)
    .map((r) => `${r.surahName} (${r.grade || 'Lulus'})`)
    .join(', ');

  // Formatted WhatsApp message for parents
  const generateWaMessage = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return `*LAPORAN PERKEMBANGAN HAFALAN AL-QUR'AN (AL-FATIHAH & JUZ 30)*\n` +
      `*SMKN 3 PANGKEP - TAHFIDZ GURU WALI*\n` +
      `Tanggal: ${todayStr}\n\n` +
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Kepada Yth. Bapak/Ibu Wali Murid dari:\n` +
      `• *Nama Siswa* : ${student.name}\n` +
      `• *NISN* : ${student.nisn}\n` +
      `• *Kelas* : ${student.className}\n` +
      `• *Guru Wali* : ${student.teacherName}\n\n` +
      `Berikut kami sampaikan ringkasan progres hafalan Al-Qur'an ananda:\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *Sudah Hapal (Tuntas)* : ${totalSudah} dari ${TOTAL_TARGET_SURAHS} Surah (${percentCompleted}%)\n` +
      `⏳ *Sedang Proses Hapal* : ${totalProses} Surah\n` +
      `📖 *Belum Dihafal* : ${totalBelum} Surah\n\n` +
      (inProcessSurahs ? `🎯 *Fokus Hafalan Saat Ini*:\n${inProcessSurahs}\n\n` : '') +
      (recentDoneSurahs ? `🌟 *Capaian Terbaru*:\n${recentDoneSurahs}\n\n` : '') +
      `Mohon bimbingan dan doa dari Bapak/Ibu di rumah agar ananda senantiasa istiqomah dan lancar menghafal Al-Qur'an.\n\n` +
      `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n` +
      `_Guru Wali SMKN 3 Pangkep_`;
  };

  const copyWaText = () => {
    navigator.clipboard.writeText(generateWaMessage());
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const openWhatsAppUrl = () => {
    const text = encodeURIComponent(generateWaMessage());
    let phone = (student.parentPhone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                Kartu Hafalan Siswa • Juz 30
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">{currentStudent.name}</h2>
                <button
                  type="button"
                  onClick={() => setShowEditStudent(true)}
                  className="p-1.5 px-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-emerald-200 transition flex items-center gap-1 cursor-pointer"
                  title="Edit Data Siswa (Nama, NIS/NISN, Kelas)"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 px-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                  title="Hapus Siswa Bimbingan Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Siswa</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100/80 mt-1">
                <span className="font-mono bg-white/10 px-2.5 py-0.5 rounded-lg">NIS / NISN: {currentStudent.nisn}</span>
                <span>•</span>
                <span>Kelas: <strong className="text-white">{currentStudent.className}</strong></span>
                <span>•</span>
                <span>Guru Wali: <strong className="text-white">{currentStudent.teacherName}</strong></span>
              </div>
            </div>

            {/* Quick action: WhatsApp report */}
            <button
              type="button"
              onClick={() => setShowWaModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-900/50 cursor-pointer shrink-0"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim Laporan WA Wali Murid</span>
            </button>
          </div>

          {studentSaveNotice && (
            <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-400 text-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{studentSaveNotice}</span>
            </div>
          )}

          {/* Progress Overview Bar */}
          <div className="mt-5 pt-4 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-emerald-800/30 border border-emerald-700/40 rounded-xl p-2.5">
              <span className="text-[11px] text-emerald-300 uppercase font-semibold block">Sudah Hapal</span>
              <div className="text-xl font-black text-white mt-0.5">
                {totalSudah} <span className="text-xs font-normal text-emerald-300">/ {TOTAL_TARGET_SURAHS} Surah</span>
              </div>
              <div className="text-[10px] text-emerald-200 mt-0.5">{percentCompleted}% Selesai</div>
            </div>

            <div className="bg-amber-900/30 border border-amber-700/40 rounded-xl p-2.5">
              <span className="text-[11px] text-amber-300 uppercase font-semibold block">Proses Hapal</span>
              <div className="text-xl font-black text-amber-300 mt-0.5">
                {totalProses} <span className="text-xs font-normal text-amber-200">Surah</span>
              </div>
              <div className="text-[10px] text-amber-200/80 mt-0.5">Sedang disetorkan</div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2.5">
              <span className="text-[11px] text-slate-300 uppercase font-semibold block">Belum Hapal</span>
              <div className="text-xl font-black text-slate-300 mt-0.5">
                {totalBelum} <span className="text-xs font-normal text-slate-400">Surah</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Target berikutnya</div>
            </div>

            <div className="bg-teal-900/30 border border-teal-700/40 rounded-xl p-2.5">
              <span className="text-[11px] text-teal-300 uppercase font-semibold block">Predikat Mutqin</span>
              <div className="text-base font-bold text-teal-200 mt-1 truncate">
                {percentCompleted >= 100
                  ? 'Khatam Mumtaz 🎓'
                  : percentCompleted >= 75
                  ? 'Jayyid Jiddan'
                  : percentCompleted >= 40
                  ? 'Jayyid'
                  : 'Berproses'}
              </div>
              <div className="text-[10px] text-teal-300/80 mt-0.5">Penilaian Hafalan</div>
            </div>
          </div>
        </div>

        {/* Filter bar & Search */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Surah ({TOTAL_TARGET_SURAHS})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('sudah_hapal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedCategory === 'sudah_hapal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Sudah Hapal ({totalSudah})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('proses_hapal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedCategory === 'proses_hapal'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Proses Hapal ({totalProses})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('belum_hapal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedCategory === 'belum_hapal'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <CircleAlert className="w-3.5 h-3.5" />
              <span>Belum Hapal ({totalBelum})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau nomor surah..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 pl-9 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
          </div>
        </div>

        {/* Surahs Grid / List */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tidak ada surah yang cocok dengan filter.</p>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const surahMeta = JUZ_30_SURAHS.find((s) => s.number === rec.surahNumber);

              return (
                <div
                  key={rec.surahNumber}
                  className="py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition"
                >
                  {/* Left: Surah Number & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                      {rec.surahNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {rec.surahName}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({surahMeta?.meaning || ''})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{rec.totalAyat} Ayat</span>
                        <span>•</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600">
                          {surahMeta?.type}
                        </span>
                        {rec.ayatRange && rec.status === 'proses_hapal' && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-medium">
                              {rec.ayatRange}
                            </span>
                          </>
                        )}
                        {rec.targetDate && rec.status === 'proses_hapal' && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              Target: {rec.targetDate}
                            </span>
                          </>
                        )}
                        {rec.completedDate && rec.status === 'sudah_hapal' && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <Calendar className="w-3 h-3" />
                              Tuntas: {rec.completedDate}
                            </span>
                          </>
                        )}
                        {rec.grade && rec.status === 'sudah_hapal' && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ★ {rec.grade}
                          </span>
                        )}
                      </div>
                      {rec.notes && (
                        <p className="text-xs text-slate-600 italic mt-1 bg-amber-50/60 border-l-2 border-amber-400 pl-2 py-0.5">
                          "{rec.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle / Right: Arabic typography & Status Control */}
                  <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                    {/* Arabic Text in Amiri Font */}
                    <div className="font-['Amiri'] text-xl sm:text-2xl text-emerald-950 font-bold px-2 hidden sm:block">
                      {rec.arabicName}
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {rec.status === 'sudah_hapal' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Sudah Hapal
                        </span>
                      )}
                      {rec.status === 'proses_hapal' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Proses Hapal
                        </span>
                      )}
                      {rec.status === 'belum_hapal' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                          <CircleAlert className="w-3.5 h-3.5 text-slate-400" />
                          Belum Hapal
                        </span>
                      )}
                    </div>

                    {/* Action button to open detailed form */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(rec)}
                      className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Set Target & Status</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Menampilkan {TOTAL_TARGET_SURAHS} Surah (Surah Al-Fatihah & Juz 30 / An-Naba' - An-Nas)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold cursor-pointer"
          >
            Tutup Kartu
          </button>
        </div>
      </div>

      {/* SUB-MODAL: Form Update Status / Target Hafalan */}
      {editingSurah && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  Update Hafalan: {editingSurah.surahName} ({editingSurah.arabicName})
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Surah ke-{editingSurah.surahNumber} • Total {editingSurah.totalAyat} Ayat
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSurah(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHafalan} className="p-6 space-y-4">
              {/* Category radio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Kategori Status Hafalan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusInput('belum_hapal');
                      setAyatRangeInput(`1 - ${editingSurah.totalAyat}`);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      statusInput === 'belum_hapal'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CircleAlert className="w-4 h-4" />
                    <span>Belum Hapal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusInput('proses_hapal');
                      if (!ayatRangeInput) setAyatRangeInput(`Ayat 1 - ${Math.ceil(editingSurah.totalAyat / 2)}`);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      statusInput === 'proses_hapal'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Proses Hapal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusInput('sudah_hapal');
                      setAyatRangeInput(`1 - ${editingSurah.totalAyat} (Lengkap)`);
                      if (!completedDateInput) setCompletedDateInput(new Date().toISOString().split('T')[0]);
                      if (!gradeInput) setGradeInput('Jayyid Jiddan');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      statusInput === 'sudah_hapal'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Sudah Hapal</span>
                  </button>
                </div>
              </div>

              {/* Ayat range input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ayat yang Dihafalkan
                </label>
                <input
                  type="text"
                  value={ayatRangeInput}
                  onChange={(e) => setAyatRangeInput(e.target.value)}
                  placeholder={`Contoh: Ayat 1 - ${editingSurah.totalAyat}`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Date target or completed date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {statusInput === 'proses_hapal' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Target Selesai
                    </label>
                    <input
                      type="date"
                      value={targetDateInput}
                      onChange={(e) => setTargetDateInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Penyetoran / Tuntas
                    </label>
                    <input
                      type="date"
                      value={completedDateInput}
                      onChange={(e) => setCompletedDateInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}

                {/* Grade score */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Predikat Nilai Hafalan
                  </label>
                  <select
                    value={gradeInput}
                    onChange={(e: any) => setGradeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="">-- Pilih Nilai --</option>
                    <option value="Mumtaz">Mumtaz (Istimewa / Sangat Lancar)</option>
                    <option value="Jayyid Jiddan">Jayyid Jiddan (Sangat Baik)</option>
                    <option value="Jayyid">Jayyid (Baik / Cukup Lancar)</option>
                    <option value="Maqbul">Maqbul (Cukup)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Guru Wali / Evaluasi
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Makharijul huruf sudah tepat, perlu muroja'ah ayat 10-15..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSurah(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: WhatsApp Notification Generator */}
      {showWaModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-300" />
                  Notifikasi Progres ke Wali Murid
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Kirim perkembangan harian hafalan Al-Qur'an ananda {student.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWaModal(false)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Format Pesan WhatsApp
                  </label>
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Siap Dikirim
                  </span>
                </div>
                <div className="bg-slate-900 text-emerald-300 font-mono text-xs p-4 rounded-2xl max-h-56 overflow-y-auto whitespace-pre-wrap border border-slate-800 leading-relaxed shadow-inner">
                  {generateWaMessage()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={openWhatsAppUrl}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim via WhatsApp (Web / Aplikasi)</span>
                </button>

                <button
                  type="button"
                  onClick={copyWaText}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedNotice ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Teks Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Salin Format Pesan ke Clipboard</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 text-center">
                Pesan ini dapat dikirimkan langsung ke nomor WhatsApp Wali Murid siswa secara berkala.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Edit Profil Siswa (Nama, NIS, Kelas) */}
      {showEditStudent && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Edit Data Siswa
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Perbarui nama siswa, NIS/NISN, atau kelas bimbingan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditStudent(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentProfile} className="p-6 space-y-4">
              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Siswa Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                    value={editNisn}
                    onChange={(e) => setEditNisn(e.target.value)}
                    placeholder="Contoh: 0071234567 atau 12345"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Nomor Induk Siswa</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    required
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    placeholder="Contoh: X DPIB 1 / X TITL 1 / X TJKT 1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Kelompok / Rombel</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  No. WhatsApp Wali Murid (Opsional)
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditStudent(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 disabled:opacity-60 cursor-pointer"
                >
                  {isSavingStudent ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Konfirmasi Hapus Siswa dari dalam kartu */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-rose-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-300" />
                  Hapus Data Siswa
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">
                  Tindakan ini permanen dan tidak dapat dibatalkan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 text-rose-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <p className="text-xs font-semibold text-rose-900 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data bimbingan ananda:
                </p>
                <div className="mt-2.5 bg-white p-3 rounded-xl border border-rose-200 text-xs space-y-1">
                  <div><strong>Nama:</strong> {currentStudent.name}</div>
                  <div><strong>NIS / NISN:</strong> {currentStudent.nisn}</div>
                  <div><strong>Kelas:</strong> {currentStudent.className}</div>
                  <div><strong>Guru Wali:</strong> {currentStudent.teacherName}</div>
                </div>
                <p className="text-[11px] text-rose-700 mt-2">
                  * Seluruh catatan 37 surah Juz 30 siswa ini juga akan terhapus dari Firebase.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeletingStudent}
                  onClick={handleDeleteCurrentStudent}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-700/20 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeletingStudent ? 'Menghapus...' : 'Ya, Hapus Siswa'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
