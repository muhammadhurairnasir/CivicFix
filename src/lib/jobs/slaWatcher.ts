import { connectDB } from '@/lib/db';
import { Ticket, Notification, User, Report } from '@/models';
import { TicketStatus, NotificationType, UserRole } from '@/types';
import { sendSlaBreachEmail, sendSlaWarningEmail } from '@/lib/email';
import { getRedis } from '@/lib/redis';

const ACTIVE_STATUSES = [
  TicketStatus.PENDING,
  TicketStatus.ASSIGNED,
  TicketStatus.DISPATCHED,
  TicketStatus.EN_ROUTE,
  TicketStatus.ACTIVE,
  TicketStatus.BLOCKED,
];

export async function checkSlaBreaches() {
  await connectDB();
  const now = new Date();

  // Find tickets that have passed their deadline and are not yet marked as breached
  const breachedTickets = await Ticket.find({
    status: { $in: ACTIVE_STATUSES },
    slaDeadline: { $lte: now },
    slaBreached: false,
  }).populate('reportId', 'ticketNumber title');

  if (breachedTickets.length === 0) {
    return { checked: 0, breached: 0 };
  }

  // Fetch all admins/super_admins to notify
  const admins = await User.find({
    role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    isActive: true,
  }).select('_id email name');

  let breachCount = 0;

  for (const ticket of breachedTickets) {
    ticket.slaBreached = true;
    await ticket.save();
    breachCount++;

    const report = ticket.reportId as any;

    const notifyOps = admins.map(admin => 
      Notification.create({
        userId: admin._id,
        type: NotificationType.SLA_BREACHED,
        title: `SLA Breach: ${report.ticketNumber}`,
        body: `Ticket for "${report.title}" has breached its SLA deadline.`,
        ticketId: ticket._id,
        reportId: report._id,
      })
    );

    const emailOps = admins.map(admin => 
      sendSlaBreachEmail(admin.email, admin.name, report.ticketNumber).catch(err => {
        console.error(`[SLA Watcher] Failed to send breach email to ${admin.email}:`, err);
      })
    );

    await Promise.all([...notifyOps, ...emailOps]);
  }

  console.log(`[SLA Watcher] Marked ${breachCount} tickets as breached.`);
  return { checked: breachedTickets.length, breached: breachCount };
}

export async function checkUpcomingBreaches() {
  await connectDB();
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Find tickets that are at risk (deadline within next 2 hours)
  const atRiskTickets = await Ticket.find({
    status: { $in: ACTIVE_STATUSES },
    slaDeadline: { $gt: now, $lte: twoHoursFromNow },
    slaBreached: false,
  }).populate('reportId', 'ticketNumber title');

  if (atRiskTickets.length === 0) {
    return { warned: 0 };
  }

  const admins = await User.find({
    role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    isActive: true,
  }).select('_id email name');

  const redisClient = getRedis();
  let warnCount = 0;

  for (const ticket of atRiskTickets) {
    const redisKey = `sla_warned:${ticket._id}`;
    const alreadyWarned = await redisClient.get(redisKey);

    if (!alreadyWarned) {
      warnCount++;
      const report = ticket.reportId as any;
      const hoursRemaining = parseFloat(((new Date(ticket.slaDeadline).getTime() - now.getTime()) / (1000 * 60 * 60)).toFixed(1));

      const notifyOps = admins.map(admin => 
        Notification.create({
          userId: admin._id,
          type: NotificationType.SLA_WARNING,
          title: `SLA Warning: ${report.ticketNumber}`,
          body: `Ticket for "${report.title}" is at risk of breaching SLA in less than 2 hours.`,
          ticketId: ticket._id,
          reportId: report._id,
        })
      );

      const emailOps = admins.map(admin => 
        sendSlaWarningEmail(admin.email, admin.name, report.ticketNumber, hoursRemaining).catch(err => {
          console.error(`[SLA Watcher] Failed to send warning email to ${admin.email}:`, err);
        })
      );

      await Promise.all([...notifyOps, ...emailOps]);

      // Set warned flag with a 3-hour TTL
      await redisClient.set(redisKey, '1', 'EX', 3 * 60 * 60);
    }
  }

  if (warnCount > 0) {
    console.log(`[SLA Watcher] Sent early warnings for ${warnCount} tickets.`);
  }
  
  return { warned: warnCount };
}
