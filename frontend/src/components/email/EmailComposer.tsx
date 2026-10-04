// path: frontend/src/components/email/EmailComposer.tsx

'use client';

import { useState } from 'react';
import { FiSend, FiEye, FiX, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import EmailPreview from './EmailPreview';
import { previewEmail, sendEmail } from '@/lib/emailApi';

interface Props {
  selectedIds: string[];
  onSent: (campaignId: string, totalRecipients: number) => void;
  onClear: () => void;
}

export default function EmailComposer({ selectedIds, onSent, onClear }: Props) {
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const parseEmails = (input: string) =>
    input
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));

  const addCc = () => {
    const parsed = parseEmails(ccInput);
    if (!parsed.length) return;
    setCc(Array.from(new Set([...cc, ...parsed])));
    setCcInput('');
  };

  const addBcc = () => {
    const parsed = parseEmails(bccInput);
    if (!parsed.length) return;
    setBcc(Array.from(new Set([...bcc, ...parsed])));
    setBccInput('');
  };

  const handlePreview = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error('Subject and body are required.');
      return;
    }
    try {
      const data = await previewEmail({
        recipientIds: selectedIds.slice(0, 1),
        subject,
        bodyHtml,
      });
      setPreviewData(data);
      setPreviewOpen(true);
    } catch {
      toast.error('Preview failed.');
    }
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one participant.');
      return;
    }
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error('Subject and body are required.');
      return;
    }

    const confirmed = window.confirm(
      `You are about to send this email to ${selectedIds.length} participant${
        selectedIds.length !== 1 ? 's' : ''
      }.\n\nAre you sure you want to continue?`
    );
    if (!confirmed) return;

    try {
      setSending(true);
      const res = await sendEmail({
        recipientIds: selectedIds,
        subject,
        bodyHtml,
        cc,
        bcc,
      });
      toast.success('Email campaign started.');
      onSent(res.campaignId, res.totalRecipients);
      setSubject('');
      setBodyHtml('');
      setCc([]);
      setBcc([]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-100 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-ink-100 p-5">
        <div>
          <h3 className="font-display text-sm font-bold text-ink-950">
            Compose Email
          </h3>
          <p className="mt-0.5 text-xs text-ink-500">
            {selectedIds.length > 0
              ? `${selectedIds.length} recipient${
                  selectedIds.length !== 1 ? 's' : ''
                } selected`
              : 'No recipients selected'}
          </p>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ink-500 hover:bg-ink-100"
          >
            <FiX className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-4 p-5">
        {/* To */}
        <div>
          <label className="label-field !text-xs">To</label>
          <div className="rounded-xl border border-ink-200 bg-ink-50/60 px-3 py-2.5 text-sm text-ink-700">
            {selectedIds.length > 0
              ? `${selectedIds.length} participant(s) selected`
              : 'No recipients selected'}
          </div>
        </div>

        {/* CC */}
        <div>
          <label className="label-field !text-xs">CC (optional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCc())}
              placeholder="email1@example.com, email2@example.com"
              className="input-field !py-2.5 !text-sm"
            />
            <button
              onClick={addCc}
              type="button"
              className="btn-secondary !py-2.5 !text-xs"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          {cc.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cc.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
                >
                  {email}
                  <button
                    onClick={() => setCc(cc.filter((c) => c !== email))}
                    className="hover:text-red-600"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* BCC */}
        <div>
          <label className="label-field !text-xs">BCC (optional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={bccInput}
              onChange={(e) => setBccInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addBcc())
              }
              placeholder="email1@example.com, email2@example.com"
              className="input-field !py-2.5 !text-sm"
            />
            <button
              onClick={addBcc}
              type="button"
              className="btn-secondary !py-2.5 !text-xs"
            >
              <FiPlus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
          {bcc.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {bcc.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700"
                >
                  {email}
                  <button
                    onClick={() => setBcc(bcc.filter((c) => c !== email))}
                    className="hover:text-red-600"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="label-field !text-xs">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="input-field !py-2.5 !text-sm"
          />
        </div>

        {/* Body */}
        <div>
          <label className="label-field !text-xs">Email Body</label>
          <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
          <button
            onClick={handlePreview}
            type="button"
            className="btn-secondary !py-2.5 !text-sm"
          >
            <FiEye className="h-4 w-4" />
            Preview Email
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selectedIds.length === 0}
            className="btn-primary !py-2.5 !text-sm"
          >
            <FiSend className="h-4 w-4" />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>

      <EmailPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        from={previewData?.from}
        to={previewData?.to}
        cc={cc}
        bcc={bcc}
        subject={previewData?.subject || subject}
        bodyHtml={previewData?.bodyHtml || bodyHtml}
      />
    </div>
  );
}