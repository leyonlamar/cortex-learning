#![allow(dead_code)]
/// Behavioral tracking state.
#[derive(Debug, Clone)]
pub struct BehavioralState {
    pub attendance_streak: u32,
    pub missed_streak: u32,
    pub burnout_level: f64,
    pub plateau_weeks: u32,
    pub last_mastery_delta: f64,
}

impl BehavioralState {
    pub fn new() -> Self {
        Self {
            attendance_streak: 0,
            missed_streak: 0,
            burnout_level: 0.0,
            plateau_weeks: 0,
            last_mastery_delta: 0.0,
        }
    }
}

/// Alert severity levels.
#[derive(Debug, Clone, PartialEq)]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

/// A behavioral alert to surface to the user.
#[derive(Debug, Clone)]
pub struct Alert {
    pub event_type: String,
    pub severity: AlertSeverity,
    pub message: String,
}

/// Record a session attendance and return any alerts.
pub fn record_attendance(state: &mut BehavioralState, attended: bool) -> Vec<Alert> {
    let mut alerts = Vec::new();

    if attended {
        state.attendance_streak += 1;
        state.missed_streak = 0;

        // Burnout detection: long streaks without breaks
        if state.attendance_streak >= 15 {
            state.burnout_level = ((state.attendance_streak - 15) as f64 * 0.1).min(1.0);
        }

        if state.burnout_level >= 0.5 {
            alerts.push(Alert {
                event_type: "burnout_warning".into(),
                severity: AlertSeverity::Warning,
                message: format!(
                    "You've been studying {} days straight. Consider a rest day.",
                    state.attendance_streak
                ),
            });
        }

        // Streak milestones
        if state.attendance_streak % 10 == 0 && state.attendance_streak > 0 {
            alerts.push(Alert {
                event_type: "streak_milestone".into(),
                severity: AlertSeverity::Info,
                message: format!("{}-day streak! Keep it up!", state.attendance_streak),
            });
        }
    } else {
        state.missed_streak += 1;
        state.attendance_streak = 0;
        state.burnout_level = (state.burnout_level - 0.2).max(0.0);

        if state.missed_streak >= 3 {
            alerts.push(Alert {
                event_type: "attendance_warning".into(),
                severity: AlertSeverity::Critical,
                message: format!(
                    "You've missed {} sessions in a row. Getting back on track matters more than catching up.",
                    state.missed_streak
                ),
            });
        }
    }

    alerts
}

/// Record weekly mastery change and detect plateaus.
pub fn record_mastery_delta(state: &mut BehavioralState, mastery_delta: f64) -> Vec<Alert> {
    let mut alerts = Vec::new();
    state.last_mastery_delta = mastery_delta;

    if mastery_delta.abs() < 0.02 {
        state.plateau_weeks += 1;
    } else {
        state.plateau_weeks = 0;
    }

    if state.plateau_weeks >= 3 {
        alerts.push(Alert {
            event_type: "plateau_detected".into(),
            severity: AlertSeverity::Warning,
            message: format!(
                "Mastery has plateaued for {} weeks. Consider changing study approach or topics.",
                state.plateau_weeks
            ),
        });
    }

    alerts
}

/// Check if a review week should be triggered.
/// Review week = every 4th week or after burnout recovery.
pub fn should_trigger_review_week(week_num: u32, state: &BehavioralState) -> bool {
    if week_num % 4 == 0 {
        return true;
    }
    if state.burnout_level >= 0.7 {
        return true;
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_streak_increments_on_attendance() {
        let mut state = BehavioralState::new();
        record_attendance(&mut state, true);
        record_attendance(&mut state, true);
        assert_eq!(state.attendance_streak, 2);
        assert_eq!(state.missed_streak, 0);
    }

    #[test]
    fn test_streak_resets_on_miss() {
        let mut state = BehavioralState::new();
        for _ in 0..5 {
            record_attendance(&mut state, true);
        }
        record_attendance(&mut state, false);
        assert_eq!(state.attendance_streak, 0);
        assert_eq!(state.missed_streak, 1);
    }

    #[test]
    fn test_burnout_triggers_after_long_streak() {
        let mut state = BehavioralState::new();
        let mut burnout_warned = false;
        for _ in 0..20 {
            let alerts = record_attendance(&mut state, true);
            if alerts.iter().any(|a| a.event_type == "burnout_warning") {
                burnout_warned = true;
            }
        }
        assert!(burnout_warned, "Should warn about burnout after long streak");
        assert!(state.burnout_level > 0.0, "Burnout level should be elevated");
    }

    #[test]
    fn test_burnout_clears_on_rest() {
        let mut state = BehavioralState::new();
        state.burnout_level = 0.5;
        state.attendance_streak = 18;
        record_attendance(&mut state, false);
        assert!(state.burnout_level < 0.5, "Rest should reduce burnout");
    }

    #[test]
    fn test_missed_streak_triggers_critical_alert() {
        let mut state = BehavioralState::new();
        let mut critical_found = false;
        for _ in 0..4 {
            let alerts = record_attendance(&mut state, false);
            if alerts.iter().any(|a| a.severity == AlertSeverity::Critical) {
                critical_found = true;
            }
        }
        assert!(critical_found, "3+ missed sessions should trigger critical alert");
    }

    #[test]
    fn test_plateau_detection() {
        let mut state = BehavioralState::new();
        for _ in 0..3 {
            let alerts = record_mastery_delta(&mut state, 0.005);
            if state.plateau_weeks >= 3 {
                assert!(
                    alerts.iter().any(|a| a.event_type == "plateau_detected"),
                    "Should detect plateau after 3 weeks of no progress"
                );
            }
        }
        assert_eq!(state.plateau_weeks, 3);
    }

    #[test]
    fn test_plateau_resets_on_progress() {
        let mut state = BehavioralState::new();
        state.plateau_weeks = 2;
        record_mastery_delta(&mut state, 0.1);
        assert_eq!(state.plateau_weeks, 0, "Progress should reset plateau counter");
    }

    #[test]
    fn test_review_week_every_4th() {
        let state = BehavioralState::new();
        assert!(should_trigger_review_week(4, &state));
        assert!(should_trigger_review_week(8, &state));
        assert!(!should_trigger_review_week(5, &state));
    }

    #[test]
    fn test_review_week_on_high_burnout() {
        let mut state = BehavioralState::new();
        state.burnout_level = 0.8;
        assert!(should_trigger_review_week(3, &state), "High burnout should trigger review");
    }

    #[test]
    fn test_streak_milestone_alert() {
        let mut state = BehavioralState::new();
        let mut milestone_found = false;
        for _ in 0..10 {
            let alerts = record_attendance(&mut state, true);
            if alerts.iter().any(|a| a.event_type == "streak_milestone") {
                milestone_found = true;
            }
        }
        assert!(milestone_found, "10-day streak should trigger milestone alert");
    }
}
