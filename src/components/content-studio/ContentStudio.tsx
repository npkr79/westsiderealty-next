"use client";

import { useState } from "react";
import IdeasPanel from "./IdeasPanel";
import ScriptPanel from "./ScriptPanel";
import SSMLPanel from "./SSMLPanel";
import AudioPanel from "./AudioPanel";
import type { Project } from "./types";
export type { IdeaObject, Project } from "./types";

type Step = "ideas" | "script" | "ssml" | "audio";

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: "ideas", label: "Ideas", num: 1 },
  { key: "script", label: "Script", num: 2 },
  { key: "ssml", label: "SSML", num: 3 },
  { key: "audio", label: "Audio", num: 4 },
];

const STEP_ORDER: Step[] = ["ideas", "script", "ssml", "audio"];

const EMPTY_PROJECT: Project = {
  id: null,
  title: "",
  topic: "",
  targetAudience: "",
  contentType: "social_post",
  ideas: [],
  selectedIdea: null,
  script: "",
  ssml: "",
  audioUrl: "",
};

export default function ContentStudio() {
  const [step, setStep] = useState<Step>("ideas");
  const [project, setProject] = useState<Project>(EMPTY_PROJECT);

  const updateProject = (updates: Partial<Project>) =>
    setProject(prev => ({ ...prev, ...updates }));

  const currentIndex = STEP_ORDER.indexOf(step);

  const resetProject = () => {
    setProject(EMPTY_PROJECT);
    setStep("ideas");
  };

  return (
    <div className="max-w-3xl">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map(({ key, label, num }, i) => {
          const idx = STEP_ORDER.indexOf(key);
          const isActive = key === step;
          const isDone = idx < currentIndex;
          return (
            <div key={key} className="flex items-center">
              <button
                onClick={() => isDone ? setStep(key) : undefined}
                disabled={!isDone}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : isDone
                    ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-300 cursor-default"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${
                  isActive
                    ? "border-white bg-white text-slate-900"
                    : isDone
                    ? "border-slate-400 text-slate-500"
                    : "border-slate-200 text-slate-300"
                }`}>
                  {isDone ? "✓" : num}
                </span>
                {label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px mx-1 ${idx < currentIndex ? "bg-slate-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}

        {/* New project button — shown after first idea generated */}
        {project.ideas.length > 0 && (
          <button
            onClick={resetProject}
            className="ml-auto text-xs text-slate-400 hover:text-slate-700 underline"
          >
            New project
          </button>
        )}
      </div>

      {/* Active panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        {step === "ideas" && (
          <IdeasPanel
            project={project}
            onUpdate={updateProject}
            onContinue={() => setStep("script")}
          />
        )}
        {step === "script" && (
          <ScriptPanel
            project={project}
            onUpdate={updateProject}
            onContinue={() => setStep("ssml")}
            onBack={() => setStep("ideas")}
          />
        )}
        {step === "ssml" && (
          <SSMLPanel
            project={project}
            onUpdate={updateProject}
            onContinue={() => setStep("audio")}
            onBack={() => setStep("script")}
          />
        )}
        {step === "audio" && (
          <AudioPanel
            project={project}
            onUpdate={updateProject}
            onBack={() => setStep("ssml")}
          />
        )}
      </div>
    </div>
  );
}
