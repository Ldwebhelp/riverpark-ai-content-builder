'use client';

import React, { useState } from 'react';
import { ProcessingJob } from '@/types/content';
import ProgressBar from './ProgressBar';
import JobCard from './JobCard';
import NewJobModal from './NewJobModal';
import { useJobProgress } from '@/hooks/useJobProgress';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface DashboardProps {
  jobs: ProcessingJob[];
  onJobUpdate: (jobs: ProcessingJob[]) => void;
}

export default function Dashboard({ jobs: initialJobs, onJobUpdate }: DashboardProps) {
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  const {
    jobs,
    isLoading,
    updateJob,
    createJob,
    toggleJobStatus,
    cancelJob
  } = useJobProgress(initialJobs);

  const { isConnected } = useRealtimeUpdates({
    jobs,
    onJobUpdate: updateJob,
    enabled: true
  });

  // Update parent component when jobs change
  React.useEffect(() => {
    onJobUpdate(jobs);
  }, [jobs, onJobUpdate]);

  const activeJobs = jobs.filter(job => job.status === 'running' || job.status === 'pending');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  const totalProgress = jobs.length > 0
    ? jobs.reduce((acc, job) => acc + job.progress.percentage, 0) / jobs.length
    : 0;

  const totalProducts = jobs.reduce((acc, job) => acc + job.progress.total, 0);
  const completedProducts = jobs.reduce((acc, job) => acc + job.progress.completed, 0);
  const failedProducts = jobs.reduce((acc, job) => acc + job.progress.failed, 0);

  const handleStartNewJob = () => {
    setShowNewJobModal(true);
  };

  const handleJobCreate = async (jobConfig: unknown) => {
    const newJob = await createJob(jobConfig);
    if (newJob) {
      setShowNewJobModal(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overall Statistics */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Overall Progress</h2>
            {isConnected && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Updates</span>
              </div>
            )}
          </div>
          <button
            onClick={handleStartNewJob}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Start New Job
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{totalProducts}</div>
            <div className="text-gray-600">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{completedProducts}</div>
            <div className="text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{failedProducts}</div>
            <div className="text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{Math.round(totalProgress)}%</div>
            <div className="text-gray-600">Overall Progress</div>
          </div>
        </div>

        <ProgressBar
          progress={totalProgress}
          label="Overall System Progress"
          showPercentage
          className="h-4"
        />
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Active Jobs ({activeJobs.length})
          </h3>
          <div className="space-y-4">
            {activeJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onPauseResume={() => toggleJobStatus(job.id)}
                onCancel={() => cancelJob(job.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Job History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              Completed Jobs ({completedJobs.length})
            </h3>
            <div className="space-y-3">
              {completedJobs.slice(0, 5).map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        {/* Failed Jobs */}
        {failedJobs.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              Failed Jobs ({failedJobs.length})
            </h3>
            <div className="space-y-3">
              {failedJobs.slice(0, 5).map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* No Jobs State */}
      {jobs.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-lg border border-gray-200 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Generate Content</h3>
          <p className="text-gray-600 mb-6">
            Start your first AI content generation job to process aquarium products.
          </p>
          <button
            onClick={handleStartNewJob}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Your First Job
          </button>
        </div>
      )}

      {/* New Job Modal */}
      {showNewJobModal && (
        <NewJobModal
          onClose={() => setShowNewJobModal(false)}
          onSubmit={handleJobCreate}
        />
      )}
    </div>
  );
}