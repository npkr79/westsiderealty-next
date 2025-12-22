import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { profileService } from '@/services/profileService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Please upload images smaller than 5MB.' },
        { status: 400 }
      );
    }

    // Update profile image
    const imageUrl = await profileService.updateProfileImage(user.id, imageFile);

    return NextResponse.json({
      imageUrl,
      message: 'Profile image updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}