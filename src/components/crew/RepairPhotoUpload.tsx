'use client';

import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Camera, UploadCloud, XCircle, Image as ImageIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';

interface RepairPhotoUploadProps {
  ticketId: string;
  existingPhotos: { url: string; publicId: string }[];
  onUploadSuccess: () => void;
}

export function RepairPhotoUpload({
  ticketId,
  existingPhotos,
  onUploadSuccess,
}: RepairPhotoUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await axios.post(`/api/crew/tickets/${ticketId}/repair-photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Photo uploaded successfully', variant: 'success' });
      onUploadSuccess();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (err: any) => {
      toast({
        title: 'Upload failed',
        description: err.response?.data?.error || 'An error occurred during upload',
        variant: 'danger',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadMutation.mutate(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Target */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : uploadMutation.isPending
            ? 'border-slate-300 bg-slate-50'
            : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={uploadMutation.isPending}
        />
        
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
            <p className="text-sm font-medium text-slate-600">Uploading photo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 mb-2">
              <Camera className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-900">Tap to take photo</p>
            <p className="text-xs text-slate-500">or select from gallery</p>
          </div>
        )}
      </div>

      {/* Grid of uploaded photos */}
      {existingPhotos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
            <ImageIcon className="h-4 w-4 mr-1.5" /> Uploaded Photos ({existingPhotos.length})
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {existingPhotos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img src={photo.url} alt={`Repair ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
