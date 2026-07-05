import referential from './domains.json'
import lessonsD1 from './lessons/domain-1.json'
import lessonsD2 from './lessons/domain-2.json'
import lessonsD3 from './lessons/domain-3.json'
import lessonsD4 from './lessons/domain-4.json'
import quizD1 from './quiz/domain-1.json'
import quizD2 from './quiz/domain-2.json'
import quizD3 from './quiz/domain-3.json'
import quizD4 from './quiz/domain-4.json'
import caseStudiesRaw from './case-studies.json'
import labsRaw from './labs.json'
import type {
  Domain,
  Objective,
  LessonContent,
  QuizQuestion,
  CaseStudy,
  LabReference,
} from '../types'

export const examMeta = referential.exam

export const domains: Domain[] = referential.domains
export const objectives: Objective[] = referential.objectives as Objective[]

export const lessons: LessonContent[] = [
  ...lessonsD1,
  ...lessonsD2,
  ...lessonsD3,
  ...lessonsD4,
] as LessonContent[]

export const questions: QuizQuestion[] = [
  ...quizD1,
  ...quizD2,
  ...quizD3,
  ...quizD4,
] as QuizQuestion[]

export const caseStudies: CaseStudy[] = caseStudiesRaw
export const labs: LabReference[] = labsRaw

export const domainsById: Record<string, Domain> = Object.fromEntries(
  domains.map((d) => [d.id, d]),
)

export const objectivesByDomain: Record<string, Objective[]> = Object.fromEntries(
  domains.map((d) => [d.id, objectives.filter((o) => o.domainId === d.id)]),
)

export const objectivesById: Record<string, Objective> = Object.fromEntries(
  objectives.map((o) => [o.id, o]),
)

export const lessonByObjective: Record<string, LessonContent> = Object.fromEntries(
  lessons.map((l) => [l.objectiveId, l]),
)

export const questionsByObjective: Record<string, QuizQuestion[]> = Object.fromEntries(
  objectives.map((o) => [o.id, questions.filter((q) => q.objectiveId === o.id)]),
)

export const questionsById: Record<string, QuizQuestion> = Object.fromEntries(
  questions.map((q) => [q.id, q]),
)

export const caseStudiesById: Record<string, CaseStudy> = Object.fromEntries(
  caseStudies.map((c) => [c.id, c]),
)

export const labsByObjective: Record<string, LabReference[]> = Object.fromEntries(
  objectives.map((o) => [o.id, labs.filter((l) => l.objectiveId === o.id)]),
)

export function domainWeightMidpoint(domain: Domain): number {
  return (domain.weightPercent.min + domain.weightPercent.max) / 2
}
