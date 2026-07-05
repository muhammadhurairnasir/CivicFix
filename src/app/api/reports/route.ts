export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadRateLimit } from '@/lib/rateLimit';
import {
  parseFormData,
  validateImageFile,
  compressImage,
  MAX_PHOTOS_PER_REPORT,
} from '@/lib/uploadHandler';
import { uploadReportPhoto, deletePhoto } from '@/lib/cloudinary';
import { detectWard } from '@/lib/wardDetector';
import { createReportSchema, reportQuerySchema } from '@/lib/validations/report';
import { connectDB } from '@/lib/db';
import { Report } from '@/models';
import { ApiResponse, PaginatedResponse } from '@/types';
import { FilterQuery, SortOrder } from 'mongoose';
import { IReportDocument } from '@/models/Report';
import { handleApiError } from '@/lib/apiHelpers';

// ─── POST /api/reports ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  // Rate Limiting (10 reports per 5 mins per user)
  const rateLimit = await uploadRateLimit(req, auth.user.userId);
  if (!rateLimit.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Too many reports submitted. Please try again later.' },
      { status: 429, headers: { 'X-RateLimit-Reset': rateLimit.resetTime.toISOString() } }
    );
  }

  const uploadedPublicIds: string[] = [];

  try {
    const { fields, files } = await parseFormData(req);

    // 1. Parse and Validate Fields
    // Convert stringified fields to appropriate types for Zod
    const rawData = {
      ...fields,
      latitude: parseFloat(fields.latitude),
      longitude: parseFloat(fields.longitude),
      tags: fields.tags ? JSON.parse(fields.tags) : [],
    };

    const parsedData = createReportSchema.safeParse(rawData);
    if (!parsedData.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Validation failed', errors: parsedData.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }
    const data = parsedData.data;

    // 2. Validate Files
    if (files.length > MAX_PHOTOS_PER_REPORT) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Maximum ${MAX_PHOTOS_PER_REPORT} photos allowed.` },
        { status: 400 }
      );
    }

    for (const file of files) {
      const vResult = validateImageFile(file);
      if (!vResult.valid) {
        return NextResponse.json<ApiResponse>({ success: false, error: vResult.error! }, { status: 400 });
      }
    }

    // 3. Process and Upload Images
    const photos = [];
    for (const file of files) {
      const compressedBuffer = await compressImage(file.buffer);
      const uploadResult = await uploadReportPhoto(compressedBuffer);
      uploadedPublicIds.push(uploadResult.publicId);
      
      photos.push({
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        uploadedAt: new Date(),
      });
    }

    // 4. Geospatial / Ward Detection
    let ward = data.ward;
    if (!ward) {
      ward = await detectWard(data.latitude, data.longitude);
    }

    // 5. Database Insertion
    await connectDB();
    
    // The Counter pre-save hook will automatically assign the `ticketNumber`
    const report = new Report({
      reporterId: auth.user.userId,
      title: data.title,
      description: data.description,
      type: data.type,
      severity: data.severity,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
      address: data.address,
      ward,
      tags: data.tags,
      photos,
      status: 'open',
    });

    await report.save();

    // Re-fetch without sensitive internal Mongoose fields
    const sanitizedReport = await Report.findById(report._id)
      .select('-__v')
      .populate('reporterId', 'name avatar')
      .lean();

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Report submitted successfully', data: sanitizedReport },
      { status: 201 }
    );

  } catch (error) {
    // 6. Cleanup Cloudinary uploads on failure
    for (const publicId of uploadedPublicIds) {
      try {
        await deletePhoto(publicId);
      } catch (cleanupError) {
        console.error(`[Cleanup] Failed to delete photo ${publicId}:`, cleanupError);
      }
    }
    return handleApiError(error, 'Create Report API');
  }
}

// ─── GET /api/reports ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json<ApiResponse>({ success: false, error: auth.error! }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const queryObj = Object.fromEntries(searchParams.entries());

    const parsedQuery = reportQuerySchema.safeParse(queryObj);
    if (!parsedQuery.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid query parameters', errors: parsedQuery.error.flatten().fieldErrors as Record<string, string[]> },
        { status: 400 }
      );
    }

    const { page, limit, status, severity, type, ward, sortBy, sortOrder, search } = parsedQuery.data;

    const filter: FilterQuery<IReportDocument> = { isDeleted: false };

    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    if (ward) filter.ward = ward;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, SortOrder> = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('reporterId', 'name avatar role') // Ensure password/email is excluded
        .lean(),
      Report.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json<PaginatedResponse<unknown>>({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });

  } catch (error) {
    return handleApiError(error, 'List Reports API');
  }
}
