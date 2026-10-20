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
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'login' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'sidebar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running in standalone PWA mode, don't clutter the UI
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate text-[11px] font-semibold">Mode PWA Aktif</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
      }
    } else {
      // Show instructional guide modal for iOS or browsers that hide native prompt
      setShowGuideModal(true);
    }
  };

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

          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang Sekarang</span>
          </button>
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

      {/* Installation Guide Modal (for iOS or manual install) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl text-white relative">
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
                <h3 className="text-base font-bold text-white">Petunjuk Pemasangan (PWA)</h3>
                <p className="text-xs text-emerald-300">Monitoring Hafalan Al Quran &bull; SMKN 3 Pangkep</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {isIOS ? (
                /* iOS Safari instructions */
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Untuk Pengguna iPhone / iPad (Safari):
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                    <li>
                      Ketuk tombol <strong>Bagikan (Share)</strong>{' '}
                      <Share2 className="w-3.5 h-3.5 inline text-sky-400" /> pada bilah menu Safari di bagian bawah.
                    </li>
                    <li>
                      Geser menu ke bawah lalu pilih menu{' '}
                      <strong className="text-emerald-300">
                        "Tambah ke Layar Utama" (Add to Home Screen)
                      </strong>{' '}
                      <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />.
                    </li>
                    <li>
                      Ketuk <strong>"Tambah" (Add)</strong> di pojok kanan atas.
                    </li>
                  </ol>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-700">
                    Ikon aplikasi akan langsung muncul di layar utama iPhone Anda seperti aplikasi asli!
                  </p>
                </div>
              ) : (
                /* Android / Chrome / Edge instructions */
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      HP Android (Google Chrome):
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      Ketuk <strong>titik tiga (⋮)</strong> di pojok kanan atas browser Chrome, lalu pilih{' '}
                      <strong className="text-emerald-300">"Pasang aplikasi" (Install app)</strong> atau{' '}
                      <strong className="text-emerald-300">"Tambahkan ke Layar Utama"</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-teal-400" />
                      Laptop / Komputer PC (Chrome & Edge):
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      Klik ikon <strong>Komputer / Pasang Aplikasi</strong> di bilah alamat URL (di sebelah kanan bintang bookmark) lalu klik <strong>"Install"</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-[11px] flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Selalu Mengikuti Pembaruan:</strong> Aplikasi PWA ini otomatis terhubung dengan server dan langsung diperbarui otomatis ketika ada fitur baru dari tim pengembang.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
            >
              Mengerti, Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
