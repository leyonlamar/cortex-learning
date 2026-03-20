#![allow(dead_code)]
use statrs::distribution::{Beta, ContinuousCDF};

/// Bayesian knowledge state for a single topic.
#[derive(Debug, Clone)]
pub struct BayesianState {
    pub alpha: f64,
    pub beta_param: f64,
}

impl BayesianState {
    /// Create a new state with uniform prior Beta(1,1).
    pub fn new() -> Self {
        Self {
            alpha: 1.0,
            beta_param: 1.0,
        }
    }

    /// Create from existing parameters.
    pub fn from_params(alpha: f64, beta_param: f64) -> Self {
        Self { alpha, beta_param }
    }

    /// Update state after a quiz/retrieval attempt.
    ///
    /// weight = difficulty * confidence_factor (typically 0.1 to 2.0)
    pub fn update(&mut self, correct: bool, weight: f64) {
        let w = weight.max(0.01);
        if correct {
            self.alpha += w;
        } else {
            self.beta_param += w;
        }
    }

    /// Expected mastery: E[X] = alpha / (alpha + beta)
    pub fn mastery_mean(&self) -> f64 {
        self.alpha / (self.alpha + self.beta_param)
    }

    /// Uncertainty metric: lower = more certain.
    /// 1 / (alpha + beta + 1)
    pub fn uncertainty(&self) -> f64 {
        1.0 / (self.alpha + self.beta_param + 1.0)
    }

    /// 95% credible interval [lower, upper].
    pub fn credible_interval_95(&self) -> (f64, f64) {
        if let Ok(dist) = Beta::new(self.alpha, self.beta_param) {
            let lower = dist.inverse_cdf(0.025);
            let upper = dist.inverse_cdf(0.975);
            (lower, upper)
        } else {
            (0.0, 1.0)
        }
    }

    /// Total data points observed.
    pub fn data_points(&self) -> f64 {
        (self.alpha + self.beta_param - 2.0).max(0.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_state_is_uniform() {
        let s = BayesianState::new();
        assert!((s.mastery_mean() - 0.5).abs() < 1e-10, "Uniform prior = 0.5 mastery");
    }

    #[test]
    fn test_new_state_high_uncertainty() {
        let s = BayesianState::new();
        let well_known = BayesianState::from_params(10.0, 10.0);
        assert!(
            s.uncertainty() > well_known.uncertainty(),
            "New state should have higher uncertainty"
        );
    }

    #[test]
    fn test_correct_answer_increases_mastery() {
        let mut s = BayesianState::new();
        let before = s.mastery_mean();
        s.update(true, 1.0);
        assert!(s.mastery_mean() > before, "Correct answer should increase mastery");
    }

    #[test]
    fn test_incorrect_answer_decreases_mastery() {
        let mut s = BayesianState::new();
        let before = s.mastery_mean();
        s.update(false, 1.0);
        assert!(s.mastery_mean() < before, "Incorrect answer should decrease mastery");
    }

    #[test]
    fn test_uncertainty_decreases_with_data() {
        let mut s = BayesianState::new();
        let initial_uncertainty = s.uncertainty();
        for _ in 0..10 {
            s.update(true, 1.0);
        }
        assert!(
            s.uncertainty() < initial_uncertainty,
            "Uncertainty should decrease with more data"
        );
    }

    #[test]
    fn test_difficulty_weighting() {
        let mut easy = BayesianState::new();
        let mut hard = BayesianState::new();
        easy.update(true, 0.3);
        hard.update(true, 0.9);
        assert!(
            hard.mastery_mean() > easy.mastery_mean(),
            "Harder correct answers should boost mastery more"
        );
    }

    #[test]
    fn test_credible_interval_contains_mean() {
        let s = BayesianState::from_params(5.0, 3.0);
        let (lower, upper) = s.credible_interval_95();
        let mean = s.mastery_mean();
        assert!(lower < mean && mean < upper, "CI should contain the mean");
    }

    #[test]
    fn test_credible_interval_narrows_with_data() {
        let few = BayesianState::from_params(2.0, 2.0);
        let many = BayesianState::from_params(20.0, 20.0);
        let (l1, u1) = few.credible_interval_95();
        let (l2, u2) = many.credible_interval_95();
        assert!(
            (u2 - l2) < (u1 - l1),
            "More data should narrow the CI"
        );
    }

    #[test]
    fn test_data_points_tracking() {
        let mut s = BayesianState::new();
        assert!((s.data_points() - 0.0).abs() < 1e-10);
        s.update(true, 1.0);
        s.update(false, 1.0);
        assert!((s.data_points() - 2.0).abs() < 1e-10);
    }
}
