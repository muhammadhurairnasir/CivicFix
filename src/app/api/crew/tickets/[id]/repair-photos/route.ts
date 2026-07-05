export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Ticket } from '@/models';
import { ApiResponse, UserRole } from '@/types';
import { handleApiError } from '@/lib/apiHelpers';
import { Types } from 'mongoose';
import { parseFormData, validateImageFile, compressImage } from '@/lib/uploadHandler';
import { uploadRepairPhoto } from '@/lib/cloudinary';

const MAX_REPAIR_PHOTOS = 10;

// ─── POST /api/crew/tickets/[id]/repair-photos ─────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, [UserRole.CREW]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();

    const ticket = await Ticket.findOne({ _id: params.id, assignedTo: auth.user.userId });
    if (!ticket) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ticket not found or not assigned to you' },
        { status: 404 }
      );
    }

    if (ticket.repairPhotos.length >= MAX_REPAIR_PHOTOS) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Maximum of ${MAX_REPAIR_PHOTOS} repair photos allowed.` },
        { status: 400 }
      );
    }

    const { files } = await parseFormData(req);

    if (files.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No files provided in request.' },
        { status: 400 }
      );
    }

    const file = files[0]; // Process one at a time for simplicity

    // Validate
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Compress
    const compressedBuffer = await compressImage(file.buffer);

    // Upload
    const uploadResult = await uploadRepairPhoto(compressedBuffer);

    // Save to ticket
    const newPhoto = {
      url:      uploadResult.url,
      publicId: uploadResult.publicId,
      takenAt:  new Date(),
      takenBy:  new Types.ObjectId(auth.user.userId),
    };

    ticket.repairPhotos.push(newPhoto);
    await ticket.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Repair photo uploaded successfully',
      data: ticket.repairPhotos,
    });
  } catch (error) {
    return handleApiError(error, 'Crew Upload Repair Photo');
  }
}
