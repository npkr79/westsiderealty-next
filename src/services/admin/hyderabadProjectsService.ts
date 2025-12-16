import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


export interface HyderabadProject {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithUsage extends HyderabadProject {
  usage_count: number;
}

export const hyderabadProjectsService = {
  // Get all projects with usage counts
  async getAllProjectsWithUsage(): Promise<ProjectWithUsage[]> {
    const { data: projects, error: projectsError } = await supabase
      .from('hyderabad_project_names')
      .select('*')
      .order('name', { ascending: true });

    if (projectsError) throw projectsError;

    // Get usage counts for each project
    const projectsWithUsage: ProjectWithUsage[] = await Promise.all(
      (projects || []).map(async (project) => {
        const { count } = await supabase
          .from('hyderabad_properties')
          .select('*', { count: 'exact', head: true })
          .eq('project_name', project.name)
          .eq('status', 'active');

        return {
          ...project,
          usage_count: count || 0
        };
      })
    );

    return projectsWithUsage;
  },

  // Get active projects only
  async getActiveProjects(): Promise<HyderabadProject[]> {
    const { data, error } = await supabase
      .from('hyderabad_project_names')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Add new project
  async addProject(name: string): Promise<HyderabadProject> {
    const { data, error } = await supabase
      .from('hyderabad_project_names')
      .insert({ name, is_active: true })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update project name
  async updateProject(id: string, name: string): Promise<HyderabadProject> {
    const { data, error } = await supabase
      .from('hyderabad_project_names')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Toggle active status
  async toggleActiveStatus(id: string, isActive: boolean): Promise<HyderabadProject> {
    const { data, error } = await supabase
      .from('hyderabad_project_names')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete project (only if not in use)
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('hyderabad_project_names')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Check if project is in use
  async isProjectInUse(projectName: string): Promise<boolean> {
    const { count } = await supabase
      .from('hyderabad_properties')
      .select('*', { count: 'exact', head: true })
      .eq('project_name', projectName);

    return (count || 0) > 0;
  },

  // NEW: Sync project to main projects table
  async syncProjectToMainTable(projectName: string): Promise<void> {
    // Get first property with this project name to extract micro-market and developer
    const { data: property } = await supabase
      .from('hyderabad_properties')
      .select('micro_market, developer_name')
      .eq('project_name', projectName)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!property) {
      throw new Error(`No active properties found for project: ${projectName}`);
    }

    // Get Hyderabad city ID
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('url_slug', 'hyderabad')
      .single();

    if (!city) {
      throw new Error('Hyderabad city not found');
    }

    // Check if project already exists in main table
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('project_name', projectName)
      .eq('city_id', city.id)
      .single();

    if (existingProject) {
      console.log(`Project ${projectName} already exists in main table`);
      return;
    }

    // Generate slug
    const slug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Insert into projects table
    const { error } = await supabase
      .from('projects')
      .insert({
        project_name: projectName,
        url_slug: slug,
        h1_title: `${projectName} Hyderabad | Premium Residential Project`,
        city_id: city.id,
        seo_title: `${projectName} in Hyderabad | Luxury Apartments & Villas`,
        meta_description: `Discover ${projectName} in Hyderabad. Premium residential project with modern amenities and excellent connectivity.`,
        project_overview_seo: `${projectName} is a prestigious residential development in Hyderabad, offering modern living spaces with world-class amenities.`,
        status: 'published'
      });

    if (error) {
      throw new Error(`Failed to sync project to main table: ${error.message}`);
    }

    console.log(`✅ Successfully synced ${projectName} to main projects table`);
  }
};
