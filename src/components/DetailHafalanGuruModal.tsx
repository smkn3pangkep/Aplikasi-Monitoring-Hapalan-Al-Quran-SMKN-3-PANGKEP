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
  X,
  FileText,
  User,
} from 'lucide-react';
import { Teacher, TeacherMemorizationRecord, MemorizationStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { JUZ_30_SURAHS, TOTAL_TARGET_SURAHS } from '../data/juz30Data';
import { subscribeTeacherMemorization, updateTeacherHafalanRecord } from '../services/dataService';
import { exportSingleTeacherCardToPDF } from '../utils/teacherHafalanExport';

interface DetailHafalanGuruModalProps {
  teacher: Teacher;
  onClose: () => void;
}

export const DetailHafalanGuruModal: React.FC<DetailHafalanGuruModalProps> = ({
  teacher,
  onClose,
}) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<TeacherMemorizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | MemorizationStatus>('all');

  // Edit record state
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<MemorizationStatus>('sudah_hapal');
  const [formAyatRange, setFormAyatRange] = useState('');
  const [formCompletedDate, setFormCompletedDate] = useState(new Date().toISOString().slice(0, 10));
  const [formGrade, setFormGrade] = useState<'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | ''>('Jayyid Jiddan');
  const [formListenerName, setFormListenerName] = useState(user?.name || '');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!teacher.id) return;
    const unsub = subscribeTeacherMemorization(teacher.id, (list) => {
      setRecords(list);
      setLoading(false);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [teacher.id]);

  const memorizedCount = records.filter((r) => r.status === 'sudah_hapal').length;
  const inProcessCount = records.filter((r) => r.status === 'proses_hapal').length;
  const remainingCount = Math.max(0, TOTAL_TARGET_SURAHS - memorizedCount - inProcessCount);
  const percentage = Math.round((memorizedCount / TOTAL_TARGET_SURAHS) * 100);

  const handleOpenEdit = (surahNumber: number) => {
    const surahMeta = JUZ_30_SURAHS.find((s) => s.number === surahNumber);
    const existing = records.find((r) => r.surahNumber === surahNumber);

    setSelectedSurah(surahNumber);
    setFormStatus(existing?.status || 'sudah_hapal');
    setFormAyatRange(existing?.ayatRange || `Lengkap (1 - ${surahMeta?.totalAyat || 0})`);
    setFormCompletedDate(existing?.completedDate || new Date().toISOString().slice(0, 10));
    setFormGrade(existing?.grade || 'Jayyid Jiddan');
    setFormListenerName(existing?.listenerName || user?.name || '');
    setFormNotes(existing?.notes || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSurah === null) return;

    setIsSubmitting(true);
    try {
      const surahMeta = JUZ_30_SURAHS.find((s) => s.number === selectedSurah);
      await updateTeacherHafalanRecord(
        teacher.id,
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
          name: user?.name || 'Administrator',
          nip: user?.nip || 'admin',
          role: user?.role === 'superadmin' ? 'Super Admin' : 'Admin Staf',
          teacherName: teacher.name,
          teacherNip: teacher.nip,
        }
      );

      setToastMessage(`Hafalan surah ${surahMeta?.name} berhasil diperbarui.`);
      setSelectedSurah(null);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black">{teacher.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  NIP: {teacher.nip}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Kartu Hafalan Al-Qur'an Juz 30 (Al-Fatihah & Juz 30) &bull; Rombel: {teacher.classes || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportSingleTeacherCardToPDF(teacher, records)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Cetak PDF Kartu Guru Ini"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Stat Mini */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 font-semibold block">Tuntas Hapal:</span>
                <span className="text-sm font-black text-emerald-700">{memorizedCount} / {TOTAL_TARGET_SURAHS} Surah</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Dalam Proses:</span>
                <span className="text-sm font-black text-amber-600">{inProcessCount} Surah</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Belum Hapal:</span>
                <span className="text-sm font-black text-slate-600">{remainingCount} Surah</span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-bold text-slate-700">Persentase Capaian: {percentage}%</span>
              <div className="w-48 bg-slate-200 rounded-full h-2.5 mt-1 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(percentage, 2))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Semua ({TOTAL_TARGET_SURAHS})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('sudah_hapal')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterStatus === 'sudah_hapal' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-slate-200'
                }`}
              >
                Sudah ({memorizedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('proses_hapal')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterStatus === 'proses_hapal' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-slate-200'
                }`}
              >
                Proses ({inProcessCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('belum_hapal')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterStatus === 'belum_hapal' ? 'bg-slate-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Belum ({remainingCount})
              </button>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari surah..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* List Surahs Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {toastMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSurahs.map((surah) => {
              const rec = records.find((r) => r.surahNumber === surah.number);
              const isMemorized = rec?.status === 'sudah_hapal';
              const isInProcess = rec?.status === 'proses_hapal';

              return (
                <div
                  key={surah.number}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-2.5 ${
                    isMemorized
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : isInProcess
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {surah.number}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs leading-none">
                            {surah.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">{surah.totalAyat} Ayat</span>
                        </div>
                      </div>
                      <span className="font-arabic text-sm text-slate-700 font-bold">
                        {surah.arabicName}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      {isMemorized ? (
                        <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          Sudah Hapal
                        </span>
                      ) : isInProcess ? (
                        <span className="font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                          Proses Hapal
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Belum Hapal</span>
                      )}

                      {rec?.grade && (
                        <span className="font-semibold text-slate-700 text-[10px]">
                          {rec.grade}
                        </span>
                      )}
                    </div>

                    {rec?.listenerName && (
                      <p className="mt-1.5 text-[10px] text-slate-500 truncate">
                        Penyimak: {rec.listenerName}
                      </p>
                    )}
                    {rec?.notes && (
                      <p className="mt-0.5 text-[10px] text-slate-500 italic truncate">
                        Catatan: "{rec.notes}"
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(surah.number)}
                    className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Catat / Evaluasi</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Edit Surah Tunggal */}
        {selectedSurah !== null && (() => {
          const surahMeta = JUZ_30_SURAHS.find((s) => s.number === selectedSurah);
          return (
            <div className="fixed inset-0 z-60 bg-slate-950/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Setoran Surah {surahMeta?.name}
                    </h3>
                    <p className="text-xs text-slate-500">Guru: {teacher.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSurah(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status Hafalan</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormStatus('sudah_hapal')}
                        className={`py-1.5 px-2 rounded-xl font-bold border transition cursor-pointer text-center ${
                          formStatus === 'sudah_hapal'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Sudah Hapal
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStatus('proses_hapal')}
                        className={`py-1.5 px-2 rounded-xl font-bold border transition cursor-pointer text-center ${
                          formStatus === 'proses_hapal'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Proses
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStatus('belum_hapal')}
                        className={`py-1.5 px-2 rounded-xl font-bold border transition cursor-pointer text-center ${
                          formStatus === 'belum_hapal'
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Belum Hapal
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Rentang Ayat</label>
                      <input
                        type="text"
                        value={formAyatRange}
                        onChange={(e) => setFormAyatRange(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tanggal Setor</label>
                      <input
                        type="date"
                        value={formCompletedDate}
                        onChange={(e) => setFormCompletedDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Penyimak / Penguji</label>
                    <input
                      type="text"
                      value={formListenerName}
                      onChange={(e) => setFormListenerName(e.target.value)}
                      placeholder="Nama Penguji / Pembina"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Predikat Kelancaran</label>
                    <select
                      value={formGrade}
                      onChange={(e: any) => setFormGrade(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold"
                    >
                      <option value="Mumtaz">Mumtaz (Sangat Lancar)</option>
                      <option value="Jayyid Jiddan">Jayyid Jiddan (Sangat Baik)</option>
                      <option value="Jayyid">Jayyid (Baik)</option>
                      <option value="Maqbul">Maqbul (Cukup)</option>
                      <option value="">Tanpa Predikat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan Tajwid / Tahsin</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Catatan makharijul huruf, tajwid, atau kelancaran..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedSurah(null)}
                      className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
