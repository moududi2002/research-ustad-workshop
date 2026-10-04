// path: frontend/src/components/email/RichTextEditor.tsx

'use client';

import { useEffect, useRef } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
} from 'react-icons/fi';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external value only on mount to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const insertVariable = (variable: string) => {
    exec('insertText', variable);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-ink-100 bg-ink-50 p-2">
        <ToolbarButton onClick={() => exec('bold')} title="Bold">
          <FiBold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('italic')} title="Italic">
          <FiItalic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('underline')} title="Underline">
          <FiUnderline className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-ink-200" />
        <ToolbarButton onClick={() => exec('formatBlock', 'H2')} title="Heading 2">
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('formatBlock', 'H3')} title="Heading 3">
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec('formatBlock', 'BLOCKQUOTE')}
          title="Quote"
        >
          <span className="text-xs font-bold">&ldquo;</span>
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-ink-200" />
        <ToolbarButton
          onClick={() => exec('insertUnorderedList')}
          title="Bullet List"
        >
          <FiList className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec('insertOrderedList')}
          title="Numbered List"
        >
          <span className="text-xs font-bold">1.</span>
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-ink-200" />
        <ToolbarButton onClick={() => exec('justifyLeft')} title="Align Left">
          <FiAlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('justifyCenter')} title="Align Center">
          <FiAlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('justifyRight')} title="Align Right">
          <FiAlignRight className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-ink-200" />
        <ToolbarButton onClick={insertLink} title="Insert Link">
          <FiLink className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Variable chips */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-ink-100 bg-white px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Insert:
        </span>
        {['{{name}}', '{{email}}', '{{university}}', '{{department}}'].map(
          (v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v)}
              className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-primary-700 transition-colors hover:bg-primary-100"
            >
              {v}
            </button>
          )
        )}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        className="min-h-[280px] px-4 py-4 text-sm leading-relaxed text-ink-800 outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink-950 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink-900 [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc"
        data-placeholder="Write your email here..."
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-white hover:text-primary-600"
    >
      {children}
    </button>
  );
}