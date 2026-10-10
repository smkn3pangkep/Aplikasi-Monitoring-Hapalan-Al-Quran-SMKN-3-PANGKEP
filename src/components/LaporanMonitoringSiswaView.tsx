import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  Users,
  Search,
  CheckCircle2,
  Clock,
  CircleAlert,
  School,
  Sparkles,
  BookOpen,
  ArrowDownToLine,
  Eye,
} from 'lucide-react';
import { Student, Teacher } from '../types';
import { TOTAL_TARGET_SURAHS } from '../data/juz30Data';
import { useAuth } from '../context/AuthContext';
import { exportStudentHafalanToPDF } from '../utils/studentReportPDF';
import { exportStudentsToExcel } from '../utils/reportExport';

interface LaporanMonitoringSiswaViewProps {
  students: Student[];
  teachers: Teacher[];
}

export const LaporanMonitoringSiswaView: React.FC<LaporanMonitoringSiswaViewProps> = ({
  students,
  teachers,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdminStaff = user?.role === 'admin_staf';
  const canDownloadAll = isSuperAdmin || isAdminStaff;

  // Selected filters
  const [selectedTeacherNip, setSelectedTeacherNip] = useState<string>(
    canDownloadAll ? 'all' : user?.nip || ''
  );
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<'all' | 'sudah' | 'proses' | 'belum'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // List of active Guru Wali (excluding Pegawai TU without bimbingan)
  const guruWaliList = teachers.filter(
    (t) =>
      t.role !== 'pegawai_tu' &&
      !t.classes?.includes('Tata Usaha') &&
      t.nip !== '197412162025212005' &&
      t.nip !== '197508282025212006' &&
      t.nip !== '198605012025212025' &&
      t.nip !== '198009042008011007'
  );

  // Data segregation:
  // Super Admin & Admin Staf can see all students
  // Guru Wali only sees their bimbingan
  const baseStudents = canDownloadAll
    ? students
    : students.filter((s) => s.teacherNip === user?.nip);

  // Filtered students for display and report
  const filteredStudents = baseStudents.filter((s) => {
    // Filter teacher (only applicable if admin)
    const matchTeacher =
      !canDownloadAll ||
      selectedTeacherNip === 'all' ||
      s.teacherNip === selectedTeacherNip;

    const matchClass = selectedClass === 'all' || s.className === selectedClass;

    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      (s.teacherName && s.teacherName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.teacherNip && s.teacherNip.includes(searchQuery)) ||
      (s.className && s.className.toLowerCase().includes(searchQuery.toLowerCase()));

    const memorized = Number(s.totalMemorized) || 0;
    const inProcess = Number(s.totalInProcess) || 0;

    let matchProgress = true;
    if (progressFilter === 'sudah') matchProgress = memorized >= TOTAL_TARGET_SURAHS;
    else if (progressFilter === 'proses') matchProgress = (memorized > 0 && memorized < TOTAL_TARGET_SURAHS) || (memorized === 0 && inProcess > 0);
    else if (progressFilter === 'belum') matchProgress = memorized === 0 && inProcess === 0;

    return matchTeacher && matchClass && matchSearch && matchProgress;
  });

  // Extract unique classes from baseStudents
  const classList = Array.from(new Set(baseStudents.map((s) => s.className).filter(Boolean))).sort();

  // Statistics
  const totalSiswa = filteredStudents.length;
  const tuntasCount = filteredStudents.filter(
    (s) => (Number(s.totalMemorized) || 0) >= TOTAL_TARGET_SURAHS
  ).length;
  const prosesCount = filteredStudents.filter((s) => {
    const mem = Number(s.totalMemorized) || 0;
    const inp = Number(s.totalInProcess) || 0;
    return (mem > 0 && mem < TOTAL_TARGET_SURAHS) || (mem === 0 && inp > 0);
  }).length;
  const belumCount = filteredStudents.filter((s) => {
    const mem = Number(s.totalMemorized) || 0;
    const inp = Number(s.totalInProcess) || 0;
    return mem === 0 && inp === 0;
  }).length;

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      let currentTeacherName = user?.name || '';
      let currentTeacherNip = user?.nip || '';

      if (canDownloadAll) {
        if (selectedTeacherNip !== 'all') {
          const selectedT = teachers.find((t) => t.nip === selectedTeacherNip);
          if (selectedT) {
            currentTeacherName = selectedT.name;
            currentTeacherNip = selectedT.nip;
          }
        }
      }

      exportStudentHafalanToPDF(filteredStudents, {
        isAllData: canDownloadAll && selectedTeacherNip === 'all',
        guruWaliName: currentTeacherName,
        guruWaliNip: currentTeacherNip,
        selectedClass: selectedClass,
      });
    } catch (err) {
      console.error('Gagal mencetak PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExcel = () => {
    exportStudentsToExcel(filteredStudents);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-700/40">
        <div className="absolute right-0 top-0 w-96 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              Laporan Resmi &bull; SMKN 3 PANGKEP
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Laporan Hasil Monitoring Hafalan Siswa
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              Program Pembiasaan Tahfidz Al-Qur'an Juz 'Amma (Al-Fatihah & Juz 30 • {TOTAL_TARGET_SURAHS} Surah) - Per Tanggal. Dokumen format PDF resmi dilengkapi Kop UPT SMKN 3 Pangkep, rincian perolehan capaian hafalan siswa, dan tanda tangan Kepala Sekolah.
            </p>
          </div>

          {/* Action Download Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
              title="Unduh Rekap Format Microsoft Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting || filteredStudents.length === 0}
              className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-xl shadow-slate-950/20 cursor-pointer disabled:opacity-50"
              title="Unduh Laporan PDF Resmi Lengkap Tanda Tangan"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>{isExporting ? 'Menyiapkan PDF...' : 'Unduh Laporan PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Notice */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">
              {canDownloadAll
                ? 'Hak Akses Administrator (Super Admin / Admin Staf)'
                : `Hak Akses Guru Wali: ${user?.name}`}
            </span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {canDownloadAll
                ? 'Anda berwenang mengunduh seluruh data siswa maupun menyaring per Guru Wali / per Kelas.'
                : 'Laporan otomatis difilter khusus untuk anak bimbingan binaan Anda.'}
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-semibold">
          {filteredStudents.length} Siswa Terpilih
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Siswa Laporan
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalSiswa}</span>
            <span className="text-xs text-slate-500">Siswa</span>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-1">
            Target per siswa: {TOTAL_TARGET_SURAHS} Surah
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sudah Tuntas (100%)
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{tuntasCount}</span>
            <span className="text-xs text-slate-500">
              ({totalSiswa > 0 ? Math.round((tuntasCount / totalSiswa) * 100) : 0}%)
            </span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Tuntas 38 Surah Juz 30
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
            <span className="text-3xl font-black text-amber-600">{prosesCount}</span>
            <span className="text-xs text-slate-500">
              ({totalSiswa > 0 ? Math.round((prosesCount / totalSiswa) * 100) : 0}%)
            </span>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-1">
            Dalam proses setoran hafalan
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Belum Tuntas / Mulai
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <CircleAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{belumCount}</span>
            <span className="text-xs text-slate-500">
              ({totalSiswa > 0 ? Math.round((belumCount / totalSiswa) * 100) : 0}%)
            </span>
          </div>
          <p className="text-xs text-rose-600 font-medium mt-1">
            Belum ada setoran hafalan
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa, NISN, kelas, atau nama guru wali..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm outline-none transition"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Guru Wali (Only for Admin) */}
            {canDownloadAll && (
              <select
                value={selectedTeacherNip}
                onChange={(e) => setSelectedTeacherNip(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Guru Wali ({guruWaliList.length})</option>
                {guruWaliList.map((t) => (
                  <option key={t.nip} value={t.nip}>
                    {t.name} ({t.classes || 'Wali'})
                  </option>
                ))}
              </select>
            )}

            {/* Filter Kelas */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Kelas</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>

            {/* Filter Capaian */}
            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Status</option>
              <option value="sudah">Sudah Tuntas (100%)</option>
              <option value="proses">Sedang Berproses</option>
              <option value="belum">Belum Mulai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Preview Laporan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Pratinjau Data Laporan ({filteredStudents.length} Siswa)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Format kolom tabel sesuai dengan lembar cetak Laporan PDF resmi SMKN 3 Pangkep.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExporting || filteredStudents.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Unduh Laporan PDF Sekarang</span>
          </button>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <School className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">Tidak Ada Data Siswa</p>
            <p className="text-xs text-slate-400 mt-1">
              Tidak ditemukan data siswa berdasarkan kriteria filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center">No</th>
                  <th className="py-3 px-3">NIP Guru Wali</th>
                  <th className="py-3 px-3">Nama Guru Wali</th>
                  <th className="py-3 px-3">Nama Siswa</th>
                  <th className="py-3 px-3 text-center">Kelas</th>
                  <th className="py-3 px-3 text-center">Tuntas</th>
                  <th className="py-3 px-3 text-center">Hapal</th>
                  <th className="py-3 px-3 text-center">Proses</th>
                  <th className="py-3 px-3 text-center">Progres</th>
                  <th className="py-3 px-3 text-center">Status Capaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => {
                  const memorized = Number(s.totalMemorized) || 0;
                  const inProcess = Number(s.totalInProcess) || 0;
                  const pct = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);
                  const isSudah = memorized >= TOTAL_TARGET_SURAHS;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {s.teacherNip || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {s.teacherName || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {s.name}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {s.className}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {memorized} / {TOTAL_TARGET_SURAHS}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-emerald-600">
                        {memorized} Surah
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-amber-600">
                        {inProcess} Surah
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                pct >= 100
                                  ? 'bg-emerald-600'
                                  : pct > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-slate-700">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isSudah ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Sudah
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            <Clock className="w-3 h-3" /> Belum
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
