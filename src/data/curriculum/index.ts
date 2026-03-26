import type { LessonContent } from './types';
import { powerBiLessons } from './power-bi';
import { biLessons } from './bi';
import { operationsLessons } from './operations';
import { logisticsLessons } from './logistics';

// ── Interleave 4 domains round-robin ────────────────────────────────────
// Each week of 5 days covers multiple domains: PBI, BI, OPS, LOG, PBI, BI, ...
// This maximizes retention through spaced interleaving.
const domainArrays = [powerBiLessons, biLessons, operationsLessons, logisticsLessons];
const allLessons: LessonContent[] = [];
const maxLen = Math.max(...domainArrays.map((a) => a.length));
for (let i = 0; i < maxLen; i++) {
  for (const arr of domainArrays) {
    if (i < arr.length) allLessons.push(arr[i]);
  }
}

const lessonMap = new Map<string, LessonContent>();
for (const l of allLessons) {
  lessonMap.set(`${l.domainSlug}::${l.topicSlug}::${l.dayNumber}`, l);
}

/** Lookup by domain + topic + day number within topic */
export function getLessonByTopic(domainSlug: string, topicSlug: string, dayNumber: number): LessonContent | null {
  return lessonMap.get(`${domainSlug}::${topicSlug}::${dayNumber}`) ?? null;
}

/** Lookup by global day index (1-based across all domains) */
export function getLessonByIndex(globalIndex: number): LessonContent | null {
  return allLessons[globalIndex - 1] ?? null;
}

/** Get all lessons for a domain */
export function getLessonsByDomain(domainSlug: string): LessonContent[] {
  return allLessons.filter((l) => l.domainSlug === domainSlug);
}

export { allLessons, powerBiLessons, biLessons, operationsLessons, logisticsLessons };
export type { LessonContent } from './types';
