"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

type QuillEditorClientProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  modules?: any;
  formats?: string[];
  className?: string;
  style?: React.CSSProperties;
};

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    return RQ;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8 border rounded-lg bg-gray-50">
        <div className="text-sm text-muted-foreground">Loading editor…</div>
      </div>
    ),
  }
);

export default function QuillEditorClient({
  value,
  onChange,
  placeholder = "Write or paste your content here...",
  modules,
  formats,
  className = "",
  style,
}: QuillEditorClientProps) {
  // Ensure value is always a string
  const safeValue = useMemo(() => value ?? "", [value]);

  // Default modules if not provided
  const defaultModules = useMemo(
    () =>
      modules || {
        toolbar: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          ["link", "blockquote", "code-block"],
          [{ align: [] }],
          [{ color: [] }, { background: [] }],
          ["clean"],
        ],
        clipboard: {
          matchVisual: false,
        },
        history: {
          delay: 1000,
          maxStack: 100,
          userOnly: false,
        },
      },
    [modules]
  );

  // Default formats if not provided
  const defaultFormats = useMemo(
    () =>
      formats || [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "list",
        "bullet",
        "indent",
        "link",
        "align",
        "blockquote",
        "code-block",
        "color",
        "background",
      ],
    [formats]
  );

  return (
    <div className={`quill-editor-wrapper ${className}`} style={style}>
      <ReactQuill
        theme="snow"
        value={safeValue}
        onChange={onChange}
        placeholder={placeholder}
        modules={defaultModules}
        formats={defaultFormats}
      />
    </div>
  );
}

