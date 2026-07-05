import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import User         from '../src/models/User.js';
import Report       from '../src/models/Report.js';
import Ticket       from '../src/models/Ticket.js';
import Comment      from '../src/models/Comment.js';
import Notification from '../src/models/Notification.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const day  = 24 * 60 * 60 * 1000;
const hour = 60 * 60 * 1000;

/** Returns a Date relative to now in milliseconds offset */
function ago(ms: number)   { return new Date(Date.now() - ms); }
function ahead(ms: number) { return new Date(Date.now() + ms); }

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('✅  Connected.\n');

  // ─── Wipe ──────────────────────────────────────────────────────────────────
  console.log('🗑   Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Report.deleteMany({}),
    Ticket.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  // ─── Users ─────────────────────────────────────────────────────────────────
  console.log('👤  Creating users…');

  // All passwords: Password123!
  const [citizen1, citizen2, superAdmin, admin, crew1, crew2, crew3] = await Promise.all([
    User.create({
      name: 'Jane Citizen',
      email: 'citizen@example.com',
      password: 'Password123!',
      role: 'citizen',
      ward: 'Ward 1',
      phone: '+1-555-0101',
      isVerified: true,
      isActive: true,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=jane',
      createdAt: ago(30 * day),
    }),
    User.create({
      name: 'Carlos Reporter',
      email: 'citizen2@example.com',
      password: 'Password123!',
      role: 'citizen',
      ward: 'Ward 3',
      phone: '+1-555-0102',
      isVerified: true,
      isActive: true,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=carlos',
      createdAt: ago(20 * day),
    }),
    User.create({
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: 'Password123!',
      role: 'super_admin',
      isVerified: true,
      isActive: true,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=superadmin',
      createdAt: ago(60 * day),
    }),
    User.create({
      name: 'Admin Boss',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin',
      ward: 'Ward 1',
      isVerified: true,
      isActive: true,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=admin',
      createdAt: ago(60 * day),
    }),
    User.create({
      name: 'Bob Builder',
      email: 'crew@example.com',
      password: 'Password123!',
      role: 'crew',
      ward: 'Ward 1',
      phone: '+1-555-0201',
      isVerified: true,
      isActive: true,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=bob',
      createdAt: ago(45 * day),
    }),
    User.create({
      name: 'Alice Roads',
      email: 'crew2@example.com',
      password: 'Password123!',
      role: 'crew',
      ward: 'Ward 2',
      phone: '+1-555-0202',
      isVerified: true,
      isActive: true,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=alice',
      createdAt: ago(40 * day),
    }),
    User.create({
      name: 'Dave Drains',
      email: 'crew3@example.com',
      password: 'Password123!',
      role: 'crew',
      ward: 'Ward 3',
      phone: '+1-555-0203',
      isVerified: true,
      isActive: true,
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dave',
      createdAt: ago(35 * day),
    }),
  ]);

  // ─── Reports ───────────────────────────────────────────────────────────────
  console.log('📋  Creating reports…');

  const reports = await Promise.all([
    // 0 — Open / Unassigned — pothole
    Report.create({
      reporterId: citizen1._id,
      ticketNumber: 'RPT-2026-00001',
      title: 'Massive pothole on Main St',
      description: 'There is a huge pothole that has been damaging cars. At least 3 cars had blown tyres this week. Needs urgent attention.',
      type: 'pothole', severity: 'high', status: 'open',
      address: '100 Main St, Cityville', ward: 'Ward 1',
      location: { type: 'Point', coordinates: [3.384, 6.455] },
      photos: [
        { url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop', publicId: 'seed_p1' },
      ],
      viewCount: 15, upvoteCount: 7,
      tags: ['pothole', 'urgent'],
      createdAt: ago(7 * day),
    }),

    // 1 — Under Review — broken signage
    Report.create({
      reporterId: citizen1._id,
      ticketNumber: 'RPT-2026-00002',
      title: 'Broken street light on Oak Ave',
      description: 'Street light completely out — dangerous at night for pedestrians. Children walk this route to school.',
      type: 'broken_signage', severity: 'medium', status: 'under_review',
      address: '250 Oak Ave, Cityville', ward: 'Ward 2',
      location: { type: 'Point', coordinates: [3.391, 6.462] },
      photos: [],
      viewCount: 8, upvoteCount: 2,
      tags: ['lighting', 'safety'],
      createdAt: ago(5 * day),
    }),

    // 2 — In Progress (crew active) — flooding
    Report.create({
      reporterId: citizen2._id,
      ticketNumber: 'RPT-2026-00003',
      title: 'Flooded intersection at Pine & 5th',
      description: 'Storm drain completely blocked. Intersection is underwater. Cars stranded.',
      type: 'flooding', severity: 'critical', status: 'in_progress',
      address: 'Pine & 5th St, Cityville', ward: 'Ward 1',
      location: { type: 'Point', coordinates: [3.379, 6.451] },
      photos: [
        { url: 'https://images.unsplash.com/photo-1548625361-ec2e3153eb26?w=800&auto=format&fit=crop', publicId: 'seed_fl1' },
      ],
      viewCount: 42, upvoteCount: 14,
      tags: ['flooding', 'critical', 'drain'],
      createdAt: ago(3 * day),
    }),

    // 3 — Resolved (completed ticket)
    Report.create({
      reporterId: citizen1._id,
      ticketNumber: 'RPT-2026-00004',
      title: 'Cracked sidewalk near Central Park',
      description: 'Trip hazard outside the park entrance. An elderly resident nearly fell last week.',
      type: 'crack', severity: 'low', status: 'resolved',
      address: 'Central Park West, Cityville', ward: 'Ward 3',
      location: { type: 'Point', coordinates: [3.395, 6.469] },
      photos: [],
      viewCount: 5, upvoteCount: 1,
      tags: ['sidewalk', 'trip-hazard'],
      createdAt: ago(14 * day),
    }),

    // 4 — Open / Critical — guardrail
    Report.create({
      reporterId: citizen2._id,
      ticketNumber: 'RPT-2026-00005',
      title: 'Guardrail collapsed on Highway 7',
      description: 'A section of guardrail on the south side has completely collapsed. Serious risk to vehicle safety.',
      type: 'broken_guardrail', severity: 'critical', status: 'open',
      address: 'Highway 7 Southbound, Ward 4', ward: 'Ward 4',
      location: { type: 'Point', coordinates: [3.405, 6.479] },
      photos: [],
      viewCount: 21, upvoteCount: 9,
      tags: ['guardrail', 'highway', 'safety'],
      createdAt: ago(1 * day),
    }),

    // 5 — Open — faded markings
    Report.create({
      reporterId: citizen1._id,
      ticketNumber: 'RPT-2026-00006',
      title: 'Faded road markings near school zone',
      description: 'Pedestrian crossing markings near Maple Elementary have faded. Dangerous for children.',
      type: 'faded_markings', severity: 'medium', status: 'open',
      address: 'Maple Elementary School, Ward 2', ward: 'Ward 2',
      location: { type: 'Point', coordinates: [3.388, 6.458] },
      photos: [],
      viewCount: 9, upvoteCount: 3,
      tags: ['school-zone', 'markings'],
      createdAt: ago(3 * day),
    }),

    // 6 — Open — road collapse (Ward 3)
    Report.create({
      reporterId: citizen2._id,
      ticketNumber: 'RPT-2026-00007',
      title: 'Road collapse outside Ward 3 market',
      description: 'Large section of road has caved in outside the daily market. Heavy lorry traffic likely the cause.',
      type: 'road_collapse', severity: 'critical', status: 'open',
      address: 'Market Rd, Ward 3', ward: 'Ward 3',
      location: { type: 'Point', coordinates: [3.398, 6.467] },
      photos: [],
      viewCount: 33, upvoteCount: 11,
      tags: ['road-collapse', 'ward3'],
      createdAt: ago(2 * day),
    }),

    // 7 — Resolved — debris cleanup
    Report.create({
      reporterId: citizen1._id,
      ticketNumber: 'RPT-2026-00008',
      title: 'Debris blocking Ward 2 bus stop',
      description: 'Construction waste dumped beside the bus stop. Passengers cannot access the shelter.',
      type: 'debris', severity: 'low', status: 'resolved',
      address: 'Bus Stop 12, Ward 2', ward: 'Ward 2',
      location: { type: 'Point', coordinates: [3.393, 6.463] },
      photos: [],
      viewCount: 6, upvoteCount: 0,
      tags: ['debris', 'bus-stop'],
      createdAt: ago(20 * day),
    }),

    // 8 — Assigned (en_route) — pothole Ward 3
    Report.create({
      reporterId: citizen2._id,
      ticketNumber: 'RPT-2026-00009',
      title: 'Series of potholes on Commerce Blvd',
      description: 'At least 6 potholes clustered on Commerce Blvd between junctions 3 and 5.',
      type: 'pothole', severity: 'high', status: 'in_progress',
      address: 'Commerce Blvd, Ward 3', ward: 'Ward 3',
      location: { type: 'Point', coordinates: [3.401, 6.471] },
      photos: [],
      viewCount: 18, upvoteCount: 5,
      tags: ['pothole', 'commerce'],
      createdAt: ago(6 * day),
    }),

    // 9 — Open (SLA about to breach) — Ward 1
    Report.create({
      reporterId: citizen1._id,
      ticketNumber: 'RPT-2026-00010',
      title: 'Broken water main cover on Elm St',
      description: 'Open water main access cover in the middle of the road. Dangerous for cyclists and vehicles.',
      type: 'other', severity: 'high', status: 'open',
      address: '44 Elm St, Ward 1', ward: 'Ward 1',
      location: { type: 'Point', coordinates: [3.382, 6.453] },
      photos: [],
      viewCount: 11, upvoteCount: 4,
      tags: ['water-main', 'hazard'],
      createdAt: ago(12 * day),
    }),
  ]);

  // ─── Tickets ───────────────────────────────────────────────────────────────
  // NOTE: The Ticket pre-save hook auto-calculates slaDeadline from priority.
  // We bypass it by using insertMany with timestamps:false for historical tickets,
  // or just create normally and accept the auto-computed deadlines for active ones.
  console.log('🎫  Creating tickets…');

  // Helper to bypass the pre-save slaDeadline recalculation for seeded tickets
  const insertTicketRaw = (data: object) =>
    Ticket.collection.insertOne({ ...data, createdAt: (data as any).createdAt || new Date(), updatedAt: new Date() });

  const ticketDocs = await Promise.all([
    // T0 — Report[1] (broken signage) — ASSIGNED to crew2
    insertTicketRaw({
      reportId:       reports[1]._id,
      assignedTo:     crew2._id,
      assignedBy:     admin._id,
      priority:       'medium',
      slaDeadline:    ahead(30 * hour),
      slaBreached:    false,
      status:         'assigned',
      repairPhotos:   [],
      notes:          [],
      estimatedCost:  800,
      createdAt:      ago(4 * day),
    }),

    // T1 — Report[2] (flooding) — ACTIVE (crew1 on-site)
    insertTicketRaw({
      reportId:       reports[2]._id,
      assignedTo:     crew1._id,
      assignedBy:     admin._id,
      priority:       'urgent',
      slaDeadline:    ahead(2 * hour),   // nearly at-risk
      slaBreached:    false,
      status:         'active',
      startedAt:      ago(6 * hour),
      repairPhotos:   [
        {
          url:       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
          publicId:  'seed_rp1',
          takenAt:   ago(3 * hour),
          takenBy:   crew1._id,
        },
      ],
      notes:          [
        {
          _id:       new Types.ObjectId(),
          text:      'Drain unblocked. Pumping residual water now. Should clear within 2 hrs.',
          author:    crew1._id,
          createdAt: ago(3 * hour),
        },
      ],
      estimatedCost:  2500,
      createdAt:      ago(3 * day),
    }),

    // T2 — Report[3] (cracked sidewalk) — COMPLETED (resolved, historical)
    insertTicketRaw({
      reportId:       reports[3]._id,
      assignedTo:     crew3._id,
      assignedBy:     admin._id,
      priority:       'low',
      slaDeadline:    ago(2 * day),
      slaBreached:    false,             // completed before breach
      status:         'completed',
      startedAt:      ago(12 * day),
      completedAt:    ago(10 * day),
      actualCost:     350,
      repairPhotos:   [
        {
          url:       'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop',
          publicId:  'seed_rp2',
          takenAt:   ago(10 * day),
          takenBy:   crew3._id,
        },
      ],
      notes:          [
        {
          _id:       new Types.ObjectId(),
          text:      'Crack filled and surface re-levelled. Job complete.',
          author:    crew3._id,
          createdAt: ago(10 * day),
        },
      ],
      createdAt:      ago(14 * day),
    }),

    // T3 — Report[4] (guardrail) — DISPATCHED (crew1)
    insertTicketRaw({
      reportId:       reports[4]._id,
      assignedTo:     crew1._id,
      assignedBy:     admin._id,
      priority:       'urgent',
      slaDeadline:    ahead(1 * hour),   // very close — at_risk
      slaBreached:    false,
      status:         'dispatched',
      repairPhotos:   [],
      notes:          [],
      estimatedCost:  4500,
      createdAt:      ago(1 * day),
    }),

    // T4 — Report[8] (potholes Ward3) — EN_ROUTE (crew3)
    insertTicketRaw({
      reportId:       reports[8]._id,
      assignedTo:     crew3._id,
      assignedBy:     admin._id,
      priority:       'high',
      slaDeadline:    ahead(4 * hour),
      slaBreached:    false,
      status:         'en_route',
      repairPhotos:   [],
      notes:          [
        {
          _id:       new Types.ObjectId(),
          text:      'Equipment loaded. Heading to site now.',
          author:    crew3._id,
          createdAt: ago(30 * 60 * 1000),
        },
      ],
      estimatedCost:  1200,
      createdAt:      ago(6 * day),
    }),

    // T5 — Report[7] (debris) — COMPLETED with SLA compliance intact
    insertTicketRaw({
      reportId:       reports[7]._id,
      assignedTo:     crew2._id,
      assignedBy:     admin._id,
      priority:       'low',
      slaDeadline:    ago(12 * day),
      slaBreached:    false,
      status:         'completed',
      startedAt:      ago(17 * day),
      completedAt:    ago(16 * day),
      actualCost:     200,
      repairPhotos:   [
        {
          url:       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
          publicId:  'seed_rp3',
          takenAt:   ago(16 * day),
          takenBy:   crew2._id,
        },
      ],
      notes:          [],
      createdAt:      ago(20 * day),
    }),

    // T6 — Report[9] (water main) — SLA BREACHED (pending, no crew assigned yet)
    insertTicketRaw({
      reportId:       reports[9]._id,
      assignedTo:     null,
      assignedBy:     admin._id,
      priority:       'high',
      slaDeadline:    ago(36 * hour),   // breached 36h ago
      slaBreached:    true,
      status:         'pending',
      repairPhotos:   [],
      notes:          [],
      estimatedCost:  900,
      createdAt:      ago(12 * day),
    }),

    // T7 — Report[6] (road collapse) — BLOCKED (crew3 waiting for equipment)
    insertTicketRaw({
      reportId:       reports[6]._id,
      assignedTo:     crew1._id,
      assignedBy:     admin._id,
      priority:       'urgent',
      slaDeadline:    ago(6 * hour),   // breached
      slaBreached:    true,
      status:         'blocked',
      startedAt:      ago(1.5 * day),
      repairPhotos:   [],
      notes:          [
        {
          _id:       new Types.ObjectId(),
          text:      'Require heavy compactor equipment. Logged requisition. Waiting on depot.',
          author:    crew1._id,
          createdAt: ago(8 * hour),
        },
      ],
      estimatedCost:  8000,
      createdAt:      ago(2 * day),
    }),
  ]);

  // ─── Comments ──────────────────────────────────────────────────────────────
  console.log('💬  Creating comments…');
  await Promise.all([
    Comment.create({
      reportId: reports[0]._id, authorId: citizen1._id, isOfficial: false,
      text: 'I almost blew a tire on this today! Needs to be fixed ASAP.',
      createdAt: ago(6 * day),
    }),
    Comment.create({
      reportId: reports[0]._id, authorId: admin._id, isOfficial: true,
      text: 'Thank you for your report. We have logged this and a crew will be dispatched within 48 hours.',
      createdAt: ago(5 * day),
    }),
    Comment.create({
      reportId: reports[2]._id, authorId: citizen2._id, isOfficial: false,
      text: 'Still flooded this morning, getting worse!',
      createdAt: ago(2 * day),
    }),
    Comment.create({
      reportId: reports[2]._id, authorId: admin._id, isOfficial: true,
      text: 'Crew is on-site clearing the drain. Should be resolved within 2 hours.',
      createdAt: ago(12 * hour),
    }),
    Comment.create({
      reportId: reports[4]._id, authorId: citizen2._id, isOfficial: false,
      text: 'This is extremely dangerous. A truck nearly went off the road last night.',
      createdAt: ago(20 * hour),
    }),
    Comment.create({
      reportId: reports[6]._id, authorId: citizen2._id, isOfficial: false,
      text: 'The hole is about 2 metres wide now. Nobody can drive past.',
      createdAt: ago(1 * day),
    }),
    Comment.create({
      reportId: reports[3]._id, authorId: admin._id, isOfficial: true,
      text: 'This issue has been fully resolved. The sidewalk has been repaired.',
      createdAt: ago(10 * day),
    }),
  ]);

  // ─── Notifications ─────────────────────────────────────────────────────────
  console.log('🔔  Creating notifications…');
  await Promise.all([
    // Citizen1 — assigned notification
    Notification.create({
      userId: citizen1._id, type: 'ticket_assigned', isRead: false,
      title: 'Report Assigned: Broken street light',
      body: 'Your report "Broken street light on Oak Ave" has been assigned to a maintenance crew.',
      reportId: reports[1]._id,
      createdAt: ago(4 * day),
    }),
    // Citizen2 — update notification
    Notification.create({
      userId: citizen2._id, type: 'report_updated', isRead: false,
      title: 'Report In Progress: Flooded intersection',
      body: 'Crew is currently on-site for "Flooded intersection at Pine & 5th". Work has begun.',
      reportId: reports[2]._id,
      createdAt: ago(6 * hour),
    }),
    // Citizen1 — resolved
    Notification.create({
      userId: citizen1._id, type: 'report_resolved', isRead: true,
      title: 'Report Resolved ✅',
      body: '"Cracked sidewalk near Central Park" has been fully repaired.',
      reportId: reports[3]._id,
      createdAt: ago(10 * day),
    }),
    // Citizen1 — official reply
    Notification.create({
      userId: citizen1._id, type: 'report_updated', isRead: true,
      title: 'Official response on your report',
      body: 'A staff member replied to your report "Massive pothole on Main St".',
      reportId: reports[0]._id,
      createdAt: ago(5 * day),
    }),
    // Citizen1 — SLA warning on water main
    Notification.create({
      userId: citizen1._id, type: 'sla_breached', isRead: false,
      title: 'SLA Breach — your report needs attention',
      body: '"Broken water main cover on Elm St" has exceeded its resolution deadline.',
      reportId: reports[9]._id,
      createdAt: ago(36 * hour),
    }),
    // Crew1 — ticket assigned
    Notification.create({
      userId: crew1._id, type: 'ticket_assigned', isRead: false,
      title: 'New ticket assigned to you',
      body: 'You have been assigned a new URGENT ticket: "Flooded intersection at Pine & 5th".',
      reportId: reports[2]._id,
      createdAt: ago(3 * day),
    }),
    // Crew1 — second ticket assigned
    Notification.create({
      userId: crew1._id, type: 'ticket_assigned', isRead: false,
      title: 'New ticket assigned to you',
      body: 'You have been assigned a new URGENT ticket: "Guardrail collapsed on Highway 7".',
      reportId: reports[4]._id,
      createdAt: ago(1 * day),
    }),
    // Admin — SLA breach alert
    Notification.create({
      userId: admin._id, type: 'sla_breached', isRead: false,
      title: 'SLA Breach Alert — Ward 1',
      body: 'Ticket for "Broken water main cover on Elm St" has breached its SLA deadline by 36h.',
      reportId: reports[9]._id,
      createdAt: ago(36 * hour),
    }),
    // Citizen2 — guardrail assigned
    Notification.create({
      userId: citizen2._id, type: 'ticket_assigned', isRead: false,
      title: 'Report Assigned: Guardrail collapsed',
      body: 'Your report "Guardrail collapsed on Highway 7" has been assigned to a crew.',
      reportId: reports[4]._id,
      createdAt: ago(1 * day),
    }),
    // Citizen2 — road collapse update
    Notification.create({
      userId: citizen2._id, type: 'report_updated', isRead: false,
      title: 'Update on: Road collapse outside Ward 3 market',
      body: 'Work has started but is currently blocked pending equipment. We will update you soon.',
      reportId: reports[6]._id,
      createdAt: ago(8 * hour),
    }),
  ]);

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅  Seed complete!');
  console.log('─────────────────────────────────────────────────────────');
  console.log('📧  Test Accounts (all use password: Password123!)');
  console.log('  Super Admin → superadmin@example.com');
  console.log('  Admin       → admin@example.com');
  console.log('  Citizen 1   → citizen@example.com');
  console.log('  Citizen 2   → citizen2@example.com');
  console.log('  Crew 1      → crew@example.com   (Ward 1 — Bob Builder)');
  console.log('  Crew 2      → crew2@example.com  (Ward 2 — Alice Roads)');
  console.log('  Crew 3      → crew3@example.com  (Ward 3 — Dave Drains)');
  console.log('─────────────────────────────────────────────────────────');
  console.log('📊  Seeded Data:');
  console.log('  7 Users  |  10 Reports  |  8 Tickets');
  console.log('  7 Comments  |  10 Notifications');
  console.log('');
  console.log('🎫  Ticket Statuses:');
  console.log('  pending    ×1  (SLA breached — water main)');
  console.log('  assigned   ×1  (broken signage → crew2)');
  console.log('  dispatched ×1  (guardrail → crew1, at-risk)');
  console.log('  en_route   ×1  (potholes → crew3)');
  console.log('  active     ×1  (flooding → crew1, 1 photo)');
  console.log('  blocked    ×1  (road collapse → crew1, SLA breached)');
  console.log('  completed  ×2  (cracked sidewalk + debris)');
  console.log('─────────────────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err);
  process.exit(1);
});
