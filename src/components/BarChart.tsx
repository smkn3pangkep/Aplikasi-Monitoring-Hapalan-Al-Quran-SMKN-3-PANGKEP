import React, { useState } from 'react';
import { Student } from '../types';
import { TOTAL_TARGET_SURAHS } from '../data/juz30Data';

interface BarChartProps {
  students: Student[];
}

export const BarChart: React.FC<BarChartProps> = ({ students }) => {
  const [viewMode, setViewMode] = useState<'class' | 'distribution'>('class');

  // Compute breakdown per Class
  const classMap = new Map<
    string,
    { className: string; studentsCount: number; totalMemorized: number; totalInProcess: number; totalRemaining: number }
  >();

  (students || []).forEach((s) => {
    if (!s) return;
    const cName = s.className || 'Tanpa Kelas';
    if (!classMap.has(cName)) {
      classMap.set(cName, {
        className: cName,
        studentsCount: 0,
        totalMemorized: 0,
        totalInProcess: 0,
        totalRemaining: 0,
      });
    }
    const item = classMap.get(cName)!;
    item.studentsCount += 1;
    item.totalMemorized += Number(s.totalMemorized) || 0;
    item.totalInProcess += Number(s.totalInProcess) || 0;
    item.totalRemaining += Number(s.totalRemaining) || 0;
  });

  const classData = Array.from(classMap.values());

  // Compute overall distribution
  let totalSudah = 0;
  let totalProses = 0;
  let totalBelum = 0;
  (students || []).forEach((s) => {
    if (!s) return;
    totalSudah += Number(s.totalMemorized) || 0;
    totalProses += Number(s.totalInProcess) || 0;
    totalBelum += Number(s.totalRemaining) || 0;
  });

  const grandTotal = totalSudah + totalProses + totalBelum || 1;
  const pctSudah = Math.round((totalSudah / grandTotal) * 100);
  const pctProses = Math.round((totalProses / grandTotal) * 100);
  const pctBelum = Math.max(0, 100 - pctSudah - pctProses);

  // For Class chart, find maximum surah count to scale safely
  const maxSurahsPerClass =
    classData.length > 0
      ? Math.max(
          ...classData.map((c) =>
            Math.max(c.totalMemorized || 0, c.totalInProcess || 0, c.totalRemaining || 0)
          ),
          20
        )
      : 20;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Grafik Visual Progres Hafalan Siswa (Al-Fatihah & Juz 30)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Akumulasi capaian surah (total {TOTAL_TARGET_SURAHS} surah per siswa)
          </p>
        </div>

        {/* View mode toggle */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('class')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'class' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perbandingan Kelas
          </button>
          <button
            type="button"
            onClick={() => setViewMode('distribution')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'distribution' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Distribusi Keseluruhan
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 mb-6 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
          <span>Sudah Hapal (Tuntas)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-400" />
          <span>Sedang Proses Hapal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-rose-300" />
          <span>Belum Hapal</span>
        </div>
      </div>

      {viewMode === 'class' ? (
        <div className="space-y-5">
          {classData.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Belum ada data siswa untuk ditampilkan pada grafik.
            </div>
          ) : (
            classData.map((cls) => {
              const maxPossible = cls.studentsCount * TOTAL_TARGET_SURAHS || 1;
              const sudahPct = Math.round((cls.totalMemorized / maxPossible) * 100);
              const prosesPct = Math.round((cls.totalInProcess / maxPossible) * 100);
              const belumPct = Math.max(0, 100 - sudahPct - prosesPct);

              return (
                <div key={cls.className} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {cls.className} <span className="font-normal text-slate-500">({cls.studentsCount} siswa)</span>
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {cls.totalMemorized} Surah Tuntas ({sudahPct}%)
                    </span>
                  </div>

                  {/* Multi-segmented Stacked Bar */}
                  <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${sudahPct}%` }}
                      className="bg-emerald-500 transition-all duration-500 hover:brightness-105 flex items-center justify-center text-[10px] text-white font-bold"
                      title={`Sudah Hapal: ${cls.totalMemorized} surah`}
                    >
                      {sudahPct > 8 && `${cls.totalMemorized}`}
                    </div>
                    <div
                      style={{ width: `${prosesPct}%` }}
                      className="bg-amber-400 transition-all duration-500 hover:brightness-105 flex items-center justify-center text-[10px] text-slate-900 font-bold"
                      title={`Proses Hapal: ${cls.totalInProcess} surah`}
                    >
                      {prosesPct > 8 && `${cls.totalInProcess}`}
                    </div>
                    <div
                      style={{ width: `${belumPct}%` }}
                      className="bg-rose-200 transition-all duration-500 hover:brightness-105 flex items-center justify-center text-[10px] text-rose-800 font-bold"
                      title={`Belum Hapal: ${cls.totalRemaining} surah`}
                    >
                      {belumPct > 8 && `${cls.totalRemaining}`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Overall distribution breakdown */
        <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Sudah Hapal (Tuntas)
              </span>
              <div className="text-3xl font-extrabold text-emerald-700 mt-1">{totalSudah}</div>
              <p className="text-xs text-emerald-600 mt-0.5">Surah diselesaikan ({pctSudah}%)</p>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Dalam Proses Hapal
              </span>
              <div className="text-3xl font-extrabold text-amber-700 mt-1">{totalProses}</div>
              <p className="text-xs text-amber-600 mt-0.5">Surah sedang dibimbing ({pctProses}%)</p>
            </div>

            <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 text-center">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Belum Hapal
              </span>
              <div className="text-3xl font-extrabold text-rose-700 mt-1">{totalBelum}</div>
              <p className="text-xs text-rose-600 mt-0.5">Surah tersisa ({pctBelum}%)</p>
            </div>
          </div>

          {/* Large Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Rasio Keseluruhan Hafalan Siswa</span>
              <span>Total {grandTotal} Surah Target</span>
            </div>
            <div className="h-7 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${pctSudah}%` }}
                className="bg-emerald-500 flex items-center justify-center text-xs text-white font-bold"
              >
                {pctSudah > 5 ? `${pctSudah}%` : ''}
              </div>
              <div
                style={{ width: `${pctProses}%` }}
                className="bg-amber-400 flex items-center justify-center text-xs text-slate-900 font-bold"
              >
                {pctProses > 5 ? `${pctProses}%` : ''}
              </div>
              <div
                style={{ width: `${pctBelum}%` }}
                className="bg-rose-200 flex items-center justify-center text-xs text-rose-800 font-bold"
              >
                {pctBelum > 5 ? `${pctBelum}%` : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
