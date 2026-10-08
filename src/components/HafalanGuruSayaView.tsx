import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Check,
  Edit3,
  Calendar,
  AlertCircle,
  Sparkles,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Teacher, TeacherMemorizationRecord, MemorizationStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { JUZ_30_SURAHS, TOTAL_TARGET_SURAHS } from '../data/juz30Data';
import { subscribeTeacherMemorization, updateTeacherHafalanRecord } from '../services/dataService';
import { exportSingleTeacherCardToPDF } from '../utils/teacherHafalanExport';

interface HafalanGuruSayaViewProps {
  teachers: Teacher[];
}

export const HafalanGuruSayaView: React.FC<HafalanGuruSayaViewProps> = ({ teachers }) => {
  const { user } = useAuth();

  // Find currently logged-in teacher profile
  const currentTeacher = teachers.find(
    (t) => t.nip === user?.nip || t.id === user?.uid
  ) || {
    id: user?.uid || 'temp-id',
    nip: user?.nip || '-',
    name: user?.name || 'Guru Wali',
    email: user?.email || '',
    phone: '',
    classes: user?.classes || '-',
    isActive: true,
    totalMemorized: 0,
    totalInProcess: 0,
    totalRemaining: TOTAL_TARGET_SURAHS,
    createdAt: new Date().toISOString(),
  };

  const [records, setRecords] = useState<TeacherMemorizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | MemorizationStatus>('all');

  // Modal edit setoran state
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<MemorizationStatus>('sudah_hapal');
  const [formAyatRange, setFormAyatRange] = useState('');
  const [formCompletedDate, setFormCompletedDate] = useState(new Date().toISOString().slice(0, 10));
  const [formGrade, setFormGrade] = useState<'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | ''>('Jayyid Jiddan');
  const [formListenerName, setFormListenerName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTeacher.id) return;
    const unsub = subscribeTeacherMemorization(currentTeacher.id, (list) => {
      setRecords(list);
      setLoading(false);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [currentTeacher.id]);

  // Calculations
  const memorizedCount = records.filter((r) => r.status === 'sudah_hapal').length;
  const inProcessCount = records.filter((r) => r.status === 'proses_hapal').length;
  const remainingCount = Math.max(0, TOTAL_TARGET_SURAHS - memorizedCount - inProcessCount);
  const percentage = Math.round((memorizedCount / TOTAL_TARGET_SURAHS) * 100);

  // Open modal for specific surah
  const handleOpenModal = (surahNumber: number) => {
    const surahMeta = JUZ_30_SURAHS.find((s) => s.number === surahNumber);
    const existingRec = records.find((r) => r.surahNumber === surahNumber);

    setSelectedSurah(surahNumber);
    setFormStatus(existingRec?.status === 'sudah_hapal' ? 'sudah_hapal' : 'sudah_hapal');
    setFormAyatRange(existingRec?.ayatRange || `Lengkap (1 - ${surahMeta?.totalAyat || 0})`);
    setFormCompletedDate(existingRec?.completedDate || new Date().toISOString().slice(0, 10));
    setFormGrade(existingRec?.grade || 'Jayyid Jiddan');
    setFormListenerName(existingRec?.listenerName || '');
    setFormNotes(existingRec?.notes || '');
  };

  const handleSaveSetoran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSurah === null) return;

    setIsSubmitting(true);
    try {
      const surahMeta = JUZ_30_SURAHS.find((s) => s.number === selectedSurah);
      await updateTeacherHafalanRecord(
        currentTeacher.id,
        selectedSurah,
        {
          status: formStatus,
          ayatRange: formAyatRange.trim() || `1 - ${surahMeta?.totalAyat || 0}`,
          completedDate: formStatus === 'sudah_hapal' ? formCompletedDate : undefined,
          grade: formGrade,
          listenerName: formListenerName.trim() || undefined,
          notes: formNotes.trim() || undefined,
        },
        {
          name: user?.name || currentTeacher.name,
          nip: user?.nip || currentTeacher.nip,
          role: 'Guru Wali',
          teacherName: currentTeacher.name,
          teacherNip: currentTeacher.nip,
        }
      );

      setToastMessage(`Hafalan surah ${surahMeta?.name} berhasil diperbarui.`);
      setSelectedSurah(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Gagal menyimpan setoran hafalan: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered surahs list
  const filteredSurahs = JUZ_30_SURAHS.filter((surah) => {
    const rec = records.find((r) => r.surahNumber === surah.number);
    const status = rec?.status || 'belum_hapal';

    const matchStatus = filterStatus === 'all' || status === filterStatus;
    const matchSearch =
      surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.arabicName.includes(searchQuery) ||
      surah.number.toString().includes(searchQuery);

    return matchStatus && matchSearch;
  });

  // Recent Completed / In Progress history
  const activeRecords = records
    .filter((r) => r.status === 'sudah_hapal' || r.status === 'proses_hapal')
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner Kartu Hafalan Guru */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-700/40">
        <div className="absolute right-0 top-0 w-96 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              Kartu Tahfidz Guru & GTK &bull; SMKN 3 PANGKEP
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hafalan Al-Qur'an Saya
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              Selamat datang, <strong>{currentTeacher.name}</strong> (NIP: {currentTeacher.nip}).
              Halaman ini diperuntukkan bagi Bapak/Ibu Guru serta Pegawai Tata Usaha untuk mencatat dan memantau kemajuan hafalan Juz 30 (Al-Fatihah & Juz 30) yang telah disetorkan kepada Guru/Ustadz Pembina yang ditunjuk.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-200">
              <span className="bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-600/30">
                Target: {TOTAL_TARGET_SURAHS} Surah (Al-Fatihah + Juz 30)
              </span>
              <span className="bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-600/30">
                Unit / Rombel: {currentTeacher.classes || '-'}
              </span>
            </div>
          </div>

          {/* Action: Cetak Kartu Pribadi */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => exportSingleTeacherCardToPDF(currentTeacher, records)}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
              title="Unduh Kartu Hafalan Pribadi format PDF resmi"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu Hafalan (PDF)</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Besar */}
        <div className="mt-8 pt-6 border-t border-emerald-700/40">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-emerald-200">Progres Capaian Target Hafalan:</span>
            <span className="text-emerald-300 text-sm">{percentage}% Selesai ({memorizedCount} / {TOTAL_TARGET_SURAHS} Surah)</span>
          </div>
          <div className="w-full bg-slate-950/60 rounded-full h-3.5 p-0.5 border border-emerald-600/30">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(percentage, 2))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 Statistik Cepat Guru */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sudah Hapal (Tuntas)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{memorizedCount}</span>
              <span className="text-xs text-slate-500">dari {TOTAL_TARGET_SURAHS} Surah</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Tuntas disimak & divalidasi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dalam Proses Hafal
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600">{inProcessCount}</span>
              <span className="text-xs text-slate-500">Surah</span>
            </div>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Sedang disetor sebagian</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Belum Disetorkan
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-700">{remainingCount}</span>
              <span className="text-xs text-slate-500">Surah tersisa</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Siap dihafalkan bertahap</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Pencarian Surah */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Tab Filter Status */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Surah ({TOTAL_TARGET_SURAHS})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('sudah_hapal')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterStatus === 'sudah_hapal'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Sudah Hapal ({memorizedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('proses_hapal')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterStatus === 'proses_hapal'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Proses ({inProcessCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('belum_hapal')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterStatus === 'belum_hapal'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Hapal ({remainingCount})
          </button>
        </div>

        {/* Input Pencarian */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama surah (e.g. Al-Fatihah, An-Naba)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Grid 38 Surah */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSurahs.map((surah) => {
          const rec = records.find((r) => r.surahNumber === surah.number);
          const isMemorized = rec?.status === 'sudah_hapal';
          const isInProcess = rec?.status === 'proses_hapal';

          return (
            <div
              key={surah.number}
              className={`rounded-2xl border p-4.5 transition flex flex-col justify-between space-y-3 ${
                isMemorized
                  ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                  : isInProcess
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isMemorized
                          ? 'bg-emerald-600 text-white'
                          : isInProcess
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {surah.number}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                        {surah.name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {surah.totalAyat} Ayat &bull; {surah.type}
                      </p>
                    </div>
                  </div>

                  <span className="font-arabic text-lg text-slate-700 font-bold leading-none">
                    {surah.arabicName}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  {isMemorized ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Check className="w-3 h-3" /> Sudah Hapal
                    </span>
                  ) : isInProcess ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3" /> Sedang Proses
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      Belum Hapal
                    </span>
                  )}

                  {rec?.grade && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      Nilai: {rec.grade}
                    </span>
                  )}
                </div>

                {/* Detail Catatan Tajwid / Guru Penyimak jika ada */}
                {(rec?.listenerName || rec?.notes) && (
                  <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                    {rec.listenerName && (
                      <p className="text-slate-600">
                        <strong className="text-slate-800">Penyimak:</strong> {rec.listenerName}
                      </p>
                    )}
                    {rec.notes && (
                      <p className="text-slate-600 italic">
                        <strong className="text-slate-800 not-italic">Catatan Tajwid/Tahsin:</strong> "{rec.notes}"
                      </p>
                    )}
                    {rec.completedDate && (
                      <p className="text-slate-400 text-[10px]">
                        Tgl Setor: {rec.completedDate}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button: Setor / Update */}
              <button
                type="button"
                onClick={() => handleOpenModal(surah.number)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isMemorized
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : isInProcess
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isMemorized ? 'Perbarui Evaluasi Setoran' : 'Setor / Catat Hafalan'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Riwayat Setoran & Catatan Tajwid Guru */}
      {activeRecords.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Riwayat Setor & Evaluasi Tajwid/Tahsin Guru
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar surah yang telah disetorkan beserta catatan koreksi tajwid dan fashahah dari guru penyimak.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activeRecords.length} Setoran Tercatat
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Surah</th>
                  <th className="py-2.5 px-3">Rentang Ayat</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Predikat / Nilai</th>
                  <th className="py-2.5 px-3">Guru / Ustadz Penyimak</th>
                  <th className="py-2.5 px-3">Tanggal Setor</th>
                  <th className="py-2.5 px-3">Catatan Tajwid / Tahsin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRecords.map((r, idx) => (
                  <tr key={r.surahNumber} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {r.surahName} <span className="text-slate-400 font-normal">({r.surahNumber})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{r.ayatRange || '-'}</td>
                    <td className="py-2.5 px-3">
                      {r.status === 'sudah_hapal' ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                          Tuntas Hapal
                        </span>
                      ) : (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                          Proses Hapal
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{r.grade || '-'}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{r.listenerName || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{r.completedDate || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600 italic max-w-xs truncate">
                      {r.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL FORM SETORAN HAFALAN GURU */}
      {selectedSurah !== null && (() => {
        const surahMeta = JUZ_30_SURAHS.find((s) => s.number === selectedSurah);
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    {surahMeta?.number}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Setor Surah {surahMeta?.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {surahMeta?.totalAyat} Ayat &bull; {surahMeta?.arabicName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSurah(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveSetoran} className="space-y-4 text-xs">
                {/* Status Pilihan */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Capaian Surah
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStatus('sudah_hapal')}
                      className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formStatus === 'sudah_hapal'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Sudah Hapal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('proses_hapal')}
                      className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formStatus === 'proses_hapal'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Proses Hapal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('belum_hapal')}
                      className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formStatus === 'belum_hapal'
                          ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Belum Hapal</span>
                    </button>
                  </div>
                </div>

                {/* Rentang Ayat & Tanggal Setor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Rentang Ayat Disetor
                    </label>
                    <input
                      type="text"
                      value={formAyatRange}
                      onChange={(e) => setFormAyatRange(e.target.value)}
                      placeholder={`Contoh: 1 - ${surahMeta?.totalAyat}`}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Setor
                    </label>
                    <input
                      type="date"
                      value={formCompletedDate}
                      onChange={(e) => setFormCompletedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Guru / Ustadz Penyimak */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Guru / Ustadz Penyimak (Yang Ditunjuk)
                  </label>
                  <input
                    type="text"
                    value={formListenerName}
                    onChange={(e) => setFormListenerName(e.target.value)}
                    placeholder="Contoh: Ustadz Ahmad Fauzi, S.Pd.I / Koordinator Tahfidz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nama guru agama, rekan pembina, atau koordinator yang menyimak setoran Anda.
                  </p>
                </div>

                {/* Predikat / Nilai Kelancaran */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nilai Kelancaran / Predikat
                  </label>
                  <select
                    value={formGrade}
                    onChange={(e: any) => setFormGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-semibold text-slate-800"
                  >
                    <option value="Mumtaz">Mumtaz (Sangat Lancar & Tajwid Istimewa)</option>
                    <option value="Jayyid Jiddan">Jayyid Jiddan (Lancar & Sangat Baik)</option>
                    <option value="Jayyid">Jayyid (Cukup Lancar & Baik)</option>
                    <option value="Maqbul">Maqbul (Perlu Pengulangan / Cukup)</option>
                    <option value="">Tanpa Nilai</option>
                  </select>
                </div>

                {/* Catatan Tajwid & Tahsin */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Tajwid, Makharijul Huruf, & Evaluasi
                  </label>
                  <textarea
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Contoh: Makharijul huruf sudah baik, perhatikan mad jaiz munfashil dan dengung ghunnah..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedSurah(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Setoran'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
