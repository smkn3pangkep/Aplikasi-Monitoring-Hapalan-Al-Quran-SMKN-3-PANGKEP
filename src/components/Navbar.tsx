import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookMarked,
  KeyRound,
  Database,
  LogOut,
  Shield,
  UserCheck,
  BookOpen,
  School,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'bimbingan' | 'siswa' | 'kontrol_sandi' | 'backup_restore';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <header className="bg-slate-900 border-b border-emerald-900/40 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & School Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-900/50 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950/70 rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold text-base sm:text-lg tracking-tight">
                  SMKN 3 PANGKEP
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
                  Juz 30
                </span>
              </div>
              <p className="text-xs text-emerald-200/70 font-medium hidden sm:block">
                Sistem Monitoring Hafalan Al-Qur'an Guru Wali
              </p>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('bimbingan')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition ${
                activeTab === 'bimbingan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Data Bimbingan</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('siswa')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition ${
                activeTab === 'siswa'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>Daftar Siswa & Hafalan</span>
            </button>

            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('kontrol_sandi')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition ${
                    activeTab === 'kontrol_sandi'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Kontrol Sandi</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('backup_restore')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition ${
                    activeTab === 'backup_restore'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Backup & Restore</span>
                </button>
              </>
            )}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-white text-xs sm:text-sm font-bold truncate max-w-[180px]">
                {user?.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Shield className="w-2.5 h-2.5" />
                    Super Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <UserCheck className="w-2.5 h-2.5" />
                    Guru Wali
                  </span>
                )}
                {user?.nip && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    NIP: {user.nip}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Keluar dari Sistem"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-600/50 text-slate-300 hover:text-red-400 transition flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Mobile Submenu Navigation */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-slate-800 text-xs font-semibold overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('bimbingan')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'bimbingan' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Bimbingan
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('siswa')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'siswa' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Daftar Siswa
          </button>
          {isSuperAdmin && (
            <>
              <button
                type="button"
                onClick={() => onSelectTab('kontrol_sandi')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  activeTab === 'kontrol_sandi' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Kontrol Sandi
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('backup_restore')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  activeTab === 'backup_restore' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Backup & Restore
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
