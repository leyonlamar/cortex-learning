import type { LessonContent } from './types';
import { biLessons } from './bi';
import { logisticsLessons } from './logistics';

const allLessons: LessonContent[] = [...biLessons, ...logisticsLessons];

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

export { allLessons, biLessons, logisticsLessons };
export type { LessonContent } from './types';
