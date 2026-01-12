import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectNames } = body;

    if (!Array.isArray(projectNames)) {
      return NextResponse.json(
        { error: 'projectNames must be an array' },
        { status: 400 }
      );
    }

    const projects = await projectService.getMultipleProjects(projectNames);
    
    // Convert Map to object for JSON serialization
    const projectsObject: Record<string, any> = {};
    projects.forEach((value, key) => {
      projectsObject[key] = value;
    });

    return NextResponse.json(projectsObject);
  } catch (error) {
    console.error('[API] Error fetching multiple projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
