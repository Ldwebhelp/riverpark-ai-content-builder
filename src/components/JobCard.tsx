'use client';

import { useState } from 'react';
import { ProcessingJob, JobStatus } from '@/types/content';
import ProgressBar from './ProgressBar';
import { formatDuration, formatTimestamp, calculateETA } from '@/lib/utils';

interface JobCardProps {
  job: ProcessingJob;
  onPauseResume?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export default function JobCard({ job, onPauseResume, onCancel, compact = false }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const statusColors: Record<JobStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    paused: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const progressColor = job.status === 'failed' ? 'red' :
                       job.status === 'completed' ? 'green' : 'blue';

  const eta = job.startedAt && job.status === 'running'
    ? calculateETA(job.progress.completed, job.progress.total, job.startedAt)
    : null;

  const handlePauseResume = () => {
    if (onPauseResume) {
      onPauseResume();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <h4 className="font-semibold text-gray-900">
            Job {job.id.slice(-8)}
          </h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {job.status === 'running' && (
            <button
              onClick={handlePauseResume}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Pause
            </button>
          )}
          {job.status === 'paused' && (
            <button
              onClick={handlePauseResume}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              Resume
            </button>
          )}
          {(job.status === 'running' || job.status === 'paused') && (
            <button
              onClick={handleCancel}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Cancel
            </button>
          )}
          {compact && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <ProgressBar
          progress={job.progress.percentage}
          label={`${job.progress.completed}/${job.progress.total} products`}
          showPercentage
          color={progressColor}
          className="h-3"
        />
      </div>

      {/* Details */}
      {isExpanded && (
        <div className="space-y-3">
          {/* Categories */}
          <div>
            <span className="text-sm font-medium text-gray-600">Categories: </span>
            <span className="text-sm text-gray-900">
              {job.categories.join(', ')}
            </span>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {job.startedAt && (
              <div>
                <span className="font-medium text-gray-600">Started: </span>
                <span className="text-gray-900">{formatTimestamp(job.startedAt)}</span>
              </div>
            )}
            {job.completedAt && (
              <div>
                <span className="font-medium text-gray-600">Completed: </span>
                <span className="text-gray-900">{formatTimestamp(job.completedAt)}</span>
              </div>
            )}
            {eta && (
              <div>
                <span className="font-medium text-gray-600">ETA: </span>
                <span className="text-gray-900">{formatDuration(eta)}</span>
              </div>
            )}
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Batch Size: </span>
              <span className="text-gray-900">{job.batchSize}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Concurrent: </span>
              <span className="text-gray-900">{job.concurrent}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">AI Model: </span>
              <span className="text-gray-900">{job.config.aiModel}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Validation: </span>
              <span className="text-gray-900">{job.config.validation}</span>
            </div>
          </div>

          {/* Errors */}
          {job.progress.failed > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <span className="text-red-800 font-medium text-sm">
                  {job.progress.failed} Failed Products
                </span>
              </div>
              {job.errors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-xs text-red-700 mb-1">
                  {error.productName}: {error.message}
                </div>
              ))}
              {job.errors.length > 3 && (
                <div className="text-xs text-red-600">
                  + {job.errors.length - 3} more errors
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}