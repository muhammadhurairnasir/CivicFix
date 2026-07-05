// ─── Enums (as const objects for runtime + type safety) ───────────────────────

export const UserRole = {
  CITIZEN:     'citizen',
  CREW:        'crew',
  ADMIN:       'admin',
  SUPER_ADMIN: 'super_admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ReportStatus = {
  DRAFT:       'draft',
  OPEN:        'open',
  UNDER_REVIEW:'under_review',
  IN_PROGRESS: 'in_progress',
  RESOLVED:    'resolved',
  CLOSED:      'closed',
  REJECTED:    'rejected',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ReportType = {
  POTHOLE:         'pothole',
  CRACK:           'crack',
  ROAD_COLLAPSE:   'road_collapse',
  BROKEN_SIGNAGE:  'broken_signage',
  FLOODING:        'flooding',
  DEBRIS:          'debris',
  FADED_MARKINGS:  'faded_markings',
  BROKEN_GUARDRAIL:'broken_guardrail',
  OTHER:           'other',
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const Severity = {
  LOW:      'low',
  MEDIUM:   'medium',
  HIGH:     'high',
  CRITICAL: 'critical',
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const TicketStatus = {
  PENDING:     'pending',
  ASSIGNED:    'assigned',
  DISPATCHED:  'dispatched',
  EN_ROUTE:    'en_route',
  ACTIVE:      'active',
  BLOCKED:     'blocked',
  COMPLETED:   'completed',
  CANCELLED:   'cancelled',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW:      'low',
  MEDIUM:   'medium',
  HIGH:     'high',
  URGENT:   'urgent',
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

export const NotificationType = {
  REPORT_CREATED:   'report_created',
  REPORT_UPDATED:   'report_updated',
  REPORT_RESOLVED:  'report_resolved',
  TICKET_ASSIGNED:  'ticket_assigned',
  TICKET_COMPLETED: 'ticket_completed',
  SLA_WARNING:      'sla_warning',
  SLA_BREACHED:     'sla_breached',
  UPVOTE_MILESTONE: 'upvote_milestone',
  SYSTEM:           'system',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ─── Geo Location ─────────────────────────────────────────────────────────────

export interface IGeoLocation {
  type: 'Point';
  coordinates: [longitude: number, latitude: number];
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward?: string;
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string | Date;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface IReport {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  type: ReportType;
  severity: Severity;
  location: IGeoLocation;
  address: string;
  ward: string;
  photos: string[];
  status: ReportStatus;
  upvoteCount: number;
  viewCount: number;
  reporterId: string;
  reporter?: Pick<IUser, 'id' | 'name' | 'avatar'>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ─── Ticket ───────────────────────────────────────────────────────────────────

export interface ITicketNote {
  id: string;
  authorId: string;
  author?: Pick<IUser, 'id' | 'name' | 'avatar'>;
  body?: string;
  text?: string;
  createdAt: string | Date;
}

export interface ITicket {
  id: string;
  reportId: string;
  report?: Pick<IReport, 'id' | 'ticketNumber' | 'title' | 'severity'>;
  assignedTo?: string;
  assignedCrew?: Pick<IUser, 'id' | 'name' | 'avatar'>;
  assignedBy: string;
  assignedAdmin?: Pick<IUser, 'id' | 'name'>;
  priority: TicketPriority;
  slaDeadline: string | Date;
  slaBreached: boolean;
  status: TicketStatus;
  repairPhotos: { url: string; publicId: string; takenAt?: string | Date; takenBy?: string }[] | any[];
  notes: ITicketNote[];
  estimatedCost?: number;
  completedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  reportId?: string;
  ticketId?: string;
  isRead: boolean;
  createdAt: string | Date;
}

// ─── API Response Generics ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}
