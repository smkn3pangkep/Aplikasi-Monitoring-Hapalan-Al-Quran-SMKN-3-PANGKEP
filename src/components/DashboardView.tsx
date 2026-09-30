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
} from 'lucide-react';
import { Teacher, Student, ActivityLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { BarChart } from './BarChart';
import { subscribeActivityLogs } from '../services/dataService';
import { TOTAL_TARGET_SURAHS } from '../data/juz30Data';

interface DashboardViewProps {
  teachers: Teacher[];
  students: Student[];
  onNavigateTab: (tab: 'bimbingan' | 'siswa' | 'kontrol_sandi') => void;
  onSelectStudent: (student: Student) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  teachers,
  students,
  onNavigateTab,
  onSelectStudent,
}) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const unsub = subscribeActivityLogs((list) => {
      setLogs(list);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const isSuperAdmin = user?.role === 'superadmin';

  // Specific students for this view
  const displayStudents = isSuperAdmin
    ? students
    : students.filter((s) => s.teacherNip === user?.nip);

  // Active Teachers count
  const activeTeachersCount = teachers.filter((t) => t.isActive).length;

  // Active Students count
  const activeStudentsCount = displayStudents.length;

  // Kelompok Hafalan (Unique Classes count)
  const uniqueClasses = Array.from(new Set(displayStudents.map((s) => s.className).filter(Boolean)));
  const kelompokCount = uniqueClasses.length;

  // Total completed surahs
  const totalMemorizedAll = displayStudents.reduce(
    (acc, curr) => acc + (Number(curr.totalMemorized) || 0),
    0
  );

  // Khatam Al-Fatihah & Juz 30 count (students with all target surahs)
  const khatamCount = displayStudents.filter(
    (s) => (Number(s.totalMemorized) || 0) >= TOTAL_TARGET_SURAHS
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-700/40">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <School className="w-3.5 h-3.5" />
            Tahun Ajaran Aktif • SMKN 3 PANGKEP
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ahlan Wa Sahlan, {user?.name}
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base mt-2 leading-relaxed">
            {isSuperAdmin
              ? 'Selamat datang di Panel Super Admin Monitoring Hafalan Al-Qur\'an Juz 30. Anda dapat memantau seluruh aktivitas guru wali, mengelola data bimbingan, dan kontrol akun.'
              : `Selamat datang di ruang bimbingan tahfidz Anda. Memantau bimbingan khusus kelas ${user?.classes || 'Anda'} dengan sinkronisasi data langsung.`}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('siswa')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <span>Buka Kartu & Daftar Siswa</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('bimbingan')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm transition border border-white/20 cursor-pointer"
            >
              <span>Input & Import Data Siswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
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

      {/* Visual Bar Chart Progres Hafalan */}
      <BarChart students={displayStudents} />

      {/* 2-Columns: Top Students Progress & Activity Log Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Quick Progress Cards */}
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

        {/* Right (1 Col): Activity Log Stream (Admin & Teacher actions) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Aktivitas Guru Wali
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
  );
};
