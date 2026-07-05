export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Report } from '@/models';
import { ApiResponse } from '@/types';
import { updateReportSchema } from '@/lib/validations/report';
import { parseFormData, validateImageFile, compressImage, MAX_PHOTOS_PER_REPORT } from '@/lib/uploadHandler';
import { uploadReportPhoto, deletePhoto } from '@/lib/cloudinary';
import { IReportPhoto } from '@/models/Report';

// ─── GET /api/reports/[id] ────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    // Fire-and-forget atomic view count increment
    Report.findByIdAndUpdate(params.id, { $inc: { viewCount: 1 } }).exec().catch(err => {
      console.error('[GET Report] Failed to increment viewCount:', err);
    });

    const report = await Report.findOne({ _id: params.id, isDeleted: false })
      .populate('reporterId', 'name avatar role')
      .lean();

    if (!report) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({ success: true, data: report }, { status: 200 });

  } catch (error) {
    console.error('[GET Report API] Error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to retrieve report' }, { status: 500 });
  }
}

// ─── PUT /api/reports/[id] ────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    await connectDB();

    const report = await Report.findOne({ _id: params.id, isDeleted: false });
    if (!report) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Report not found' }, { status: 404 });
    }

    // Authorization: Only the reporter or admin/super_admin can edit
    const isReporter = report.reporterId.toString() === auth.user.userId;
    const isAdmin = ['admin', 'super_admin'].includes(auth.user.role);

    if (!isReporter && !isAdmin) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden: You cannot edit this report.' }, { status: 403 });
    }

    // State validation: only OPEN reports can be edited by citizens
    if (!isAdmin && report.status !== 'open') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Reports cannot be edited once they are no longer in the Open state.' },
        { status: 400 }
      );
    }

    const { fields, files } = await parseFormData(req);

    // Parse existing photos passed as stringified JSON array
    let existingPhotos: IReportPhoto[] = [];
    if (fields.existingPhotos) {
      try {
        existingPhotos = JSON.parse(fields.existingPhotos);
      } catch {
        return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid existingPhotos format' }, { status: 400 });
      }
    }

    if (existingPhotos.length + files.length > MAX_PHOTOS_PER_REPORT) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Maximum ${MAX_PHOTOS_PER_REPORT} photos allowed.` },
        { status: 400 }
      );
    }

    // Identify which photos to delete from Cloudinary
    const oldPublicIds = report.photos.map((p) => p.publicId);
    const newPublicIdsToKeep = existingPhotos.map((p) => p.publicId);
    const idsToDelete = oldPublicIds.filter((id) => !newPublicIdsToKeep.includes(id));

    // Validate new files
    for (const file of files) {
      const vResult = validateImageFile(file);
      if (!vResult.valid) {
        return NextResponse.json<ApiResponse>({ success: false, error: vResult.error! }, { status: 400 });
      }
    }

    const uploadedPublicIds: string[] = [];
    const newUploadedPhotos: IReportPhoto[] = [];

    // Process and Upload new images
    for (const file of files) {
      const compressedBuffer = await compressImage(file.buffer);
      const uploadResult = await uploadReportPhoto(compressedBuffer);
      uploadedPublicIds.push(uploadResult.publicId);
      
      newUploadedPhotos.push({
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        uploadedAt: new Date(),
      });
    }

    // Merge photos
    const mergedPhotos = [...existingPhotos, ...newUploadedPhotos];

    // Data parsing
    const rawData = {
      ...fields,
      ...(fields.latitude ? { latitude: parseFloat(fields.latitude) } : {}),
      ...(fields.longitude ? { longitude: parseFloat(fields.longitude) } : {}),
      ...(fields.tags ? { tags: JSON.parse(fields.tags) } : {}),
    };

    const parsedData = updateReportSchema.safeParse(rawData);
    if (!parsedData.success) {
      // Cleanup any uploads that just happened
      for (const id of uploadedPublicIds) await deletePhoto(id).catch(() => {});

      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Validation failed', errors: parsedData.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const data = parsedData.data;

    // Apply updates
    if (data.title) report.title = data.title;
    if (data.description) report.description = data.description;
    if (data.type) report.type = data.type;
    if (data.severity) report.severity = data.severity;
    if (data.address) report.address = data.address;
    if (data.ward) report.ward = data.ward;
    if (data.tags) report.tags = data.tags;
    if (data.latitude && data.longitude) {
      report.location.coordinates = [data.longitude, data.latitude];
    }
    
    report.photos = mergedPhotos;

    await report.save();

    // Fire cleanup for deleted photos
    for (const id of idsToDelete) {
      deletePhoto(id).catch(err => console.error('[Update Report] Failed to delete photo:', err));
    }

    const updatedReport = await Report.findById(report._id).populate('reporterId', 'name avatar role').lean();

    return NextResponse.json<ApiResponse>({ success: true, message: 'Report updated', data: updatedReport }, { status: 200 });

  } catch (error) {
    console.error('[PUT Report API] Error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'An error occurred while updating the report.' }, { status: 500 });
  }
}

// ─── DELETE /api/reports/[id] ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    await connectDB();

    const report = await Report.findOne({ _id: params.id, isDeleted: false });
    if (!report) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Report not found' }, { status: 404 });
    }

    const isReporter = report.reporterId.toString() === auth.user.userId;
    const isAdmin = ['admin', 'super_admin'].includes(auth.user.role);

    if (!isReporter && !isAdmin) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden: You cannot delete this report.' }, { status: 403 });
    }

    if (isAdmin) {
      // Admin/Super Admin: Hard delete (or mark isDeleted: true but strip location to remove from map)
      report.isDeleted = true;
      // Scramble location to remove from geospatial queries but keep data around
      report.location.coordinates = [0, 0];
      await report.save();
    } else {
      // Citizen: Soft delete only if OPEN
      if (report.status !== 'open') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Cannot delete report because it is already being processed.' },
          { status: 400 }
        );
      }
      report.isDeleted = true;
      await report.save();
    }

    return NextResponse.json<ApiResponse>({ success: true, message: 'Report successfully deleted.' }, { status: 200 });

  } catch (error) {
    console.error('[DELETE Report API] Error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete report.' }, { status: 500 });
  }
}
