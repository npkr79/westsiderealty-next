"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useMemo, useEffect } from "react";

type QuillEditorClientProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function QuillEditorClient({
  value,
  onChange,
  placeholder = "Write or paste your content here...",
  className = "",
  style,
}: QuillEditorClientProps) {
  // Ensure value is always a string
  const safeValue = useMemo(() => value ?? "", [value]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
    ],
    content: safeValue,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && safeValue !== editor.getHTML()) {
      editor.commands.setContent(safeValue);
    }
  }, [safeValue, editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg bg-gray-50">
        <div className="text-sm text-muted-foreground">Loading editor…</div>
      </div>
    );
  }

  return (
    <div className={`tiptap-editor-wrapper border rounded-lg bg-white ${className}`} style={style}>
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("bold") ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("italic") ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("underline") ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Underline"
        >
          <u>U</u>
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("heading", { level: 1 }) ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("heading", { level: 2 }) ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("heading", { level: 3 }) ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("bulletList") ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("orderedList") ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Numbered List"
        >
          1.
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("blockquote") ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Quote"
        >
          "
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("codeBlock") ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Code Block"
        >
          &lt;/&gt;
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`px-2 py-1 rounded text-sm ${
            editor.isActive("link") ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
          }`}
          title="Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          className="px-2 py-1 rounded text-sm hover:bg-gray-100 disabled:opacity-50"
          title="Remove Link"
        >
          🔗×
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="px-2 py-1 rounded text-sm hover:bg-gray-100"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>
      {/* Editor Content */}
      <EditorContent editor={editor} className="min-h-[400px]" />
    </div>
  );
}
