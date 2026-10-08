import React, { useState } from 'react';
import {
  Users,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  Search,
  ChevronRight,
  Sparkles,
  TrendingUp,
  School,
  Eye,
} from 'lucide-react';
import { Teacher } from '../types';
import { TOTAL_TARGET_SURAHS } from '../data/juz30Data';
import { exportTeacherHafalanToExcel, exportTeacherHafalanToPDF, exportSingleTeacherCardToPDF } from '../utils/teacherHafalanExport';
import { DetailHafalanGuruModal } from './DetailHafalanGuruModal';

interface MonitoringHafalanGuruViewProps {
  teachers: Teacher[];
}

export const MonitoringHafalanGuruView: React.FC<MonitoringHafalanGuruViewProps> = ({
  teachers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgress, setFilterProgress] = useState<'all' | 'khatam' | 'proses' | 'belum'>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Statistics
  const totalGuru = teachers.length;
  const khatamGuru = teachers.filter((t) => (t.totalMemorized ?? 0) >= TOTAL_TARGET_SURAHS).length;
  const inProcessGuru = teachers.filter(
    (t) => (t.totalMemorized ?? 0) > 0 && (t.totalMemorized ?? 0) < TOTAL_TARGET_SURAHS
  ).length;
  const belumGuru = teachers.filter((t) => (t.totalMemorized ?? 0) === 0).length;

  const totalSurahDisetor = teachers.reduce((acc, curr) => acc + (curr.totalMemorized ?? 0), 0);
  const averagePercentage = totalGuru > 0
    ? Math.round((totalSurahDisetor / (totalGuru * TOTAL_TARGET_SURAHS)) * 100)
    : 0;

  // Filter teachers
  const filteredTeachers = teachers.filter((t) => {
    const memorized = t.totalMemorized ?? 0;
    let matchProgress = true;
    if (filterProgress === 'khatam') matchProgress = memorized >= TOTAL_TARGET_SURAHS;
    else if (filterProgress === 'proses') matchProgress = memorized > 0 && memorized < TOTAL_TARGET_SURAHS;
    else if (filterProgress === 'belum') matchProgress = memorized === 0;

    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.includes(searchQuery) ||
      (t.classes && t.classes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchProgress && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-700/40">
        <div className="absolute right-0 top-0 w-96 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <School className="w-3.5 h-3.5" />
              Monitoring Terpadu &bull; Guru & Pegawai Tata Usaha SMKN 3 PANGKEP
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Data Hafalan Al-Qur'an Guru & Pegawai TU
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              Panel monitoring capaian hafalan Juz 'Amma (Al-Fatihah & Juz 30 • {TOTAL_TARGET_SURAHS} Surah) untuk seluruh Guru Wali dan Pegawai Tata Usaha (GTK). Dilengkapi fitur cetak rekapitulasi resmi dengan tanda tangan Kepala UPT SMKN 3 Pangkep.
            </p>
          </div>

          {/* Action Buttons: Excel & PDF */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => exportTeacherHafalanToExcel(teachers)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
              title="Unduh Rekap Format Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Rekap Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => exportTeacherHafalanToPDF(teachers)}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-slate-950/20 cursor-pointer"
              title="Cetak Laporan Format PDF Resmi Kepala Sekolah"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Cetak Laporan PDF Resmi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Guru Terdaftar
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalGuru}</span>
            <span className="text-xs text-slate-500">Guru & Pembina</span>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-1">
            Target per guru: {TOTAL_TARGET_SURAHS} Surah
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Khatam Target (100%)
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{khatamGuru}</span>
            <span className="text-xs text-emerald-700 font-bold">Guru Tuntas</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {khatamGuru > 0 ? `${khatamGuru} guru telah khatam Juz 30` : 'Belum ada yang tuntas 100%'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sedang Berproses
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">{inProcessGuru}</span>
            <span className="text-xs text-slate-500">Guru aktif setor</span>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-1">
            {belumGuru} guru belum mulai
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Setoran Guru
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600">{totalSurahDisetor}</span>
            <span className="text-xs text-slate-500">Surah tuntas</span>
          </div>
          <p className="text-xs text-purple-600 font-medium mt-1">
            Rata-rata sekolah: {averagePercentage}%
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterProgress('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterProgress === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Guru ({totalGuru})
          </button>
          <button
            type="button"
            onClick={() => setFilterProgress('khatam')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterProgress === 'khatam'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Khatam 100% ({khatamGuru})
          </button>
          <button
            type="button"
            onClick={() => setFilterProgress('proses')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterProgress === 'proses'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Sedang Berproses ({inProcessGuru})
          </button>
          <button
            type="button"
            onClick={() => setFilterProgress('belum')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              filterProgress === 'belum'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Mulai ({belumGuru})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP, atau rombel..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Tabel Data Hafalan Seluruh Guru */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Rekapitulasi Capaian Hafalan Guru ({filteredTeachers.length} Guru)
            </h3>
            <span className="text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500">
              Target: {TOTAL_TARGET_SURAHS} Surah
            </span>
          </div>
          <span className="text-xs text-emerald-700 font-bold hidden sm:inline">
            Tanda Tangan Resmi: Kepala UPT SMKN 3 Pangkep
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center">No</th>
                <th className="py-3 px-4">Nama Guru & NIP</th>
                <th className="py-3 px-4">Kelompok / Tugas</th>
                <th className="py-3 px-4">Progres Hafalan</th>
                <th className="py-3 px-4 text-center">Persentase</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Update Terakhir</th>
                <th className="py-3 px-4 text-center">Aksi & Setoran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data guru yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, idx) => {
                  const memorized = teacher.totalMemorized ?? 0;
                  const inProcess = teacher.totalInProcess ?? 0;
                  const percentage = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);
                  const isKhatam = memorized >= TOTAL_TARGET_SURAHS;
                  const isInProcess = memorized > 0 || inProcess > 0;

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{teacher.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NIP: {teacher.nip}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {teacher.classes || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 text-xs">
                            {memorized} / {TOTAL_TARGET_SURAHS} Surah
                          </span>
                          {inProcess > 0 && (
                            <span className="text-[10px] text-amber-600 font-semibold">
                              ({inProcess} proses)
                            </span>
                          )}
                        </div>
                        <div className="w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isKhatam
                                ? 'bg-emerald-500'
                                : isInProcess
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(percentage, 2))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-800">
                        {percentage}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isKhatam ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Khatam 100%
                          </span>
                        ) : isInProcess ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" /> Berproses
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                            Belum Mulai
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {teacher.lastHafalanUpdated
                          ? new Date(teacher.lastHafalanUpdated).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTeacher(teacher)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Buka Kartu & Catat Setoran Guru"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka & Catat</span>
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

      {/* Modal Detail Kartu Guru jika dibuka oleh Admin */}
      {selectedTeacher && (
        <DetailHafalanGuruModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
};
