// path: frontend/src/components/email/SendProgress.tsx

'use client';

import { FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

interface Props {
  open: boolean;
  progress: {
    status: string;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    failures: { email: string; reason: string }[];
  } | null;
  onClose: () => void;
}

export default function SendProgress({ open, progress, onClose }: Props) {
  if (!open || !progress) return null;

  const failures = progress.failures ?? [];
  {failures.length > 0 && (
    <div className="mt-5 max-h-32 overflow-y-auto rounded-xl bg-red-50 p-3 text-left">
      <p className="text-xs font-bold uppercase tracking-wider text-red-700">
        Failed:
      </p>
      <ul className="mt-1 space-y-1">
        {failures.map((f, i) => (
          <li key={i} className="text-xs text-red-700">
            <span className="font-mono">{f.email}</span> — {f.reason}
          </li>
        ))}
      </ul>
    </div>
  )}

  const done = progress.status === 'sent' || progress.status === 'partial' || progress.status === 'failed';
  const percent =
    progress.totalRecipients > 0
      ? Math.round(
          ((progress.sentCount + progress.failedCount) /
            progress.totalRecipients) *
            100
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="p-6 text-center">
          {!done && (
            <>
              <FiLoader className="mx-auto h-10 w-10 animate-spin text-primary-600" />
              <h3 className="mt-4 font-display text-lg font-bold text-ink-950">
                Sending emails...
              </h3>
            </>
          )}
          {done && progress.status === 'sent' && (
            <>
              <FiCheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 font-display text-lg font-bold text-ink-950">
                Emails sent successfully!
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                {progress.sentCount} email{progress.sentCount !== 1 ? 's' : ''}{' '}
                delivered.
              </p>
            </>
          )}
          {done && progress.status === 'partial' && (
            <>
              <FiAlertCircle className="mx-auto h-12 w-12 text-amber-500" />
              <h3 className="mt-4 font-display text-lg font-bold text-ink-950">
                Partially sent
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                {progress.sentCount} sent · {progress.failedCount} failed
              </p>
            </>
          )}
          {done && progress.status === 'failed' && (
            <>
              <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 font-display text-lg font-bold text-ink-950">
                Sending failed
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                All {progress.failedCount} emails failed to send.
              </p>
            </>
          )}

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-semibold text-ink-700">
              {progress.sentCount + progress.failedCount} /{' '}
              {progress.totalRecipients} processed
            </p>
          </div>

          {progress.failures.length > 0 && (
            <div className="mt-5 max-h-32 overflow-y-auto rounded-xl bg-red-50 p-3 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                Failed:
              </p>
              <ul className="mt-1 space-y-1">
                {progress.failures.map((f, i) => (
                  <li key={i} className="text-xs text-red-700">
                    <span className="font-mono">{f.email}</span> — {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {done && (
            <button
              onClick={onClose}
              className="btn-primary mt-6 w-full !py-3"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}