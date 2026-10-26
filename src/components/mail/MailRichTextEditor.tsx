import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Video,
} from 'lucide-react';

import { MailVideo } from './MailVideo';

export interface MailMediaUploadResult {
  url: string;
  kind: 'image' | 'video';
}

interface MailRichTextEditorProps {
  /** Current HTML value of the editor. */
  value: string;
  /** Called on every change with the new HTML. */
  onChange: (html: string) => void;
  placeholder?: string;
  /**
   * Uploads a file and returns its public URL. When it is not provided the
   * media buttons are hidden.
   */
  uploadMedia?: (file: File) => Promise<MailMediaUploadResult>;
  minHeight?: number;
  className?: string;
}

interface ToolbarButtonProps {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({ title, active, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded transition ${
        active
          ? 'bg-sky-500 text-white'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40'
      }`}
    >
      {children}
    </button>
  );
}

const ICON_CLASS = 'h-3.5 w-3.5';

/**
 * Rich-text editor used to compose the body of a mail.
 *
 * It only produces HTML (`bodyHtml`); the plain-text fallback is derived by
 * the backend so both representations can never drift apart.
 */
export default function MailRichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung mail...',
  uploadMedia,
  minHeight = 220,
  className = '',
}: MailRichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Image.configure({ allowBase64: false }),
      MailVideo,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'ProseMirror mail-editor-content break-words focus:outline-none text-[var(--text-primary)]',
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  // Keep the editor in sync when the parent replaces the value (reset,
  // loading a template, ...).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const current = editor.getHTML();
    if (value !== current && !(value === '' && editor.isEmpty)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={`rounded-lg border border-[var(--border-color)] ${className}`}
        style={{ minHeight }}
      />
    );
  }

  const runCommand = (command: () => void) => {
    command();
    editor.chain().focus().run();
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file || !uploadMedia) return;

    setUploading(true);
    try {
      const result = await uploadMedia(file);
      if (result.kind === 'video') {
        editor.chain().focus().setMailVideo({ src: result.url }).run();
      } else {
        editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const applyLink = () => {
    const href = linkValue.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href }).run();
    }
    setLinkOpen(false);
    setLinkValue('');
  };

  const isActive = (name: string, attributes?: Record<string, unknown>): boolean =>
    editor.isActive(name, attributes);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] ${className}`}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] px-2 py-1.5">
        <ToolbarButton
          title="In đậm"
          active={isActive('bold')}
          onClick={() => runCommand(() => editor.chain().toggleBold().run())}
        >
          <Bold className={ICON_CLASS} />
        </ToolbarButton>
        <ToolbarButton
          title="In nghiêng"
          active={isActive('italic')}
          onClick={() => runCommand(() => editor.chain().toggleItalic().run())}
        >
          <Italic className={ICON_CLASS} />
        </ToolbarButton>
        <ToolbarButton
          title="Gạch chân"
          active={isActive('underline')}
          onClick={() => runCommand(() => editor.chain().toggleUnderline().run())}
        >
          <span className="text-xs font-semibold underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          title="Gạch ngang"
          active={isActive('strike')}
          onClick={() => runCommand(() => editor.chain().toggleStrike().run())}
        >
          <Strikethrough className={ICON_CLASS} />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-[var(--border-color)]" />

        <ToolbarButton
          title="Tiêu đề 1"
          active={isActive('heading', { level: 1 })}
          onClick={() => runCommand(() => editor.chain().toggleHeading({ level: 1 }).run())}
        >
          <span className="text-xs font-bold">H1</span>
        </ToolbarButton>
        <ToolbarButton
          title="Tiêu đề 2"
          active={isActive('heading', { level: 2 })}
          onClick={() => runCommand(() => editor.chain().toggleHeading({ level: 2 }).run())}
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          title="Tiêu đề 3"
          active={isActive('heading', { level: 3 })}
          onClick={() => runCommand(() => editor.chain().toggleHeading({ level: 3 }).run())}
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-[var(--border-color)]" />

        <ToolbarButton
          title="Danh sách gạch đầu dòng"
          active={isActive('bulletList')}
          onClick={() => runCommand(() => editor.chain().toggleBulletList().run())}
        >
          <List className={ICON_CLASS} />
        </ToolbarButton>
        <ToolbarButton
          title="Danh sách đánh số"
          active={isActive('orderedList')}
          onClick={() => runCommand(() => editor.chain().toggleOrderedList().run())}
        >
          <ListOrdered className={ICON_CLASS} />
        </ToolbarButton>
        <ToolbarButton
          title="Trích dẫn"
          active={isActive('blockquote')}
          onClick={() => runCommand(() => editor.chain().toggleBlockquote().run())}
        >
          <Quote className={ICON_CLASS} />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-[var(--border-color)]" />

        <ToolbarButton
          title="Căn trái"
          active={isActive('paragraph', { textAlign: 'left' })}
          onClick={() => runCommand(() => editor.chain().setTextAlign('left').run())}
        >
          <AlignLeft className={ICON_CLASS} />
        </ToolbarButton>
        <ToolbarButton
          title="Căn giữa"
          active={isActive('paragraph', { textAlign: 'center' })}
          onClick={() => runCommand(() => editor.chain().setTextAlign('center').run())}
        >
          <AlignCenter className={ICON_CLASS} />
        </ToolbarButton>
        <ToolbarButton
          title="Căn phải"
          active={isActive('paragraph', { textAlign: 'right' })}
          onClick={() => runCommand(() => editor.chain().setTextAlign('right').run())}
        >
          <AlignRight className={ICON_CLASS} />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-[var(--border-color)]" />

        <ToolbarButton
          title="Chèn liên kết"
          active={isActive('link')}
          onClick={() => {
            setLinkValue(editor.getAttributes('link').href ?? '');
            setLinkOpen((current) => !current);
          }}
        >
          <Link2 className={ICON_CLASS} />
        </ToolbarButton>

        {uploadMedia ? (
          <>
            <ToolbarButton
              title="Chèn ảnh"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className={`${ICON_CLASS} animate-spin`} />
              ) : (
                <ImagePlus className={ICON_CLASS} />
              )}
            </ToolbarButton>
            <ToolbarButton
              title="Chèn video"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Video className={ICON_CLASS} />
            </ToolbarButton>
          </>
        ) : null}

        <span className="mx-1 h-4 w-px bg-[var(--border-color)]" />

        <ToolbarButton
          title="Hoàn tác"
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => runCommand(() => editor.chain().undo().run())}
        >
          <Undo2 className={ICON_CLASS} />
        </ToolbarButton>
        <ToolbarButton
          title="Làm lại"
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => runCommand(() => editor.chain().redo().run())}
        >
          <Redo2 className={ICON_CLASS} />
        </ToolbarButton>
      </div>

      {linkOpen ? (
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-1.5">
          <input
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://example.com"
            className="flex-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded bg-sky-500 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-sky-600"
          >
            Áp dụng
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetLink().run();
              setLinkOpen(false);
              setLinkValue('');
            }}
            className="rounded px-2 py-1 text-xs text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)]"
          >
            Bỏ liên kết
          </button>
        </div>
      ) : null}

      <div style={{ minHeight }} className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>

      {uploadMedia ? (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(event) => {
            void handleFileSelected(event.target.files?.[0]);
          }}
        />
      ) : null}
    </div>
  );
}
