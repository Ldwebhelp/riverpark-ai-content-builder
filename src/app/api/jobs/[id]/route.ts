import { NextRequest, NextResponse } from 'next/server';
import { ProcessingJob } from '@/types/content';

// In-memory storage for demo (replace with Supabase in production)
// This would normally import from a shared store
declare global {
  var jobs: ProcessingJob[] | undefined;
}

const getJobs = (): ProcessingJob[] => {
  if (!global.jobs) {
    global.jobs = [];
  }
  return global.jobs;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobs = getJobs();
  const job = jobs.find(j => j.id === id);

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(job);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobs = getJobs();
    const jobIndex = jobs.findIndex(j => j.id === id);

    if (jobIndex === -1) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    jobs[jobIndex] = {
      ...jobs[jobIndex],
      status,
      ...(status === 'completed' && { completedAt: new Date().toISOString() })
    };

    return NextResponse.json(jobs[jobIndex]);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobs = getJobs();
    const jobIndex = jobs.findIndex(j => j.id === id);

    if (jobIndex === -1) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    jobs.splice(jobIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}