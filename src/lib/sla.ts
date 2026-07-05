import { TicketPriority, ITicket } from '@/types';

export const SLA_RULES: Record<TicketPriority, number> = {
  [TicketPriority.URGENT]: 4,
  [TicketPriority.HIGH]: 24,
  [TicketPriority.MEDIUM]: 72,
  [TicketPriority.LOW]: 168,
};

/**
 * Calculate the SLA deadline based on the ticket's priority and creation date.
 */
export function calculateSlaDeadline(priority: TicketPriority, createdAt: Date): Date {
  const hours = SLA_RULES[priority];
  const deadline = new Date(createdAt.getTime());
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

export type SlaStatus = 'on_track' | 'at_risk' | 'breached';

/**
 * Determine the current SLA status of a ticket.
 */
export function getSlaStatus(ticket: ITicket): SlaStatus {
  if (ticket.completedAt) {
    return new Date(ticket.completedAt) > new Date(ticket.slaDeadline) ? 'breached' : 'on_track';
  }

  const now = new Date();
  const deadline = new Date(ticket.slaDeadline);

  if (deadline < now) {
    return 'breached';
  }

  // If deadline is within the next 2 hours
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  if (deadline < twoHoursFromNow) {
    return 'at_risk';
  }

  return 'on_track';
}

/**
 * Calculate the time overdue in minutes. If not overdue, returns a negative number representing remaining minutes.
 */
export function getTimeOverdue(ticket: ITicket): number {
  const now = new Date();
  const deadline = new Date(ticket.slaDeadline);
  const diffMs = now.getTime() - deadline.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Format the SLA countdown or overdue time into a human-readable string.
 */
export function formatSlaCountdown(ticket: ITicket): string {
  if (ticket.completedAt) {
    const completed = new Date(ticket.completedAt);
    const deadline = new Date(ticket.slaDeadline);
    if (completed > deadline) {
      const diffMs = completed.getTime() - deadline.getTime();
      const minutesOverdue = Math.floor(diffMs / (1000 * 60));
      return formatMinutes(minutesOverdue) + ' overdue (completed)';
    }
    return 'Completed on track';
  }

  const minutesOverdue = getTimeOverdue(ticket);
  
  if (minutesOverdue > 0) {
    return formatMinutes(minutesOverdue) + ' overdue';
  } else {
    return formatMinutes(Math.abs(minutesOverdue)) + ' remaining';
  }
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get the CSS variable token string for a given SLA status.
 * Use these with inline `style` props, not as Tailwind classes.
 * Returns: { color, borderColor } pointing to locked CSS variables.
 */
export function getSlaColor(status: SlaStatus): { color: string; borderColor: string } {
  switch (status) {
    case 'breached':
      return { color: 'var(--status-critical)', borderColor: 'var(--status-critical)' };
    case 'at_risk':
      return { color: 'var(--status-pending)', borderColor: 'var(--status-pending)' };
    case 'on_track':
      return { color: 'var(--status-resolved)', borderColor: 'var(--status-resolved)' };
    default:
      return { color: 'var(--text-secondary)', borderColor: 'var(--border)' };
  }
}
