'use client';

import React, { useState } from 'react';
import { ProcessingJob } from '@/types/content';
import ProgressBar from './ProgressBar';
import JobCard from './JobCard';
import NewJobModal from './NewJobModal';
import JSONViewer from './JSONViewer';
import { useJobProgress } from '@/hooks/useJobProgress';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface DashboardProps {
  jobs: ProcessingJob[];
  onJobUpdate: (jobs: ProcessingJob[]) => void;
}

export default function Dashboard({ jobs: initialJobs, onJobUpdate }: DashboardProps) {
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [showJSONViewer, setShowJSONViewer] = useState(false);
  const [showProductModal, setShowProductModal] = useState<'total' | 'completed' | 'failed' | null>(null);

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

  // Calculate actual overall progress based on all products
  const totalProgress = totalProducts > 0
    ? Math.round((completedProducts / totalProducts) * 100)
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

  // Get all products by status
  const getAllProducts = (status: 'total' | 'completed' | 'failed') => {
    const products: Array<{productId: number, name: string, status: string, jobId: string}> = [];

    jobs.forEach(job => {
      job.products.forEach(product => {
        if (status === 'total') {
          products.push({
            productId: product.productId,
            name: product.name,
            status: 'total',
            jobId: job.id.slice(-8)
          });
        }
      });

      if (status === 'completed') {
        // For now, we'll estimate completed products by progress
        const completedCount = job.progress.completed;
        job.products.slice(0, completedCount).forEach(product => {
          products.push({
            productId: product.productId,
            name: product.name,
            status: 'completed',
            jobId: job.id.slice(-8)
          });
        });
      }

      if (status === 'failed' && job.errors.length > 0) {
        job.errors.forEach(error => {
          products.push({
            productId: error.productId,
            name: error.productName,
            status: 'failed',
            jobId: job.id.slice(-8)
          });
        });
      }
    });

    return products;
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
          <div className="flex space-x-3">
            <button
              onClick={() => setShowJSONViewer(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>JSON Files</span>
            </button>
            <button
              onClick={handleStartNewJob}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Start New Job
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <button
            onClick={() => setShowProductModal('total')}
            className="text-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
          >
            <div className="text-3xl font-bold text-blue-600 group-hover:text-blue-700">{totalProducts}</div>
            <div className="text-gray-600 group-hover:text-gray-700">Total Products</div>
            <div className="text-xs text-gray-400 mt-1">Click to view</div>
          </button>
          <button
            onClick={() => setShowProductModal('completed')}
            className="text-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
          >
            <div className="text-3xl font-bold text-green-600 group-hover:text-green-700">{completedProducts}</div>
            <div className="text-gray-600 group-hover:text-gray-700">Completed</div>
            <div className="text-xs text-gray-400 mt-1">Click to view</div>
          </button>
          <button
            onClick={() => setShowProductModal('failed')}
            className="text-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
          >
            <div className="text-3xl font-bold text-red-600 group-hover:text-red-700">{failedProducts}</div>
            <div className="text-gray-600 group-hover:text-gray-700">Failed</div>
            <div className="text-xs text-gray-400 mt-1">Click to view</div>
          </button>
          <div className="text-center p-4 rounded-lg border border-gray-200 bg-purple-50">
            <div className="text-3xl font-bold text-purple-600">{totalProgress}%</div>
            <div className="text-gray-600">Overall Progress</div>
            <div className="text-xs text-gray-500 mt-1">{completedProducts}/{totalProducts}</div>
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

      {/* JSON Viewer Modal */}
      {showJSONViewer && (
        <JSONViewer
          onClose={() => setShowJSONViewer(false)}
        />
      )}

      {/* Product Details Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {showProductModal === 'total' && `All Products (${totalProducts})`}
                {showProductModal === 'completed' && `Completed Products (${completedProducts})`}
                {showProductModal === 'failed' && `Failed Products (${failedProducts})`}
              </h3>
              <button
                onClick={() => setShowProductModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                {getAllProducts(showProductModal).map((product, index) => (
                  <div
                    key={`${product.productId}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      product.status === 'completed' ? 'bg-green-50 border-green-200' :
                      product.status === 'failed' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">Product ID: {product.productId}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">Job: {product.jobId}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'completed' ? 'bg-green-100 text-green-800' :
                        product.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {getAllProducts(showProductModal).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products found for this status.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}