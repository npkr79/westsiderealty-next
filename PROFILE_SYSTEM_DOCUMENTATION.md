# User Profile Update System Documentation

## Overview

This documentation covers the comprehensive user profile update functionality implemented for the application. The system provides a reusable, feature-rich profile management solution with image upload capabilities, form validation, and seamless integration with Supabase.

## Architecture

### Components Structure
```
src/
├── components/ui/
│   ├── profile-form.tsx          # Main ProfileForm component
│   └── progress.tsx              # Progress bar component
├── services/
│   ├── profileService.ts         # Profile management service
│   └── supabaseImageService.ts   # Image upload service (existing)
├── hooks/
│   └── use-profile.ts            # Profile management hook
├── app/api/profile/
│   ├── route.ts                  # Profile CRUD API routes
│   └── image/route.ts            # Image upload API route
└── app/agent/profile/
    └── page.tsx                  # Updated agent profile page
```

## Core Components

### 1. ProfileForm Component (`/src/components/ui/profile-form.tsx`)

A comprehensive, reusable form component for user profile management.

#### Features:
- **Image Upload**: Drag-and-drop image upload with preview
- **Form Validation**: Zod-based validation with error handling
- **Service Areas**: Multi-select checkboxes for service area selection
- **Social Media**: LinkedIn, Instagram, WhatsApp integration
- **Profile Completion**: Visual completion tracking
- **Responsive Design**: Mobile-friendly layout
- **Accessibility**: ARIA labels and keyboard navigation

#### Props:
```typescript
interface ProfileFormProps {
  initialData?: Partial<ProfileFormData & { 
    profileImage?: string; 
    profileCompleted?: boolean;
    id?: string;
  }>;
  onSubmit: (data: ProfileFormData & { profileImage?: string }) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  onEditToggle?: () => void;
  isLoading?: boolean;
  showServiceAreas?: boolean;
  serviceAreaOptions?: string[];
  className?: string;
  title?: string;
  showProfileCompletion?: boolean;
}
```

#### Usage Example:
```tsx
import { ProfileForm } from "@/components/ui/profile-form";

<ProfileForm
  initialData={profile}
  onSubmit={handleProfileSubmit}
  onCancel={handleCancel}
  isEditing={isEditing}
  onEditToggle={handleEditToggle}
  showServiceAreas={true}
  serviceAreaOptions={microMarkets}
  title="Personal Information"
  showProfileCompletion={true}
/>
```

### 2. Profile Service (`/src/services/profileService.ts`)

Centralized service for all profile-related operations.

#### Key Methods:
- `getProfile(userId)`: Retrieve user profile
- `updateProfile(userId, data)`: Update profile with validation
- `updateProfileImage(userId, file)`: Handle image uploads
- `isProfileCompleted(userId)`: Check completion status
- `validateProfileData(data)`: Validate profile data
- `getProfileCompletionPercentage(profile)`: Calculate completion
- `getProfileSuggestions(profile)`: Get improvement suggestions

#### Usage Example:
```typescript
import { profileService } from '@/services/profileService';

// Get profile
const profile = await profileService.getProfile(userId);

// Update profile
const updatedProfile = await profileService.updateProfile(userId, {
  name: "John Doe",
  bio: "Updated bio",
  profileImageFile: imageFile
});

// Check completion
const isCompleted = await profileService.isProfileCompleted(userId);
```

### 3. Profile Hook (`/src/hooks/use-profile.ts`)

React hook for profile state management and operations.

#### Features:
- Automatic profile loading
- Real-time completion tracking
- Error handling with toast notifications
- Loading states management
- Profile validation

#### Usage Example:
```tsx
import { useProfile } from '@/hooks/use-profile';

function ProfilePage() {
  const { 
    profile, 
    isLoading, 
    isUpdating, 
    completion,
    updateProfile, 
    updateProfileImage 
  } = useProfile();

  const handleSubmit = async (data) => {
    const success = await updateProfile(data);
    if (success) {
      // Handle success
    }
  };

  return (
    <ProfileForm
      initialData={profile}
      onSubmit={handleSubmit}
      isLoading={isUpdating}
    />
  );
}
```

## API Endpoints

### Profile Management (`/api/profile`)

#### GET `/api/profile`
Retrieve current user's profile.

**Response:**
```json
{
  "profile": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "bio": "User bio",
    "specialization": "Real Estate",
    "profileImage": "https://...",
    "serviceAreas": ["Area1", "Area2"],
    "whatsapp": "+1234567890",
    "linkedin": "https://linkedin.com/in/johndoe",
    "instagram": "@johndoe",
    "profileCompleted": true
  }
}
```

