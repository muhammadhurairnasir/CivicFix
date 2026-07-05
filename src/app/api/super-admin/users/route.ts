import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Report } from '@/models';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [UserRole.SUPER_ADMIN]);
  if (auth.error || !auth.user) {
    const status = auth.error?.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ success: false, error: auth.error! }, { status });
  }

  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filters
    const query: any = {};
    
    if (searchParams.has('role') && searchParams.get('role') !== 'all') {
      query.role = searchParams.get('role');
    }
    
    if (searchParams.has('isActive')) {
      query.isActive = searchParams.get('isActive') === 'true';
    }
    
    if (searchParams.has('isVerified')) {
      query.isVerified = searchParams.get('isVerified') === 'true';
    }
    
    if (searchParams.has('ward') && searchParams.get('ward') !== 'all') {
      query.ward = searchParams.get('ward');
    }
    
    const search = searchParams.get('search');
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Sort
    const sortField = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Attach computed fields
    const usersWithStats = await Promise.all(users.map(async (u: any) => {
      const reportsCount = await Report.countDocuments({ reporterId: u._id, isDeleted: false });
      return {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        ward: u.ward,
        isActive: u.isActive,
        isVerified: u.isVerified,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        avatar: u.avatar,
        reportsCount,
        hasFcmToken: !!u.fcmToken
      };
    }));

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('[SuperAdmin Users GET Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}
