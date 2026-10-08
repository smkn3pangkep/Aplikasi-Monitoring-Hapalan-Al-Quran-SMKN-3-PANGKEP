import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, BookOpen, User, Key, CheckCircle2, AlertCircle, School, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginAsAdmin, loginAsGuru, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'guru' | 'admin'>('guru');

  // Form states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [guruNip, setGuruNip] = useState('');
  const [guruPassword, setGuruPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await loginAsAdmin(adminEmail, adminPassword);
    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.message || 'Login gagal.');
    }
  };

  const handleGuruSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await loginAsGuru(guruNip, guruPassword);
    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.message || 'Login gagal.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Decorative Islamic Geometric Pattern / Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header & Logo */}
      <div className="text-center mb-6 relative z-10 max-w-xl">
        <div className="inline-flex items-center justify-center p-3.5 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl mb-4 backdrop-blur-md shadow-lg shadow-emerald-900/30">
          <BookOpen className="w-9 h-9 text-emerald-400" />
        </div>
        <div className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-2">
          Juz 'Amma • Juz 30
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Sistem Monitoring Hafalan Al-Qur'an
        </h1>
        <p className="text-emerald-200/80 font-medium text-sm md:text-base mt-1 flex items-center justify-center gap-1.5">
          <School className="w-4 h-4 text-emerald-400 inline" /> SMKN 3 PANGKEP (PANGKAJENE DAN KEPULAUAN)
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative z-10">
        {/* Tab switch between Guru/Pegawai TU and Admin */}
        <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1.5 rounded-2xl mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('guru');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 ${
              activeTab === 'guru'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            Guru & Pegawai TU
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-500/15 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-200 text-xs md:text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Guru & Pegawai TU */}
        {activeTab === 'guru' && (
          <form onSubmit={handleGuruSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
                NIP Guru / Pegawai TU
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={guruNip}
                  onChange={(e) => setGuruNip(e.target.value)}
                  placeholder="Contoh: 197412162025212005"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-xl px-4 py-3 pl-11 text-sm outline-none transition placeholder:text-slate-500"
                />
                <User className="w-4 h-4 text-emerald-400 absolute left-4 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Masuk menggunakan NIP Guru Wali atau Pegawai Tata Usaha yang terdaftar (kata sandi default: <span className="font-mono text-emerald-400">bismillah</span>).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={guruPassword}
                  onChange={(e) => setGuruPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-xl px-4 py-3 pl-11 text-sm outline-none transition placeholder:text-slate-500"
                />
                <Key className="w-4 h-4 text-emerald-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk sebagai Guru / Pegawai TU</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form Admin */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                Username / Email Admin
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@smkn3pangkep.sch.id atau adminhapalan"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white rounded-xl px-4 py-3 pl-11 text-sm outline-none transition placeholder:text-slate-500"
                />
                <Shield className="w-4 h-4 text-amber-400 absolute left-4 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Akses Super Admin atau Admin Staf (adminhapalan@smkn3pangkep.sch.id).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                Kata Sandi Admin
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white rounded-xl px-4 py-3 pl-11 text-sm outline-none transition placeholder:text-slate-500"
                />
                <Key className="w-4 h-4 text-amber-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full mt-2 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-amber-700/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Memverifikasi Admin...</span>
              ) : (
                <>
                  <span>Masuk sebagai Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Terhubung dengan Cloud Firebase Firestore Real-Time
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-6 text-center text-xs text-slate-500 relative z-10">
        &copy; {new Date().getFullYear()} SMKN 3 PANGKEP &bull; Program Tahfidz Al-Qur'an Juz 30
      </div>
    </div>
  );
};
