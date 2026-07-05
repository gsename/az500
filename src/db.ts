import Dexie, { type Table } from 'dexie'
import type { UserProgress, QuizAttempt, ExamResult, LabProgress } from './types'

class Az500Database extends Dexie {
  userProgress!: Table<UserProgress, string>
  quizAttempts!: Table<QuizAttempt, number>
  examResults!: Table<ExamResult, number>
  labProgress!: Table<LabProgress, string>

  constructor() {
    super('az500-study-guide')
    this.version(1).stores({
      userProgress: 'objectiveId',
      quizAttempts: '++id, objectiveId, questionId, timestamp, mode, examResultId',
      examResults: '++id, date',
      labProgress: 'labId',
    })
  }
}

export const db = new Az500Database()
