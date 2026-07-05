import { useNavigate } from 'react-router-dom'
import { domains, objectivesByDomain, questionsByObjective, examMeta } from '../content'
import { buildExam } from '../lib/examBuilder'
import { saveExamSession, DEFAULT_EXAM_QUESTION_COUNT } from '../lib/examSession'

export default function ExamStart() {
  const navigate = useNavigate()

  function start() {
    const exam = buildExam(domains, objectivesByDomain, questionsByObjective, DEFAULT_EXAM_QUESTION_COUNT)
    saveExamSession({
      questionIds: exam.map((q) => q.id),
      startedAt: new Date().toISOString(),
      durationMinutes: examMeta.durationMinutes,
      answers: {},
    })
    navigate('/exam/session')
  }

  return (
    <div>
      <h1>Examen blanc</h1>
      <div className="card">
        <div className="chip-row" style={{ marginBottom: '1rem' }}>
          <span className="chip accent">{DEFAULT_EXAM_QUESTION_COUNT} questions</span>
          <span className="chip">{examMeta.durationMinutes} min</span>
          <span className="chip">
            Réussite {examMeta.passingScore}/{examMeta.scoreMax}
          </span>
        </div>
        <p>
          Les questions sont tirées <strong>proportionnellement à la pondération officielle</strong> des 4 domaines :
        </p>
        <div className="grid" style={{ margin: '0.75rem 0' }}>
          {domains.map((d) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <span>{d.name}</span>
              <span className="muted" style={{ whiteSpace: 'nowrap' }}>
                {d.weightPercent.min}-{d.weightPercent.max}%
              </span>
            </div>
          ))}
        </div>
        <p className="muted">
          Le chronomètre ne s'arrête pas une fois lancé. Tu peux naviguer entre les questions et changer tes réponses
          avant de terminer.
        </p>
        <button className="btn" onClick={start}>
          ▶ Commencer l'examen
        </button>
      </div>
    </div>
  )
}
