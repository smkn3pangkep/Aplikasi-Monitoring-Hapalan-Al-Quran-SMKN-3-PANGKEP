import React, { useState } from 'react';
import {
  KeyRound,
  Shield,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Plus,
  RefreshCw,
  Power,
  X,
  Phone,
  Mail,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
} from 'lucide-react';
import { Teacher } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  updateTeacherPassword,
  updateTeacher,
  addTeacher,
  deleteTeacher,
  clearAllDummyData,
  downloadTeacherExcelTemplate,
  processTeacherExcelUpload,
} from '../services/dataService';

interface AkunGuruViewProps {
  teachers: Teacher[];
}

export const AkunGuruView: React.FC<AkunGuruViewProps> = ({ teachers }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  // Password reset modal state
  const [targetTeacher, setTargetTeacher] = useState<Teacher | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add teacher modal state (Super Admin)
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addNip, setAddNip] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addClasses, setAddClasses] = useState('');
  const [addPassword, setAddPassword] = useState('bismillah');

  // Teacher delete modal state
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [deleteAssignedStudentsAlso, setDeleteAssignedStudentsAlso] = useState(true);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState(false);

  // Purge all dummy data modal state
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Import Guru Excel modal state (Super Admin)
  const [showImportExcelModal, setShowImportExcelModal] = useState(false);
  const [excelTeacherFile, setExcelTeacherFile] = useState<File | null>(null);
  const [isImportingTeachers, setIsImportingTeachers] = useState(false);
  const [importResult, setImportResult] = useState<{
    added: number;
    updated: number;
    total: number;
    errors: string[];
  } | null>(null);

  // Teacher changing their own password
  const [selfOldPass, setSelfOldPass] = useState('');
  const [selfNewPass, setSelfNewPass] = useState('');
  const [selfConfirmPass, setSelfConfirmPass] = useState('');

  const handleDownloadTeacherTemplate = () => {
    downloadTeacherExcelTemplate();
  };

  const handleTeacherFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelTeacherFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImportTeachersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelTeacherFile) return;

    setIsImportingTeachers(true);
    setImportResult(null);

    try {
      const res = await processTeacherExcelUpload(excelTeacherFile);
      setImportResult(res);
      setNotification({
        type: 'success',
        message: `Berhasil memproses Excel: ${res.added} Guru Baru ditambahkan, ${res.updated} akun diperbarui. Password default: "bismillah".`,
      });
      setExcelTeacherFile(null);
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      setImportResult({
        added: 0,
        updated: 0,
        total: 0,
        errors: [err.message || 'Gagal mengimpor file Excel.'],
      });
    } finally {
      setIsImportingTeachers(false);
    }
  };

  const handleOpenReset = (t: Teacher) => {
    setTargetTeacher(t);
    setNewPassword('guru123');
    setNotification(null);
  };

  const handleConfirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    setIsDeletingTeacher(true);
    try {
      await deleteTeacher(
        teacherToDelete.id,
        teacherToDelete.name,
        deleteAssignedStudentsAlso,
        teacherToDelete.nip
      );
      setNotification({
        type: 'success',
        message: `Akun Guru Wali "${teacherToDelete.name}" (NIP: ${teacherToDelete.nip}) berhasil dihapus dari Firebase.`,
      });
      setTeacherToDelete(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menghapus akun guru.',
      });
    } finally {
      setIsDeletingTeacher(false);
    }
  };

  const handlePurgeAllDummyData = async () => {
    setIsPurging(true);
    try {
      const res = await clearAllDummyData();
      setNotification({
        type: 'success',
        message: `Berhasil menghapus seluruh data dummy (${res.deletedTeachers} data guru dan ${res.deletedStudents} data siswa). Database kini kosong dan siap diisi.`,
      });
      setShowPurgeModal(false);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal membersihkan data dummy.',
      });
    } finally {
      setIsPurging(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeacher) return;
    if (!newPassword.trim()) {
      setNotification({ type: 'error', message: 'Kata sandi baru tidak boleh kosong.' });
      return;
    }

    setIsUpdating(true);
    try {
      await updateTeacherPassword(targetTeacher.id, newPassword.trim(), targetTeacher.name);
      setNotification({
        type: 'success',
        message: `Kata sandi untuk ${targetTeacher.name} (NIP: ${targetTeacher.nip}) berhasil diperbarui!`,
      });
      setTimeout(() => {
        setTargetTeacher(null);
      }, 1500);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal mengubah kata sandi.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (teacher: Teacher) => {
    try {
      await updateTeacher(teacher.id, { isActive: !teacher.isActive });
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addNip.trim() || !addPassword.trim()) {
      setNotification({ type: 'error', message: 'Nama, NIP, dan Kata Sandi wajib diisi.' });
      return;
    }

    setIsUpdating(true);
    try {
      await addTeacher({
        name: addName.trim(),
        nip: addNip.trim(),
        email: addEmail.trim() || `${addNip.trim()}@smkn3pangkep.sch.id`,
        phone: addPhone.trim(),
        classes: addClasses.trim(),
        password: addPassword.trim(),
        isActive: true,
      });
      setShowAddTeacherModal(false);
      setAddName('');
      setAddNip('');
      setAddEmail('');
      setAddPhone('');
      setAddClasses('');
      setAddPassword('guru123');
      setNotification({
        type: 'success',
        message: `Akun Guru Wali "${addName.trim()}" (NIP: ${addNip.trim()}) berhasil ditambahkan dan disimpan ke Firebase!`,
      });
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menambahkan guru.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Self change password for Guru Wali
  const handleSelfPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (selfNewPass !== selfConfirmPass) {
      setNotification({ type: 'error', message: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }
    if (selfNewPass.length < 5) {
      setNotification({ type: 'error', message: 'Kata sandi minimal 5 karakter.' });
      return;
    }

    const currentTeacherDoc = teachers.find((t) => t.nip === user?.nip);
    if (!currentTeacherDoc) {
      setNotification({ type: 'error', message: 'Data akun guru tidak ditemukan.' });
      return;
    }

    if (currentTeacherDoc.password && currentTeacherDoc.password !== selfOldPass) {
      setNotification({ type: 'error', message: 'Kata sandi lama tidak sesuai.' });
      return;
    }

    setIsUpdating(true);
    try {
      await updateTeacherPassword(currentTeacherDoc.id, selfNewPass, currentTeacherDoc.name);
      setNotification({ type: 'success', message: 'Kata sandi Anda berhasil diperbarui!' });
      setSelfOldPass('');
      setSelfNewPass('');
      setSelfConfirmPass('');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal mengubah kata sandi.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <KeyRound className="w-3.5 h-3.5" />
            Kontrol Akses Masuk Sistem
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Kontrol Sandi Akun Guru Wali
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Manajemen kredensial login (NIP & Kata Sandi) khusus Guru Wali SMKN 3 Pangkep.'
              : 'Perbarui kata sandi akun login bimbingan Anda secara berkala demi keamanan.'}
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {teachers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPurgeModal(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Hapus seluruh data guru & siswa dummy yang ada di Firebase"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Data Dummy</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowImportExcelModal(true);
                setExcelTeacherFile(null);
                setImportResult(null);
              }}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-800/20 cursor-pointer"
              title="Import Akun Guru Wali dalam format Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Akun Guru (Excel)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddTeacherModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun Guru Baru</span>
            </button>
          </div>
        )}
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* SUPER ADMIN VIEW: Table of all Guru Wali Accounts */}
      {isSuperAdmin ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Daftar Akun Guru Wali Terdaftar ({teachers.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Guru login menggunakan NIP & Kata Sandi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Guru Wali</th>
                  <th className="py-3 px-4">NIP (Username)</th>
                  <th className="py-3 px-4">Kelas Bimbingan</th>
                  <th className="py-3 px-4">Kata Sandi Saat Ini</th>
                  <th className="py-3 px-4 text-center">Status Akun</th>
                  <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      Belum ada data Guru Wali yang terdaftar. Klik "+ Tambah Akun Guru Baru" untuk mendaftarkan Guru Wali.
                    </td>
                  </tr>
                ) : (
                  teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {t.name}
                        <span className="block text-[11px] font-normal text-slate-400">{t.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 bg-emerald-50/50">
                        {t.nip}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {t.classes || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 bg-slate-50/60">
                        <span className="bg-slate-200/70 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {t.password || 'guru123'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {t.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            <Power className="w-3 h-3 text-rose-600" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReset(t)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="Ganti Kata Sandi Guru"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Ganti Sandi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(t)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              t.isActive
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={t.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setTeacherToDelete(t)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                            title="Hapus Akun Guru Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GURU WALI VIEW: Change Own Password Form */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-xl">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Ganti Kata Sandi Akun Anda
              </h3>
              <p className="text-xs text-slate-500">
                Akun Guru Wali: {user?.name} (NIP: {user?.nip})
              </p>
            </div>
          </div>

          <form onSubmit={handleSelfPasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kata Sandi Lama
              </label>
              <input
                type="password"
                required
                value={selfOldPass}
                onChange={(e) => setSelfOldPass(e.target.value)}
                placeholder="Masukkan kata sandi lama"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                value={selfNewPass}
                onChange={(e) => setSelfNewPass(e.target.value)}
                placeholder="Minimal 5 karakter"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ulangi Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                value={selfConfirmPass}
                onChange={(e) => setSelfConfirmPass(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-60"
            >
              {isUpdating ? 'Memperbarui Sandi...' : 'Simpan Kata Sandi Baru'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Reset Password by Admin */}
      {targetTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Ganti Kata Sandi Guru
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {targetTeacher.name} (NIP: {targetTeacher.nip})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTargetTeacher(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Contoh: guru123"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Guru akan menggunakan kata sandi ini bersama NIP mereka saat login.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTargetTeacher(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-amber-700/20 disabled:opacity-60 cursor-pointer"
                >
                  {isUpdating ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Akun Guru Baru */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Tambah Akun Guru Wali Baru
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Registrasi pembimbing tahfidz SMKN 3 Pangkep
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTeacherModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Guru Beserta Gelar
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Contoh: Drs. H. Muhammad Yunus, M.Pd"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  NIP (Digunakan untuk Login)
                </label>
                <input
                  type="text"
                  required
                  value={addNip}
                  onChange={(e) => setAddNip(e.target.value)}
                  placeholder="Contoh: 198205142008011005"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kelas Bimbingan
                  </label>
                  <input
                    type="text"
                    value={addClasses}
                    onChange={(e) => setAddClasses(e.target.value)}
                    placeholder="X DPIB 1, XI DPIB 1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kata Sandi Awal
                  </label>
                  <input
                    type="text"
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="guru123"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Guru (Opsional)
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="nama@smkn3pangkep.sch.id"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 disabled:opacity-60 cursor-pointer"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: Konfirmasi Hapus Akun Guru */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-rose-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-300" />
                  Konfirmasi Hapus Akun Guru
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">
                  Tindakan ini akan menghapus akun guru dari Firebase
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="p-1 text-rose-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <p className="text-xs font-semibold text-rose-900 leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun Guru Wali berikut?
                </p>
                <div className="bg-white p-3 rounded-xl border border-rose-200 text-xs space-y-1">
                  <div><strong>Nama:</strong> {teacherToDelete.name}</div>
                  <div><strong>NIP:</strong> {teacherToDelete.nip}</div>
                  <div><strong>Kelas:</strong> {teacherToDelete.classes || '-'}</div>
                  <div><strong>Email:</strong> {teacherToDelete.email || '-'}</div>
                </div>

                <label className="flex items-start gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteAssignedStudentsAlso}
                    onChange={(e) => setDeleteAssignedStudentsAlso(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[11px] text-rose-800 font-medium">
                    Hapus juga seluruh siswa bimbingan yang dibimbing oleh Guru Wali ini
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTeacherToDelete(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeletingTeacher}
                  onClick={handleConfirmDeleteTeacher}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-700/20 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeletingTeacher ? 'Menghapus...' : 'Ya, Hapus Guru'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Bersihkan Seluruh Data Dummy */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-rose-950 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  Bersihkan Seluruh Data Dummy
                </h3>
                <p className="text-xs text-rose-300 mt-0.5">
                  Reset database guru & siswa menjadi kosong
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="p-1 text-rose-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-900">
                <p className="font-bold">
                  Peringatan: Tindakan ini akan menghapus permanen:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                  <li>Seluruh data Guru Wali ({teachers.length} guru)</li>
                  <li>Seluruh data Siswa Bimbingan dan riwayat hafalan Juz 30</li>
                  <li>Akun Super Admin tetap aman dan tidak terhapus</li>
                </ul>
                <p className="text-[11px] text-slate-500 pt-1">
                  Gunakan fitur ini jika ingin menghapus seluruh data contoh/dummy sebelumnya agar database bersih dan siap untuk data riil SMKN 3 Pangkep.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPurgeModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPurging}
                  onClick={handlePurgeAllDummyData}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-900/30 disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isPurging ? 'Membersihkan...' : 'Ya, Bersihkan Semua Data'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Import Akun Guru Wali via Excel */}
      {showImportExcelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Import Akun Guru Wali via Excel
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Daftarkan banyak Guru Wali sekaligus tanpa perlu input satu per satu
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportExcelModal(false);
                  setExcelTeacherFile(null);
                  setImportResult(null);
                }}
                className="p-1 text-emerald-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportTeachersSubmit} className="p-6 space-y-4">
              {/* Petunjuk Format */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Format Kolom File Excel:
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadTeacherTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Format Excel (.xlsx)
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Kolom 1</span>
                    <strong>Nama Guru Wali</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Kolom 2</span>
                    <strong>NIP (Username)</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Kolom 3</span>
                    <strong>Kelas Bimbingan</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-400 block text-[9px] uppercase">Kolom 4</span>
                    <strong>Kata Sandi Saat Ini</strong>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-800 pt-1 leading-relaxed">
                  * <strong>Kata Sandi Default:</strong> Seluruh akun guru otomatis diset dengan kata sandi <strong>bismillah</strong> jika kolom kata sandi tidak diisi atau dikosongkan.
                </p>
              </div>

              {/* Upload Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition bg-slate-50/50">
                <input
                  type="file"
                  id="teacher-excel-upload"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleTeacherFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="teacher-excel-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">
                      {excelTeacherFile ? excelTeacherFile.name : 'Pilih File Excel Guru (.xlsx / .xls)'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {excelTeacherFile
                        ? `${(excelTeacherFile.size / 1024).toFixed(1)} KB • Klik untuk mengganti file`
                        : 'Klik untuk memilih file dari komputer atau perangkat Anda'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Hasil Import Alert */}
              {importResult && (
                <div
                  className={`p-4 rounded-2xl text-xs space-y-1.5 border ${
                    importResult.errors.length > 0 && importResult.total === 0
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-2 text-sm">
                    {importResult.total > 0 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Import Selesai: {importResult.total} Akun Diproses!
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        Gagal Mengimpor
                      </>
                    )}
                  </div>
                  {importResult.total > 0 && (
                    <p className="text-[11px]">
                      • <strong>{importResult.added}</strong> Akun Guru Baru berhasil didaftarkan.<br />
                      • <strong>{importResult.updated}</strong> Akun Guru berhasil diperbarui datanya.<br />
                      • Seluruh kata sandi aktif: <strong>bismillah</strong>
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-rose-200 text-[11px] text-rose-700">
                      <p className="font-semibold">Catatan perbaikan:</p>
                      <ul className="list-disc list-inside">
                        {importResult.errors.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportExcelModal(false);
                    setExcelTeacherFile(null);
                    setImportResult(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {importResult && importResult.total > 0 ? 'Selesai' : 'Batal'}
                </button>
                <button
                  type="submit"
                  disabled={!excelTeacherFile || isImportingTeachers}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isImportingTeachers ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memproses Excel & Firestore...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Import Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
