import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { objectivesById, questionsByObjective, caseStudiesById } from '../content'
import { shuffle, seededShuffle } from '../lib/examBuilder'
import { applySm2Update, createInitialProgress } from '../lib/spacedRepetition'
import { db } from '../db'
import QuestionCard from '../components/QuestionCard'
import type { QuizQuestion } from '../types'

const DEFAULT_QUIZ_SIZE = 20

interface PreparedQuestion {
  question: QuizQuestion
  choices: string[]
}

function isCorrect(question: QuizQuestion, selected: string[]): boolean {
  if (selected.length !== question.correctAnswers.length) return false
  const correctSet = new Set(question.correctAnswers)
  return selected.every((choice) => correctSet.has(choice))
}

export default function Quiz() {
  const { objectiveId } = useParams<{ objectiveId: string }>()
  const [searchParams] = useSearchParams()
  const objective = objectiveId ? objectivesById[objectiveId] : undefined

  const pool = objectiveId ? questionsByObjective[objectiveId] ?? [] : []
  const requested = Number(searchParams.get('n'))
  const size = Number.isFinite(requested) && requested > 0 ? requested : DEFAULT_QUIZ_SIZE
  const targetSize = Math.min(size, pool.length)

  // A salt fixed for the session: keeps question selection AND choice order
  // stable across re-renders, but changes on restart for a fresh draw.
  const [salt, setSalt] = useState(() => Math.random().toString(36).slice(2))

  const prepared: PreparedQuestion[] = useMemo(() => {
    const picked = shuffle(pool).slice(0, targetSize)
    return picked.map((question) => ({
      question,
      choices: seededShuffle(question.choices, `${question.id}:${salt}`),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectiveId, salt, targetSize])

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!objective) return <p>Objectif introuvable.</p>
  if (prepared.length === 0) return <p>Aucune question disponible pour cet objectif.</p>

  const current = prepared[index]
  const caseStudy = current.question.caseStudyId ? caseStudiesById[current.question.caseStudyId] : null

  function toggleChoice(choice: string) {
    if (revealed) return
    if (current.question.type === 'multiple') {
      setSelected((prev) => (prev.includes(choice) ? prev.filter((c) => c !== choice) : [...prev, choice]))
    } else {
      setSelected([choice])
    }
  }

  async function handleValidate() {
    const correct = isCorrect(current.question, selected)
    if (correct) setCorrectCount((c) => c + 1)
    setRevealed(true)
    await db.quizAttempts.add({
      objectiveId: objective!.id,
      questionId: current.question.id,
      correct,
      mode: 'practice',
      timestamp: new Date().toISOString(),
    })
  }

  async function handleNext() {
    if (index + 1 < prepared.length) {
      setIndex((i) => i + 1)
      setSelected([])
      setRevealed(false)
    } else {
      setFinished(true)
      if (!saved) {
        setSaved(true)
        const existing = await db.userProgress.get(objective!.id)
        const updated = applySm2Update(
          existing ?? createInitialProgress(objective!.id),
          correctCount,
          prepared.length,
        )
        await db.userProgress.put(updated)
      }
    }
  }

  function restart() {
    setSalt(Math.random().toString(36).slice(2))
    setIndex(0)
    setSelected([])
    setRevealed(false)
    setCorrectCount(0)
    setFinished(false)
    setSaved(false)
  }

  if (finished) {
    const accuracy = Math.round((correctCount / prepared.length) * 100)
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
                <strong>{correctCount}</strong> / {prepared.length} bonnes réponses
              </p>
              <p className="muted" style={{ margin: '0.3rem 0 0' }}>
                La prochaine date de révision de cet objectif a été mise à jour (répétition espacée SM-2).
              </p>
            </div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={restart}>
            🔁 Nouveau tirage
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
        question={current.question}
        displayChoices={current.choices}
        caseStudy={caseStudy}
        selected={selected}
        onChange={toggleChoice}
        revealed={revealed}
        questionNumber={index + 1}
        totalQuestions={prepared.length}
      />
      {!revealed ? (
        <button className="btn" disabled={selected.length === 0} onClick={handleValidate}>
          Valider
        </button>
      ) : (
        <button className="btn" onClick={handleNext}>
          {index + 1 < prepared.length ? 'Question suivante →' : 'Voir le résultat'}
        </button>
      )}
    </div>
  )
}
