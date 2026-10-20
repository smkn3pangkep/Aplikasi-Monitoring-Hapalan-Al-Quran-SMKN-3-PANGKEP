import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  LayoutDashboard,
  Users,
  BookMarked,
  KeyRound,
  Database,
  FolderOpen,
  LogOut,
  Shield,
  UserCheck,
  BookOpen,
  School,
  Award,
  FileText,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'baca_quran'
  | 'bimbingan'
  | 'siswa'
  | 'laporan_siswa'
  | 'dokumentasi'
  | 'hafalan_saya'
  | 'monitoring_guru'
  | 'kontrol_sandi'
  | 'backup_restore';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdminStaff = user?.role === 'admin_staf';
  const isPegawaiTu = user?.role === 'pegawai_tu' || user?.classes?.includes('Tata Usaha');
  const isGuruWali = user?.role === 'guru_wali' && !isPegawaiTu;
  const isSiswa = user?.role === 'siswa';
  const canViewAll = isSuperAdmin || isAdminStaff;

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  const getActiveTabTitle = () => {
    if (isSiswa && activeTab === 'dashboard') {
      return 'Progres Hafalan Saya';
    }
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'baca_quran':
        return 'Baca Al-Qur\'an';
      case 'bimbingan':
        return 'Data Bimbingan';
      case 'siswa':
        return 'Daftar Siswa & Hafalan';
      case 'laporan_siswa':
        return 'Laporan Siswa (PDF)';
      case 'dokumentasi':
        return 'Dokumentasi Hafalan';
      case 'hafalan_saya':
        return 'Hafalan Saya';
      case 'monitoring_guru':
        return 'Data Hafalan Guru';
      case 'kontrol_sandi':
        return 'Kontrol Sandi';
      case 'backup_restore':
        return 'Backup & Restore';
      default:
        return 'Monitoring Hafalan';
    }
  };

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header & Branding */}
      <div>
        <div
          onClick={() => handleNavClick('dashboard')}
          className="p-5 border-b border-slate-800 flex items-center gap-3.5 cursor-pointer hover:bg-slate-800/40 transition group"
        >
          <img
            src="/app-logo.png"
            alt="Logo Monitoring Hafalan Al Quran"
            className="w-11 h-11 rounded-xl shadow-md shadow-emerald-950/60 object-cover shrink-0 border border-emerald-500/30 group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-extrabold text-base tracking-tight truncate">
                SMKN 3 PANGKEP
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                Juz 30
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/70 font-medium truncate mt-0.5">
              {isSiswa
                ? "Portal Siswa SMKN 3"
                : isPegawaiTu
                ? "Monitoring Pegawai TU"
                : canViewAll
                ? "Monitoring Terpadu"
                : "Monitoring Guru Wali"}
            </p>
          </div>
        </div>

        {/* Navigation Menu List */}
        <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-250px)] lg:max-h-[calc(100vh-270px)] custom-scrollbar">
          {/* Siswa Navigation Mode */}
          {isSiswa ? (
            <div>
              <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Menu Siswa
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-emerald-400'}`} />
                    <span className="truncate">Progres Hafalan Saya</span>
                  </div>
                  {activeTab === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('baca_quran')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'baca_quran'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'baca_quran' ? 'text-white' : 'text-teal-400'}`} />
                    <span className="truncate">Baca Al-Qur'an</span>
                  </div>
                  {activeTab === 'baca_quran' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Group: Menu Utama */}
              <div>
                <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Menu Utama
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNavClick('dashboard')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === 'dashboard'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-emerald-400'}`} />
                      <span className="truncate">Dashboard</span>
                    </div>
                    {activeTab === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavClick('baca_quran')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                      activeTab === 'baca_quran'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'baca_quran' ? 'text-white' : 'text-teal-400'}`} />
                      <span className="truncate">Baca Al-Qur'an</span>
                    </div>
                    {activeTab === 'baca_quran' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                  </button>
                </div>
              </div>

          {/* Group: Pembiasaan Siswa (Guru Wali & Admin, Pegawai TU tidak memiliki anak bimbingan) */}
          {!isPegawaiTu && (
            <div>
              <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Tahfidz Siswa
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavClick('bimbingan')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'bimbingan'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users className={`w-4 h-4 shrink-0 ${activeTab === 'bimbingan' ? 'text-white' : 'text-sky-400'}`} />
                    <span className="truncate">Data Bimbingan</span>
                  </div>
                  {activeTab === 'bimbingan' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('siswa')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'siswa'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookMarked className={`w-4 h-4 shrink-0 ${activeTab === 'siswa' ? 'text-white' : 'text-amber-400'}`} />
                    <span className="truncate">Daftar Siswa & Hafalan</span>
                  </div>
                  {activeTab === 'siswa' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('laporan_siswa')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'laporan_siswa'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'laporan_siswa' ? 'text-white' : 'text-emerald-400'}`} />
                    <span className="truncate">Laporan Siswa (PDF)</span>
                  </div>
                  {activeTab === 'laporan_siswa' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>
              </div>
            </div>
          )}

          {/* Group: Monitoring & Dokumentasi */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Monitoring & Catatan
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNavClick('dokumentasi')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                  activeTab === 'dokumentasi'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderOpen className={`w-4 h-4 shrink-0 ${activeTab === 'dokumentasi' ? 'text-white' : 'text-violet-400'}`} />
                  <span className="truncate">Dokumentasi Hafalan</span>
                </div>
                {activeTab === 'dokumentasi' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              </button>

              {/* Menu Khusus: Hafalan Saya (untuk Guru Wali dan Pegawai TU) */}
              {(isGuruWali || isPegawaiTu) && (
                <button
                  type="button"
                  onClick={() => handleNavClick('hafalan_saya')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'hafalan_saya'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className={`w-4 h-4 shrink-0 ${activeTab === 'hafalan_saya' ? 'text-white' : 'text-amber-400'}`} />
                    <span className="truncate">Hafalan Saya</span>
                  </div>
                  {activeTab === 'hafalan_saya' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>
              )}

              {/* Menu Khusus: Data Hafalan Guru (untuk Super Admin & Admin Staf) */}
              {canViewAll && (
                <button
                  type="button"
                  onClick={() => handleNavClick('monitoring_guru')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'monitoring_guru'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Award className={`w-4 h-4 shrink-0 ${activeTab === 'monitoring_guru' ? 'text-white' : 'text-emerald-400'}`} />
                    <span className="truncate">Data Hafalan Guru</span>
                  </div>
                  {activeTab === 'monitoring_guru' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>
              )}
            </div>
          </div>

          {/* Group: Pengaturan Administrator (Superadmin only) */}
          {isSuperAdmin && (
            <div>
              <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Administrasi Sistem
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavClick('kontrol_sandi')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'kontrol_sandi'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <KeyRound className={`w-4 h-4 shrink-0 ${activeTab === 'kontrol_sandi' ? 'text-white' : 'text-amber-400'}`} />
                    <span className="truncate">Kontrol Sandi</span>
                  </div>
                  {activeTab === 'kontrol_sandi' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('backup_restore')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                    activeTab === 'backup_restore'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Database className={`w-4 h-4 shrink-0 ${activeTab === 'backup_restore' ? 'text-white' : 'text-teal-400'}`} />
                    <span className="truncate">Backup & Restore</span>
                  </div>
                  {activeTab === 'backup_restore' && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </nav>
      </div>

      {/* Bottom Profile & Logout Section */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-2.5 mt-auto">
        {/* PWA Install Button */}
        <PWAInstallButton variant="sidebar" />

        {/* User Details Card */}
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-bold truncate" title={user?.name}>
                {user?.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Shield className="w-2.5 h-2.5" />
                    Super Admin
                  </span>
                ) : isAdminStaff ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    <Shield className="w-2.5 h-2.5" />
                    Admin Staf
                  </span>
                ) : isSiswa ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    <GraduationCap className="w-2.5 h-2.5" />
                    Siswa ({user?.classes || 'SMK'})
                  </span>
                ) : user?.classes?.includes('Tata Usaha') ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    <UserCheck className="w-2.5 h-2.5" />
                    Pegawai TU
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <UserCheck className="w-2.5 h-2.5" />
                    Guru Wali
                  </span>
                )}
                {user?.nisn ? (
                  <span className="text-[10px] text-slate-400 font-mono truncate" title={`NISN: ${user.nisn}`}>
                    NISN: {user.nisn}
                  </span>
                ) : user?.nip ? (
                  <span className="text-[10px] text-slate-400 font-mono truncate" title={`NIP: ${user.nip}`}>
                    {user.nip}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Keluar */}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 border border-slate-700/80 hover:border-rose-600/50 text-slate-300 hover:text-rose-300 font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Keluar dari Sistem</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Top Bar (Visible on mobile/tablet screens < lg) */}
      <header className="lg:hidden bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <img
              src="/app-logo.png"
              alt="Logo"
              className="w-8 h-8 rounded-lg object-contain shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <span className="text-white font-extrabold text-sm block truncate">
                SMKN 3 PANGKEP
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold block truncate">
                {getActiveTabTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
              {user?.name}
            </span>
            <button
              type="button"
              onClick={logout}
              title="Keluar"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 text-slate-300 hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer content sliding in from left */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-800 animate-in slide-in-from-left duration-200">
            {/* Close button header for mobile */}
            <div className="absolute top-4 right-3 z-20">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* 3. Desktop Permanent Left Sidebar (Visible on >= lg screens) */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 shrink-0 z-30 select-none shadow-xl">
        {renderNavContent()}
      </aside>
    </>
  );
};
