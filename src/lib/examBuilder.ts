import type { Domain, Objective, QuizQuestion } from '../types'

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Allocates `total` integer slots across weighted buckets using the
 * largest-remainder method, so the rounded allocation still sums to `total`.
 */
export function allocateByWeight(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map((w) => (sum > 0 ? (w / sum) * total : 0))
  const base = raw.map(Math.floor)
  const allocated = base.reduce((a, b) => a + b, 0)
  let remainder = total - allocated

  const fractions = raw
    .map((r, i) => ({ i, frac: r - base[i] }))
    .sort((a, b) => b.frac - a.frac)

  const counts = [...base]
  for (let k = 0; k < remainder && k < fractions.length; k++) {
    counts[fractions[k].i] += 1
  }
  return counts
}

export function domainWeightMidpoint(domain: Domain): number {
  return (domain.weightPercent.min + domain.weightPercent.max) / 2
}

/**
 * Builds a mock-exam question set drawn proportionally to each domain's
 * official exam weighting (using the midpoint of its published range).
 */
export function buildExam(
  domains: Domain[],
  objectivesByDomain: Record<string, Objective[]>,
  questionsByObjective: Record<string, QuizQuestion[]>,
  totalQuestions: number,
): QuizQuestion[] {
  const weights = domains.map(domainWeightMidpoint)
  const counts = allocateByWeight(weights, totalQuestions)

  const selected: QuizQuestion[] = []
  domains.forEach((domain, idx) => {
    const objectiveIds = (objectivesByDomain[domain.id] ?? []).map((o) => o.id)
    const pool = objectiveIds.flatMap((oid) => questionsByObjective[oid] ?? [])
    const need = Math.min(counts[idx], pool.length)
    selected.push(...shuffle(pool).slice(0, need))
  })

  return shuffle(selected)
}

export function scaleScore(correctCount: number, totalCount: number): number {
  if (totalCount === 0) return 0
  return Math.round((correctCount / totalCount) * 1000)
}

export const PASSING_SCORE = 700
