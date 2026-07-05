'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createReportSchema, CreateReportInput } from '@/lib/validations/report';
import { PhotoFile } from '@/components/ui/PhotoUploader';

export interface ReportFormState extends CreateReportInput {
  photos: PhotoFile[];
}

export function useReportSubmit() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ReportFormState>({
    resolver: zodResolver(createReportSchema as any) as any,
    defaultValues: {
      title: '',
      description: '',
      type: undefined as any,
      severity: undefined as any,
      latitude: undefined as any,
      longitude: undefined as any,
      address: '',
      ward: '',
      tags: [],
      photos: [],
    },
    mode: 'onTouched',
  });

  // Persist draft to session storage
  useEffect(() => {
    const draft = sessionStorage.getItem('civicfix_report_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // We can't easily persist File objects in session storage, so we skip photos
        form.reset({ ...parsed, photos: [] });
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const draftValue = { ...value };
      delete draftValue.photos; // Don't stringify files
      sessionStorage.setItem('civicfix_report_draft', JSON.stringify(draftValue));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const clearDraft = () => {
    sessionStorage.removeItem('civicfix_report_draft');
  };

  const nextStep = async () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = await form.trigger(['type', 'severity', 'title', 'description', 'tags']);
    } else if (currentStep === 2) {
      isValid = await form.trigger(['latitude', 'longitude', 'address', 'ward']);
    } else if (currentStep === 3) {
      // Photos are optional
      isValid = true;
    }

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (step: number) => {
    // Only allow navigating back to previously completed steps
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submitReport = async (data: ReportFormState) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      
      Object.keys(data).forEach((key) => {
        if (key === 'photos') return;
        if (key === 'tags') {
          data.tags?.forEach((tag) => formData.append('tags', tag));
        } else {
          const value = data[key as keyof CreateReportInput];
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, value.toString());
          }
        }
      });

      data.photos.forEach((photo) => {
        formData.append('photos', photo.file);
      });

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
        // Note: Do not set Content-Type header; fetch sets it automatically with the boundary for FormData
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit report');
      }

      clearDraft();
      return result.data.ticketNumber;
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    currentStep,
    isSubmitting,
    submitError,
    nextStep,
    prevStep,
    goToStep,
    submitReport,
  };
}
