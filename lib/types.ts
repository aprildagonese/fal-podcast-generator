export interface Episode {
  id: string; // Date string YYYY-MM-DD
  title: string;
  audioUrl: string;
  duration: number; // seconds
  topics: string[];
  sources: Source[];
  createdAt: string; // ISO date string
}

export interface Teaser {
  id: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
}

export interface Source {
  type: 'hackernews' | 'reddit' | 'arxiv' | 'huggingface' | 'news';
  title: string;
  url: string;
}

export interface EpisodesMetadata {
  episodes: Episode[];
  teasers: Teaser[];
}

export interface AgentResponse {
  title: string;
  script: string;
  topics: string[];
  sources: Source[];
}

export interface TeaserAgentResponse {
  script: string;
}

export interface FalTTSRequest {
  text: string;
  voice: string;
  model?: string;
}

export interface FalTTSResponse {
  request_id: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  completed_at?: string;
  created_at?: string;
  started_at?: string | null;
  error?: string | null;
  model_id?: string;
  output?: {
    audio?: {
      content_type: string;
      file_name: string;
      file_size: number;
      url: string;
    };
    timestamps?: any;
  };
}

export type GenerationMode = 'full' | 'teaser';

export interface GenerationProgress {
  step: 'querying' | 'generating_script' | 'creating_audio' | 'uploading' | 'done' | 'error';
  message: string;
  error?: string;
}
