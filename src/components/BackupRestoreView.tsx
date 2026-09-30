import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileJson,
  Users,
  GraduationCap,
  BookOpen,
  Info,
  Clock,
  HardDriveDownload,
  HardDriveUpload,
  AlertCircle,
  X,
} from 'lucide-react';
import { Teacher, Student, DatabaseBackupPayload } from '../types';
import { useAuth } from '../context/AuthContext';
import { createDatabaseBackup, restoreDatabaseBackup } from '../services/dataService';
import { TOTAL_TARGET_SURAHS } from '../data/juz30Data';

interface BackupRestoreViewProps {
  teachers: Teacher[];
  students: Student[];
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ teachers, students }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Restore state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPayload, setParsedPayload] = useState<DatabaseBackupPayload | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // In-progress restore state
  const [isRestoring, setIsRestoring] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [restoreSuccess, setRestoreSuccess] = useState<{
    teacherCount: number;
    studentCount: number;
    hafalanCount: number;
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Handle Backup Trigger
  const handleBackup = async () => {
    setIsBackingUp(true);
    setRestoreSuccess(null);
    setRestoreError(null);
    try {
      await createDatabaseBackup({
        name: user?.name || 'Super Admin',
        nip: user?.nip || 'admin',
      });
      setLastBackupTime(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err: any) {
      alert('Gagal melakukan backup database: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setRestoreSuccess(null);
    setRestoreError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setFileError('Harap pilih file dengan ekstensi .json');
      setSelectedFile(null);
      setParsedPayload(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as DatabaseBackupPayload;
        if (!json.metadata || !Array.isArray(json.teachers) || !Array.isArray(json.students)) {
          setFileError('Format file cadangan tidak valid. File harus merupakan cadangan resmi aplikasi ini.');
          setParsedPayload(null);
          return;
        }
        setParsedPayload(json);
      } catch (error) {
        setFileError('Gagal memproses file JSON. File mungkin korup atau tidak valid.');
        setParsedPayload(null);
      }
    };
    reader.onerror = () => {
      setFileError('Gagal membaca isi file.');
      setParsedPayload(null);
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!parsedPayload) return;
    setShowConfirmModal(false);
    setIsRestoring(true);
    setProgressMsg('Memulai proses pemulihan...');
    setProgressPercent(5);
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const result = await restoreDatabaseBackup(
        parsedPayload,
        restoreMode,
        (msg, pct) => {
          setProgressMsg(msg);
          setProgressPercent(pct);
        },
        {
          name: user?.name || 'Super Admin',
          nip: user?.nip || 'admin',
        }
      );

      setRestoreSuccess(result);
      setSelectedFile(null);
      setParsedPayload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setRestoreError(err?.message || 'Gagal memulihkan database.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Hak Akses Khusus Super Admin • SMKN 3 Pangkep
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Backup & Restore Database
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Pusat pencadangan dan pemulihan data sistem monitoring hafalan SMKN 3 Pangkep.
            Gunakan fitur ini secara berkala untuk mengamankan data guru, siswa, dan seluruh riwayat hafalan Juz 30, serta memulihkan data jika terjadi kendala pada aplikasi.
          </p>
        </div>
      </div>

      {/* Success Notification Banner after Restore */}
      {restoreSuccess && (
        <div className="p-5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base text-emerald-950">
                Database Berhasil Dipulihkan (Restore Sukses)!
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Data telah disinkronkan kembali ke Cloud Firestore:
              </p>
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold">
                <li className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  👥 <strong>{restoreSuccess.teacherCount}</strong> Data Guru Wali
                </li>
                <li className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  🎓 <strong>{restoreSuccess.studentCount}</strong> Data Siswa Bimbingan
                </li>
                <li className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                  📖 <strong>{restoreSuccess.hafalanCount}</strong> Catatan Hafalan Surah
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {restoreError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{restoreError}</span>
          </div>
          <button
            type="button"
            onClick={() => setRestoreError(null)}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Cards Grid: Backup (Left) and Restore (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: BACKUP DATABASE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <HardDriveDownload className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">1. Backup Database</h2>
                  <p className="text-xs text-slate-500">Cadangkan seluruh data ke file JSON</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
                Aktif
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Mengunduh salinan lengkap database Firestore ke komputer Anda dalam satu file berformat <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-mono">.json</code>. Berisi seluruh profil guru, siswa, catatan nilai hafalan, serta log aktivitas.
            </p>

            {/* Live Database Metrics */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block">
                Status Data Saat Ini:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 font-medium block">Guru Wali</span>
                  <span className="text-base font-black text-slate-900">{teachers.length}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 font-medium block">Siswa</span>
                  <span className="text-base font-black text-slate-900">{students.length}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 font-medium block">Target Surah</span>
                  <span className="text-base font-black text-emerald-600">{TOTAL_TARGET_SURAHS}</span>
                </div>
              </div>
              {lastBackupTime && (
                <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Backup terakhir diunduh hari ini pukul <strong>{lastBackupTime}</strong></span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={isBackingUp || isRestoring}
            onClick={handleBackup}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm transition shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Membuat File Backup...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan (.json)</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 2: RESTORE DATABASE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <HardDriveUpload className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">2. Restore Database</h2>
                  <p className="text-xs text-slate-500">Pulihkan data dari file cadangan</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-full border border-amber-200">
                Pemulihan
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih file cadangan <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700 font-mono">.json</code> yang sebelumnya telah diunduh untuk mengembalikan database ke kondisi semula saat cadangan dibuat.
            </p>

            {/* File Picker Area */}
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isRestoring}
                className="hidden"
                id="restore-file-input"
              />

              {!selectedFile ? (
                <label
                  htmlFor="restore-file-input"
                  className="border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group"
                >
                  <FileJson className="w-10 h-10 text-slate-400 group-hover:text-amber-500 transition mb-2" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-amber-900">
                    Klik untuk Memilih File Backup (.json)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    File JSON resmi hasil cadangan aplikasi Tahfidz SMKN 3 Pangkep
                  </span>
                </label>
              ) : (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileJson className="w-6 h-6 text-amber-600" />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block truncate max-w-[200px] sm:max-w-xs">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => {
                        setSelectedFile(null);
                        setParsedPayload(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Metadata preview */}
                  {parsedPayload && (
                    <div className="pt-2 border-t border-amber-200/70 text-[11px] text-slate-700 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tanggal Cadangan:</span>
                        <strong className="text-slate-800">
                          {new Date(parsedPayload.metadata.exportedAt).toLocaleString('id-ID')}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Oleh:</span>
                        <strong>{parsedPayload.metadata.exportedBy}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Isi Data:</span>
                        <span className="text-emerald-700 font-bold">
                          {parsedPayload.metadata.totalTeachers} Guru, {parsedPayload.metadata.totalStudents} Siswa, {parsedPayload.metadata.totalHafalanRecords} Hafalan
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {fileError && (
                <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </p>
              )}

              {/* Restore Mode Option */}
              {parsedPayload && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Pilih Metode Pemulihan:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                        restoreMode === 'replace'
                          ? 'bg-amber-50/80 border-amber-500 text-amber-950 font-semibold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        value="replace"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="mt-0.5 accent-amber-600"
                      />
                      <div>
                        <span className="block font-bold">Timpa Penuh (Replace)</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          Bersihkan database lalu pulihkan 100% persis isi file backup.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                        restoreMode === 'merge'
                          ? 'bg-amber-50/80 border-amber-500 text-amber-950 font-semibold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-0.5 accent-amber-600"
                      />
                      <div>
                        <span className="block font-bold">Gabungkan (Merge)</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          Perbarui dan sisipkan tanpa menghapus data lain yang ada.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar during restore */}
          {isRestoring ? (
            <div className="space-y-2 p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="flex justify-between text-xs font-bold text-amber-900">
                <span>{progressMsg}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-amber-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={!parsedPayload || isRestoring || isBackingUp}
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-bold text-sm transition shadow-lg shadow-amber-700/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              <span>Mulai Pulihkan Database (Restore)</span>
            </button>
          )}
        </div>
      </div>

      {/* CARD 3: PANDUAN STANDAR OPERASIONAL PROSEDUR (SOP) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Info className="w-5 h-5 text-emerald-600" />
          Panduan Standar & Tips Penanganan Darurat Database
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              1. Jadwal Pencadangan Rutin
            </h4>
            <p className="leading-relaxed text-[11px] text-slate-500">
              Lakukan <strong>Backup Database</strong> minimal seminggu sekali atau sebelum melakukan pembaruan massal akun guru dan data siswa. Simpan file cadangan pada Google Drive atau penyimpanan lokal aman.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              2. Kapan Harus Restore?
            </h4>
            <p className="leading-relaxed text-[11px] text-slate-500">
              Gunakan fitur <strong>Restore Database</strong> apabila terjadi ketidaksengajaan penghapusan data bimbingan, kesalahan impor Excel yang tidak terduga, atau saat ingin memindahkan data ke environment baru.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              3. Keamanan Akun Super Admin
            </h4>
            <p className="leading-relaxed text-[11px] text-slate-500">
              Proses restore tidak akan menghapus kredensial login Super Admin utama sehingga sistem tetap dapat diakses dengan aman tanpa kehilangan hak administratif.
            </p>
          </div>
        </div>
      </div>

      {/* CONFIRMATION RESTORE MODAL */}
      {showConfirmModal && parsedPayload && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-amber-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Konfirmasi Pemulihan Database</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 text-amber-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="text-sm font-semibold text-slate-900">
                Apakah Anda yakin ingin memulihkan database dengan file cadangan ini?
              </p>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">File Backup:</span>
                  <strong className="text-slate-800">{selectedFile?.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Dipilih:</span>
                  <strong className="text-amber-900 uppercase">
                    {restoreMode === 'replace' ? 'Timpa Penuh (Replace)' : 'Gabungkan (Merge)'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Akan Memulihkan:</span>
                  <strong className="text-emerald-800">
                    {parsedPayload.metadata.totalTeachers} Guru Wali & {parsedPayload.metadata.totalStudents} Siswa
                  </strong>
                </div>
              </div>

              {restoreMode === 'replace' && (
                <p className="text-rose-700 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-200">
                  ⚠️ Perhatian: Mode Timpa Penuh akan menghapus seluruh data siswa dan guru saat ini dan menggantikannya secara menyeluruh dengan data dari file cadangan.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md shadow-amber-800/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Ya, Lanjutkan Restore</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
