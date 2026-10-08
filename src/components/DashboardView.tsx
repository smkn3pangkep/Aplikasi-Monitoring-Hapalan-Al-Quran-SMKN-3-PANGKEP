import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  School,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { Teacher, Student, ActivityLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { BarChart } from './BarChart';
import { subscribeActivityLogs } from '../services/dataService';
import { TOTAL_TARGET_SURAHS } from '../data/juz30Data';
import { NavTab } from './Navbar';
import { exportTeacherHafalanToExcel, exportTeacherHafalanToPDF } from '../utils/teacherHafalanExport';

interface DashboardViewProps {
  teachers: Teacher[];
  students: Student[];
  onNavigateTab: (tab: NavTab) => void;
  onSelectStudent: (student: Student) => void;
  onSelectTeacher?: (teacher: Teacher) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  teachers,
  students,
  onNavigateTab,
  onSelectStudent,
  onSelectTeacher,
}) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdminStaff = user?.role === 'admin_staf';
  const isPegawaiTu = user?.role === 'pegawai_tu' || user?.classes?.includes('Tata Usaha');
  const canViewAll = isSuperAdmin || isAdminStaff;

  const [dashboardScope, setDashboardScope] = useState<'siswa' | 'guru'>(isPegawaiTu ? 'guru' : 'siswa');

  useEffect(() => {
    const unsub = subscribeActivityLogs((list) => {
      setLogs(list);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Specific students for this view
  const displayStudents = canViewAll
    ? students
    : students.filter((s) => s.teacherNip === user?.nip);

  // Active Teachers count
  const activeTeachersCount = teachers.filter((t) => t.isActive).length;

  // Active Students count
  const activeStudentsCount = displayStudents.length;

  // Kelompok Hafalan (Unique Classes count)
  const uniqueClasses = Array.from(new Set(displayStudents.map((s) => s.className).filter(Boolean)));
  const kelompokCount = uniqueClasses.length;

  // Total completed surahs by students
  const totalMemorizedAll = displayStudents.reduce(
    (acc, curr) => acc + (Number(curr.totalMemorized) || 0),
    0
  );

  // Khatam Al-Fatihah & Juz 30 count (students)
  const khatamCount = displayStudents.filter(
    (s) => (Number(s.totalMemorized) || 0) >= TOTAL_TARGET_SURAHS
  ).length;

  // Teacher statistics for Kepala Sekolah & Admin
  const totalGuru = teachers.length;
  const khatamGuru = teachers.filter((t) => (t.totalMemorized ?? 0) >= TOTAL_TARGET_SURAHS).length;
  const inProcessGuru = teachers.filter(
    (t) => (t.totalMemorized ?? 0) > 0 && (t.totalMemorized ?? 0) < TOTAL_TARGET_SURAHS
  ).length;
  const belumGuru = teachers.filter((t) => (t.totalMemorized ?? 0) === 0).length;
  const totalSurahGuru = teachers.reduce((acc, curr) => acc + (curr.totalMemorized ?? 0), 0);
  const avgGuruPercentage = totalGuru > 0
    ? Math.round((totalSurahGuru / (totalGuru * TOTAL_TARGET_SURAHS)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-700/40">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <School className="w-3.5 h-3.5" />
            Tahun Ajaran Aktif &bull; SMKN 3 PANGKEP
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ahlan Wa Sahlan, {user?.name}
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base mt-2 leading-relaxed">
            {canViewAll
              ? 'Selamat datang di Panel Monitoring Hafalan Al-Qur\'an Juz 30. Anda dapat memantau dua capaian terpadu: Progres Tahfidz Siswa dan Capaian Tahfidz Guru & Tenaga Pendidik.'
              : isPegawaiTu
              ? 'Selamat datang di Panel Monitoring Hafalan Al-Qur\'an Pegawai Tata Usaha SMKN 3 Pangkep. Anda dapat mencatat dan memantau kemajuan hafalan Juz 30 dan Surah Al-Fatihah pribadi Anda.'
              : `Selamat datang di ruang bimbingan tahfidz Anda. Memantau bimbingan khusus kelas ${user?.classes || 'Anda'} serta memantau progres hafalan pribadi Anda.`}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('baca_quran')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Ayo Baca Qur'an</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab(canViewAll ? 'monitoring_guru' : 'hafalan_saya')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm transition border border-white/20 cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{canViewAll ? 'Data Hafalan Guru' : 'Hafalan Saya'}</span>
            </button>
            {!isPegawaiTu && (
              <button
                type="button"
                onClick={() => onNavigateTab('bimbingan')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm transition border border-white/20 cursor-pointer"
              >
                <span>Data Bimbingan Siswa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scope Switcher: Capaian Siswa vs Capaian Guru */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setDashboardScope('siswa')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              dashboardScope === 'siswa'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Capaian Tahfidz Siswa ({activeStudentsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardScope('guru')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              dashboardScope === 'guru'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Capaian Tahfidz Guru & GTK ({totalGuru})</span>
          </button>
        </div>

        {dashboardScope === 'guru' && canViewAll && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => exportTeacherHafalanToExcel(teachers)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Guru</span>
            </button>
            <button
              type="button"
              onClick={() => exportTeacherHafalanToPDF(teachers)}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Resmi Guru</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW: CAPAIAN SISWA */}
      {dashboardScope === 'siswa' && (
        <div className="space-y-6">
          {/* 4 Stat Cards Siswa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Guru Wali Aktif */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Guru Wali Aktif
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{activeTeachersCount}</span>
                <span className="text-xs text-slate-500">Ustadz/Ustadzah</span>
              </div>
              <p className="text-xs text-blue-600 font-medium mt-1">
                {isSuperAdmin ? 'Total pembimbing terdaftar di sistem' : 'Guru pembimbing aktif'}
              </p>
            </div>

            {/* Stat 2: Siswa Aktif */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Siswa Terbimbing
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{activeStudentsCount}</span>
                <span className="text-xs text-slate-500">Santri / Siswa</span>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {isSuperAdmin ? 'Seluruh siswa di SMKN 3 Pangkep' : 'Siswa bimbingan khusus Anda'}
              </p>
            </div>

            {/* Stat 3: Kelompok Hafalan */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Kelompok Hafalan
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{kelompokCount}</span>
                <span className="text-xs text-slate-500">Kelas / Halaqah</span>
              </div>
              <p className="text-xs text-amber-600 font-medium mt-1">
                DPIB, TITL, TJKT
              </p>
            </div>

            {/* Stat 4: Khatam Al-Fatihah & Juz 30 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Khatam Target ({TOTAL_TARGET_SURAHS} Surah)
                </span>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{khatamCount}</span>
                <span className="text-xs text-purple-600 font-bold">Siswa Tuntas 100%</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Total {totalMemorizedAll} surah telah disetorkan
              </p>
            </div>
          </div>

          {/* Visual Bar Chart Progres Hafalan Siswa */}
          <BarChart students={displayStudents} />

          {/* 2-Columns: Top Students Progress & Activity Log Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left (2 Cols): Quick Progress Cards Siswa */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Daftar Siswa Terdepan (Progres Tertinggi)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Klik salah satu siswa untuk langsung membuka kartu hafalan Al-Fatihah & Juz 30
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('siswa')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {[...displayStudents]
                  .sort((a, b) => (Number(b.totalMemorized) || 0) - (Number(a.totalMemorized) || 0))
                  .slice(0, 5)
                  .map((student) => {
                    const memorized = Number(student.totalMemorized) || 0;
                    const pct = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);
                    return (
                      <div
                        key={student.id}
                        onClick={() => onSelectStudent(student)}
                        className="p-3.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-800 transition">
                              {student.name}
                            </span>
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                              {student.className}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            NISN: {student.nisn} &bull; Guru: {student.teacherName}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700">
                              {memorized} / {TOTAL_TARGET_SURAHS} Surah
                            </span>
                            <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full bg-emerald-500 rounded-full"
                              />
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-slate-700 w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right (1 Col): Activity Log Stream */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Aktivitas Terkini
                </h3>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md">
                  Real-Time
                </span>
              </div>

              <div className="space-y-3.5 overflow-y-auto max-h-[360px] pr-1">
                {logs.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">
                    Belum ada rekaman aktivitas terbaru.
                  </p>
                ) : (
                  logs.map((log) => {
                    const dateObj = new Date(log.timestamp);
                    const timeStr = dateObj.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={log.id} className="text-xs space-y-1 pb-3 border-b border-slate-50 last:border-0">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                            {log.actorName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{timeStr}</span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {log.description}
                        </p>
                        <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CAPAIAN GURU & GTK */}
      {dashboardScope === 'guru' && (
        <div className="space-y-6">
          {/* 4 Stat Cards Guru */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Guru Wali / GTK
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{totalGuru}</span>
                <span className="text-xs text-slate-500">Orang</span>
              </div>
              <p className="text-xs text-blue-600 font-medium mt-1">
                Target: {TOTAL_TARGET_SURAHS} Surah per guru
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Guru Khatam 100%
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600">{khatamGuru}</span>
                <span className="text-xs text-emerald-700 font-bold">Khatam Juz 30</span>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {khatamGuru > 0 ? `${khatamGuru} guru telah menyelesaikan 38 surah` : 'Sedang berproses'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
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
                <span className="text-xs text-slate-500">Guru aktif</span>
              </div>
              <p className="text-xs text-amber-600 font-medium mt-1">
                {belumGuru} guru belum memulai
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Setoran Guru
                </span>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-600">{totalSurahGuru}</span>
                <span className="text-xs text-slate-500">Surah tuntas</span>
              </div>
              <p className="text-xs text-purple-600 font-medium mt-1">
                Capaian rata-rata dewan guru: {avgGuruPercentage}%
              </p>
            </div>
          </div>

          {/* Ranking & Progres Guru */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Peringkat Capaian Hafalan Guru & Tenaga Pendidik
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Progres hafalan Al-Fatihah dan Juz 30 dewan guru SMKN 3 Pangkep.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab(canViewAll ? 'monitoring_guru' : 'hafalan_saya')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <span>{canViewAll ? 'Lihat Semua & Catat Setoran' : 'Buka Hafalan Saya'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {[...teachers]
                .sort((a, b) => (b.totalMemorized ?? 0) - (a.totalMemorized ?? 0))
                .map((t, idx) => {
                  const memorized = t.totalMemorized ?? 0;
                  const pct = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                              {t.classes || '-'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 font-mono">
                            NIP: {t.nip}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-700">
                            {memorized} / {TOTAL_TARGET_SURAHS} Surah
                          </span>
                          <div className="w-32 sm:w-44 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div
                              style={{ width: `${Math.min(100, Math.max(pct, 2))}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-700 w-12 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
