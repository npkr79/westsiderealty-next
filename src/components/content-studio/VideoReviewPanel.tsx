"use client";

import { useState, useEffect } from "react";

interface VideoRecord {
  id: string;
  project_id: string;
  title: string;
  status: "pending_review" | "approved" | "revision_needed" | "rejected";
  scene_count: number | null;
  total_duration: number | null;
  canva_design_url: string | null;
  error_log: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  projectId: string | null;
  sceneJson?: unknown;
  projectTitle: string;
  onBack: () => void;
}

const STATUS_STYLES: Record<VideoRecord["status"], string> = {
  pending_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  revision_needed: "bg-orange-100 text-orange-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<VideoRecord["status"], string> = {
  pending_review: "Pending Review",
  approved: "Approved",
  revision_needed: "Revision Needed",
  rejected: "Rejected",
};

export default function VideoReviewPanel({ projectId, sceneJson, projectTitle, onBack }: Props) {
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [creating, setCreating] = useState(false);
  const [canvaEditUrl, setCanvaEditUrl] = useState("");
  const [canvaError, setCanvaError] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    console.log("[VideoReviewPanel] props:", {
      projectId,
      canvaConnected,
      sceneJson: !!sceneJson,
    });
  }, [projectId, canvaConnected]);

  useEffect(() => {
    // Check Canva connection status
    fetch("/api/canva/token")
      .then(r => r.json())
      .then((d: { valid: boolean }) => setCanvaConnected(d.valid === true))
      .catch(() => setCanvaConnected(false));

    // Handle OAuth redirect params
    const params = new URLSearchParams(window.location.search);
    const canvaParam = params.get("canva");
    if (canvaParam === "connected") {
      setCanvaConnected(true);
    } else if (canvaParam === "error") {
      setCanvaError("Canva connection failed. Please try again.");
    }
    if (canvaParam) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoadingVideos(true);
    const res = await fetch("/api/content/video-review");
    if (res.ok) {
      const data = await res.json() as { videos: VideoRecord[] };
      setVideos(data.videos);
    }
    setLoadingVideos(false);
  };

  const handleCreateInCanva = async () => {
    if (!projectId) return;
    setCreating(true);
    setCanvaError(null);
    try {
      const res = await fetch("/api/content/canva-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json() as { success: boolean; edit_url?: string; error?: string };
      if (data.success && data.edit_url) {
        setCanvaEditUrl(data.edit_url);
        window.open(data.edit_url, "_blank");
        await loadVideos();
      } else {
        setCanvaError("Failed to create Canva design: " + (data.error ?? "Unknown error"));
      }
    } catch (err) {
      setCanvaError("Failed to create Canva design: " + String(err));
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (videoId: string, status: VideoRecord["status"]) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    await fetch("/api/content/video-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_id: videoId,
        project_id: video.project_id,
        title: video.title,
        status,
      }),
    });

    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, status } : v));
  };

  const projectVideos = videos.filter(v => v.project_id === projectId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Video Review</h2>
        <p className="text-sm text-slate-500 mt-0.5">Create your Canva design and track review status.</p>
      </div>

      {/* Section A — Canva connection status */}
      {!canvaConnected ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-3">
            Connect your Canva account to create designs automatically
          </p>
          <a
            href="/api/canva/auth"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7D2AE8] text-white rounded-lg text-sm font-medium hover:bg-[#6B24C7]"
          >
            Connect Canva
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <span>✓ Canva connected</span>
          <a href="/api/canva/auth" className="ml-auto text-xs text-green-600 underline">
            Reconnect
          </a>
        </div>
      )}

      {/* Section B — Create design button */}
      {canvaConnected && (
        <div className="space-y-3">
          <button
            onClick={handleCreateInCanva}
            disabled={creating}
            className="w-full py-3 bg-[#7D2AE8] text-white rounded-xl text-sm font-medium hover:bg-[#6B24C7] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                Creating design in Canva...
              </>
            ) : canvaEditUrl ? (
              "↻ Recreate in Canva"
            ) : (
              "Create Design in Canva →"
            )}
          </button>

          {/* Section C — After successful creation */}
          {canvaEditUrl && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-purple-700">✓ Design created in Canva</span>
              <a
                href={canvaEditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#7D2AE8] underline"
              >
                Open in Canva →
              </a>
            </div>
          )}
        </div>
      )}

      {canvaError && <p className="text-sm text-red-600">{canvaError}</p>}

      {/* Handoff checklist */}
      <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Handoff Checklist</p>
        <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>Audio is auto-uploaded to Canva — attach it to the correct slide</li>
          <li>Sync SSML pacing with Canva slide durations</li>
          <li>Verify branding: fonts, colors, and logo placement</li>
          <li>Review all text overlays against the script for accuracy</li>
          <li>Update status below once review is complete</li>
        </ul>
      </div>

      {/* This project's videos */}
      {projectVideos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">This Project</p>
          {projectVideos.map(video => (
            <VideoCard key={video.id} video={video} onStatusChange={updateStatus} />
          ))}
        </div>
      )}

      {/* All recent videos */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Videos</p>
        {loadingVideos ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : videos.length === 0 ? (
          <p className="text-sm text-slate-400">No videos yet.</p>
        ) : (
          videos.slice(0, 10).map(video => (
            <VideoCard key={video.id} video={video} onStatusChange={updateStatus} />
          ))
        )}
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to Audio
        </button>
      </div>
    </div>
  );
}

function VideoCard({
  video,
  onStatusChange,
}: {
  video: VideoRecord;
  onStatusChange: (id: string, status: VideoRecord["status"]) => void;
}) {
  const date = new Date(video.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="rounded-lg border border-slate-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{video.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{date}</p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[video.status]}`}>
          {STATUS_LABELS[video.status]}
        </span>
      </div>

      {video.canva_design_url && (
        <a
          href={video.canva_design_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[#7D2AE8] underline hover:text-[#6B24C7] block truncate"
        >
          Open in Canva →
        </a>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {(["approved", "revision_needed", "rejected"] as VideoRecord["status"][]).map(s => (
          <button
            key={s}
            onClick={() => onStatusChange(video.id, s)}
            disabled={video.status === s}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              video.status === s
                ? "border-slate-300 bg-slate-100 text-slate-400 cursor-default"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
