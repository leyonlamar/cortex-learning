/// Compute recall probability using exponential decay.
///
/// P(recall) = exp(-dt_hours / memory_strength)
pub fn recall_probability(dt_hours: f64, memory_strength: f64) -> f64 {
    if memory_strength <= 0.0 {
        return 0.0;
    }
    (-dt_hours / memory_strength).exp().clamp(0.0, 1.0)
}

/// Update memory strength after a retrieval attempt.
///
/// - score >= 0.6 (success): S_new = S * (1.0 + 0.5 * score)
/// - score < 0.6 (failure):  S_new = S * 0.5
///
/// Returns (new_strength, next_review_hours)
pub fn update_strength(current_strength: f64, score: f64) -> (f64, f64) {
    let base_interval_hours = 24.0;

    if score >= 0.6 {
        let new_s = current_strength * (1.0 + 0.5 * score);
        let next_review = base_interval_hours * new_s;
        (new_s, next_review)
    } else {
        let new_s = current_strength * 0.5;
        let next_review = base_interval_hours;
        (new_s, next_review)
    }
}

/// Sort topics by recall probability (ascending = most urgent first).
/// Returns indices into the input slice, limited to `limit`.
pub fn priority_queue(recall_probs: &[f64], limit: usize) -> Vec<usize> {
    let mut indexed: Vec<(usize, f64)> = recall_probs.iter().copied().enumerate().collect();
    indexed.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
    indexed.into_iter().take(limit).map(|(i, _)| i).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recall_probability_at_zero_time() {
        let p = recall_probability(0.0, 1.0);
        assert!((p - 1.0).abs() < 1e-10, "P(recall) should be 1.0 at t=0");
    }

    #[test]
    fn test_recall_decays_over_time() {
        let p1 = recall_probability(12.0, 1.0);
        let p2 = recall_probability(24.0, 1.0);
        let p3 = recall_probability(48.0, 1.0);
        assert!(p1 > p2, "Recall should decrease over time");
        assert!(p2 > p3, "Recall should continue decreasing");
        assert!(p3 > 0.0, "Recall should remain positive");
    }

    #[test]
    fn test_higher_strength_decays_slower() {
        let p_weak = recall_probability(24.0, 1.0);
        let p_strong = recall_probability(24.0, 5.0);
        assert!(p_strong > p_weak, "Higher S should decay slower");
    }

    #[test]
    fn test_successful_retrieval_increases_strength() {
        let (new_s, _) = update_strength(1.0, 0.8);
        assert!(new_s > 1.0, "Strength should increase on success");
    }

    #[test]
    fn test_failed_retrieval_halves_strength() {
        let (new_s, _) = update_strength(2.0, 0.3);
        assert!((new_s - 1.0).abs() < 1e-10, "Strength should halve on failure");
    }

    #[test]
    fn test_failed_retrieval_reviews_tomorrow() {
        let (_, next_hours) = update_strength(5.0, 0.2);
        assert!((next_hours - 24.0).abs() < 1e-10, "Failed retrieval = review in 24h");
    }

    #[test]
    fn test_successful_retrieval_expands_interval() {
        let (_, next_hours) = update_strength(1.0, 0.8);
        assert!(next_hours > 24.0, "Successful retrieval should expand interval");
    }

    #[test]
    fn test_priority_queue_sorted_ascending() {
        let probs = vec![0.8, 0.3, 0.5, 0.1, 0.9];
        let queue = priority_queue(&probs, 3);
        assert_eq!(queue, vec![3, 1, 2], "Should return indices sorted by lowest P(recall)");
    }

    #[test]
    fn test_priority_queue_respects_limit() {
        let probs = vec![0.8, 0.3, 0.5, 0.1, 0.9];
        let queue = priority_queue(&probs, 2);
        assert_eq!(queue.len(), 2, "Queue should respect limit");
    }

    #[test]
    fn test_zero_strength_returns_zero_recall() {
        let p = recall_probability(10.0, 0.0);
        assert!((p - 0.0).abs() < 1e-10, "Zero strength = zero recall");
    }
}
