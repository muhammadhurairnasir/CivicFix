'use client';

import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatar?: string;
  name: string;
  size?: number; // px
  onUploadSuccess: (newUrl: string) => void;
}

export default function AvatarUpload({
  currentAvatar,
  name,
  size = 112,
  onUploadSuccess,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState<string | null>(null);

  const initial = name?.charAt(0)?.toUpperCase() ?? '?';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Use JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5 MB.');
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await axios.post('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      });
      onUploadSuccess(res.data.data.avatar);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Upload failed. Please try again.');
      setPreview(null); // revert preview
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const displaySrc = preview ?? currentAvatar;
  const radius     = size / 2;
  const stroke     = 4;
  const normalizedR = radius - stroke / 2;
  const circumference  = 2 * Math.PI * normalizedR;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar wrapper */}
      <div
        className="relative cursor-pointer group select-none"
        style={{ width: size, height: size }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        title="Click to change avatar"
      >
        {/* Progress ring */}
        {uploading && (
          <svg
            className="absolute inset-0 -rotate-90 z-10"
            width={size}
            height={size}
          >
            <circle
              cx={radius}
              cy={radius}
              r={normalizedR}
              stroke="#e2e8f0"
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={radius}
              cy={radius}
              r={normalizedR}
              stroke="#3b82f6"
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          </svg>
        )}

        {/* Avatar image or initial */}
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={name}
            className={cn(
              'rounded-full object-cover border-4 border-white shadow-lg transition-opacity duration-200',
              uploading && 'opacity-50'
            )}
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            className={cn(
              'rounded-full bg-gradient-to-br from-brand-500 to-brand-700',
              'flex items-center justify-center text-white font-bold shadow-lg',
              'border-4 border-white',
              uploading && 'opacity-50'
            )}
            style={{ width: size, height: size, fontSize: size * 0.38 }}
          >
            {initial}
          </div>
        )}

        {/* Hover overlay */}
        {!uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="text-white" style={{ width: size * 0.28, height: size * 0.28 }} />
          </div>
        )}

        {/* Loading spinner */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-brand-500 animate-spin" style={{ width: size * 0.28 }} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg max-w-[200px] text-center">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-1">Click to change photo</p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
