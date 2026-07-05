'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Truck, Navigation, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TicketStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/hooks/useToast';

interface StatusUpdateButtonProps {
  ticketId: string;
  currentStatus: TicketStatus;
  hasPhotos: boolean;
  onSuccess: () => void;
}

export function StatusUpdateButton({
  ticketId,
  currentStatus,
  hasPhotos,
  onSuccess,
}: StatusUpdateButtonProps) {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TicketStatus | null>(null);
  const [blockNote, setBlockNote] = useState('');

  const statusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: TicketStatus; note?: string }) => {
      const res = await axios.patch(`/api/crew/tickets/${ticketId}`, { status, note });
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Status updated successfully', variant: 'success' });
      setConfirmOpen(false);
      setTargetStatus(null);
      setBlockNote('');
      onSuccess();
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to update status',
        description: err.response?.data?.error || err.message,
        variant: 'danger',
      });
    },
  });

  const handleAction = (status: TicketStatus) => {
    setTargetStatus(status);
    setConfirmOpen(true);
  };

  const confirmAction = () => {
    if (!targetStatus) return;
    statusMutation.mutate({ status: targetStatus, note: blockNote });
  };

  let primaryButton = null;
  let secondaryButton = null;

  switch (currentStatus) {
    case TicketStatus.ASSIGNED:
      primaryButton = (
        <Button
          size="lg"
          className="w-full text-lg py-6"
          onClick={() => handleAction(TicketStatus.DISPATCHED)}
        >
          Acknowledge & Dispatch
        </Button>
      );
      break;
    case TicketStatus.DISPATCHED:
      primaryButton = (
        <Button
          size="lg"
          className="w-full text-lg py-6"
          leftIcon={<Truck className="h-5 w-5" />}
          onClick={() => handleAction(TicketStatus.EN_ROUTE)}
        >
          Start Journey
        </Button>
      );
      break;
    case TicketStatus.EN_ROUTE:
      primaryButton = (
        <Button
          size="lg"
          className="w-full text-lg py-6"
          leftIcon={<Navigation className="h-5 w-5" />}
          onClick={() => handleAction(TicketStatus.ACTIVE)}
        >
          Arrived On Site
        </Button>
      );
      break;
    case TicketStatus.ACTIVE:
      primaryButton = (
        <Button
          size="lg"
          className="w-full text-lg py-6"
          leftIcon={<CheckCircle2 className="h-5 w-5" />}
          onClick={() => handleAction(TicketStatus.COMPLETED)}
          disabled={!hasPhotos}
          title={!hasPhotos ? 'Upload at least one repair photo to complete' : ''}
        >
          Mark Complete
        </Button>
      );
      secondaryButton = (
        <Button
          size="lg"
          variant="danger"
          className="w-full text-lg py-6 mt-3 bg-red-100 text-red-700 hover:bg-red-200"
          leftIcon={<AlertTriangle className="h-5 w-5" />}
          onClick={() => handleAction(TicketStatus.BLOCKED)}
        >
          Report Blockage
        </Button>
      );
      break;
    case TicketStatus.BLOCKED:
      primaryButton = (
        <Button
          size="lg"
          className="w-full text-lg py-6"
          onClick={() => handleAction(TicketStatus.ACTIVE)}
        >
          Resume Work
        </Button>
      );
      break;
    default:
      return null;
  }

  return (
    <div className="w-full">
      {primaryButton}
      {secondaryButton}

      {targetStatus && (
        <ConfirmModal
          isOpen={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={`Confirm ${targetStatus.replace('_', ' ').toUpperCase()}`}
          description={
            targetStatus === TicketStatus.BLOCKED
              ? 'Please provide a reason why this ticket is blocked. This will be added as an internal note and visible to admins.'
              : targetStatus === TicketStatus.COMPLETED
              ? 'Are you sure you want to mark this ticket as completed? This will notify the citizen that the report has been resolved.'
              : 'Are you sure you want to update the status?'
          }
          confirmLabel={statusMutation.isPending ? 'Updating...' : 'Confirm Update'}
          onConfirm={confirmAction}
          variant={targetStatus === TicketStatus.BLOCKED ? 'danger' : 'primary'}
        >
          {targetStatus === TicketStatus.BLOCKED && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason for blockage <span className="text-red-500">*</span>
              </label>
              <textarea
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm resize-none"
                rows={3}
                placeholder="E.g., Require heavy machinery, unsafe conditions..."
                required
              />
            </div>
          )}
        </ConfirmModal>
      )}
    </div>
  );
}
