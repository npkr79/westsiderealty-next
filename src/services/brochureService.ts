import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


/**
 * Search for brochure file in storage bucket by project name
 * @param projectName - Name of the project to search for
 * @returns Public URL of the brochure file or null if not found
 */
export async function findBrochureByProjectName(projectName: string): Promise<string | null> {
  try {
    // List all files in the brochures bucket
    const { data: files, error } = await supabase.storage
      .from('brochures')
      .list();

    if (error) {
      console.error('Error listing brochures:', error);
      return null;
    }

    if (!files || files.length === 0) {
      return null;
    }

    // Normalize project name for matching (lowercase, remove special chars)
    const normalizedProjectName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Find file that contains the project name
    const matchingFile = files.find(file => {
      const normalizedFileName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      return normalizedFileName.includes(normalizedProjectName);
    });

    if (!matchingFile) {
      console.log('No brochure found for project:', projectName);
      return null;
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('brochures')
      .getPublicUrl(matchingFile.name);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error finding brochure:', error);
    return null;
  }
}
