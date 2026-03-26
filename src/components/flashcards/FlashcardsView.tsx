import { useState, useEffect, useCallback } from 'react';
import { Plus, Layers, CheckCircle2, Brain } from 'lucide-react';
import { Card, Button } from '../shared';
import {
  listFlashcards, getDueFlashcards, createFlashcard, reviewFlashcard,
} from '../../lib/tauri-bridge';
import { useCurriculum } from '../../hooks/useCurriculum';
import type { Flashcard, FlashcardRating } from '../../types/models';

type Phase = 'deck' | 'review' | 'create' | 'complete';

const RATING_CONFIG: Record<FlashcardRating, { label: string; color: string; description: string }> = {
  again: { label: 'Again', color: 'var(--accent-danger)', description: 'Did not remember' },
  hard: { label: 'Hard', color: 'var(--chart-5)', description: 'Took effort' },
  good: { label: 'Good', color: 'var(--accent-primary)', description: 'Remembered' },
  easy: { label: 'Easy', color: 'var(--accent-success)', description: 'Effortless' },
};

export function FlashcardsView() {
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [phase, setPhase] = useState<Phase>('deck');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Create form
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newTopic, setNewTopic] = useState('');

  const { domains, loadDomains } = useCurriculum();

  const load = useCallback(async () => {
    const [all, due] = await Promise.all([listFlashcards(), getDueFlashcards()]);
    setAllCards(all);
    setDueCards(due);
  }, []);

  useEffect(() => {
    load();
    loadDomains();
  }, [load, loadDomains]);

  const handleStartReview = () => {
    if (dueCards.length === 0) return;
    setCurrentIdx(0);
    setFlipped(false);
    setReviewedCount(0);
    setCorrectCount(0);
    setPhase('review');
  };

  const handleRate = async (rating: FlashcardRating) => {
    const card = dueCards[currentIdx];
    if (!card) return;
    await reviewFlashcard(card.id, rating);
    setReviewedCount((c) => c + 1);
    if (rating === 'good' || rating === 'easy') setCorrectCount((c) => c + 1);

    if (currentIdx + 1 >= dueCards.length) {
      setPhase('complete');
      await load();
    } else {
      setCurrentIdx((i) => i + 1);
      setFlipped(false);
    }
  };

  const handleCreate = async () => {
    if (!newFront.trim() || !newBack.trim()) return;
    await createFlashcard(newFront, newBack, newDomain || 'general', newTopic || 'general');
    setNewFront('');
    setNewBack('');
    await load();
    setPhase('deck');
  };

  // ── Complete screen ─────────────────────────────────────────────────
  if (phase === 'complete') {
    const accuracy = reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0;
    return (
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto py-12 animate-fade-in">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'var(--accent-success)', opacity: 0.9 }}
        >
          <CheckCircle2 size={40} style={{ color: 'var(--text-inverse)' }} />
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Review Complete!
        </h2>
        <div className="flex gap-6">
          <StatBubble label="Reviewed" value={`${reviewedCount}`} color="var(--accent-primary)" />
          <StatBubble label="Accuracy" value={`${accuracy}%`} color="var(--accent-success)" />
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={() => setPhase('deck')}>Back to Deck</Button>
          <Button variant="secondary" onClick={() => { load(); handleStartReview(); }}>
            Review Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Review screen ───────────────────────────────────────────────────
  if (phase === 'review' && dueCards[currentIdx]) {
    const card = dueCards[currentIdx];
    return (
      <div className="flex flex-col gap-6 max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Review
          </h2>
          <span
            className="text-sm"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}
          >
            {currentIdx + 1}/{dueCards.length}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-1 overflow-hidden"
          style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)' }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((currentIdx + 1) / dueCards.length) * 100}%`,
              background: 'var(--accent-primary)',
              borderRadius: 'var(--border-radius)',
            }}
          />
        </div>

        {/* Card */}
        <div
          onClick={() => setFlipped(!flipped)}
          className="cursor-pointer"
          style={{ perspective: '1000px' }}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              minHeight: '280px',
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <Card
              className="absolute inset-0 flex flex-col items-center justify-center p-8"
              style={{ backfaceVisibility: 'hidden' }}
              glow={!flipped}
            >
              <span className="text-xs mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                {card.domain_slug} / {card.topic_slug}
              </span>
              <p
                className="text-lg text-center font-medium"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}
              >
                {card.front}
              </p>
              <span className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                Tap to flip
              </span>
            </Card>

            {/* Back */}
            <Card
              className="absolute inset-0 flex flex-col items-center justify-center p-8"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
              glow={flipped}
            >
              <span className="text-xs mb-4" style={{ color: 'var(--accent-success)', fontFamily: 'var(--font-code)' }}>
                Answer
              </span>
              <p
                className="text-lg text-center font-medium"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}
              >
                {card.back}
              </p>
            </Card>
          </div>
        </div>

        {/* Rating buttons - only show when flipped */}
        {flipped && (
          <div className="flex gap-2 justify-center animate-fade-in">
            {(Object.keys(RATING_CONFIG) as FlashcardRating[]).map((rating) => {
              const rc = RATING_CONFIG[rating];
              return (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  className="flex flex-col items-center gap-1 px-5 py-3 border-none cursor-pointer transition-all duration-150"
                  style={{
                    background: 'var(--bg-surface)',
                    border: `2px solid ${rc.color}`,
                    borderRadius: 'var(--border-radius)',
                    color: rc.color,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = rc.color;
                    e.currentTarget.style.color = 'var(--text-inverse)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-surface)';
                    e.currentTarget.style.color = rc.color;
                  }}
                >
                  <span className="text-sm font-semibold">{rc.label}</span>
                  <span className="text-xs opacity-70">{rc.description}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Create screen ───────────────────────────────────────────────────
  if (phase === 'create') {
    return (
      <div className="flex flex-col gap-6 max-w-lg mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Create Flashcard
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setPhase('deck')}>Cancel</Button>
        </div>

        <Card className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
              Front (Question)
            </label>
            <textarea
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="What concept or question do you want to memorize?"
              className="w-full p-3 text-sm border-none outline-none resize-none"
              rows={3}
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--border-radius)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
              Back (Answer)
            </label>
            <textarea
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="The answer or explanation..."
              className="w-full p-3 text-sm border-none outline-none resize-none"
              rows={3}
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--border-radius)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                Domain
              </label>
              <select
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="w-full p-2 text-sm border-none outline-none"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">Select domain</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.slug}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                Topic
              </label>
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Topic slug"
                className="w-full p-2 text-sm border-none outline-none"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        </Card>

        <Button
          onClick={handleCreate}
          disabled={!newFront.trim() || !newBack.trim()}
        >
          Create Flashcard
        </Button>
      </div>
    );
  }

  // ── Deck overview ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Flashcards
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Spaced repetition for lasting memory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPhase('create')}>
            <Plus size={14} /> Create
          </Button>
          {dueCards.length > 0 && (
            <Button onClick={handleStartReview}>
              <Brain size={14} /> Review ({dueCards.length} due)
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div
            className="text-2xl font-bold"
            style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-code)' }}
          >
            {allCards.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Total Cards</div>
        </Card>
        <Card className="text-center">
          <div
            className="text-2xl font-bold"
            style={{ color: dueCards.length > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', fontFamily: 'var(--font-code)' }}
          >
            {dueCards.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Due Today</div>
        </Card>
        <Card className="text-center">
          <div
            className="text-2xl font-bold"
            style={{ color: 'var(--accent-success)', fontFamily: 'var(--font-code)' }}
          >
            {allCards.filter((c) => c.review_count > 0).length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Reviewed</div>
        </Card>
      </div>

      {/* Cards list */}
      {allCards.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Your Cards
          </h3>
          {allCards.slice(0, 20).map((card) => {
            const isDue = card.next_review <= new Date().toISOString();
            return (
              <Card key={card.id} className="flex items-center gap-3">
                <Layers size={16} style={{ color: isDue ? 'var(--accent-danger)' : 'var(--text-muted)', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {card.front}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {card.domain_slug} &middot; reviewed {card.review_count}x
                  </p>
                </div>
                {isDue && (
                  <span
                    className="text-xs px-2 py-0.5 shrink-0"
                    style={{
                      background: 'var(--accent-danger)',
                      color: 'var(--text-inverse)',
                      borderRadius: 'var(--border-radius)',
                    }}
                  >
                    Due
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Layers size={36} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto' }} />
          <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
            No flashcards yet. Create some from your curriculum!
          </p>
          <Button className="mt-3" size="sm" onClick={() => setPhase('create')}>
            <Plus size={14} /> Create First Card
          </Button>
        </Card>
      )}
    </div>
  );
}

function StatBubble({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold" style={{ color, fontFamily: 'var(--font-code)' }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}
