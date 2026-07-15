import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';

import EditorToolbar from './EditorToolbar';
import PageCanvas from './PageCanvas';
import { FontSize } from './fontSize';
import { LineHeight } from './lineHeight';
import { Indent } from './indent';
import { UnderlineWhitespace } from './underlineWhitespace';
import { SearchAndReplace } from './searchAndReplace';
import { UndoCaptureBoundary } from './undoCaptureBoundary';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung tài liệu...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      FontSize,
      LineHeight,
      Indent,
      UnderlineWhitespace,
      SearchAndReplace,
      UndoCaptureBoundary,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[800px]',
      },
    },
  });

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] dark:bg-[#202020] relative border border-[var(--border-color)] rounded-lg overflow-hidden">
      {/* Fixed Toolbar */}
      <div className="sticky top-0 z-10 w-full shadow-sm">
        <EditorToolbar editor={editor} />
      </div>
      
      {/* Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto w-full relative">
        <PageCanvas>
          <EditorContent editor={editor} />
        </PageCanvas>
      </div>
    </div>
  );
}
