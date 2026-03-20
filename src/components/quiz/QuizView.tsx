import { useState, useEffect } from 'react';
import { Card, Button, Spinner } from '../shared';
import { QuizProgress } from './QuizProgress';
import { QuizTimer } from './QuizTimer';
import { QuizQuestionCard } from './QuizQuestion';
import { QuizResultsCard } from './QuizResultsCard';
import { useCurriculum } from '../../hooks/useCurriculum';
import { useQuiz } from '../../hooks/useQuiz';
import { useCalendar } from '../../hooks/useCalendar';
import type { Domain, Topic } from '../../types/models';

type Phase = 'browse' | 'quizzing' | 'results';

export function QuizView() {
  const { domains, topicsByDomain, loading: currLoading, loadDomains, loadTopics } = useCurriculum();
  const { quiz, results, currentIndex, loading: quizLoading, error, startQuiz, answerQuestion, finishQuiz } = useQuiz();
  const { calendar, loadCalendar } = useCalendar();

  const [phase, setPhase] = useState<Phase>('browse');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Map<string, Topic>>(new Map());
  const [timerRunning, setTimerRunning] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    loadDomains().then((ds) => {
      if (ds) ds.forEach((d) => loadTopics(d.id));
    });
    loadCalendar();
  }, [loadDomains, loadTopics, loadCalendar]);

  const handleExpandDomain = async (domain: Domain) => {
    if (expandedDomain === domain.id) {
      setExpandedDomain(null);
      return;
    }
    setExpandedDomain(domain.id);
    if (!topicsByDomain[domain.id]) {
      await loadTopics(domain.id);
    }
  };

  const toggleTopic = (topic: Topic) => {
    setSelectedTopics((prev) => {
      const next = new Map(prev);
      if (next.has(topic.id)) {
        next.delete(topic.id);
      } else {
        next.set(topic.id, topic);
      }
      return next;
    });
  };

  const selectAllInDomain = (domainId: string) => {
    const topics = topicsByDomain[domainId] ?? [];
    setSelectedTopics((prev) => {
      const next = new Map(prev);
      const allSelected = topics.every((t) => next.has(t.id));
      if (allSelected) {
        topics.forEach((t) => next.delete(t.id));
      } else {
        topics.forEach((t) => next.set(t.id, t));
      }
      return next;
    });
  };

  const handleStartQuiz = async () => {
    if (selectedTopics.size === 0) return;
    const topicTuples: [string, string, string, number][] = Array.from(selectedTopics.values()).map(
      (t) => [t.id, t.name, t.slug, 0]
    );
    // Derive current week ID from calendar
    const now = new Date().toISOString().slice(0, 10);
    const currentWeek = calendar?.weeks.find(
      (ws) => ws.week.start_date <= now && ws.week.end_date >= now,
    );
    const weekId = currentWeek?.week.id ?? calendar?.weeks[0]?.week.id ?? 'W01';
    await startQuiz(weekId, topicTuples, 10);
    setPhase('quizzing');
    setTimerRunning(true);
    setLastCorrect(null);
  };

  const handleAnswer = async (answer: string) => {
    if (!quiz) return;
    const correct = await answerQuestion(quiz.questions[currentIndex].id, answer);
    setLastCorrect(correct);

    // Auto-advance after short delay, or finish if last question
    setTimeout(async () => {
      setLastCorrect(null);
      if (currentIndex + 1 >= quiz.questions.length) {
        setTimerRunning(false);
        await finishQuiz();
        setPhase('results');
      }
    }, 800);
  };

  const handleReset = () => {
    setPhase('browse');
    setSelectedTopics(new Map());
    setTimerRunning(false);
    setLastCorrect(null);
  };

  // ── Results phase ──────────────────────────────────────────────────
  if (phase === 'results' && results) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Quiz Results
          </h2>
          <Button onClick={handleReset}>New Quiz</Button>
        </div>
        <QuizResultsCard results={results} />
      </div>
    );
  }

  // ── Quizzing phase ─────────────────────────────────────────────────
  if (phase === 'quizzing' && quiz) {
    const question = quiz.questions[currentIndex];
    if (!question) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner size={32} />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Quiz
          </h2>
          <QuizTimer running={timerRunning} />
        </div>

        <QuizProgress current={currentIndex + 1} total={quiz.questions.length} />

        {/* Correct/incorrect flash */}
        {lastCorrect !== null && (
          <div
            className="text-center text-sm font-semibold py-2 animate-fade-in"
            style={{
              color: lastCorrect ? 'var(--accent-success)' : 'var(--accent-danger)',
            }}
          >
            {lastCorrect ? 'Correct!' : 'Incorrect'}
          </div>
        )}

        <QuizQuestionCard question={question} onAnswer={handleAnswer} />
      </div>
    );
  }

  // ── Browse/select phase ────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Curriculum
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Select topics then start a quiz
          </p>
        </div>
        {selectedTopics.size > 0 && (
          <Button onClick={handleStartQuiz} disabled={quizLoading}>
            {quizLoading ? 'Generating...' : `Start Quiz (${selectedTopics.size} topics)`}
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm px-3 py-2" style={{ color: 'var(--accent-danger)', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)' }}>
          {error}
        </div>
      )}

      {currLoading && domains.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="flex flex-col gap-3 stagger-children">
          {domains.map((domain) => {
            const topics = topicsByDomain[domain.id] ?? [];
            const isExpanded = expandedDomain === domain.id;
            const selectedInDomain = topics.filter((t) => selectedTopics.has(t.id)).length;

            return (
              <Card key={domain.id} className="overflow-hidden">
                {/* Domain header */}
                <button
                  onClick={() => handleExpandDomain(domain)}
                  className="w-full flex items-center gap-3 p-0 border-none cursor-pointer text-left"
                  style={{ background: 'transparent' }}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: domain.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                      >
                        {domain.name}
                      </span>
                      {selectedInDomain > 0 && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: domain.color + '22',
                            color: domain.color,
                            fontFamily: 'var(--font-code)',
                          }}
                        >
                          {selectedInDomain}/{topics.length}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {topics.length > 0 ? `${topics.length} topics` : 'Loading...'}
                    </span>
                  </div>
                  <span
                    className="text-xs shrink-0"
                    style={{
                      color: 'var(--text-muted)',
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    ▶
                  </span>
                </button>

                {/* Topics list */}
                {isExpanded && topics.length > 0 && (
                  <div
                    className="mt-3 pt-3 flex flex-col gap-1 animate-fade-in"
                    style={{ borderTop: '1px solid var(--border-color)' }}
                  >
                    {/* Select all toggle */}
                    <button
                      onClick={() => selectAllInDomain(domain.id)}
                      className="text-xs mb-1 px-2 py-1 border-none cursor-pointer"
                      style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-muted)',
                        borderRadius: 'var(--border-radius)',
                        width: 'fit-content',
                      }}
                    >
                      {topics.every((t) => selectedTopics.has(t.id)) ? 'Deselect all' : 'Select all'}
                    </button>

                    {topics.map((topic) => {
                      const isSelected = selectedTopics.has(topic.id);
                      return (
                        <button
                          key={topic.id}
                          onClick={() => toggleTopic(topic)}
                          className="flex items-center gap-2 px-2 py-2 text-sm border-none cursor-pointer text-left"
                          style={{
                            background: isSelected ? domain.color + '15' : 'transparent',
                            borderRadius: 'var(--border-radius)',
                            borderLeft: isSelected ? `3px solid ${domain.color}` : '3px solid transparent',
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded shrink-0 flex items-center justify-center text-xs"
                            style={{
                              background: isSelected ? domain.color : 'var(--bg-tertiary)',
                              color: isSelected ? '#fff' : 'transparent',
                              border: isSelected ? 'none' : '1px solid var(--border-color)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isSelected ? '✓' : ''}
                          </div>
                          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                            {topic.name}
                          </span>
                          <span
                            className="ml-auto text-xs"
                            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}
                          >
                            {topic.slug}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
