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
  MessageCircle,
  Share2,
  Copy,
  Check,
  Send,
  Phone,
  ExternalLink,
  X,
  Award,
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

  // WhatsApp Modal States
  const [showWaModal, setShowWaModal] = useState<boolean>(false);
  const [waReportMode, setWaReportMode] = useState<'rekap_guru' | 'rekap_siswa'>('rekap_guru');
  const [selectedStudentForWa, setSelectedStudentForWa] = useState<Student | null>(null);
  const [waTargetPhone, setWaTargetPhone] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

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

  // ----------------------------------------------------
  // GENERATOR PESAN WHATSAPP MONITORING HAFALAN
  // ----------------------------------------------------

  const generateTeacherMonitoringWaReport = (mode: 'rekap_guru' | 'rekap_siswa'): string => {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const total = filteredStudents.length;
    const tuntas = tuntasCount;
    const proses = prosesCount;
    const belum = belumCount;

    const pctTuntas = total > 0 ? Math.round((tuntas / total) * 100) : 0;
    const pctProses = total > 0 ? Math.round((proses / total) * 100) : 0;
    const pctBelum = total > 0 ? Math.round((belum / total) * 100) : 0;

    const totalMemorizedAll = filteredStudents.reduce((acc, s) => acc + (Number(s.totalMemorized) || 0), 0);
    const avgSurah = total > 0 ? (totalMemorizedAll / total).toFixed(1) : '0';
    const avgPct = total > 0 ? Math.round((totalMemorizedAll / (total * TOTAL_TARGET_SURAHS)) * 100) : 0;

    // Filter scope info
    const isAllTeacher = !canDownloadAll || selectedTeacherNip === 'all';
    const selectedTeacherObj = teachers.find((t) => t.nip === selectedTeacherNip);
    const teacherScopeLabel = isAllTeacher
      ? `Seluruh Guru Wali (${guruWaliList.length} Pembimbing)`
      : `${selectedTeacherObj?.name || 'Guru Wali'} (NIP. ${selectedTeacherNip})`;

    const classScopeLabel = selectedClass === 'all' ? 'Semua Kelas' : `Kelas ${selectedClass}`;

    // Grouping per Guru Wali
    const teacherStatsMap = new Map<string, {
      nip: string;
      name: string;
      classes: string;
      total: number;
      tuntas: number;
      proses: number;
      belum: number;
      memorizedSurahs: number;
    }>();

    filteredStudents.forEach((s) => {
      const nip = s.teacherNip || 'unassigned';
      if (!teacherStatsMap.has(nip)) {
        teacherStatsMap.set(nip, {
          nip,
          name: s.teacherName || 'Guru Pembimbing',
          classes: s.className || '',
          total: 0,
          tuntas: 0,
          proses: 0,
          belum: 0,
          memorizedSurahs: 0,
        });
      }
      const stat = teacherStatsMap.get(nip)!;
      stat.total += 1;
      const mem = Number(s.totalMemorized) || 0;
      const inp = Number(s.totalInProcess) || 0;
      stat.memorizedSurahs += mem;
      if (mem >= TOTAL_TARGET_SURAHS) stat.tuntas += 1;
      else if (mem > 0 || inp > 0) stat.proses += 1;
      else stat.belum += 1;
    });

    const teacherStatsList = Array.from(teacherStatsMap.values()).sort((a, b) => {
      const pctA = a.total > 0 ? a.tuntas / a.total : 0;
      const pctB = b.total > 0 ? b.tuntas / b.total : 0;
      return pctB - pctA;
    });

    let message = `*LAPORAN RINGKAS MONITORING HAFALAN SISWA*\n`;
    message += `*UPT SMKN 3 PANGKEP - TAHFIDZ JUZ 30*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📅 *Tanggal:* ${todayStr}\n`;
    message += `👨‍🏫 *Guru Pembimbing:* ${teacherScopeLabel}\n`;
    message += `🏫 *Kelas:* ${classScopeLabel}\n`;
    message += `👥 *Total Siswa Terpantau:* ${total} Siswa\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    message += `📊 *RINGKASAN CAPAIAN PROGRES HAFALAN:*\n`;
    message += `• Target: ${TOTAL_TARGET_SURAHS} Surah (Al-Fatihah & Juz 30)\n`;
    message += `• ✅ *Sudah Tuntas (100%)* : ${tuntas} Siswa (${pctTuntas}%)\n`;
    message += `• ⏳ *Sedang Berproses* : ${proses} Siswa (${pctProses}%)\n`;
    message += `• 📖 *Belum Mulai* : ${belum} Siswa (${pctBelum}%)\n`;
    message += `• 📈 *Rata-rata Capaian* : ${avgSurah} Surah / Siswa (${avgPct}%)\n\n`;

    if (mode === 'rekap_guru') {
      message += `👨‍🏫 *PROGRES PEMBIASAAN PER GURU WALI:*\n`;
      if (teacherStatsList.length === 0) {
        message += `_(Tidak ada data guru pembimbing)_\n\n`;
      } else {
        teacherStatsList.forEach((t, i) => {
          const tPct = t.total > 0 ? Math.round((t.tuntas / t.total) * 100) : 0;
          message += `${i + 1}. *${t.name}*\n`;
          message += `   • Siswa Bimbingan: ${t.total} Siswa\n`;
          message += `   • Capaian: ✅ ${t.tuntas} Tuntas | ⏳ ${t.proses} Proses | 📖 ${t.belum} Belum\n`;
          message += `   • Persentase Tuntas: *${tPct}%*\n\n`;
        });
      }

      // Top 5 students with highest memorization
      const topStudents = [...filteredStudents]
        .sort((a, b) => (Number(b.totalMemorized) || 0) - (Number(a.totalMemorized) || 0))
        .slice(0, 5);

      if (topStudents.length > 0) {
        message += `🌟 *SISWA DENGAN PROGRES HAFALAN TERTINGGI:*\n`;
        topStudents.forEach((s, idx) => {
          const mem = Number(s.totalMemorized) || 0;
          const pct = Math.round((mem / TOTAL_TARGET_SURAHS) * 100);
          message += `${idx + 1}. *${s.name}* (${s.className}) : ${mem} Surah (${pct}%)\n`;
        });
        message += `\n`;
      }
    } else {
      // Mode rekap per siswa
      message += `📋 *RINCIAN PERKEMBANGAN SISWA:*\n`;
      if (filteredStudents.length === 0) {
        message += `_(Tidak ada data siswa)_\n\n`;
      } else {
        const displayStudents = filteredStudents.slice(0, 35);
        displayStudents.forEach((s, i) => {
          const mem = Number(s.totalMemorized) || 0;
          const inp = Number(s.totalInProcess) || 0;
          const pct = Math.round((mem / TOTAL_TARGET_SURAHS) * 100);
          const icon = mem >= TOTAL_TARGET_SURAHS ? '✅' : mem > 0 || inp > 0 ? '⏳' : '📖';
          message += `${i + 1}. ${icon} *${s.name}* (${s.className})\n`;
          message += `   • Hapal: ${mem}/${TOTAL_TARGET_SURAHS} Surah (${pct}%) | Guru: ${s.teacherName || '-'}\n`;
        });
        if (filteredStudents.length > 35) {
          message += `_...dan ${filteredStudents.length - 35} siswa lainnya terlampir dalam sistem._\n\n`;
        } else {
          message += `\n`;
        }
      }
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📌 *Catatan:* Monitoring pembiasaan hafalan dilaksanakan secara berkala oleh Guru Wali Pembimbing SMKN 3 Pangkep untuk menguatkan karakter religius siswa.\n\n`;
    message += `_Admin Sistem Monitoring Tahfidz Al-Qur'an_\n`;
    message += `_SMKN 3 PANGKEP (Pangkajene dan Kepulauan)_`;

    return message;
  };

  const generateSingleStudentWaMessage = (student: Student): string => {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const memorized = Number(student.totalMemorized) || 0;
    const inProcess = Number(student.totalInProcess) || 0;
    const remaining = Math.max(0, TOTAL_TARGET_SURAHS - memorized - inProcess);
    const pct = Math.round((memorized / TOTAL_TARGET_SURAHS) * 100);

    return `*LAPORAN PERKEMBANGAN HAFALAN SISWA*\n` +
      `*SMKN 3 PANGKEP - TAHFIDZ JUZ 30*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Tanggal:* ${todayStr}\n\n` +
      `Kepada Yth. Bapak/Ibu Wali Murid dari:\n` +
      `• *Nama Siswa* : ${student.name}\n` +
      `• *NISN* : ${student.nisn}\n` +
      `• *Kelas* : ${student.className}\n` +
      `• *Guru Wali Pembimbing* : ${student.teacherName || '-'}\n\n` +
      `Berikut kami sampaikan ringkasan capaian hafalan Al-Qur'an (Al-Fatihah & Juz 30):\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *Sudah Hapal (Tuntas)* : ${memorized} dari ${TOTAL_TARGET_SURAHS} Surah (${pct}%)\n` +
      `⏳ *Dalam Proses Bimbingan* : ${inProcess} Surah\n` +
      `📖 *Belum Dihafal* : ${remaining} Surah\n\n` +
      `Mohon dukungan dan doa dari Bapak/Ibu di rumah agar ananda senantiasa istiqomah dan lancar menghafal Al-Qur'an.\n\n` +
      `_Admin Monitoring Tahfidz SMKN 3 Pangkep_`;
  };

  const getActiveWaMessage = (): string => {
    if (selectedStudentForWa) {
      return generateSingleStudentWaMessage(selectedStudentForWa);
    }
    return generateTeacherMonitoringWaReport(waReportMode);
  };

  const copyWaText = () => {
    navigator.clipboard.writeText(getActiveWaMessage());
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const openWhatsAppUrl = () => {
    const text = encodeURIComponent(getActiveWaMessage());
    let phone = (waTargetPhone || (selectedStudentForWa?.parentPhone || '')).replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleShareNative = async () => {
    const text = getActiveWaMessage();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Laporan Ringkas Monitoring Hafalan Siswa SMKN 3 Pangkep',
          text,
        });
      } catch (err) {
        console.log('Share canceled or error', err);
      }
    } else {
      copyWaText();
    }
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
              Program Pembiasaan Tahfidz Al-Qur'an Juz 'Amma (Al-Fatihah & Juz 30 • {TOTAL_TARGET_SURAHS} Surah) - Per Tanggal. Dilengkapi laporan format WhatsApp untuk komunikasi cepat, berkas PDF resmi bertanda tangan, dan rekap Excel.
            </p>
          </div>

          {/* Action Download & WA Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tombol Laporan WhatsApp */}
            <button
              type="button"
              onClick={() => {
                setSelectedStudentForWa(null);
                setWaReportMode('rekap_guru');
                setWaTargetPhone('');
                setShowWaModal(true);
              }}
              disabled={filteredStudents.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              title="Kirim atau Salin Laporan Ringkas via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-slate-950 fill-slate-950/20" />
              <span>Laporan WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-4 py-2.5 rounded-2xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
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
                ? 'Anda berwenang mengunduh seluruh data siswa, menyaring per Guru Wali / per Kelas, dan membagikan laporan ringkas WhatsApp.'
                : 'Laporan otomatis difilter khusus untuk anak bimbingan binaan Anda.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedStudentForWa(null);
              setWaReportMode('rekap_guru');
              setWaTargetPhone('');
              setShowWaModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Bagikan Ringkasan WA</span>
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-semibold">
            {filteredStudents.length} Siswa Terpilih
          </div>
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

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Tombol Laporan WA Cepat */}
            <button
              type="button"
              onClick={() => {
                setSelectedStudentForWa(null);
                setWaReportMode('rekap_guru');
                setWaTargetPhone('');
                setShowWaModal(true);
              }}
              disabled={filteredStudents.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              title="Buka Laporan Ringkas WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Laporan WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting || filteredStudents.length === 0}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unduh PDF</span>
            </button>
          </div>
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
                  <th className="py-3 px-3 text-center">Kirim WA</th>
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
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForWa(s);
                            setWaTargetPhone(s.parentPhone || '');
                            setShowWaModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200 transition cursor-pointer"
                          title={`Kirim laporan WhatsApp khusus ananda ${s.name}`}
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WA</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: Laporan Ringkas WhatsApp Monitoring Hafalan Siswa */}
      {/* ---------------------------------------------------------------- */}
      {showWaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-5 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-6 relative">
              <button
                type="button"
                onClick={() => {
                  setShowWaModal(false);
                  setSelectedStudentForWa(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pr-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3" /> Laporan WhatsApp Resmi
                  </div>
                  <h3 className="font-extrabold text-lg text-white">
                    {selectedStudentForWa
                      ? `Laporan Hafalan: ${selectedStudentForWa.name}`
                      : 'Laporan Ringkas Monitoring Hafalan Siswa'}
                  </h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    {selectedStudentForWa
                      ? `Kelas ${selectedStudentForWa.className} • Guru Wali: ${selectedStudentForWa.teacherName || '-'}`
                      : 'Rekap progres monitoring bimbingan tahfidz yang dilakukan oleh Guru Wali'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* If general report, provide Mode Switch tabs */}
              {!selectedStudentForWa ? (
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWaReportMode('rekap_guru')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      waReportMode === 'rekap_guru'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    <span>Rekap Bimbingan per Guru Wali</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaReportMode('rekap_siswa')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      waReportMode === 'rekap_siswa'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Daftar Progres Siswa</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Mengirim laporan khusus untuk <strong>{selectedStudentForWa.name}</strong> ({selectedStudentForWa.className})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForWa(null)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer shrink-0 ml-2"
                  >
                    Kembali ke Rekap Umum
                  </button>
                </div>
              )}

              {/* Target Phone Input (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Nomor WhatsApp Tujuan (Opsional)</span>
                  <span className="text-[10px] font-normal text-slate-500 normal-case">
                    Kosongkan jika ingin memilih kontak / grup di WhatsApp
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={waTargetPhone}
                    onChange={(e) => setWaTargetPhone(e.target.value)}
                    placeholder="Contoh: 081234567890 (Kepala Sekolah / Guru Wali / Grup)"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm outline-none transition"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Message Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Pratinjau Pesan WhatsApp</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Format Rapi
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={copyWaText}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedNotice ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-900 text-emerald-300 font-mono text-[11px] sm:text-xs p-4 rounded-2xl max-h-60 overflow-y-auto whitespace-pre-wrap border border-slate-800 leading-relaxed shadow-inner custom-scrollbar select-text">
                  {getActiveWaMessage()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={openWhatsAppUrl}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim via WhatsApp (Web / HP)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={copyWaText}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                  >
                    {copiedNotice ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Teks Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600" />
                        <span>Salin Teks Pesan</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareNative}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                  >
                    <Share2 className="w-4 h-4 text-slate-600" />
                    <span>Bagikan (Share)</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 text-center pt-1 border-t border-slate-100">
                Laporan ini dirancang khusus untuk koordinasi berkala perkembangan hafalan Al-Qur'an siswa antara Admin, Kepala Sekolah, dan Guru Wali SMKN 3 Pangkep.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
