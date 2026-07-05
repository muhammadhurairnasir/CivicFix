'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { IReportPhoto } from '@/models/Report';

interface PhotoLightboxProps {
  photos: IReportPhoto[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ photos, initialIndex = 0, isOpen, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Sync initial index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setIsZoomed(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setIsZoomed(false);
  };

  const toggleZoom = () => setIsZoomed(!isZoomed);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{ backgroundColor: '#141210' }}
          onClick={onClose}
        >
          {/* Top Bar Controls */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 z-10 bg-[var(--background)]/80">
            <div className="font-mono text-sm font-medium tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(20,18,16,0.6)', color: 'var(--text-inverse)' }}>
              {currentIndex + 1} / {photos.length}
            </div>
            
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={toggleZoom}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'rgba(253,252,250,0.6)' }}
                title={isZoomed ? "Zoom Out" : "Zoom In"}
              >
                {isZoomed ? <ZoomOut className="w-6 h-6" /> : <ZoomIn className="w-6 h-6" />}
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-full transition-colors"
                style={{ color: 'rgba(253,252,250,0.6)' }}
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 p-3 rounded-full transition-colors z-10"
              style={{ color: 'rgba(253,252,250,0.5)' }}
              title="Previous Image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image Container */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full h-full flex items-center justify-center p-4 sm:p-12 overflow-auto custom-scrollbar`}
            onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
          >
            <img
              src={currentPhoto.url}
              alt="Full screen view"
              className={`transition-all duration-300 rounded shadow-2xl ${isZoomed ? 'object-cover min-w-full min-h-full cursor-zoom-out' : 'max-w-full max-h-full object-contain cursor-zoom-in'}`}
              draggable={false}
            />
          </motion.div>

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 p-3 rounded-full transition-colors z-10"
              style={{ color: 'rgba(253,252,250,0.5)' }}
              title="Next Image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Bottom Thumbnails Strip (Optional feature if many photos) */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 p-2 z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2 p-2 rounded-xl" style={{ backgroundColor: 'rgba(20,18,16,0.6)' }}>
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsZoomed(false);
                    }}
                    className={`relative w-12 h-12 rounded overflow-hidden transition-all ${currentIndex === idx ? 'ring-2 scale-110 opacity-100' : 'opacity-50 hover:opacity-100'}`}
                    style={{ outlineColor: 'var(--text-inverse)' }}
                  >
                    <img src={photo.url} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
