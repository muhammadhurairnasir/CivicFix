'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Stepper, Step } from '@/components/ui/Stepper';
import { PhotoUploader } from '@/components/ui/PhotoUploader';
import MapWrapper from '@/components/map/MapWrapper';
import { useReportSubmit } from '@/hooks/useReportSubmit';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { ReportType, Severity } from '@/types';
import { 
  AlertCircle, AlertTriangle, ShieldAlert, AlertOctagon, 
  Droplets, Trash2, ArrowRight, ArrowLeft, Send, Info, MapPin, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS: Step[] = [
  { id: 1, label: 'Problem Details' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Photos' },
  { id: 4, label: 'Review' },
];

const REPORT_TYPES = [
  { id: ReportType.POTHOLE, label: 'Pothole', icon: AlertCircle, desc: 'Deep hole in road surface' },
  { id: ReportType.CRACK, label: 'Road Crack', icon: AlertTriangle, desc: 'Linear fracture in asphalt' },
  { id: ReportType.ROAD_COLLAPSE, label: 'Collapse', icon: ShieldAlert, desc: 'Significant structural failure' },
  { id: ReportType.FLOODING, label: 'Flooding', icon: Droplets, desc: 'Standing water or blocked drain' },
  { id: ReportType.DEBRIS, label: 'Debris', icon: Trash2, desc: 'Obstruction on the roadway' },
  { id: ReportType.BROKEN_SIGNAGE, label: 'Signage', icon: AlertOctagon, desc: 'Damaged or missing sign' },
];

const SEVERITIES = [
  { id: Severity.LOW, label: 'Low', color: 'bg-success', desc: 'No immediate danger' },
  { id: Severity.MEDIUM, label: 'Medium', color: 'bg-warning', desc: 'Monitor carefully' },
  { id: Severity.HIGH, label: 'High', color: 'bg-orange-500', desc: 'Hazardous, needs attention' },
  { id: Severity.CRITICAL, label: 'Critical', color: 'bg-danger', desc: 'Immediate emergency' },
];

export default function NewReportPage() {
  const router = useRouter();
  const {
    form,
    currentStep,
    isSubmitting,
    submitError,
    nextStep,
    prevStep,
    goToStep,
    submitReport,
  } = useReportSubmit();

  const { watch, setValue, control, handleSubmit } = form;
  const values = watch();

  const handleTags = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && values.tags.length < 5 && !values.tags.includes(val)) {
        setValue('tags', [...values.tags, val]);
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tag: string) => {
    setValue('tags', values.tags.filter(t => t !== tag));
  };

  const onSubmit = async (data: any) => {
    const ticketId = await submitReport(data);
    if (ticketId) {
      router.push(`/report/success?ticket=${ticketId}`);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="max-w-3xl mx-auto w-full pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary mb-2">Report a Defect</h1>
        <p className="text-text-secondary">Help keep our city safe by reporting road issues.</p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 bg-bg-surface border border-border rounded-xl shadow-sm overflow-hidden p-6 md:p-8">
        <AnimatePresence mode="wait">
          {/* STEP 1: PROBLEM DETAILS */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-4">What&apos;s the problem?</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {REPORT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = values.type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setValue('type', type.id, { shouldValidate: true })}
                        className={cn(
                          "flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all",
                          isSelected 
                            ? "border-brand bg-brand-subtle/20 text-brand shadow-sm" 
                            : "border-border hover:border-brand-subtle hover:bg-bg-subtle text-text-secondary"
                        )}
                      >
                        <Icon className={cn("w-6 h-6 mb-2", isSelected ? "text-brand" : "text-text-tertiary")} />
                        <span className="text-sm font-semibold mb-1">{type.label}</span>
                        <span className="text-xs text-text-tertiary hidden md:block">{type.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.type && (
                  <p className="text-danger text-sm mt-2 font-medium">{form.formState.errors.type.message as string}</p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-text-primary mb-4">How severe is it?</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SEVERITIES.map((sev) => {
                    const isSelected = values.severity === sev.id;
                    return (
                      <button
                        key={sev.id}
                        type="button"
                        onClick={() => setValue('severity', sev.id, { shouldValidate: true })}
                        className={cn(
                          "relative overflow-hidden flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left",
                          isSelected 
                            ? "border-brand bg-brand-subtle/10 shadow-sm" 
                            : "border-border hover:border-border-strong hover:bg-bg-subtle"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("w-3 h-3 rounded-full", sev.color)} />
                          <span className={cn("text-sm font-semibold", isSelected ? "text-brand" : "text-text-primary")}>
                            {sev.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-tertiary">{sev.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.severity && (
                  <p className="text-danger text-sm mt-2 font-medium">{form.formState.errors.severity.message as string}</p>
                )}
              </div>

              <div className="space-y-4">
                <FormField
                  control={control as any}
                  name="title"
                  label="Title"
                  placeholder="E.g. Large pothole on Main St."
                  maxLength={100}
                />
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary">Description</label>
                  <textarea
                    {...form.register('description')}
                    placeholder="Provide more details about the issue..."
                    className={cn(
                      "flex min-h-[100px] w-full rounded-input border border-border-strong bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-colors",
                      form.formState.errors.description && "border-danger focus-visible:ring-danger focus-visible:border-danger"
                    )}
                  />
                  {form.formState.errors.description && (
                    <p className="text-xs text-danger font-medium">{form.formState.errors.description.message as string}</p>
                  )}
                  <p className="text-xs text-text-tertiary text-right">{values.description.length}/1000</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary">Tags (Optional)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {values.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-subtle text-brand text-xs font-semibold">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-brand-fg">
                          <AlertCircle className="w-3 h-3 rotate-45" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Type a tag and press Enter"
                    disabled={values.tags.length >= 5}
                    onKeyDown={handleTags}
                    className="flex h-9 w-full rounded-input border border-border-strong bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: LOCATION */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">Where is it?</h2>
                <p className="text-sm text-text-secondary mb-4">Pinpoint the exact location on the map.</p>
                
                <MapWrapper 
                  value={values.latitude && values.longitude ? { 
                    lat: values.latitude, 
                    lng: values.longitude, 
                    address: values.address, 
                    ward: values.ward 
                  } : undefined}
                  onChange={(loc) => {
                    setValue('latitude', loc.lat, { shouldValidate: true });
                    setValue('longitude', loc.lng, { shouldValidate: true });
                    if (loc.address) setValue('address', loc.address, { shouldValidate: true });
                    if (loc.ward) setValue('ward', loc.ward, { shouldValidate: true });
                  }}
                />
                {(form.formState.errors.latitude || form.formState.errors.longitude) && (
                  <p className="text-danger text-sm mt-2 font-medium">Please select a location on the map.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control as any}
                  name="address"
                  label="Address / Landmark"
                  placeholder="123 Civic Way"
                />
                <FormField
                  control={control as any}
                  name="ward"
                  label="Ward / Neighborhood"
                  placeholder="Downtown"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 3: PHOTOS */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">Add Photos (Optional)</h2>
                <p className="text-sm text-text-secondary mb-4">Visual evidence helps our crew resolve issues faster.</p>
                
                <div className="bg-brand-subtle/30 border border-brand-subtle rounded-xl p-4 flex items-start gap-3 mb-6">
                  <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div className="text-sm text-text-secondary">
                    <strong className="text-text-primary block mb-1">Good photo tips:</strong>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Include the full defect in the frame.</li>
                      <li>Include a wider shot showing surroundings (e.g., landmarks).</li>
                      <li>Ensure lighting is clear and avoid blurry shots.</li>
                    </ul>
                  </div>
                </div>

                <PhotoUploader 
                  photos={values.photos} 
                  onChange={(photos) => setValue('photos', photos)} 
                  maxFiles={5}
                />
              </div>
            </motion.div>
          )}

          {/* STEP 4: REVIEW */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">Review & Submit</h2>
                <p className="text-sm text-text-secondary mb-6">Check your details before submitting.</p>
                
                <div className="space-y-6">
                  {/* Summary Block 1 */}
                  <div className="relative border border-border rounded-xl p-5 bg-bg-base">
                    <button type="button" onClick={() => goToStep(1)} className="absolute top-4 right-4 text-sm font-semibold text-brand hover:underline">Edit</button>
                    <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Problem Details</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-bg-surface border border-border text-sm font-medium">
                        {REPORT_TYPES.find(t => t.id === values.type)?.label || values.type}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-bg-surface border border-border text-sm font-medium flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", SEVERITIES.find(s => s.id === values.severity)?.color)} />
                        {SEVERITIES.find(s => s.id === values.severity)?.label || values.severity} Severity
                      </span>
                    </div>
                    <p className="font-semibold text-text-primary mb-1">{values.title}</p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{values.description}</p>
                  </div>

                  {/* Summary Block 2 */}
                  <div className="relative border border-border rounded-xl p-5 bg-bg-base">
                    <button type="button" onClick={() => goToStep(2)} className="absolute top-4 right-4 text-sm font-semibold text-brand hover:underline">Edit</button>
                    <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Location</h3>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-text-secondary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{values.address || 'No address provided'}</p>
                        {values.ward && <p className="text-xs text-text-secondary">{values.ward}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Summary Block 3 */}
                  <div className="relative border border-border rounded-xl p-5 bg-bg-base">
                    <button type="button" onClick={() => goToStep(3)} className="absolute top-4 right-4 text-sm font-semibold text-brand hover:underline">Edit</button>
                    <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Attached Photos ({values.photos.length})</h3>
                    {values.photos.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {values.photos.map(p => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.id} src={p.preview} alt="Preview" className="w-16 h-16 rounded-md object-cover border border-border shrink-0" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary italic">No photos attached.</p>
                    )}
                  </div>
                </div>

                {submitError && (
                  <div className="mt-6 p-4 bg-danger-bg border border-danger-default rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                    <p className="text-sm text-danger font-medium">{submitError}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep} className="px-8">
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="px-8 bg-success hover:bg-success-fg text-white">
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  Submit Report
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
