'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProcessingJob } from '@/types/content';

export function useJobProgress(initialJobs: ProcessingJob[] = []) {
  const [jobs, setJobs] = useState<ProcessingJob[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update specific job
  const updateJob = useCallback((updatedJob: ProcessingJob) => {
    setJobs(prevJobs =>
      prevJobs.map(job => job.id === updatedJob.id ? updatedJob : job)
    );
  }, []);

  // Add new job
  const addJob = useCallback((newJob: ProcessingJob) => {
    setJobs(prevJobs => [newJob, ...prevJobs]);
  }, []);

  // Remove job
  const removeJob = useCallback((jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  }, []);

  // Pause/Resume job
  const toggleJobStatus = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const newStatus = job.status === 'running' ? 'paused' : 'running';

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedJob = await response.json();
        updateJob(updatedJob);
      }
    } catch (error) {
      console.error('Failed to toggle job status:', error);
    }
  }, [jobs, updateJob]);

  // Cancel job
  const cancelJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        const updatedJob = await response.json();
        updateJob(updatedJob);
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  }, [updateJob]);

  // Create new job
  const createJob = useCallback(async (jobConfig: any) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobConfig),
      });

      if (response.ok) {
        const newJob = await response.json();
        addJob(newJob);
        return newJob;
      }
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  }, [addJob]);

  // Set up real-time polling for active jobs
  useEffect(() => {
    const activeJobs = jobs.filter(job =>
      job.status === 'running' || job.status === 'pending'
    );

    if (activeJobs.length === 0) return;

    const interval = setInterval(() => {
      fetchJobs();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  // Initial load
  useEffect(() => {
    if (initialJobs.length === 0) {
      fetchJobs();
    }
  }, [fetchJobs, initialJobs.length]);

  return {
    jobs,
    isLoading,
    fetchJobs,
    updateJob,
    addJob,
    removeJob,
    toggleJobStatus,
    cancelJob,
    createJob
  };
}