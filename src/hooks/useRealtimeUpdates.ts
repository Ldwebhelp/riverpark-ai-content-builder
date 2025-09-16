'use client';

import { useEffect, useRef } from 'react';
import { ProcessingJob } from '@/types/content';

interface UseRealtimeUpdatesProps {
  jobs: ProcessingJob[];
  onJobUpdate: (job: ProcessingJob) => void;
  enabled?: boolean;
}

export function useRealtimeUpdates({
  jobs,
  onJobUpdate,
  enabled = true
}: UseRealtimeUpdatesProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const activeJobs = jobs.filter(job =>
      job.status === 'running' || job.status === 'pending'
    );

    if (activeJobs.length === 0) {
      // Clean up if no active jobs
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Set up Server-Sent Events for real-time updates
    const setupEventSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const jobIds = activeJobs.map(job => job.id).join(',');
      const eventSource = new EventSource(`/api/jobs/stream?ids=${jobIds}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'job_update') {
            onJobUpdate(data.job);
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();

        // Retry connection after 5 seconds
        retryTimeoutRef.current = setTimeout(() => {
          setupEventSource();
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    };

    setupEventSource();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [jobs, onJobUpdate, enabled]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN
  };
}

// WebSocket alternative (commented out, use if SSE doesn't work)
/*
export function useWebSocketUpdates({
  jobs,
  onJobUpdate,
  enabled = true
}: UseRealtimeUpdatesProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const activeJobs = jobs.filter(job =>
      job.status === 'running' || job.status === 'pending'
    );

    if (activeJobs.length === 0) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const setupWebSocket = () => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/jobs/ws`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Subscribe to job updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          jobIds: activeJobs.map(job => job.id)
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'job_update') {
            onJobUpdate(data.job);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket data:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        // Retry connection after 5 seconds
        retryTimeoutRef.current = setTimeout(() => {
          setupWebSocket();
        }, 5000);
      };

      wsRef.current = ws;
    };

    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [jobs, onJobUpdate, enabled]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}
*/