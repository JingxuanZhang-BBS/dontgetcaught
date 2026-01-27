// Database types for DontGetCaught.AI
// Auto-generated from Supabase schema

export type SourceType = 'docx' | 'pdf' | 'paste'

export type SampleStatus = 'uploaded' | 'parsing' | 'lang_failed' | 'indexed' | 'error'

export type DetectedLanguage = 'en' | 'non_en' | 'mixed' | 'unknown'

export type TaskType = 'personal_narrative' | 'argumentative' | 'general'

// Database Tables
export interface StyleSample {
  id: string
  user_id: string
  filename: string
  source_type: SourceType
  storage_path: string | null
  raw_text: string | null
  cleaned_text: string | null
  detected_language: DetectedLanguage | null
  status: SampleStatus
  word_count_en: number
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface StyleChunk {
  id: string
  sample_id: string
  user_id: string
  chunk_text: string
  chunk_index: number
  embedding: number[] | null // vector(1536)
  created_at: string
}

export interface StyleProfile {
  user_id: string
  language: string
  metrics_json: StyleMetrics
  is_ready: boolean
  total_english_words: number
  recommended_threshold_words: number
  last_updated: string
}

export interface StyleMetrics {
  sentence_length_hist?: {
    short: number
    medium: number
    long: number
  }
  punctuation_usage?: {
    comma_density: number
    semicolon: number
    em_dash: number
  }
  transition_phrases_top?: string[]
  tone_markers?: {
    casual: number
    formal: number
  }
  quirks_summary?: string[]
}

export interface WritingTask {
  id: string
  user_id: string
  task_language: string
  title: string
  prompt_text: string
  task_type: TaskType | null
  created_at: string
  updated_at: string
}

export interface TaskVersion {
  id: string
  task_id: string
  version_number: number
  generated_text: string
  revision_instruction: string | null
  exported_count: number
  created_at: string
}

// API Request/Response Types
export interface UploadResponse {
  success: boolean
  sample?: StyleSample
  error?: string
}

export interface SamplesListResponse {
  samples: StyleSample[]
  totalWords: number
  readinessPercentage: number
}

// UI State Types
export interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
}
