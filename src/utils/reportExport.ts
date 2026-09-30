import * as XLSX from 'xlsx';
import { Student } from '../types';
import { TOTAL_TARGET_SURAHS } from '../data/juz30Data';

export interface ReportFilterInfo {
  teacherName?: string;
  className?: string;
  filterLabel?: string;
}

/**
 * Mendapatkan predikat mutqin berdasarkan persentase capaian
 */
export function getPredicate(pct: number): string {
  if (pct >= 100) return 'Khatam Mumtaz 🎓';
  if (pct >= 75) return 'Jayyid Jiddan';
  if (pct >= 40) return 'Jayyid';
  return 'Berproses';
}

/**
 * Unduh Rekapitulasi Progres Hafalan dalam Format Excel (.XLSX)
 */
export function exportStudentsToExcel(students: Student[], filterInfo?: ReportFilterInfo): void {
  const data = students.map((s, idx) => {
    const memorized = Number(s.totalMemorized) || 0;
    const inProcess = Number(s.totalInProcess) || 0;
    const remaining = Number(s.totalRemaining) || Math.max(0, TOTAL_TARGET_SURAHS - memorized - inProcess);
    const pct = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);

    return {
      No: idx + 1,
      'Nama Siswa': s.name,
      NISN: s.nisn,
      Kelas: s.className,
      'Guru Wali': s.teacherName,
      'NIP Guru': s.teacherNip,
      'WA Orang Tua': s.parentPhone || '-',
      [`Hapal (dari ${TOTAL_TARGET_SURAHS})`]: memorized,
      Proses: inProcess,
      Belum: remaining,
      'Persentase (%)': `${pct}%`,
      Predikat: getPredicate(pct),
      'Update Terakhir': s.lastUpdated ? new Date(s.lastUpdated).toLocaleDateString('id-ID') : '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths
  const colWidths = [
    { wch: 5 }, // No
    { wch: 28 }, // Nama Siswa
    { wch: 16 }, // NISN
    { wch: 14 }, // Kelas
    { wch: 24 }, // Guru Wali
    { wch: 20 }, // NIP Guru
    { wch: 16 }, // WA
    { wch: 14 }, // Hapal
    { wch: 10 }, // Proses
    { wch: 10 }, // Belum
    { wch: 14 }, // Persentase
    { wch: 18 }, // Predikat
    { wch: 16 }, // Update
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Hafalan');

  const filename = `Rekap_Hafalan_SMKN3Pangkep_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
