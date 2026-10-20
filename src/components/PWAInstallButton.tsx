import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  HelpCircle,
  RotateCw,
  AlertTriangle,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'login' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'sidebar' }) => {
  const { isInstallable, isInstalled, isIOS, install, resetCacheAndReload } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
      }
    } else {
      // Show instructional guide modal for iOS, Chrome throttle, or manual install
      setShowGuideModal(true);
    }
  };

  const handleResetCache = async () => {
    setIsResetting(true);
    await resetCacheAndReload();
  };

  // If already running in standalone PWA mode
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-[11px] font-semibold">Mode PWA Aktif</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="text-emerald-400 hover:text-white text-[10px] underline cursor-pointer"
            title="Pengaturan PWA"
          >
            Bantuan
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* 1. Sidebar Variant */}
      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-950/40 cursor-pointer group"
          title="Pasang aplikasi ke layar HP atau desktop PC"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Download className="w-4 h-4 text-emerald-200 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="block font-bold truncate">Pasang Aplikasi</span>
              <span className="block text-[10px] text-emerald-100 font-normal truncate">
                Ikon HP & Desktop (PWA)
              </span>
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
        </button>
      )}

      {/* 2. Login Screen Variant */}
      {variant === 'login' && (
        <div className="w-full bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 rounded-2xl p-3.5 transition flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30">
              <Download className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-white text-xs font-bold flex items-center gap-1.5">
                <span>Pasang Aplikasi di HP / Laptop</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  PWA
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Buka langsung dari layar utama tanpa perlu mencari link lagi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang Sekarang</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTroubleshoot(true);
                setShowGuideModal(true);
              }}
              className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Bantuan jika pernah menghapus aplikasi atau ikon tidak muncul"
            >
              <HelpCircle className="w-4 h-4 text-emerald-300" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Top Banner Variant */}
      {variant === 'banner' && (
        <div className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-900 p-3 rounded-2xl border border-emerald-600/40 text-white flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-200 truncate">
              Jadikan aplikasi shortcut di layar HP / PC Anda (PWA)
            </p>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span>Pasang</span>
          </button>
        </div>
      )}

      {/* Installation Guide & Troubleshooting Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/40 p-5 sm:p-6 shadow-2xl text-white relative my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src="/app-logo.png"
                alt="Monitoring Hafalan Al Quran"
                className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/40 shadow-md shrink-0"
              />
              <div>
                <h3 className="text-base font-bold text-white">Panduan Pemasangan & Solusi Ikon</h3>
                <p className="text-xs text-emerald-300">Monitoring Hafalan Al Quran &bull; SMKN 3 Pangkep</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Special Alert for Re-installation / Deleted App Issue */}
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Pernah Hapus Aplikasi Lalu Ikon Tidak Muncul?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-100">
                  Pada HP Android, jika aplikasi dihapus dengan cara menyeret ikon ke "Hapus dari Beranda", sistem Android terkadang <strong>masih mencatat aplikasi sebagai terpasang (WebAPK)</strong>, atau Chrome menunda tombol pasang otomatis.
                </p>
              </div>

              {/* Solusi 1: Pasang Manual via Menu Titik Tiga Chrome */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
                <p className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  <span>Solusi Tercepat di HP Android (Google Chrome):</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed text-xs">
                  <li>
                    Di pojok kanan atas browser Google Chrome, ketuk <strong>Titik Tiga (⋮)</strong>.
                  </li>
                  <li>
                    Pilih menu <strong className="text-emerald-300">"Pasang aplikasi" (Install app)</strong> atau <strong className="text-emerald-300">"Tambahkan ke Layar Utama" (Add to Home screen)</strong>.
                  </li>
                  <li>
                    Konfirmasi dengan mengetuk <strong>"Pasang"</strong> atau <strong>"Tambahkan"</strong>. Ikon akan langsung muncul kembali di layar HP Anda!
                  </li>
                </ol>
              </div>

              {/* Solusi 2: Cek di Pengaturan Aplikasi Android */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
                <p className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  <span>Jika Masih Belum Muncul (Copot Pemasangan Penuh):</span>
                </p>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Buka <strong>Pengaturan HP (Settings) &rarr; Aplikasi (Apps / Kelola Aplikasi)</strong> &rarr; cari <strong>"Monitoring Hafalan Al Quran"</strong> atau <strong>"Tahfidz J30"</strong> &rarr; pilih <strong>Copot Pemasangan (Uninstall)</strong>. Setelah itu buka kembali link aplikasi ini dan pasang ulang.
                </p>
              </div>

              {/* Solusi 3: Tombol Reset Cache & Reload PWA */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/30 space-y-2.5">
                <p className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                  <span>Bersihkan Cache PWA Aplikasi:</span>
                </p>
                <p className="text-slate-300 text-xs">
                  Tekan tombol di bawah ini untuk menghapus cache lama Service Worker dan menyegarkan sistem aplikasi secara bersih:
                </p>
                <button
                  type="button"
                  onClick={handleResetCache}
                  disabled={isResetting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs border border-slate-600 transition cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'Menyegarkan Cache...' : 'Bersihkan Cache & Refresh Halaman'}</span>
                </button>
              </div>

              {/* iOS Safari Guide */}
              {isIOS && (
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
                  <p className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Untuk Pengguna iPhone / iPad (Safari):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed text-xs">
                    <li>
                      Ketuk tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline text-sky-400" /> di menu Safari bawah.
                    </li>
                    <li>
                      Pilih <strong className="text-emerald-300">"Tambah ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />.
                    </li>
                    <li>
                      Ketuk <strong>"Tambah"</strong> di pojok kanan atas.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-md"
            >
              Mengerti, Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </>
  );
};
