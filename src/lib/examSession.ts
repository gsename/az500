import type { QuestionResponse } from '../types'

export const DEFAULT_EXAM_QUESTION_COUNT = 55
const STORAGE_KEY = 'az500-exam-session'

export interface ExamSessionState {
  questionIds: string[]
  startedAt: string
  durationMinutes: number
  answers: Record<string, QuestionResponse>
  /**
   * IDs of 'solution-goal' questions the learner has already moved past.
   * Mirrors the real exam behavior: once you leave this question type you
   * cannot return to change (or even revisit) the answer.
   */
  lockedQuestionIds: string[]
}

export function saveExamSession(session: ExamSessionState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function loadExamSession(): ExamSessionState | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ExamSessionState
  } catch {
    return null
  }
}

export function clearExamSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function remainingSeconds(session: ExamSessionState, now: Date = new Date()): number {
  const elapsedMs = now.getTime() - new Date(session.startedAt).getTime()
  const totalSeconds = session.durationMinutes * 60
  return Math.max(0, totalSeconds - Math.floor(elapsedMs / 1000))
}
