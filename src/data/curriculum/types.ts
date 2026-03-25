// ── Curriculum Content Types ─────────────────────────────────────────────

export interface LessonStep {
  instruction: string;
  completed?: boolean;
}

export interface LessonContent {
  topicSlug: string;
  topicName: string;
  domainSlug: string;
  dayNumber: number;
  title: string;
  duration: number;
  objectives: string[];
  steps: LessonStep[];
  hint: {
    description: string;
    code?: string;
  };
  fullSolution: {
    description: string;
    code: string;
  };
  successCriteria: string[];
  keyTakeaway: string;
}
