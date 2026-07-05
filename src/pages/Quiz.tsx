import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { objectivesById, questionsByObjective, caseStudiesById } from '../content'
import { shuffle } from '../lib/examBuilder'
import { applySm2Update, createInitialProgress } from '../lib/spacedRepetition'
import { db } from '../db'
import QuestionCard from '../components/QuestionCard'
import type { QuizQuestion } from '../types'

function isCorrect(question: QuizQuestion, selected: string[]): boolean {
  if (selected.length !== question.correctAnswers.length) return false
  const correctSet = new Set(question.correctAnswers)
  return selected.every((choice) => correctSet.has(choice))
}

export default function Quiz() {
  const { objectiveId } = useParams<{ objectiveId: string }>()
  const objective = objectiveId ? objectivesById[objectiveId] : undefined

  const [sessionKey, setSessionKey] = useState(0)
  const questions = useMemo(
    () => (objectiveId ? shuffle(questionsByObjective[objectiveId] ?? []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [objectiveId, sessionKey],
  )

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!objective) return <p>Objectif introuvable.</p>
  if (questions.length === 0) return <p>Aucune question disponible pour cet objectif.</p>

  const current = questions[index]
  const caseStudy = current.caseStudyId ? caseStudiesById[current.caseStudyId] : null

  function toggleChoice(choice: string) {
    if (revealed) return
    if (current.type === 'multiple') {
      setSelected((prev) => (prev.includes(choice) ? prev.filter((c) => c !== choice) : [...prev, choice]))
    } else {
      setSelected([choice])
    }
  }

  async function handleValidate() {
    const correct = isCorrect(current, selected)
    if (correct) setCorrectCount((c) => c + 1)
    setRevealed(true)
    await db.quizAttempts.add({
      objectiveId: objective!.id,
      questionId: current.id,
      correct,
      mode: 'practice',
      timestamp: new Date().toISOString(),
    })
  }

  async function handleNext() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1)
      setSelected([])
      setRevealed(false)
    } else {
      setFinished(true)
      if (!saved) {
        setSaved(true)
        const existing = await db.userProgress.get(objective!.id)
        const updated = applySm2Update(existing ?? createInitialProgress(objective!.id), correctCount, questions.length)
        await db.userProgress.put(updated)
      }
    }
  }

  function restart() {
    setSessionKey((k) => k + 1)
    setIndex(0)
    setSelected([])
    setRevealed(false)
    setCorrectCount(0)
    setFinished(false)
    setSaved(false)
  }

  if (finished) {
    const accuracy = Math.round((correctCount / questions.length) * 100)
    const tone = accuracy >= 75 ? 'good' : accuracy >= 60 ? 'warn' : 'bad'
    return (
      <div>
        <div className="breadcrumb">
          <Link to={`/objectives/${objective.id}`}>← {objective.title}</Link>
        </div>
        <h1>Résultat</h1>
        <div className="card">
          <div className="stat-row">
            <div className="big-score" style={{ color: `var(--${tone})` }}>
              {accuracy}%
            </div>
            <div>
              <p style={{ margin: 0 }}>
                <strong>{correctCount}</strong> / {questions.length} bonnes réponses
              </p>
              <p className="muted" style={{ margin: '0.3rem 0 0' }}>
                La prochaine date de révision de cet objectif a été mise à jour (répétition espacée SM-2).
              </p>
            </div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={restart}>
            🔁 Recommencer
          </button>
          <Link to={`/objectives/${objective.id}`} className="btn secondary">
            Retour à l'objectif
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to={`/objectives/${objective.id}`}>← {objective.title}</Link>
      </div>
      <QuestionCard
        question={current}
        caseStudy={caseStudy}
        selected={selected}
        onChange={toggleChoice}
        revealed={revealed}
        questionNumber={index + 1}
        totalQuestions={questions.length}
      />
      {!revealed ? (
        <button className="btn" disabled={selected.length === 0} onClick={handleValidate}>
          Valider
        </button>
      ) : (
        <button className="btn" onClick={handleNext}>
          {index + 1 < questions.length ? 'Question suivante →' : 'Voir le résultat'}
        </button>
      )}
    </div>
  )
}
