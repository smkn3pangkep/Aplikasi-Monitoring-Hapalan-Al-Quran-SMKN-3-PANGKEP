import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocumentationRecord } from '../types';

export interface DocumentationFilterInfo {
  teacherFilterName?: string;
  classFilterName?: string;
  mediaTypeFilterName?: string;
}

/**
 * Format label jenis media
 */
export function formatMediaTypeLabel(type: string): string {
  switch (type) {
    case 'foto':
      return 'Foto Bukti';
    case 'video':
      return 'Video Bukti';
    case 'folder_drive':
      return 'Folder Drive';
    case 'dokumen':
      return 'Dokumen / PDF';
    default:
      return type || 'Media Drive';
  }
}

/**
 * Ekspor Rekap Dokumentasi ke file Excel (.XLSX)
 */
export function exportDocumentationsToExcel(
  items: DocumentationRecord[],
  filterInfo?: DocumentationFilterInfo
): void {
  const data = items.map((doc, idx) => ({
    No: idx + 1,
    'Tanggal Pelaksanaan': doc.date ? new Date(doc.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : '-',
    'Guru Wali': doc.teacherName,
    'NIP Guru': doc.teacherNip,
    'Kelas': doc.className,
    'Nama Siswa (Khusus)': doc.studentName || 'Seluruh Siswa Kelas',
    'Judul Kegiatan': doc.title,
    'Jenis Media': formatMediaTypeLabel(doc.mediaType),
    'Link Google Drive': doc.driveUrl,
    'Catatan / Keterangan': doc.description || '-',
    'Tanggal Input Sistem': doc.createdAt ? new Date(doc.createdAt).toLocaleString('id-ID') : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 22 }, // Tanggal Pelaksanaan
    { wch: 26 }, // Guru Wali
    { wch: 20 }, // NIP Guru
    { wch: 14 }, // Kelas
    { wch: 26 }, // Nama Siswa
    { wch: 32 }, // Judul Kegiatan
    { wch: 16 }, // Jenis Media
    { wch: 45 }, // Link Google Drive
    { wch: 30 }, // Keterangan
    { wch: 22 }, // Tanggal Input
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dokumentasi Hafalan');

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Rekap_Dokumentasi_Hafalan_SMKN3Pangkep_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Ekspor Rekap Dokumentasi ke file PDF resmi (.PDF)
 */
export function exportDocumentationsToPDF(
  items: DocumentationRecord[],
  filterInfo?: DocumentationFilterInfo
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

  // Header / Kop Laporan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('PEMERINTAH PROVINSI SULAWESI SELATAN', 148, 14, { align: 'center' });
  doc.setFontSize(16);
  doc.text('DINAS PENDIDIKAN - UPT SMKN 3 PANGKEP', 148, 21, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Alamat: Jl. Poros Pangkep, Kec. Mandalle, Kab. Pangkajene dan Kepulauan, Sulawesi Selatan',
    148,
    27,
    { align: 'center' }
  );

  // Line separator
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(1.2);
  doc.line(14, 30, 283, 30);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(14, 31.5, 283, 31.5);

  // Title of Report
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('REKAPITULASI DOKUMENTASI & BUKTI MONITORING HAFALAN AL-QUR\'AN (JUZ 30)', 148, 39, {
    align: 'center',
  });

  // Subtitle filter info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const teacherStr = filterInfo?.teacherFilterName || 'Semua Guru Wali';
  const classStr = filterInfo?.classFilterName || 'Semua Kelas';
  const mediaStr = filterInfo?.mediaTypeFilterName || 'Semua Jenis';
  doc.text(
    `Filter: Guru Wali: ${teacherStr} | Kelas: ${classStr} | Jenis Media: ${mediaStr} | Total: ${items.length} Dokumentasi`,
    148,
    44,
    { align: 'center' }
  );

  // Prepare table data
  const tableRows = items.map((item, idx) => [
    idx + 1,
    item.date || '-',
    `${item.teacherName}\nNIP: ${item.teacherNip}`,
    `${item.className}${item.studentName ? `\n(${item.studentName})` : ''}`,
    item.title,
    formatMediaTypeLabel(item.mediaType),
    item.driveUrl,
    item.description || '-',
  ]);

  // Generate table
  autoTable(doc, {
    startY: 48,
    head: [[
      'No',
      'Tanggal',
      'Guru Wali',
      'Kelas / Siswa',
      'Judul Kegiatan',
      'Jenis',
      'Link Google Drive',
      'Catatan',
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105], // emerald-600
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      valign: 'middle',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 42 },
      3: { cellWidth: 32 },
      4: { cellWidth: 48 },
      5: { halign: 'center', cellWidth: 22 },
      6: { cellWidth: 65, textColor: [37, 99, 235] }, // blue link
      7: { cellWidth: 30 },
    },
    didDrawCell: (data) => {
      // If column is Link Drive (index 6), make it a clickable hyperlink in the PDF!
      if (data.section === 'body' && data.column.index === 6) {
        const rowItem = items[data.row.index];
        if (rowItem && rowItem.driveUrl) {
          doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
            url: rowItem.driveUrl,
          });
        }
      }
    },
  });

  // Add Signatures at the bottom
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  const signatureY = Math.min(finalY + 12, 175);

  // Check if we need a new page for signatures
  if (signatureY > 175) {
    doc.addPage();
  }

  const signPageY = signatureY > 175 ? 25 : signatureY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Left signature: Guru Wali / Koordinator
  doc.text('Mengetahui / Memeriksa,', 40, signPageY);
  doc.text('Koordinator Program Tahfidz,', 40, signPageY + 5);
  doc.text('( .................................................... )', 40, signPageY + 26);
  doc.text('NIP. ..............................................', 40, signPageY + 31);

  // Right signature: Kepala Sekolah
  doc.text(`Pangkep, ${dateFormatted}`, 215, signPageY);
  doc.text('Kepala UPT SMKN 3 Pangkep,', 215, signPageY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('ANDI YUNITA, ST., M.Ars', 215, signPageY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 197506162010012017', 215, signPageY + 31);

  // Save the PDF
  const filename = `Laporan_Dokumentasi_Hafalan_SMKN3Pangkep_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
