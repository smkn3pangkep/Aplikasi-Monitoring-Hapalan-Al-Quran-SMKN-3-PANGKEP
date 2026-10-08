import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Teacher, TeacherMemorizationRecord } from '../types';
import { TOTAL_TARGET_SURAHS, JUZ_30_SURAHS } from '../data/juz30Data';

/**
 * Export Rekapitulasi Data Hafalan Seluruh Guru ke Excel (.xlsx)
 */
export function exportTeacherHafalanToExcel(teachers: Teacher[]): void {
  const data = teachers.map((t, idx) => {
    const memorized = t.totalMemorized ?? 0;
    const inProcess = t.totalInProcess ?? 0;
    const remaining = t.totalRemaining ?? Math.max(0, TOTAL_TARGET_SURAHS - memorized - inProcess);
    const percentage = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);

    let statusLabel = 'Belum Mulai';
    if (memorized >= TOTAL_TARGET_SURAHS) statusLabel = 'Khatam Juz 30 (100%)';
    else if (memorized > 0 || inProcess > 0) statusLabel = `Berproses (${percentage}%)`;

    return {
      No: idx + 1,
      'NIP': t.nip,
      'Nama Guru & Tenaga Pendidik': t.name,
      'Kelas / Kelompok Bimbingan': t.classes || '-',
      'Status Akun': t.isActive ? 'Aktif' : 'Nonaktif',
      'Target Total': `${TOTAL_TARGET_SURAHS} Surah`,
      'Surah Selesai (Tuntas)': memorized,
      'Surah Dalam Proses': inProcess,
      'Surah Belum Hapal': remaining,
      'Persentase Capaian (%)': `${percentage}%`,
      'Status Hafalan': statusLabel,
      'Terakhir Diperbarui': t.lastHafalanUpdated
        ? new Date(t.lastHafalanUpdated).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 22 }, // NIP
    { wch: 32 }, // Nama Guru
    { wch: 22 }, // Kelas
    { wch: 14 }, // Status Akun
    { wch: 14 }, // Target Total
    { wch: 22 }, // Surah Selesai
    { wch: 20 }, // Dalam Proses
    { wch: 18 }, // Belum Hapal
    { wch: 22 }, // Persentase
    { wch: 24 }, // Status Hafalan
    { wch: 22 }, // Terakhir Diperbarui
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hafalan Guru SMKN 3 Pangkep');

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Rekap_Hafalan_Guru_SMKN3Pangkep_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export Rekapitulasi Data Hafalan Seluruh Guru ke PDF Resmi (.pdf)
 * Dilengkapi Kop Resmi SMKN 3 Pangkep dan Tanda Tangan Kepala Sekolah
 */
export function exportTeacherHafalanToPDF(teachers: Teacher[]): void {
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
  doc.text('LAPORAN HASIL MONITORING HAFALAN AL-QUR\'AN GURU & TENAGA PENDIDIK', 148, 45, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Program Pembiasaan Tahfidz Al-Qur'an Juz 'Amma (Al-Fatihah & Juz 30 • ${TOTAL_TARGET_SURAHS} Surah) - Per Tanggal: ${dateFormatted}`,
    148,
    50,
    { align: 'center' }
  );

  // Ringkasan Cepat
  const totalGuru = teachers.length;
  const totalKhatam = teachers.filter((t) => (t.totalMemorized ?? 0) >= TOTAL_TARGET_SURAHS).length;
  const totalProses = teachers.filter((t) => (t.totalMemorized ?? 0) > 0 && (t.totalMemorized ?? 0) < TOTAL_TARGET_SURAHS).length;
  const totalBelum = teachers.filter((t) => (t.totalMemorized ?? 0) === 0).length;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Guru: ${totalGuru} orang   |   Khatam (100%): ${totalKhatam} orang   |   Sedang Berproses: ${totalProses} orang   |   Belum Mulai: ${totalBelum} orang`, 15, 57);

  // 3. Tabel Data Guru
  const tableData = teachers.map((t, idx) => {
    const memorized = t.totalMemorized ?? 0;
    const inProcess = t.totalInProcess ?? 0;
    const percentage = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);

    let statusText = 'Belum Mulai';
    if (memorized >= TOTAL_TARGET_SURAHS) statusText = 'Khatam 100%';
    else if (memorized > 0 || inProcess > 0) statusText = `Proses (${percentage}%)`;

    const lastUpdated = t.lastHafalanUpdated
      ? new Date(t.lastHafalanUpdated).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '-';

    return [
      idx + 1,
      t.nip,
      t.name,
      t.classes || '-',
      `${memorized} / ${TOTAL_TARGET_SURAHS}`,
      inProcess,
      `${percentage}%`,
      statusText,
      lastUpdated,
    ];
  });

  autoTable(doc, {
    startY: 61,
    head: [[
      'No',
      'NIP',
      'Nama Guru / Tenaga Pendidik',
      'Kelompok / Rombel',
      'Tuntas Hapal',
      'Proses',
      'Progres',
      'Status Capaian',
      'Update Terakhir',
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
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'left', cellWidth: 62 },
      3: { halign: 'center', cellWidth: 38 },
      4: { halign: 'center', cellWidth: 26 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 28 },
      8: { halign: 'center', cellWidth: 30 },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} • Sistem Monitoring Tahfidz Al-Qur'an SMKN 3 Pangkep`,
        148,
        202,
        { align: 'center' }
      );
    },
  });

  // 4. Area Tanda Tangan
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  const signatureY = finalY + 12;

  if (signatureY > 165) {
    doc.addPage();
  }

  const signPageY = signatureY > 165 ? 25 : signatureY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Kiri: Koordinator Program Tahfidz
  doc.text('Mengetahui / Memeriksa,', 40, signPageY);
  doc.text('Koordinator Program Tahfidz Guru,', 40, signPageY + 5);
  doc.text('( .................................................... )', 40, signPageY + 26);
  doc.text('NIP. ..............................................', 40, signPageY + 31);

  // Kanan: Kepala Sekolah Resmi
  doc.text(`Pangkep, ${dateFormatted}`, 215, signPageY);
  doc.text('Kepala UPT SMKN 3 Pangkep,', 215, signPageY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('ANDI YUNITA, ST., M.Ars', 215, signPageY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197506162010012017', 215, signPageY + 31);

  // Simpan File
  const filename = `Laporan_Hafalan_Guru_SMKN3Pangkep_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Cetak Kartu Hafalan Pribadi Milik Guru (.pdf)
 */
export function exportSingleTeacherCardToPDF(
  teacher: Teacher,
  records: TeacherMemorizationRecord[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Kop Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('UPT SMK NEGERI 3 PANGKEP', 105, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text('KARTU MONITORING HAFALAN AL-QUR\'AN GURU & TENAGA PENDIDIK', 105, 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Program Pembiasaan Tahfidz Al-Qur\'an Juz 30 (Al-Fatihah & Juz 30)', 105, 23, { align: 'center' });

  doc.setDrawColor(6, 95, 70);
  doc.setLineWidth(0.6);
  doc.line(15, 26, 195, 26);

  // Biodata Guru
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Guru / GTK', 15, 33);
  doc.text(':', 55, 33);
  doc.setFont('helvetica', 'normal');
  doc.text(teacher.name, 58, 33);

  doc.setFont('helvetica', 'bold');
  doc.text('NIP', 15, 38);
  doc.text(':', 55, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(teacher.nip, 58, 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Tugas / Kelompok Bimbingan', 15, 43);
  doc.text(':', 55, 43);
  doc.setFont('helvetica', 'normal');
  doc.text(teacher.classes || '-', 58, 43);

  // Progres Bar Text
  const memorized = records.filter((r) => r.status === 'sudah_hapal').length;
  const inProcess = records.filter((r) => r.status === 'proses_hapal').length;
  const percentage = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);

  doc.setFont('helvetica', 'bold');
  doc.text('Capaian Target', 125, 33);
  doc.text(':', 155, 33);
  doc.setFont('helvetica', 'normal');
  doc.text(`${memorized} / ${TOTAL_TARGET_SURAHS} Surah (${percentage}%)`, 158, 33);

  doc.setFont('helvetica', 'bold');
  doc.text('Status', 125, 38);
  doc.text(':', 155, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(memorized >= TOTAL_TARGET_SURAHS ? 'Khatam 100%' : `${inProcess} Surah Berproses`, 158, 38);

  // Tabel 38 Surah
  const tableData = JUZ_30_SURAHS.map((surah, idx) => {
    const rec = records.find((r) => r.surahNumber === surah.number);
    let status = 'Belum Hapal';
    if (rec?.status === 'sudah_hapal') status = 'Sudah Hapal';
    else if (rec?.status === 'proses_hapal') status = 'Proses';

    return [
      idx + 1,
      surah.number,
      `${surah.name} (${surah.arabicName})`,
      `${surah.totalAyat} Ayat`,
      status,
      rec?.grade || '-',
      rec?.listenerName || '-',
      rec?.completedDate || '-',
      rec?.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [[
      'No',
      'No Surah',
      'Nama Surah',
      'Ayat',
      'Status',
      'Nilai',
      'Penyimak',
      'Tgl Setor',
      'Catatan Tajwid/Tahsin',
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [6, 95, 70],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 14 },
      2: { halign: 'left', cellWidth: 38 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'left', cellWidth: 26 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'left', cellWidth: 22 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  let signY = finalY + 8;
  if (signY > 245) {
    doc.addPage();
    signY = 25;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Guru Bersangkutan,', 25, signY);
  doc.text(`( ${teacher.name} )`, 25, signY + 20);
  doc.text(`NIP. ${teacher.nip}`, 25, signY + 24);

  doc.text(`Pangkep, ${dateFormatted}`, 135, signY);
  doc.text('Kepala UPT SMKN 3 Pangkep,', 135, signY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('ANDI YUNITA, ST., M.Ars', 135, signY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197506162010012017', 135, signY + 24);

  doc.save(`Kartu_Hafalan_Guru_${teacher.name.replace(/\s+/g, '_')}.pdf`);
}
