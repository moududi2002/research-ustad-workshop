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
  FiPenTool,
} from 'react-icons/fi';

import { FaWhatsapp } from "react-icons/fa";
import { SiGmail } from "react-icons/si";


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
    editorRef.current?.focus();

    document.execCommand(command, false, arg);

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');

    if (url) {
      exec('createLink', url);
    }
  };

  const insertVariable = (variable: string) => {
    exec('insertText', variable);
  };

  /**
   * Insert HTML signature at current cursor position.
   */
  const insertSignature = () => {
    const editor = editorRef.current;

    if (!editor) return;

    editor.focus();

    const signatureHtml = `
      <div class="email-signature" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; color: #374151;">
          <tbody>
            <tr>
              <td style="padding-right: 14px; vertical-align: top;">
                <img
                  src="https://workshop.researchustad.org/RU_Logo.png"
                  alt="Company Logo"
                  width="80"
                  style="display: block; width: 80px; height: auto;"
                />
              </td>

              <td style="vertical-align: top;">
                <div style="font-size: 16px; font-weight: 700; color: #111827;">
                  Research Ustad
                </div>

                <div style="font-size: 13px; color: #374151; margin-top: 8px;">
                    <img
                      src="https://workshop.researchustad.org/gmail.png"
                      width="14"
                      height="14"
                      style="vertical-align: middle; margin-right: 5px;"
                      alt="Email"
                    />
                    <a
                      href="mailto:info@researchustad.org"
                      style="color: #2563eb; text-decoration: none;"
                    >
                      info@researchustad.org
                    </a>
                  </div>

                <div style="font-size: 13px; color: #374151; margin-top: 3px;">
                  📞 +880 1724-653054
                </div>

                <div style="font-size: 13px; margin-top: 3px;">
                  🌐
                  <a
                    href="https://researchustad.org"
                    style="color: #2563eb; text-decoration: none;"
                  >
                    researchustad.org
                  </a>
                </div>

                <div style="font-size: 13px; margin-top: 3px;">
                  <img
                    src="https://workshop.researchustad.org/WhatsApp.png"
                    width="14"
                    height="14"
                    style="vertical-align: middle; margin-right: 5px;"
                    alt="WhatsApp"
                  />

                  <a
                    href="https://api.whatsapp.com/send?phone=8801724653054&text=Greetings%20from%20Research%20Ustad."
                    style="color: #25D366; text-decoration: none;"
                  >
                    WhatsApp
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    // Modern browsers
    if (document.queryCommandSupported('insertHTML')) {
      document.execCommand('insertHTML', false, signatureHtml);
    } else {
      // Fallback
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      const wrapper = document.createElement('div');
      wrapper.innerHTML = signatureHtml;

      const fragment = document.createDocumentFragment();

      while (wrapper.firstChild) {
        fragment.appendChild(wrapper.firstChild);
      }

      range.insertNode(fragment);
    }

    onChange(editor.innerHTML);
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

        <ToolbarButton
          onClick={() => exec('formatBlock', 'H2')}
          title="Heading 2"
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => exec('formatBlock', 'H3')}
          title="Heading 3"
        >
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

        <ToolbarButton
          onClick={() => exec('justifyLeft')}
          title="Align Left"
        >
          <FiAlignLeft className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => exec('justifyCenter')}
          title="Align Center"
        >
          <FiAlignCenter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => exec('justifyRight')}
          title="Align Right"
        >
          <FiAlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-ink-200" />

        <ToolbarButton
          onClick={insertLink}
          title="Insert Link"
        >
          <FiLink className="h-4 w-4" />
        </ToolbarButton>

        {/* Signature */}
        <ToolbarButton
          onClick={insertSignature}
          title="Insert Signature"
        >
          <FiPenTool className="h-4 w-4" />
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

        {/* Signature chip */}
        <button
          type="button"
          onClick={insertSignature}
          className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700 transition-colors hover:bg-primary-100"
        >
          ✍ Signature
        </button>
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
