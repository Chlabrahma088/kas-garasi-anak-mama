'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ExternalLink,
  Camera,
} from 'lucide-react';

interface CarPhotoGalleryProps {
  photos?: string[];
  carName: string;
  plateNumber?: string;
  instagramUrl?: string;
}

export const CarPhotoGallery: React.FC<CarPhotoGalleryProps> = ({
  photos = [],
  carName,
  plateNumber,
  instagramUrl,
}) => {
  // Filter valid photo strings
  const validPhotos = photos.filter((p) => Boolean(p && p.trim()));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Touch swipe support for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Keep active index within bounds
  const total = validPhotos.length;
  const currentPhoto = total > 0 ? validPhotos[activeIndex % total] : null;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, total]);

  // Auto-scroll thumbnail strip to active thumbnail
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const activeThumb = thumbnailContainerRef.current.children[activeIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [activeIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      // Swiped left -> next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (total === 0) {
    return (
      <div className="w-full h-48 sm:h-64 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 flex flex-col items-center justify-center p-6 text-center">
        <Camera className="w-10 h-10 text-slate-400 mb-2" />
        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Belum Ada Foto Unit</p>
        <p className="text-xs text-slate-500 mt-0.5">{carName} {plateNumber ? `(${plateNumber})` : ''}</p>
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200 dark:border-pink-900 transition"
          >
            <span>Buka Link Instagram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Main Image Frame */}
      <div
        className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl bg-slate-950 overflow-hidden select-none border border-slate-800 shadow-md group cursor-pointer"
        onClick={() => setIsFullscreen(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background blurred ambiance */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-30 scale-110"
          style={{ backgroundImage: `url(${currentPhoto})` }}
        />

        {/* Foreground Car Image */}
        <img
          src={currentPhoto || ''}
          alt={`${carName} - slide ${activeIndex + 1}`}
          className="relative z-10 w-full h-full object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
          loading="eager"
        />

        {/* Counter Badge */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold tracking-wide">
          <Camera className="w-3 h-3 text-emerald-400" />
          <span>
            {activeIndex + 1} / {total} Foto
          </span>
        </div>

        {/* Action Buttons Top-Right */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white text-[11px] font-bold shadow-md transition"
              title="Lihat postingan asli di Instagram Garasi Anak Mama"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Buka di IG</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </a>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white transition"
            title="Perbesar / Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Prev / Next Chevrons on Main Frame */}
        {total > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white transition active:scale-90"
              title="Foto Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm text-white transition active:scale-90"
              title="Foto Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip (if multiple photos) */}
      {total > 1 && (
        <div
          ref={thumbnailContainerRef}
          className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-thin no-scrollbar"
        >
          {validPhotos.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                activeIndex === idx
                  ? 'border-emerald-500 ring-2 ring-emerald-500/40 scale-105 opacity-100 z-10'
                  : 'border-slate-300 dark:border-zinc-700 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={url}
                alt={`${carName} thumb ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-3 sm:p-6 backdrop-blur-md animate-fade-in select-none"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-10">
            <div>
              <h3 className="text-sm sm:text-base font-bold">{carName}</h3>
              <p className="text-xs text-slate-400">
                {plateNumber ? `${plateNumber} • ` : ''}Foto {activeIndex + 1} dari {total}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition"
                >
                  <span>Post IG</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Central Image with Navigation */}
          <div
            className="relative flex-1 flex items-center justify-center p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {total > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white transition active:scale-90"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            <img
              src={currentPhoto || ''}
              alt={`${carName} fullscreen`}
              className="max-h-[78vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-transform duration-200"
            />

            {total > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white transition active:scale-90"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {total > 1 && (
            <div
              className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {validPhotos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden border-2 transition ${
                    activeIndex === idx
                      ? 'border-emerald-400 scale-105 opacity-100 ring-2 ring-emerald-400/40'
                      : 'border-white/30 opacity-50 hover:opacity-90'
                  }`}
                >
                  <img
                    src={url}
                    alt={`thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
