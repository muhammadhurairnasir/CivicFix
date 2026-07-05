import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { requireAuth } from '@/lib/auth';
import { uploadAvatar, deletePhoto } from '@/lib/cloudinary';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: 'File too large. Max 5 MB.' }, { status: 400 });
    }

    // Convert to buffer and compress with sharp
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const compressedBuffer = await sharp(rawBuffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toBuffer();

    await connectDB();

    // Get old avatar to delete
    const user = await User.findById(auth.user.userId).select('avatarPublicId');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatarPublicId) {
      await deletePhoto(user.avatarPublicId).catch(err =>
        console.warn('[Avatar] Could not delete old avatar:', err)
      );
    }

    // Upload new avatar
    const result = await uploadAvatar(compressedBuffer, auth.user.userId);

    // Update user document
    await User.findByIdAndUpdate(auth.user.userId, {
      $set: { avatar: result.url, avatarPublicId: result.publicId },
    });

    return NextResponse.json({ success: true, data: { avatar: result.url } });
  } catch (error: any) {
    console.error('[POST /api/users/me/avatar]', error);
    return NextResponse.json({ success: false, error: 'Avatar upload failed' }, { status: 500 });
  }
}
