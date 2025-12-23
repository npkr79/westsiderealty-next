"use client";

import QuillEditorClient from "@/components/blog/QuillEditorClient";

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
  return (
    <div className="space-y-2 prose-editor">
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <QuillEditorClient
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}


