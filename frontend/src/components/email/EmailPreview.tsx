// path: frontend/src/components/email/EmailPreview.tsx

'use client';

import { FiX } from 'react-icons/fi';

interface Props {
  open: boolean;
  onClose: () => void;
  from?: string;
  to?: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  bodyHtml?: string;
}

export default function EmailPreview({
  open,
  onClose,
  from = 'Research Ustad <no-reply@researchustad.org>',
  to,
  cc = [],
  bcc = [],
  subject,
  bodyHtml,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <h3 className="font-display text-base font-bold text-ink-950">
            Email Preview
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="space-y-3 rounded-xl border border-ink-100 bg-ink-50/60 p-4 text-sm">
            <PreviewRow label="From" value={from} />
            <PreviewRow label="To" value={to || '—'} />
            {cc.length > 0 && <PreviewRow label="CC" value={cc.join(', ')} />}
            {bcc.length > 0 && <PreviewRow label="BCC" value={bcc.join(', ')} />}
            <PreviewRow label="Subject" value={subject || '(no subject)'} strong />
          </div>

          <div className="mt-5 rounded-xl border border-ink-100 bg-white p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
              Email Body
            </p>
            <div
              className="prose prose-sm max-w-none text-ink-800 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: bodyHtml || '' }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-ink-100 px-6 py-4">
          <button onClick={onClose} className="btn-secondary !py-2.5 !text-sm">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <span
        className={`flex-1 break-words ${
          strong ? 'font-semibold text-ink-950' : 'text-ink-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}