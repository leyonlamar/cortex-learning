#![allow(dead_code)]
use rand::prelude::*;
use rand::rngs::StdRng;

/// Parameters for Monte Carlo simulation.
#[derive(Debug, Clone)]
pub struct SimParams {
    pub current_attendance_rate: f64,
    pub current_quiz_avg: f64,
    pub weeks_remaining: u32,
    pub attendance_volatility: f64,
    pub quiz_volatility: f64,
}

/// Result of a Monte Carlo simulation run.
#[derive(Debug, Clone)]
pub struct ForecastResult {
    pub attendance: PercentileSet,
    pub quiz_avg: PercentileSet,
    pub completion_confidence: f64,
}

#[derive(Debug, Clone)]
pub struct PercentileSet {
    pub p10: f64,
    pub p25: f64,
    pub median: f64,
    pub p75: f64,
    pub p90: f64,
}

/// Run Monte Carlo simulation with the given parameters.
///
/// Simulates `sim_count` trajectories, each projecting weekly attendance
/// and quiz scores forward by `weeks_remaining` weeks.
pub fn simulate(params: &SimParams, sim_count: u32, seed: Option<u64>) -> ForecastResult {
    let mut rng: Box<dyn RngCore> = match seed {
        Some(s) => Box::new(StdRng::seed_from_u64(s)),
        None => Box::new(StdRng::from_entropy()),
    };

    let mut attendance_finals = Vec::with_capacity(sim_count as usize);
    let mut quiz_finals = Vec::with_capacity(sim_count as usize);

    for _ in 0..sim_count {
        let mut att = params.current_attendance_rate;
        let mut quiz = params.current_quiz_avg;

        for _ in 0..params.weeks_remaining {
            let att_shock: f64 = rng.gen_range(-1.0..1.0) * params.attendance_volatility;
            att = (att + att_shock).clamp(0.0, 1.0);

            let quiz_shock: f64 = rng.gen_range(-1.0..1.0) * params.quiz_volatility;
            quiz = (quiz + quiz_shock).clamp(0.0, 100.0);
        }

        attendance_finals.push(att);
        quiz_finals.push(quiz);
    }

    attendance_finals.sort_by(|a, b| a.partial_cmp(b).unwrap());
    quiz_finals.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let completion_confidence = attendance_finals
        .iter()
        .filter(|&&a| a >= 0.80)
        .count() as f64
        / sim_count as f64;

    ForecastResult {
        attendance: percentiles(&attendance_finals),
        quiz_avg: percentiles(&quiz_finals),
        completion_confidence,
    }
}

/// Apply a scenario override to the base parameters.
pub fn apply_scenario(
    base: &SimParams,
    attendance_override: Option<f64>,
    study_time_override: Option<f64>,
) -> SimParams {
    let mut params = base.clone();
    if let Some(att) = attendance_override {
        params.current_attendance_rate = att.clamp(0.0, 1.0);
    }
    if let Some(time_factor) = study_time_override {
        // More study time reduces quiz volatility
        params.quiz_volatility *= (1.0 / time_factor.max(0.1)).min(2.0);
    }
    params
}

fn percentiles(sorted: &[f64]) -> PercentileSet {
    let n = sorted.len();
    if n == 0 {
        return PercentileSet {
            p10: 0.0,
            p25: 0.0,
            median: 0.0,
            p75: 0.0,
            p90: 0.0,
        };
    }
    PercentileSet {
        p10: sorted[(n as f64 * 0.10) as usize],
        p25: sorted[(n as f64 * 0.25) as usize],
        median: sorted[n / 2],
        p75: sorted[(n as f64 * 0.75) as usize],
        p90: sorted[((n as f64 * 0.90) as usize).min(n - 1)],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn default_params() -> SimParams {
        SimParams {
            current_attendance_rate: 0.85,
            current_quiz_avg: 72.0,
            weeks_remaining: 20,
            attendance_volatility: 0.05,
            quiz_volatility: 5.0,
        }
    }

    #[test]
    fn test_deterministic_with_seed() {
        let params = default_params();
        let r1 = simulate(&params, 1000, Some(42));
        let r2 = simulate(&params, 1000, Some(42));
        assert!(
            (r1.completion_confidence - r2.completion_confidence).abs() < 1e-10,
            "Same seed should produce same results"
        );
    }

    #[test]
    fn test_percentile_ordering() {
        let params = default_params();
        let result = simulate(&params, 10000, Some(42));
        assert!(result.attendance.p10 <= result.attendance.p25);
        assert!(result.attendance.p25 <= result.attendance.median);
        assert!(result.attendance.median <= result.attendance.p75);
        assert!(result.attendance.p75 <= result.attendance.p90);
    }

    #[test]
    fn test_completion_confidence_range() {
        let params = default_params();
        let result = simulate(&params, 5000, Some(42));
        assert!(
            (0.0..=1.0).contains(&result.completion_confidence),
            "Confidence should be between 0 and 1"
        );
    }

    #[test]
    fn test_scenario_shifts_attendance() {
        let base = default_params();
        let modified = apply_scenario(&base, Some(0.95), None);
        assert!(
            (modified.current_attendance_rate - 0.95).abs() < 1e-10,
            "Scenario should override attendance"
        );
    }

    #[test]
    fn test_performance_50k_under_limit() {
        let params = default_params();
        let start = std::time::Instant::now();
        simulate(&params, 50_000, Some(42));
        let elapsed = start.elapsed();
        // 200ms in release, 2000ms in debug (unoptimized)
        let limit_ms = if cfg!(debug_assertions) { 2000 } else { 200 };
        assert!(
            elapsed.as_millis() < limit_ms,
            "50K simulations took {}ms, expected <{}ms",
            elapsed.as_millis(),
            limit_ms
        );
    }
}
