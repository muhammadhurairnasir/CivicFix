'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, HardHat, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TicketPriority } from '@/types';
import { useToast } from '@/hooks/useToast';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;

const assignSchema = z.object({
  assignedTo: z.string().min(1, 'Please select a crew member'),
  priority: z.enum(PRIORITY_OPTIONS),
  estimatedCost: z.any(),
});

type AssignFormValues = z.infer<typeof assignSchema>;

interface AssignTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: {
    id: string;
    title: string;
    severity: string;
    address: string;
    ticketNumber: string;
  } | null;
  onSuccess?: () => void;
}

export function AssignTicketModal({
  open,
  onOpenChange,
  report,
  onSuccess,
}: AssignTicketModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      assignedTo: '',
      priority: TicketPriority.MEDIUM as any,
      estimatedCost: undefined,
    },
  });

  const selectedPriority = watch('priority');

  // Fetch active crew members
  const { data: crewData, isLoading: isLoadingCrew } = useQuery({
    queryKey: ['admin-users', { role: 'crew', isActive: true }],
    queryFn: async () => {
      const res = await axios.get('/api/admin/users?role=crew&isActive=true&limit=100');
      return res.data.data;
    },
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: async (values: AssignFormValues) => {
      if (!report) throw new Error('No report selected');
      const payload = {
        reportId: report.id,
        ...values,
      };
      const res = await axios.post('/api/admin/tickets', payload);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: 'Ticket Assigned',
        description: `Successfully dispatched crew for ${report?.ticketNumber}.`,
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      reset();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Assignment Failed',
        description: error.response?.data?.error || 'Could not assign ticket.',
        variant: 'danger',
      });
    },
  });

  const onSubmit = (values: AssignFormValues) => {
    assignMutation.mutate(values);
  };

  const getSlaHours = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.URGENT: return 4;
      case TicketPriority.HIGH: return 24;
      case TicketPriority.MEDIUM: return 72;
      case TicketPriority.LOW: return 168;
      default: return 72;
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--text-primary)]/50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl focus:outline-none">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <Dialog.Title className="text-xl font-semibold text-slate-900 font-display">
              Assign Ticket
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {report && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 border border-slate-200">
              <div className="text-sm font-medium text-brand-600 mb-1">{report.ticketNumber}</div>
              <h4 className="text-base font-semibold text-slate-900 line-clamp-1">{report.title}</h4>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                  {report.severity} Priority
                </span>
                <span className="truncate max-w-[200px]">{report.address}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Assign to Crew
              </label>
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm h-10 px-3 border"
                  >
                    <option value="" disabled>Select a crew member...</option>
                    {isLoadingCrew ? (
                      <option disabled>Loading crew...</option>
                    ) : (
                      crewData?.map((crew: any) => (
                        <option key={crew._id} value={crew._id}>
                          {crew.name} ({crew.stats?.ticketsCompleted || 0} completed)
                        </option>
                      ))
                    )}
                  </select>
                )}
              />
              {errors.assignedTo && <p className="mt-1 text-sm text-red-600">{errors.assignedTo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Ticket Priority
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm h-10 px-3 border capitalize"
                  >
                    {Object.values(TicketPriority).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
              />
              {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>}
              
              <div className="mt-2 flex items-center text-sm text-slate-500 bg-blue-50/50 p-2 rounded border border-blue-100">
                <AlertCircle className="h-4 w-4 text-blue-500 mr-2 shrink-0" />
                SLA Deadline: <strong className="ml-1 text-blue-700">{getSlaHours(selectedPriority)} hours</strong> from now
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Estimated Cost ($) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Controller
                name="estimatedCost"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    error={errors.estimatedCost?.message as string | undefined}
                  />
                )}
              />
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                leftIcon={<HardHat className="h-4 w-4" />}
              >
                Dispatch Crew
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
