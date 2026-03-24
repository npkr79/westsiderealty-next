"use client";

import { useState } from "react";
import type { IdeaObject, Project } from "./types";

interface Props {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  onContinue: () => void;
}

const CONTENT_TYPES = [
  { value: "social_post", label: "Social Post (Instagram / LinkedIn)" },
  { value: "blog_post", label: "Blog Article" },
  { value: "video_script", label: "Video Script" },
  { value: "podcast", label: "Podcast Episode" },
] as const;

export default function IdeasPanel({ project, onUpdate, onContinue }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateIdeas = async () => {
    if (!project.topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    setLoading(true);
    setError(null);

    // Create project in DB on first generate
    let projectId = project.id;
    if (!projectId) {
      const createRes = await fetch("/api/content/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title || project.topic,
          topic: project.topic,
          target_audience: project.targetAudience,
          content_type: project.contentType,
        }),
      });
      if (createRes.ok) {
        const d = await createRes.json() as { project: { id: string } };
        projectId = d.project.id;
        onUpdate({ id: projectId, title: project.title || project.topic });
      }
    }

    const res = await fetch("/api/content/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: project.topic,
        target_audience: project.targetAudience,
        content_type: project.contentType,
        count: 5,
        project_id: projectId,
      }),
    });

    if (!res.ok) {
      setError("Failed to generate ideas. Please try again.");
      setLoading(false);
      return;
    }

    const data = await res.json() as { ideas: IdeaObject[] };
    onUpdate({ ideas: data.ideas, selectedIdea: null });
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Generate Ideas</h2>
        <p className="text-sm text-slate-500 mt-0.5">Describe what you want to create content about.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Project Title</label>
          <input
            type="text"
            placeholder="e.g. Kokapet investment series"
            value={project.title}
            onChange={e => onUpdate({ title: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Content Type</label>
          <select
            value={project.contentType}
            onChange={e => onUpdate({ contentType: e.target.value as Project["contentType"] })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {CONTENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Topic <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Why Kokapet is Hyderabad's best investment corridor in 2026"
            value={project.topic}
            onChange={e => onUpdate({ topic: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Target Audience</label>
          <input
            type="text"
            placeholder="e.g. HNI investors, NRI buyers, first-time homebuyers"
            value={project.targetAudience}
            onChange={e => onUpdate({ targetAudience: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      <button
        onClick={generateIdeas}
        disabled={loading || !project.topic.trim()}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating…" : "Generate Ideas"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {project.ideas.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Select an idea to continue</p>
          {project.ideas.map((idea, i) => {
            const isSelected = project.selectedIdea?.title === idea.title;
            return (
              <button
                key={i}
                onClick={() => onUpdate({ selectedIdea: idea })}
                className={`w-full text-left rounded-lg border p-4 text-sm transition-colors ${
                  isSelected
                    ? "border-slate-900 bg-slate-50 text-slate-900"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-medium text-slate-400 shrink-0">{i + 1}.</span>
                  <div>
                    <p className="font-medium text-slate-900">{idea.title}</p>
                    <p className="text-slate-500 mt-0.5 text-xs leading-relaxed">{idea.hook}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {project.selectedIdea && (
        <div className="flex justify-end">
          <button
            onClick={onContinue}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
          >
            Write Script →
          </button>
        </div>
      )}
    </div>
  );
}
