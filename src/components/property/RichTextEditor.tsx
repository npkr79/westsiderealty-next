"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// Dynamically import ReactQuill only on the client to avoid SSR issues.
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  required,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="space-y-2 prose-editor">
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
      />
    </div>
  );
}