#### PUT `/api/profile`
Update user profile.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "bio": "Updated bio",
  "specialization": "Real Estate Agent",
  "serviceAreas": ["Area1", "Area2"],
  "whatsapp": "+1234567890",
  "linkedin": "https://linkedin.com/in/johndoe",
  "instagram": "@johndoe"
}
```

#### PATCH `/api/profile`
Profile actions (completion tracking, suggestions).

**Request Body:**
```json
{
  "action": "get_completion" | "mark_completed"
}
```

### Image Upload (`/api/profile/image`)

#### POST `/api/profile/image`
Upload profile image.

**Request:** Multipart form data with `image` field
**Response:**
```json
{
  "imageUrl": "https://...",
  "message": "Profile image updated successfully"
}
```

## Database Schema

The system works with the existing `agents` table structure:

```sql
-- Existing agents table (Supabase)
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  bio TEXT,
  specialization TEXT,
  profile_image TEXT,
  service_areas TEXT[],
  whatsapp TEXT,
  linkedin TEXT,
  instagram TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Features

### 1. Image Upload System
- **File Validation**: Type and size validation (JPEG, PNG, WebP, max 5MB)
- **Preview**: Real-time image preview before upload
- **Storage**: Supabase Storage integration
- **Error Handling**: Comprehensive error messages

### 2. Form Validation
- **Schema Validation**: Zod-based validation
- **Real-time Feedback**: Instant validation feedback
- **Custom Rules**: LinkedIn URL validation, phone number formatting
- **Error Display**: Field-specific error messages

### 3. Profile Completion Tracking
- **Percentage Calculation**: Based on filled fields
- **Suggestions**: Actionable improvement recommendations
- **Visual Progress**: Progress bar with completion status
- **Completion Badge**: Visual completion indicator

### 4. Service Areas Management
- **Multi-select**: Checkbox-based area selection
- **Predefined Options**: Configurable service area list
- **Dynamic Updates**: Real-time selection updates

### 5. Social Media Integration
- **LinkedIn**: URL validation and formatting
- **Instagram**: Username handling
- **WhatsApp**: Phone number integration

## Usage Patterns

### 1. Basic Profile Form
```tsx
<ProfileForm
  initialData={profileData}
  onSubmit={handleSubmit}
  isEditing={true}
/>
```

### 2. With Service Areas
```tsx
<ProfileForm
  initialData={profileData}
  onSubmit={handleSubmit}
  showServiceAreas={true}
  serviceAreaOptions={areas}
/>
```

### 3. With Completion Tracking
```tsx
<ProfileForm
  initialData={profileData}
  onSubmit={handleSubmit}
  showProfileCompletion={true}
/>
```

### 4. Full Integration
```tsx
const { profile, updateProfile, isUpdating } = useProfile();

<ProfileForm
  initialData={profile}
  onSubmit={updateProfile}
  isLoading={isUpdating}
  showServiceAreas={true}
  serviceAreaOptions={serviceAreas}
  showProfileCompletion={true}
/>
```

## Error Handling

### Client-Side Errors
- Form validation errors with field-specific messages
- Image upload errors (file type, size)
- Network connectivity issues
- Authentication errors

### Server-Side Errors
- Database connection errors
- File upload failures
- Validation errors
- Authorization errors

### Error Recovery
- Automatic retry mechanisms
- User-friendly error messages
- Fallback UI states
- Data persistence during errors

## Performance Considerations

### Optimization Features
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Automatic image compression
- **Caching**: Profile data caching
- **Debouncing**: Input validation debouncing
- **Batch Updates**: Multiple field updates in single request

### Best Practices
- Use React.memo for expensive components
- Implement proper loading states
- Optimize image sizes before upload
- Use proper error boundaries
- Implement progressive enhancement

## Security

### Data Protection
- Input sanitization and validation
- File type and size restrictions
- Authentication required for all operations
- CSRF protection on API endpoints

### Privacy
- User data encryption in transit
- Secure image storage
- Access control based on user roles
- Data retention policies

## Testing

### Unit Tests
- Component rendering tests
- Service method tests
- Validation logic tests
- Hook behavior tests

### Integration Tests
- API endpoint tests
- Database operation tests
- File upload tests
- Authentication flow tests

### E2E Tests
- Complete profile update flow
- Image upload workflow
- Form validation scenarios
- Error handling scenarios

## Deployment

### Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Build Configuration
- Next.js 14+ compatibility
- TypeScript strict mode
- ESLint configuration
- Tailwind CSS setup

## Future Enhancements

### Planned Features
1. **Bulk Profile Updates**: Admin bulk update functionality
2. **Profile Templates**: Predefined profile templates
3. **Advanced Analytics**: Profile completion analytics
4. **Integration APIs**: Third-party service integrations
5. **Mobile App**: React Native implementation

### Scalability
- Microservice architecture consideration
- CDN integration for images
- Database sharding strategies
- Caching layer implementation

## Demo

A comprehensive demo is available at `/profile-demo` showcasing all features:
- Interactive profile editing
- Image upload demonstration
- Service area selection
- Form validation examples
- Error handling scenarios

## Support

For technical support or feature requests:
- Check the component documentation
- Review the API endpoint specifications
- Test with the demo page
- Refer to the troubleshooting guide

---

*This documentation covers the complete user profile update functionality. For specific implementation details, refer to the individual component files and their inline documentation.*