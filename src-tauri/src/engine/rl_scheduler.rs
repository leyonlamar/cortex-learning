use rand::prelude::*;
use crate::models::forecast::{Emphasis, TimeAllocation, DailyPlan};

/// RL state representing the learner's current context.
#[derive(Debug, Clone)]
pub struct RlState {
    pub current_week: u32,
    pub attendance_streak: u32,
    pub fatigue_proxy: f64,
    pub review_backlog_size: u32,
    pub quiz_trend: f64,
}

/// Available actions the scheduler can recommend.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Action {
    NewMaterial,
    ReviewHeavy,
    QuizPrep,
    Balanced,
}

impl Action {
    fn all() -> &'static [Action] {
        &[Action::NewMaterial, Action::ReviewHeavy, Action::QuizPrep, Action::Balanced]
    }

    fn to_emphasis(self) -> Emphasis {
        match self {
            Action::NewMaterial => Emphasis::NewMaterial,
            Action::ReviewHeavy => Emphasis::ReviewHeavy,
            Action::QuizPrep => Emphasis::QuizPrep,
            Action::Balanced => Emphasis::Balanced,
        }
    }
}

/// Score each action given the current state.
fn action_scores(state: &RlState) -> Vec<(Action, f64)> {
    let mut scores = Vec::new();

    for &action in Action::all() {
        let score = match action {
            Action::NewMaterial => {
                let base = 0.5;
                let fatigue_penalty = state.fatigue_proxy * 0.3;
                let backlog_penalty = (state.review_backlog_size as f64 * 0.02).min(0.3);
                base - fatigue_penalty - backlog_penalty
            }
            Action::ReviewHeavy => {
                let base = 0.3;
                let backlog_bonus = (state.review_backlog_size as f64 * 0.04).min(0.5);
                base + backlog_bonus
            }
            Action::QuizPrep => {
                let base = 0.2;
                // Boost if quiz trend is declining
                let trend_bonus = if state.quiz_trend < -0.05 { 0.4 } else { 0.0 };
                // Boost on Fridays (day 5 of week)
                base + trend_bonus
            }
            Action::Balanced => {
                0.4 // Steady baseline
            }
        };
        scores.push((action, score));
    }

    scores
}

/// Select an action using epsilon-greedy strategy.
/// epsilon = 0.1 means 10% random exploration.
pub fn select_action(state: &RlState, epsilon: f64, seed: Option<u64>) -> Action {
    let mut rng: Box<dyn RngCore> = match seed {
        Some(s) => Box::new(rand::rngs::StdRng::seed_from_u64(s)),
        None => Box::new(rand::rngs::StdRng::from_entropy()),
    };

    let explore: f64 = rng.gen();
    if explore < epsilon {
        let actions = Action::all();
        let idx = rng.gen_range(0..actions.len());
        return actions[idx];
    }

    let scores = action_scores(state);
    scores
        .into_iter()
        .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
        .map(|(action, _)| action)
        .unwrap_or(Action::Balanced)
}

/// Generate a daily plan based on the selected action.
/// Total time is capped at 60 minutes.
pub fn generate_plan(action: Action, topic_ids: Vec<String>) -> DailyPlan {
    let total_min: u32 = 60;

    let allocation = match action {
        Action::NewMaterial => TimeAllocation {
            retrieval_min: 5,
            new_learning_min: 30,
            micro_task_min: 15,
            reflection_min: 10,
        },
        Action::ReviewHeavy => TimeAllocation {
            retrieval_min: 20,
            new_learning_min: 10,
            micro_task_min: 20,
            reflection_min: 10,
        },
        Action::QuizPrep => TimeAllocation {
            retrieval_min: 15,
            new_learning_min: 5,
            micro_task_min: 25,
            reflection_min: 15,
        },
        Action::Balanced => TimeAllocation {
            retrieval_min: 15,
            new_learning_min: 15,
            micro_task_min: 15,
            reflection_min: 15,
        },
    };

    let actual_total = allocation.retrieval_min
        + allocation.new_learning_min
        + allocation.micro_task_min
        + allocation.reflection_min;
    assert_eq!(actual_total, total_min, "Plan must sum to 60 minutes");

    let rationale = match action {
        Action::NewMaterial => "Focus on new learning — low fatigue, backlog is manageable".into(),
        Action::ReviewHeavy => "Review-heavy day — backlog needs attention".into(),
        Action::QuizPrep => "Quiz prep mode — strengthen weak areas before assessment".into(),
        Action::Balanced => "Balanced session — steady progress across all phases".into(),
    };

    DailyPlan {
        time_allocation: allocation,
        topic_ids,
        emphasis: action.to_emphasis(),
        rationale,
    }
}

