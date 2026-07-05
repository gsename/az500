export interface WeightRange {
  min: number
  max: number
}

export interface Domain {
  id: string
  name: string
  weightPercent: WeightRange
}

export interface Objective {
  id: string
  domainId: string
  title: string
  description: string
  officialSkills: string[]
}

export interface LessonContent {
  objectiveId: string
  summary: string
  keyPoints: string[]
  commonPitfalls: string[]
  learnLinks: string[]
  diagrams?: string[]
}

export type QuestionType = 'single' | 'multiple' | 'case-study'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuizQuestion {
  id: string
  objectiveId: string
  type: QuestionType
  prompt: string
  choices: string[]
  correctAnswers: string[]
  explanation: string
  difficulty: Difficulty
  caseStudyId?: string
}

export interface CaseStudy {
  id: string
  title: string
  scenario: string
}

export interface LabReference {
  id: string
  objectiveId: string
  title: string
  description: string
  azurePortalSteps: string[]
  portalUrl: string
}

// --- User data (persisted in IndexedDB via Dexie) ---

export interface ProgressHistoryEntry {
  date: string
  accuracy: number
  quality: number
  correctCount: number
  totalCount: number
}

export interface UserProgress {
  objectiveId: string
  lastReviewed: string | null
  correctStreak: number
  nextReviewDate: string | null
  easeFactor: number
  intervalDays: number
  repetitions: number
  history: ProgressHistoryEntry[]
}

export interface QuizAttempt {
  id?: number
  objectiveId: string
  questionId: string
  correct: boolean
  mode: 'practice' | 'exam'
  timestamp: string
  examResultId?: number
}

export interface DomainScore {
  domainId: string
  correct: number
  total: number
}

export interface ExamResult {
  id?: number
  date: string
  durationSeconds: number
  totalQuestions: number
  correctCount: number
  scaledScore: number
  passed: boolean
  domainScores: DomainScore[]
}

export interface LabProgress {
  labId: string
  completed: boolean
  completedAt: string | null
}
