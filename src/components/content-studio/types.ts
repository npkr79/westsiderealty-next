export interface IdeaObject {
  title: string;
  hook: string;
  key_data_points: string[];
  target_audience: string;
}

export interface Project {
  id: string | null;
  title: string;
  topic: string;
  targetAudience: string;
  contentType: "social_post" | "blog_post" | "video_script" | "podcast";
  ideas: IdeaObject[];
  selectedIdea: IdeaObject | null;
  script: string;
  ssml: string;
  audioUrl: string;
}
