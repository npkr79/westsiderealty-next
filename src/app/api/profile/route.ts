import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { profileService } from '@/services/profileService';

export async function GET(request: NextRequest) {
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

    // Get user profile
    const profile = await profileService.getProfile(user.id);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      phone,
      bio,
      specialization,
      serviceAreas,
      whatsapp,
      linkedin,
      instagram,
      profileImage,
    } = body;

    // Validate the profile data
    const validation = profileService.validateProfileData({
      name,
      phone,
      bio,
      specialization,
      serviceAreas,
      whatsapp,
      linkedin,
      instagram,
      profileImage,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Update the profile
    const updatedProfile = await profileService.updateProfile(user.id, {
      name,
      phone,
      bio,
      specialization,
      serviceAreas,
      whatsapp,
      linkedin,
      instagram,
      profileImage,
    });

    return NextResponse.json({ 
      profile: updatedProfile,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'mark_completed':
        await profileService.markProfileCompleted(user.id);
        return NextResponse.json({ 
          message: 'Profile marked as completed' 
        });

      case 'get_completion':
        const profile = await profileService.getProfile(user.id);
        if (!profile) {
          return NextResponse.json(
            { error: 'Profile not found' },
            { status: 404 }
          );
        }
        
        const completionPercentage = profileService.getProfileCompletionPercentage(profile);
        const suggestions = profileService.getProfileSuggestions(profile);
        
        return NextResponse.json({
          completionPercentage,
          suggestions,
          isCompleted: await profileService.isProfileCompleted(user.id),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing profile action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}