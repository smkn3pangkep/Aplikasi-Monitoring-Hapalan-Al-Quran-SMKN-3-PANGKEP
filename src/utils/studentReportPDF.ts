import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student } from '../types';
import { TOTAL_TARGET_SURAHS } from '../data/juz30Data';

export interface StudentReportPDFOptions {
  guruWaliName?: string;
  guruWaliNip?: string;
  selectedClass?: string;
  isAllData?: boolean; // true for superadmin / admin_staf
  titleSuffix?: string;
}

/**
 * Ekspor LAPORAN HASIL MONITORING HAFALAN SISWA ke PDF Resmi
 * Sesuai format standar SMKN 3 Pangkep:
 * - Kop Surat Resmi UPT SMKN 3 Pangkep
 * - Judul: LAPORAN HASIL MONITORING HAFALAN SISWA
 * - Subjudul: Program Pembiasaan Tahfidz Al-Qur'an Juz 'Amma (Al-Fatihah & Juz 30 • 38 Surah) - Per Tanggal: [tanggal]
 * - Kolom tabel: No, NIP Guru Wali, Nama Guru Wali, Nama Siswa, Kelas, Tuntas, Hapal, Proses, Progres (%), Status Capaian (Sudah / Belum)
 * - Tanda Tangan: Koordinator / Guru Wali (kiri) & Kepala UPT SMKN 3 Pangkep (kanan) beserta tanggal di bagian akhir
 */
