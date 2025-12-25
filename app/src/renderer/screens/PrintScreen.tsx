/**
 * Print Screen
 * Shows print queue and job status
 */

import React, { useState, useEffect } from 'react';
import { useAutolabel } from '../hooks/useAutolabel';
import type { PrinterInfo, PrintJob } from '../../shared/types';
import './PrintScreen.css';

export function PrintScreen() {
  const api = useAutolabel();
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [loadingPrinters, setLoadingPrinters] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [jobErrors, setJobErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPrinters();
    loadJobs();
  }, []);

  // Polling for live updates when there are active jobs
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (j) => j.status === 'printing' || j.status === 'pending'
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      loadJobs();
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs]);

  const loadPrinters = async () => {
    setLoadingPrinters(true);
    setError(null);

    try {
      const result = await api.print.listPrinters();
      setPrinters(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Drucker konnten nicht geladen werden';
      setError(errorMsg);
      console.error('Failed to load printers:', err);
    } finally {
      setLoadingPrinters(false);
    }
  };

  const loadJobs = async () => {
    try {
      const result = await api.print.listJobs();
      setJobs(result);
    } catch (err) {
      console.error('Failed to load print jobs:', err);
      const errorMsg = err instanceof Error ? err.message : 'Druck-Jobs konnten nicht geladen werden';
      setError(errorMsg);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    setActionLoading(jobId);
    // Clear previous error
    setJobErrors((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });

    try {
      await api.print.retry(jobId);
      await loadJobs();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setJobErrors((prev) => ({ ...prev, [jobId]: errorMsg }));
      console.error('Failed to retry job:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Möchten Sie diesen Druck-Job wirklich löschen?')) {
      return;
    }

    setActionLoading(jobId);
    // Clear previous error
    setJobErrors((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });

    try {
      await api.print.delete(jobId);
      await loadJobs();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setJobErrors((prev) => ({ ...prev, [jobId]: errorMsg }));
      console.error('Failed to delete job:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const getStatusBadgeClass = (status: PrintJob['status']) => {
    switch (status) {
      case 'pending':
        return 'print-status-badge print-status-pending';
      case 'printing':
        return 'print-status-badge print-status-printing';
      case 'completed':
        return 'print-status-badge print-status-completed';
      case 'failed':
        return 'print-status-badge print-status-failed';
      default:
        return 'print-status-badge';
    }
  };

  const getStatusText = (status: PrintJob['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'printing':
        return 'Printing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="screen print-screen">
      <h2 className="screen-title">Print Queue</h2>

      <div className="card print-printers">
        <h3>Available Printers</h3>

        {loadingPrinters && <p>Loading printers...</p>}

        {error && (
          <div className="print-error">
            <p>
              <strong>Error:</strong> {error}
            </p>
            <button className="btn btn-primary" onClick={loadPrinters}>
              Retry
            </button>
          </div>
        )}

        {!loadingPrinters && !error && printers.length === 0 && (
          <p className="print-hint">No printers found.</p>
        )}

        {!loadingPrinters && !error && printers.length > 0 && (
          <ul className="print-printer-list">
            {printers.map((printer) => (
              <li key={printer.name} className="print-printer-item">
                <span className="print-printer-name">{printer.name}</span>
                {printer.isDefault && (
                  <span className="print-printer-badge">Default</span>
                )}
                <span className="print-printer-status">{printer.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card print-queue">
        <h3>Print Jobs</h3>

        {loadingJobs && <p>Loading print jobs...</p>}

        {!loadingJobs && jobs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🖨️</div>
            <p className="empty-state-text">No print jobs</p>
            <p className="empty-state-hint">
              Print jobs will appear here after you start printing from the Prepare screen
            </p>
          </div>
        )}

        {!loadingJobs && jobs.length > 0 && (
          <div className="print-job-list">
            {jobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const progress =
                job.totalCount > 0
                  ? Math.round((job.printedCount / job.totalCount) * 100)
                  : 0;

              return (
                <div key={job.id} className="print-job-item">
                  <div
                    className="print-job-header"
                    onClick={() => toggleExpand(job.id)}
                  >
                    <div className="print-job-info">
                      <div className="print-job-title">
                        <strong>Job #{job.id.slice(0, 8)}</strong>
                        <span className={getStatusBadgeClass(job.status)}>
                          {getStatusText(job.status)}
                        </span>
                      </div>
                      <div className="print-job-meta">
                        <span>Printer: {job.printerName}</span>
                        <span>Labels: {job.totalCount}</span>
                        <span>{formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      className="print-job-expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(job.id);
                      }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>

                  {job.status === 'printing' && (
                    <div className="print-progress">
                      <div className="print-progress-bar">
                        <div
                          className="print-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="print-progress-text">
                        {job.printedCount} / {job.totalCount} labels printed (
                        {progress}%)
                      </div>
                    </div>
                  )}

                  {job.status === 'completed' && (
                    <div className="print-job-summary print-job-success">
                      ✅ Successfully printed {job.printedCount} / {job.totalCount}{' '}
                      labels
                    </div>
                  )}

                  {job.status === 'failed' && job.errors && (
                    <div className="print-job-summary print-job-error">
                      ❌ Failed: {job.errors.join(', ')}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="print-job-details">
                      <h4>Labels in this job:</h4>
                      <ul className="print-label-list">
                        {job.labelIds.map((labelId, index) => (
                          <li key={labelId} className="print-label-item">
                            <span>
                              Label {index + 1}: {labelId.slice(0, 12)}...
                            </span>
                          </li>
                        ))}
                      </ul>

                      {job.errors && job.errors.length > 0 && (
                        <div className="print-job-errors">
                          <h4>Errors:</h4>
                          <ul>
                            {job.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {jobErrors[job.id] && (
                    <div className="print-job-action-error">
                      <strong>Fehler:</strong> {jobErrors[job.id]}
                    </div>
                  )}

                  <div className="print-job-actions">
                    {job.status === 'failed' && (
                      <button
                        className="btn btn-warning"
                        onClick={() => handleRetry(job.id)}
                        disabled={actionLoading === job.id}
                      >
                        {actionLoading === job.id ? 'Wird wiederholt...' : '🔄 Wiederholen'}
                      </button>
                    )}
                    {(job.status === 'completed' || job.status === 'failed') && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(job.id)}
                        disabled={actionLoading === job.id}
                      >
                        {actionLoading === job.id ? 'Wird gelöscht...' : '🗑️ Löschen'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
