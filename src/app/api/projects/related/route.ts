import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { microMarketId } = body;

    if (!microMarketId) {
      return NextResponse.json(
        { error: 'microMarketId is required' },
        { status: 400 }
      );
    }

    const projects = await projectService.getRelatedProjectsByMicroMarketId(String(microMarketId));
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('[API] Error fetching related projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related projects' },
      { status: 500 }
    );
  }
}
