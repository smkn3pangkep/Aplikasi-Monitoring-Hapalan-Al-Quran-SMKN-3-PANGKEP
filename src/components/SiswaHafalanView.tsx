import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  CircleAlert,
  Search,
  Filter,
  School,
  UserCheck,
  ShieldCheck,
  Calendar,
  Sparkles,
  Printer,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Student, MemorizationRecord, MemorizationStatus } from '../types';
import { JUZ_30_SURAHS, TOTAL_TARGET_SURAHS } from '../data/juz30Data';
import { subscribeStudentHafalan, subscribeStudents } from '../services/dataService';
import { NavTab } from './Sidebar';

interface SiswaHafalanViewProps {
  onNavigateTab?: (tab: NavTab) => void;
}

export const SiswaHafalanView: React.FC<SiswaHafalanViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [records, setRecords] = useState<MemorizationRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | MemorizationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to student data to keep statistics live
  useEffect(() => {
    if (!user?.studentId && !user?.nisn) {
      setIsLoading(false);
      return;
    }

    const unsubscribeStudents = subscribeStudents((studentsList) => {
      const found = studentsList.find(
        (s) =>
          (user.studentId && s.id === user.studentId) ||
          (user.nisn && s.nisn === user.nisn) ||
          (user.name && s.name.toLowerCase() === user.name.toLowerCase())
      );
      if (found) {
        setStudentData(found);
      }
    });

    return () => {
      unsubscribeStudents?.();
    };
  }, [user]);

  // Subscribe to real-time hafalan records
  useEffect(() => {
    const studentId = user?.studentId || studentData?.id;
    if (!studentId) {
      // If we don't have id yet, create placeholder records from JUZ_30_SURAHS
      const initialList: MemorizationRecord[] = JUZ_30_SURAHS.map((s) => ({
        studentId: 'temp',
        surahNumber: s.number,
        surahName: s.name,
        arabicName: s.arabicName,
        totalAyat: s.totalAyat,
        ayatRange: `1 - ${s.totalAyat}`,
        status: 'belum_hapal',
        updatedAt: new Date().toISOString(),
      }));
      setRecords(initialList);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeStudentHafalan(studentId, (list) => {
      setRecords(list);
      setIsLoading(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, [user?.studentId, studentData?.id]);

  // Calculations
  const stats = useMemo(() => {
    const total = TOTAL_TARGET_SURAHS; // 38 Surah
    const memorized = records.filter((r) => r.status === 'sudah_hapal').length;
    const inProcess = records.filter((r) => r.status === 'proses_hapal').length;
    const remaining = total - memorized - inProcess;
    const percentage = Math.round((memorized / total) * 100);
    const isCompleted = memorized >= total;

    return {
      total,
      memorized,
      inProcess,
      remaining: remaining > 0 ? remaining : 0,
      percentage,
      isCompleted,
    };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchCat =
        selectedCategory === 'all' ? true : record.status === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        record.surahName.toLowerCase().includes(q) ||
        record.arabicName.includes(q) ||
        record.surahNumber.toString().includes(q) ||
        (record.notes && record.notes.toLowerCase().includes(q)) ||
        (record.grade && record.grade.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [records, selectedCategory, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 p-6 md:p-8 text-white border border-emerald-800/40 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-lg shadow-emerald-950/60 shrink-0">
              <div className="w-full h-full bg-slate-900/90 rounded-[14px] flex items-center justify-center text-emerald-400 font-extrabold text-2xl sm:text-3xl">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Portal Siswa
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                  Hanya Lihat (Read-Only)
                </span>
                {stats.isCompleted && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Tuntas Juz 'Amma
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {user?.name || studentData?.name || 'Siswa SMKN 3 Pangkep'}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-emerald-200/80 mt-2">
                <span>
                  NISN: <strong className="text-white">{user?.nisn || studentData?.nisn || '-'}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Kelas: <strong className="text-white">{user?.classes || studentData?.className || '-'}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Guru Pembimbing:{' '}
                  <strong className="text-white">
                    {user?.teacherName || studentData?.teacherName || 'Guru Wali'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('baca_quran')}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Baca Al-Qur'an</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              title="Cetak Rapor Hafalan"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Rapor</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Statistik 4 Kartu Ringkasan Progres */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Target */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Target Program</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
              38 <span className="text-xs font-semibold text-slate-500">Surah</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Al-Fatihah & Juz 30</p>
          </div>
        </div>

        {/* Tuntas Hapal */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center gap-3.5 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Tuntas Hapal</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-800 mt-0.5">
              {stats.memorized} <span className="text-xs font-semibold text-slate-500">Surah</span>
            </h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Telah diverifikasi</p>
          </div>
        </div>

        {/* Sedang Proses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-3.5 bg-gradient-to-br from-white to-amber-50/30">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Dalam Proses</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-800 mt-0.5">
              {stats.inProcess} <span className="text-xs font-semibold text-slate-500">Surah</span>
            </h3>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Sedang bimbingan</p>
          </div>
        </div>

        {/* Persentase Capaian */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-teal-200/80 shadow-xs flex items-center gap-3.5 bg-gradient-to-br from-white to-teal-50/30">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">Progres Capaian</p>
            <h3 className="text-xl sm:text-2xl font-black text-teal-800 mt-0.5">
              {stats.percentage}%
            </h3>
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                stats.isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {stats.isCompleted ? 'Sudah Tuntas' : 'Belum Tuntas'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Visualizer */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Capaian Target Hafalan ({stats.memorized} dari {stats.total} Surah)
          </span>
          <span className="text-emerald-700 font-bold">{stats.percentage}% Selesai</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${(stats.memorized / stats.total) * 100}%` }}
            title={`Tuntas: ${stats.memorized} Surah`}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${(stats.inProcess / stats.total) * 100}%` }}
            title={`Proses: ${stats.inProcess} Surah`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Tuntas: {stats.memorized}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Proses: {stats.inProcess}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
              Belum: {stats.remaining}
            </span>
          </div>
          <span className="text-slate-400">Target: Al-Fatihah & Juz 30</span>
        </div>
      </div>

      {/* Read-Only Notice Box */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <p className="font-bold text-emerald-800">
            Akses Khusus Siswa (Hanya Lihat / Read-Only)
          </p>
          <p className="text-emerald-700 mt-0.5">
            Data hafalan ini diverifikasi dan dikelola langsung oleh Guru Wali / Pembimbing Anda (
            <strong>{user?.teacherName || studentData?.teacherName || 'Guru Wali'}</strong>). Untuk menyetorkan hafalan surah atau memperbarui catatan tajwid, silakan temui guru pembimbing saat sesi pembiasaan tahfidz.
          </p>
        </div>
      </div>

      {/* 3. Filter & Pencarian Surah */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Category Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua (38)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('sudah_hapal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'sudah_hapal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tuntas ({stats.memorized})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('proses_hapal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'proses_hapal'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Proses ({stats.inProcess})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('belum_hapal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'belum_hapal'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Belum ({stats.remaining})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari surah (An-Naba, Al-Ikhlas)..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 outline-none transition placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 4. Tabel / Daftar Surah */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Rincian 38 Surah Program Pembiasaan Tahfidz
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredRecords.length} surah berdasarkan filter saat ini
            </p>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Surah</th>
                <th className="py-3 px-4 text-center">Ayat & Kategori</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Tanggal Tuntas</th>
                <th className="py-3 px-4 text-center">Nilai Predikat</th>
                <th className="py-3 px-4">Catatan Pembimbing</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    Tidak ada surah yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isHapal = rec.status === 'sudah_hapal';
                  const isProses = rec.status === 'proses_hapal';
                  const meta = JUZ_30_SURAHS.find((s) => s.number === rec.surahNumber);

                  return (
                    <tr
                      key={rec.surahNumber}
                      className={`hover:bg-slate-50/80 transition ${
                        isHapal ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                        {rec.surahNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800">{rec.surahName}</span>
                          <span className="font-arabic text-base text-emerald-800 font-medium">
                            {rec.arabicName}
                          </span>
                        </div>
                        {meta && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            "{meta.meaning}"
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {rec.totalAyat} Ayat &bull; {meta?.type || 'Makkiyah'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isHapal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Sudah Hapal
                          </span>
                        ) : isProses ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Dalam Proses
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Belum Hapal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                        {rec.completedDate || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rec.grade ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                              rec.grade === 'Mumtaz'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : rec.grade === 'Jayyid Jiddan'
                                ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            {rec.grade}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                        {rec.notes ? (
                          <p className="bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                            "{rec.notes}"
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">Belum ada catatan</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('baca_quran')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition cursor-pointer"
                            title="Buka Baca Al-Qur'an"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Baca</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredRecords.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Tidak ada surah yang sesuai.
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const isHapal = rec.status === 'sudah_hapal';
              const isProses = rec.status === 'proses_hapal';
              const meta = JUZ_30_SURAHS.find((s) => s.number === rec.surahNumber);

              return (
                <div key={rec.surahNumber} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">
                        {rec.surahNumber}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{rec.surahName}</h3>
                        <p className="text-[11px] text-slate-400">
                          {rec.totalAyat} Ayat &bull; {meta?.type || 'Makkiyah'}
                        </p>
                      </div>
                    </div>
                    <span className="font-arabic text-xl text-emerald-800 font-medium">
                      {rec.arabicName}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-50">
                    <div>
                      {isHapal ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Sudah Hapal
                        </span>
                      ) : isProses ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Dalam Proses
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Belum Hapal
                        </span>
                      )}
                    </div>

                    {rec.grade && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Predikat: {rec.grade}
                      </span>
                    )}
                  </div>

                  {(rec.completedDate || rec.notes) && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                      {rec.completedDate && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Tuntas per tanggal: <strong>{rec.completedDate}</strong></span>
                        </div>
                      )}
                      {rec.notes && (
                        <p className="text-slate-600 italic">
                          "{rec.notes}"
                        </p>
                      )}
                    </div>
                  )}

                  {onNavigateTab && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('baca_quran')}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold transition cursor-pointer border border-slate-200/80"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Buka Baca Al-Qur'an</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
