'use client';

import React, { useCallback, useState } from 'react';
import { UploadCloud, X, Image as ImageIcon, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  size: number;
  error?: string;
}

interface PhotoUploaderProps {
  photos: PhotoFile[];
  onChange: (photos: PhotoFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function PhotoUploader({ 
  photos, 
  onChange, 
  maxFiles = 5, 
  maxSizeMB = 10 
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    const newPhotos: PhotoFile[] = [];
    const currentCount = photos.length;
    let added = 0;

    Array.from(files).forEach((file) => {
      if (currentCount + added >= maxFiles) return;

      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type);
      const isSizeValid = file.size <= maxSizeMB * 1024 * 1024;
      
      let error;
      if (!isValidType) error = 'Invalid file type. Use JPG, PNG, WEBP, or HEIC.';
      else if (!isSizeValid) error = `File exceeds ${maxSizeMB}MB limit.`;

      newPhotos.push({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        size: file.size,
        error
      });
      added++;
    });

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }
  }, [photos, maxFiles, maxSizeMB, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removePhoto = (idToRemove: string) => {
    const photoToRemove = photos.find(p => p.id === idToRemove);
    if (photoToRemove?.preview) {
      URL.revokeObjectURL(photoToRemove.preview);
    }
    onChange(photos.filter(p => p.id !== idToRemove));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <div
        className={cn(
          "relative w-full rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[160px]",
          isDragging 
            ? "border-primary bg-card" 
            : photos.length >= maxFiles 
              ? "border-border bg-surface opacity-50 cursor-not-allowed" 
              : "border-border hover:border-primary hover:bg-card"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={photos.length >= maxFiles ? undefined : handleDrop}
        onClick={() => {
          if (photos.length < maxFiles) {
            document.getElementById('photo-upload-input')?.click();
          }
        }}
      >
        <input
          id="photo-upload-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={handleChange}
          disabled={photos.length >= maxFiles}
        />
        
        <div className="rounded-full bg-card border border-border p-3 mb-3">
          <UploadCloud className="w-6 h-6 text-primary" />
        </div>
        
        {photos.length >= maxFiles ? (
          <p className="text-sm text-text-secondary font-medium">Maximum {maxFiles} photos added</p>
        ) : (
          <>
            <p className="text-sm text-text-primary font-medium mb-1">
              <span className="text-primary font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-text-secondary">
              JPG, PNG, WEBP or HEIC (max {maxSizeMB}MB)
            </p>
          </>
        )}
      </div>

      {/* Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <AnimatePresence>
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "relative group rounded-card overflow-hidden border aspect-square flex flex-col",
                  photo.error ? "border-status-critical bg-card" : "border-border bg-surface"
                )}
              >
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(photo.id);
                  }}
                  className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(26,25,23,0.7)', color: 'var(--text-inverse)' }}
                >
                  <X className="w-3 h-3" />
                </button>

                {photo.error ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                    <FileWarning className="w-6 h-6 mb-1" style={{ color: 'var(--status-critical)' }} />
                    <span className="text-[10px] font-medium leading-tight" style={{ color: 'var(--status-critical)' }}>{photo.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="relative flex-1 bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={photo.preview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-1.5 bg-surface border-t border-border flex items-center justify-between text-[10px]">
                      <span className="truncate flex-1 font-medium text-text-secondary mr-1">
                        {photo.file.name}
                      </span>
                      <span className="text-text-secondary font-mono whitespace-nowrap">
                        {formatSize(photo.size)}
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