/// Compute reward from session outcome for RL learning.
pub fn compute_reward(
    retrieval_score: f64,
    time_spent_min: u32,
    energy_level: i32,
) -> f64 {
    let score_component = retrieval_score * 0.5;
    let efficiency = if time_spent_min > 0 {
        (retrieval_score / (time_spent_min as f64 / 60.0)).min(1.0) * 0.3
    } else {
        0.0
    };
    let energy_component = (energy_level as f64 / 5.0) * 0.2;
    score_component + efficiency + energy_component
}

#[cfg(test)]
mod tests {
    use super::*;

    fn default_state() -> RlState {
        RlState {
            current_week: 5,
            attendance_streak: 10,
            fatigue_proxy: 0.3,
            review_backlog_size: 5,
            quiz_trend: 0.02,
        }
    }

    #[test]
    fn test_plan_sums_to_60_minutes() {
        for &action in Action::all() {
            let plan = generate_plan(action, vec!["t1".into()]);
            let total = plan.time_allocation.retrieval_min
                + plan.time_allocation.new_learning_min
                + plan.time_allocation.micro_task_min
                + plan.time_allocation.reflection_min;
            assert_eq!(total, 60, "Plan for {:?} should sum to 60 min", action);
        }
    }

    #[test]
    fn test_all_phases_have_minimum_time() {
        for &action in Action::all() {
            let plan = generate_plan(action, vec![]);
            assert!(plan.time_allocation.retrieval_min >= 5, "Retrieval needs >= 5 min");
            assert!(plan.time_allocation.new_learning_min >= 5, "Learning needs >= 5 min");
            assert!(plan.time_allocation.micro_task_min >= 15, "Micro-task needs >= 15 min");
            assert!(plan.time_allocation.reflection_min >= 10, "Reflection needs >= 10 min");
        }
    }

    #[test]
    fn test_high_backlog_favors_review() {
        let mut state = default_state();
        state.review_backlog_size = 20;
        state.fatigue_proxy = 0.0;
        let action = select_action(&state, 0.0, Some(42));
        assert_eq!(action, Action::ReviewHeavy, "High backlog should select ReviewHeavy");
    }

    #[test]
    fn test_declining_quiz_trend_favors_prep() {
        let mut state = default_state();
        state.quiz_trend = -0.15;
        state.review_backlog_size = 0;
        state.fatigue_proxy = 0.0;
        let action = select_action(&state, 0.0, Some(42));
        assert_eq!(action, Action::QuizPrep, "Declining quiz trend should select QuizPrep");
    }

    #[test]
    fn test_epsilon_greedy_sometimes_explores() {
        let state = default_state();
        let mut actions_seen = std::collections::HashSet::new();
        for seed in 0..200 {
            let action = select_action(&state, 0.5, Some(seed));
            actions_seen.insert(format!("{:?}", action));
        }
        assert!(
            actions_seen.len() > 1,
            "With epsilon=0.5, should see multiple actions"
        );
    }

    #[test]
    fn test_reward_computation() {
        let reward = compute_reward(0.8, 45, 4);
        assert!(reward > 0.0, "Reward should be positive for good session");
        assert!(reward <= 1.0, "Reward should not exceed 1.0");
    }

    #[test]
    fn test_burnout_state_avoids_new_material() {
        let state = RlState {
            current_week: 10,
            attendance_streak: 20,
            fatigue_proxy: 0.9,
            review_backlog_size: 15,
            quiz_trend: -0.1,
        };
        let action = select_action(&state, 0.0, Some(42));
        assert_ne!(
            action,
            Action::NewMaterial,
            "High fatigue + backlog should NOT select NewMaterial"
        );
    }
}
