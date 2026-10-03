import React, { useState, useRef } from 'react';
import {
  BookOpen,
  RotateCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Globe,
} from 'lucide-react';

const QURAN_URL = 'https://ayobacaqurandanterjemahan.blogspot.com';

export const BacaQuranView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = QURAN_URL;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-900 p-2 sm:p-4 flex flex-col'
          : 'space-y-4'
      }`}
    >
      {/* Top Banner / Toolbar */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30 shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-white tracking-tight">
                Al-Qur'an & Terjemahan
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Sparkles className="w-3 h-3" /> Ayo Baca Qur'an
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Membaca Al-Qur'an dan terjemahan langsung di dalam aplikasi (1 Frame)</span>
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            title="Muat ulang halaman Al-Qur'an"
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar dari layar penuh' : 'Tampilkan layar penuh'}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kecilkan</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </>
            )}
          </button>

          <a
            href={QURAN_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka situs sumber di tab baru"
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center justify-center cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white ${
          isFullscreen ? 'flex-1 min-h-0' : 'h-[78vh] min-h-[600px]'
        }`}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-bold text-emerald-400">
              Memuat Halaman Ayo Baca Qur'an...
            </p>
            <span className="text-xs text-slate-300 mt-1">
              Menghubungkan ke https://ayobacaqurandanterjemahan.blogspot.com
            </span>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={QURAN_URL}
          title="Ayo Baca Quran dan Terjemahan"
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
          allow="fullscreen; clipboard-read; clipboard-write"
          loading="lazy"
        />
      </div>
    </div>
  );
};
