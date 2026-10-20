import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

export const PWAUpdateNotification: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateFunction, setUpdateFunction] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    try {
      const updateSW = registerSW({
        onNeedRefresh() {
          setNeedRefresh(true);
        },
        onOfflineReady() {
          console.log('Tahfidz SMKN 3 Pangkep ready to work offline');
        },
        immediate: true,
      });

      setUpdateFunction(() => () => updateSW(true));

      // Periodically check for updates every 30 minutes
      const interval = setInterval(() => {
        updateSW();
      }, 30 * 60 * 1000);

      return () => clearInterval(interval);
    } catch (e) {
      console.warn('PWA registration notice:', e);
    }
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900/95 border border-emerald-500/60 rounded-2xl p-4 shadow-2xl text-white backdrop-blur-md animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30">
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-white flex items-center gap-1.5">
            <span>Versi Baru Tersedia!</span>
          </p>
          <p className="text-xs text-slate-300 mt-0.5">
            Pembaruan sistem & fitur hafalan terbaru telah siap digunakan.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (updateFunction) {
                  updateFunction();
                } else {
                  window.location.reload();
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Perbarui Sekarang</span>
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition cursor-pointer"
            >
              Nanti
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-slate-400 hover:text-white p-1 cursor-pointer"
          aria-label="Tutup pemberitahuan"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