export function exportStudentHafalanToPDF(
  students: Student[],
  options?: StudentReportPDFOptions
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // 1. Kop Surat Resmi SMKN 3 Pangkep
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('PEMERINTAH PROVINSI SULAWESI SELATAN', 148, 14, { align: 'center' });
  doc.text('DINAS PENDIDIKAN', 148, 19, { align: 'center' });
  doc.setFontSize(13);
  doc.text('UPT SMK NEGERI 3 PANGKEP', 148, 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Alamat: Jl. Poros Minasatene, Kec. Minasatene, Kab. Pangkajene dan Kepulauan, Sulawesi Selatan',
    148,
    30,
    { align: 'center' }
  );
  doc.text(
    'Laman: smkn3pangkep.sch.id • Email: smkn3pangkep@gmail.com • Akreditasi A',
    148,
    34,
    { align: 'center' }
  );

  // Garis Kop Ganda
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(15, 37, 282, 37);
  doc.setLineWidth(0.2);
  doc.line(15, 38.2, 282, 38.2);

  // 2. Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN HASIL MONITORING HAFALAN SISWA', 148, 45, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Program Pembiasaan Tahfidz Al-Qur'an Juz 'Amma (Al-Fatihah & Juz 30 • ${TOTAL_TARGET_SURAHS} Surah) - Per Tanggal: ${dateFormatted}`,
    148,
    50,
    { align: 'center' }
  );

  // Keterangan Lingkup Data
  let scopeInfo = options?.isAllData
    ? 'Cakupan: Seluruh Siswa & Guru Pembimbing SMKN 3 Pangkep'
    : `Cakupan: Bimbingan ${options?.guruWaliName || 'Guru Wali'}${options?.guruWaliNip ? ` (NIP. ${options.guruWaliNip})` : ''}`;
  if (options?.selectedClass && options.selectedClass !== 'all') {
    scopeInfo += ` • Kelas: ${options.selectedClass}`;
  }

  // Ringkasan Statistik
  const totalSiswa = students.length;
  const totalTuntas = students.filter(
    (s) => (Number(s.totalMemorized) || 0) >= TOTAL_TARGET_SURAHS
  ).length;
  const totalProses = students.filter((s) => {
    const mem = Number(s.totalMemorized) || 0;
    const inp = Number(s.totalInProcess) || 0;
    return (mem > 0 && mem < TOTAL_TARGET_SURAHS) || (mem === 0 && inp > 0);
  }).length;
  const totalBelum = students.filter((s) => {
    const mem = Number(s.totalMemorized) || 0;
    const inp = Number(s.totalInProcess) || 0;
    return mem === 0 && inp === 0;
  }).length;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(
    `${scopeInfo}   |   Total: ${totalSiswa} Siswa (Tuntas: ${totalTuntas}, Proses: ${totalProses}, Belum Mulai: ${totalBelum})`,
    15,
    56
  );

  // 3. Tabel Data Siswa
  const tableData = students.map((s, idx) => {
    const memorized = Number(s.totalMemorized) || 0;
    const inProcess = Number(s.totalInProcess) || 0;
    const pct = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);

    // Status Capaian: Sudah (jika tuntas 38) / Belum (jika belum 38)
    const isSudahTuntas = memorized >= TOTAL_TARGET_SURAHS;
    const statusCapaian = isSudahTuntas ? 'Sudah Tuntas' : 'Belum Tuntas';

    return [
      idx + 1,
      s.teacherNip || '-',
      s.teacherName || '-',
      s.name,
      s.className || '-',
      `${memorized} / ${TOTAL_TARGET_SURAHS}`, // Tuntas (berapa)
      `${memorized} Surah`, // Hapal
      `${inProcess} Surah`, // Proses
      `${pct}%`, // Progres
      statusCapaian, // Status Capaian (belum/sudah)
    ];
  });

  autoTable(doc, {
    startY: 60,
    head: [[
      'No',
      'NIP Guru Wali',
      'Nama Guru Wali',
      'Nama Siswa',
      'Kelas',
      'Tuntas',
      'Hapal',
      'Proses',
      'Progres',
      'Status Capaian',
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [6, 95, 70], // Emerald 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 32 },
      2: { halign: 'left', cellWidth: 42 },
      3: { halign: 'left', cellWidth: 48 },
      4: { halign: 'center', cellWidth: 26 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 18 },
      9: { halign: 'center', cellWidth: 29 },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} • Sistem Monitoring Tahfidz Al-Qur'an SMKN 3 Pangkep • Laporan Hasil Monitoring Siswa`,
        148,
        202,
        { align: 'center' }
      );
    },
  });

  // 4. Area Tanda Tangan & Tanggal di bagian akhir
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  const signatureY = finalY + 12;

  if (signatureY > 165) {
    doc.addPage();
  }

  const signPageY = signatureY > 165 ? 25 : signatureY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Kiri: Guru Wali atau Koordinator
  if (options?.isAllData) {
    doc.text('Mengetahui / Memeriksa,', 40, signPageY);
    doc.text('Koordinator Program Pembiasaan Tahfidz,', 40, signPageY + 5);
    doc.text('( .................................................... )', 40, signPageY + 26);
    doc.text('NIP. ..............................................', 40, signPageY + 31);
  } else {
    doc.text('Mengetahui / Memeriksa,', 40, signPageY);
    doc.text('Guru Wali / Pembimbing,', 40, signPageY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(options?.guruWaliName ? options.guruWaliName : '( .................................................... )', 40, signPageY + 26);
    doc.setFont('helvetica', 'normal');
    doc.text(options?.guruWaliNip ? `NIP. ${options.guruWaliNip}` : 'NIP. ..............................................', 40, signPageY + 31);
  }

  // Kanan: Tanggal & Kepala Sekolah Resmi UPT SMKN 3 Pangkep
  doc.text(`Pangkep, ${dateFormatted}`, 215, signPageY);
  doc.text('Kepala UPT SMKN 3 Pangkep,', 215, signPageY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('ANDI YUNITA, ST., M.Ars', 215, signPageY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197506162010012017', 215, signPageY + 31);

  // Simpan File
  const fileDate = now.toISOString().slice(0, 10);
  const cleanName = (options?.guruWaliName || 'Semua_Siswa').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Monitoring_Hafalan_Siswa_${cleanName}_${fileDate}.pdf`;
  doc.save(filename);
}
