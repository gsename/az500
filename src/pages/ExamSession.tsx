import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { questionsById, objectivesById, caseStudiesById } from '../content'
import {
  loadExamSession,
  saveExamSession,
  clearExamSession,
  remainingSeconds,
  type ExamSessionState,
} from '../lib/examSession'
import { scaleScore, PASSING_SCORE, seededShuffle } from '../lib/examBuilder'
import { applySm2Update, createInitialProgress } from '../lib/spacedRepetition'
import { db } from '../db'
import QuestionCard from '../components/QuestionCard'
import type { DomainScore } from '../types'

function isCorrect(correctAnswers: string[], selected: string[]): boolean {
  if (selected.length !== correctAnswers.length) return false
  const correctSet = new Set(correctAnswers)
  return selected.every((choice) => correctSet.has(choice))
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ExamSession() {
  const navigate = useNavigate()
  const [session, setSession] = useState<ExamSessionState | null>(() => loadExamSession())
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(() => (session ? remainingSeconds(session) : 0))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!session) {
      navigate('/exam')
      return
    }
    const interval = setInterval(() => {
      setRemaining(remainingSeconds(session))
    }, 1000)
    return () => clearInterval(interval)
  }, [session, navigate])

  useEffect(() => {
    if (session && remaining <= 0 && !submitting) {
      void handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  if (!session) return null

  const questions = session.questionIds.map((id) => questionsById[id]).filter(Boolean)
  const current = questions[index]
  const caseStudy = current?.caseStudyId ? caseStudiesById[current.caseStudyId] : null
  const currentAnswers = session.answers[current?.id] ?? []
  // Deterministic per-question choice order, stable for the whole session
  // (seed = question id + session start), reshuffled only on a new exam.
  const currentChoices = current ? seededShuffle(current.choices, `${current.id}:${session.startedAt}`) : []

  function updateAnswers(choice: string) {
    if (!session || !current) return
    const prev = session.answers[current.id] ?? []
    let next: string[]
    if (current.type === 'multiple') {
      next = prev.includes(choice) ? prev.filter((c) => c !== choice) : [...prev, choice]
    } else {
      next = [choice]
    }
    const updatedSession = { ...session, answers: { ...session.answers, [current.id]: next } }
    setSession(updatedSession)
    saveExamSession(updatedSession)
  }

  async function handleSubmit() {
    if (!session || submitting) return
    setSubmitting(true)

    const domainScoreMap = new Map<string, DomainScore>()
    const objectiveOutcomes = new Map<string, { correct: number; total: number }>()
    let correctCount = 0

    questions.forEach((q) => {
      const selected = session.answers[q.id] ?? []
      const correct = isCorrect(q.correctAnswers, selected)
      if (correct) correctCount += 1

      const objective = objectivesById[q.objectiveId]
      const domainId = objective?.domainId ?? 'unknown'
      const domainEntry = domainScoreMap.get(domainId) ?? { domainId, correct: 0, total: 0 }
      domainEntry.total += 1
      if (correct) domainEntry.correct += 1
      domainScoreMap.set(domainId, domainEntry)

      const objEntry = objectiveOutcomes.get(q.objectiveId) ?? { correct: 0, total: 0 }
      objEntry.total += 1
      if (correct) objEntry.correct += 1
      objectiveOutcomes.set(q.objectiveId, objEntry)
    })

    const elapsedSeconds = Math.min(
      session.durationMinutes * 60,
      Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000),
    )
    const scaledScore = scaleScore(correctCount, questions.length)

    const resultId = await db.examResults.add({
      date: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      totalQuestions: questions.length,
      correctCount,
      scaledScore,
      passed: scaledScore >= PASSING_SCORE,
      domainScores: Array.from(domainScoreMap.values()),
    })

    await db.quizAttempts.bulkAdd(
      questions.map((q) => ({
        objectiveId: q.objectiveId,
        questionId: q.id,
        correct: isCorrect(q.correctAnswers, session.answers[q.id] ?? []),
        mode: 'exam' as const,
        timestamp: new Date().toISOString(),
        examResultId: resultId as number,
      })),
    )

    for (const [objectiveId, outcome] of objectiveOutcomes) {
      const existing = await db.userProgress.get(objectiveId)
      const updated = applySm2Update(
        existing ?? createInitialProgress(objectiveId),
        outcome.correct,
        outcome.total,
      )
      await db.userProgress.put(updated)
    }

    clearExamSession()
    navigate(`/exam/results/${resultId}`)
  }

  const answeredCount = questions.filter((q) => (session.answers[q.id]?.length ?? 0) > 0).length

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          Répondu : {answeredCount} / {questions.length}
        </span>
        <span className={`timer ${remaining < 300 ? 'low' : ''}`}>{formatTime(remaining)}</span>
      </div>

      <div className="qnav">
        {questions.map((q, i) => {
          const answered = (session.answers[q.id]?.length ?? 0) > 0
          const cls = ['', answered ? 'answered' : '', i === index ? 'current' : ''].filter(Boolean).join(' ')
          return (
            <button key={q.id} className={cls} onClick={() => setIndex(i)}>
              {i + 1}
            </button>
          )
        })}
      </div>

      {current && (
        <QuestionCard
          question={current}
          displayChoices={currentChoices}
          caseStudy={caseStudy}
          selected={currentAnswers}
          onChange={updateAnswers}
          revealed={false}
          questionNumber={index + 1}
          totalQuestions={questions.length}
        />
      )}

      <div className="btn-row">
        <button className="btn secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          ← Précédent
        </button>
        <button
          className="btn secondary"
          disabled={index + 1 >= questions.length}
          onClick={() => setIndex((i) => i + 1)}
        >
          Suivant →
        </button>
        <button className="btn" onClick={() => void handleSubmit()} disabled={submitting}>
          Terminer l'examen
        </button>
      </div>
    </div>
  )
}
