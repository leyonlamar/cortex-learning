use chrono::{Datelike, NaiveDate, Weekday};
use crate::models::session::{Week, Session, SessionStatus, Milestone};

/// Return a learning objective for the given week number (1-43).
pub fn get_week_objective(week_number: u32) -> Option<String> {
    let objective = match week_number {
        // Weeks 1-5: Foundations across all domains
        1 => "Orient yourself to all 8 domains: read introductory overviews of Data Science, Engineering, Business Intelligence, Logistics, Operations, Finance/Accounting, Database Systems, and IT Architecture. Set up your learning environment and tools.",
        2 => "Explore foundational concepts in data: understand the difference between structured and unstructured data, basic statistics (mean, median, variance), and why data quality matters across every domain.",
        3 => "Study core engineering principles: version control with Git, software development lifecycles, and the distinction between frontend, backend, and infrastructure concerns.",
        4 => "Introduce yourself to business and financial fundamentals: understand income statements, balance sheets, KPIs, and how business decisions are evaluated against financial outcomes.",
        5 => "Survey logistics and operations fundamentals: learn what supply chains are, how operational processes are designed, and why efficiency metrics like throughput and utilization matter.",

        // Weeks 6-10: Data Science & Database Systems deep dive
        6 => "Deep dive into the data science workflow: from raw data collection to exploratory data analysis (EDA). Practice loading datasets, computing summary statistics, and visualizing distributions.",
        7 => "Study supervised machine learning concepts: understand regression vs. classification, training/validation/test splits, and the bias-variance tradeoff. Implement a simple linear regression model.",
        8 => "Explore unsupervised learning and clustering: understand k-means and hierarchical clustering, dimensionality reduction with PCA, and when to apply each technique.",
        9 => "Master relational database fundamentals: understand normalization (1NF–3NF), entity-relationship diagrams, and write intermediate SQL queries including JOINs, GROUP BY, and subqueries.",
        10 => "Study advanced database topics: transactions and ACID properties, indexing strategies for query performance, and an introduction to NoSQL databases and when they outperform relational models.",

        // Weeks 11-15: Engineering & IT Architecture deep dive
        11 => "Learn software design patterns: study creational, structural, and behavioral patterns (Factory, Singleton, Observer, Strategy). Apply at least two patterns in a small coding exercise.",
        12 => "Study API design and integration: understand REST principles, HTTP methods and status codes, authentication patterns (API keys, OAuth), and consume a public API in a language of your choice.",
        13 => "Explore cloud computing fundamentals: understand IaaS, PaaS, and SaaS distinctions, major cloud providers (AWS, Azure, GCP), and core services like compute, storage, and managed databases.",
        14 => "Study IT architecture patterns: monolithic vs. microservices architectures, event-driven design, and the CAP theorem. Draw an architecture diagram for a fictional e-commerce system.",
        15 => "Learn DevOps and CI/CD principles: understand containerization with Docker, orchestration concepts with Kubernetes, and set up a simple CI pipeline that builds and tests on every commit.",

        // Weeks 16-20: Business Intelligence & Finance deep dive
        16 => "Master data warehousing concepts: understand star and snowflake schemas, the difference between OLTP and OLAP, and how ETL pipelines move data from operational systems into a warehouse.",
        17 => "Study BI tooling and dashboarding: learn the principles of effective data visualization, build a dashboard in a tool of your choice (Power BI, Tableau, or similar), and critique an existing dashboard for clarity.",
        18 => "Deep dive into financial accounting: understand double-entry bookkeeping, the accounting equation, and how to read and interpret a full set of financial statements including cash flow statements.",
        19 => "Explore managerial finance and budgeting: learn cost-volume-profit analysis, break-even analysis, variance analysis, and how organizations create and monitor operating budgets.",
        20 => "Study financial modeling and forecasting: build a simple 3-statement financial model in a spreadsheet, understand scenario analysis, and learn how discounted cash flow (DCF) valuation works.",

        // Weeks 21-25: Logistics & Operations deep dive
        21 => "Deep dive into supply chain management: study demand forecasting techniques, inventory models (EOQ, safety stock), and the bullwhip effect. Map the supply chain of a real product.",
        22 => "Learn procurement and sourcing strategy: understand vendor selection criteria, total cost of ownership, contract types, and supplier relationship management best practices.",
        23 => "Study operations management and process improvement: apply Lean principles (value stream mapping, waste identification) and Six Sigma DMAIC methodology to a process of your choice.",
        24 => "Explore warehouse management and distribution: understand warehouse layout optimization, pick-and-pack operations, routing algorithms, and last-mile delivery challenges.",
        25 => "Learn project management essentials within operations: study work breakdown structures, Gantt charts, critical path method (CPM), and agile vs. waterfall project delivery.",

        // Weeks 26-30: Cross-domain integration projects
        26 => "Begin a cross-domain integration project: design a data pipeline that ingests operational or logistics data, stores it in a relational database, and exposes it via a REST API. Document your architecture decisions.",
        27 => "Extend your integration project with analytics: connect your data pipeline output to a BI dashboard, define at least three KPIs relevant to the data domain, and write a short analytical narrative.",
        28 => "Add a financial layer to your integration project: model the cost and revenue implications of the operational data you are analyzing, and build a simple P&L projection based on the trends you observe.",
        29 => "Incorporate IT architecture best practices into your project: add authentication, logging, error handling, and a basic deployment pipeline. Review your architecture against the patterns studied in weeks 11-15.",
        30 => "Complete and present your cross-domain integration project: write a one-page executive summary, prepare a technical architecture overview, and record a short walkthrough demo for peer review.",

        // Weeks 31-35: Advanced topics & specialization
        31 => "Study advanced machine learning: explore ensemble methods (Random Forest, Gradient Boosting), model evaluation metrics beyond accuracy (F1, AUC-ROC), and techniques to handle class imbalance.",
        32 => "Deep dive into advanced SQL and database performance: study query execution plans, window functions, CTEs, materialized views, and partitioning strategies for large tables.",
        33 => "Explore advanced IT architecture: study distributed systems concepts (consensus algorithms, eventual consistency, sharding), and design a fault-tolerant architecture for a high-availability system.",
        34 => "Study advanced BI and analytics engineering: learn dbt (data build tool) or a similar transformation framework, understand data lineage, and implement a medallion architecture (bronze/silver/gold layers).",
        35 => "Explore advanced finance topics: study options and derivatives basics, working capital management, and how to perform a ratio analysis to benchmark a company against industry peers.",

        // Weeks 36-40: Synthesis & capstone preparation
        36 => "Begin capstone project scoping: identify a real-world problem that spans at least three of your eight domains. Write a project brief with a problem statement, proposed solution, success metrics, and data requirements.",
        37 => "Build the data foundation for your capstone: collect or synthesize a dataset, design your database schema, implement your ETL pipeline, and validate data quality with automated checks.",
        38 => "Develop the analytical and financial components of your capstone: run your ML models or statistical analyses, build your financial model or cost analysis, and document key findings with supporting visualizations.",
        39 => "Build the engineering and architecture layer of your capstone: package your solution as a deployable application or service, implement proper logging and monitoring, and write technical documentation.",
        40 => "Integrate and polish your capstone: ensure all domain components connect cohesively, build the final dashboard or report, perform end-to-end testing, and prepare your presentation materials.",

        // Weeks 41-43: Review, assessment & wrap-up
        41 => "Conduct a comprehensive self-assessment across all 8 domains: revisit the objectives from weeks 1-40, identify knowledge gaps, and dedicate focused review sessions to your three weakest areas.",
        42 => "Present your capstone project: deliver a structured presentation covering problem context, methodology, findings, and recommendations. Gather feedback and document lessons learned for each domain.",
        43 => "Reflect and plan forward: write a personal learning retrospective summarizing your growth across all 8 domains, define three concrete next-step goals for 2027, and archive your portfolio of work.",

        _ => return None,
    };
    Some(objective.to_string())
}

/// Generate all 43 weeks with 215 session slots for the program.
pub fn generate_calendar(
    start: NaiveDate,
    end: NaiveDate,
) -> (Vec<Week>, Vec<Session>, Vec<Milestone>) {
    let mut weeks = Vec::new();
    let mut sessions = Vec::new();
    let mut current = start;
    let mut week_num: u32 = 1;
    let mut session_count: u32 = 0;

    while current <= end {
        let monday = if current.weekday() == Weekday::Mon {
            current
        } else {
            current = current + chrono::Duration::days(
                (7 - current.weekday().num_days_from_monday() as i64) % 7,
            );
            if current > end {
                break;
            }
            current
        };

        let friday = monday + chrono::Duration::days(4);
        let week_id = format!("W{:02}", week_num);

        weeks.push(Week {
            id: week_id.clone(),
            week_num,
            start_date: monday.format("%Y-%m-%d").to_string(),
            end_date: friday.format("%Y-%m-%d").to_string(),
            objective: get_week_objective(week_num),
            status: "upcoming".to_string(),
        });

        for day_offset in 0..5 {
            let date = monday + chrono::Duration::days(day_offset);
            if date > end {
                break;
            }
            session_count += 1;
            let day_of_week = (day_offset + 1) as u8;

            sessions.push(Session {
                id: format!("S{:03}", session_count),
                week_id: week_id.clone(),
                date: date.format("%Y-%m-%d").to_string(),
                day_of_week,
                status: SessionStatus::Scheduled,
                rescheduled_to: None,
                topics_json: None,
                tags_json: None,
                time_spent_min: None,
                retrieval_score: None,
                confidence: None,
                energy_level: None,
                notes: None,
                completed_at: None,
            });
        }

        week_num += 1;
        current = monday + chrono::Duration::days(7);
    }

    let total_weeks = weeks.len() as u32;
    let milestones = vec![
        Milestone {
            label: "25%".to_string(),
            percent: 25,
            week_id: format!("W{:02}", (total_weeks as f64 * 0.25).ceil() as u32),
            reached: false,
        },
        Milestone {
            label: "50%".to_string(),
            percent: 50,
            week_id: format!("W{:02}", (total_weeks as f64 * 0.50).ceil() as u32),
            reached: false,
        },
        Milestone {
            label: "75%".to_string(),
            percent: 75,
            week_id: format!("W{:02}", (total_weeks as f64 * 0.75).ceil() as u32),
            reached: false,
        },
        Milestone {
            label: "100%".to_string(),
            percent: 100,
            week_id: format!("W{:02}", total_weeks),
            reached: false,
        },
    ];

    (weeks, sessions, milestones)
}

/// Reschedule a missed session to the next available weekday.
/// Returns the new date, or None if no weekday is available before end.
pub fn find_next_available_weekday(
    from_date: NaiveDate,
    booked_dates: &[NaiveDate],
    end: NaiveDate,
) -> Option<NaiveDate> {
    let mut candidate = from_date + chrono::Duration::days(1);
    while candidate <= end {
        let is_weekday = matches!(
            candidate.weekday(),
            Weekday::Mon | Weekday::Tue | Weekday::Wed | Weekday::Thu
        );
        if is_weekday && !booked_dates.contains(&candidate) {
            return Some(candidate);
        }
        candidate = candidate + chrono::Duration::days(1);
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn program_start() -> NaiveDate {
        NaiveDate::from_ymd_opt(2026, 3, 2).unwrap()
    }

    fn program_end() -> NaiveDate {
        NaiveDate::from_ymd_opt(2026, 12, 25).unwrap()
    }

    #[test]
    fn test_generates_43_weeks() {
        let (weeks, _, _) = generate_calendar(program_start(), program_end());
        assert_eq!(weeks.len(), 43, "Expected 43 weeks");
    }

    #[test]
    fn test_generates_215_sessions() {
        let (_, sessions, _) = generate_calendar(program_start(), program_end());
        assert_eq!(sessions.len(), 215, "Expected 215 sessions");
    }

    #[test]
    fn test_first_week_starts_march_2() {
        let (weeks, _, _) = generate_calendar(program_start(), program_end());
        assert_eq!(weeks[0].id, "W01");
        assert_eq!(weeks[0].start_date, "2026-03-02");
    }

    #[test]
    fn test_all_sessions_are_weekdays() {
        let (_, sessions, _) = generate_calendar(program_start(), program_end());
        for session in &sessions {
            let date = NaiveDate::parse_from_str(&session.date, "%Y-%m-%d").unwrap();
            assert!(
                matches!(
                    date.weekday(),
                    Weekday::Mon | Weekday::Tue | Weekday::Wed | Weekday::Thu | Weekday::Fri
                ),
                "Session date {} is not a weekday",
                session.date
            );
        }
    }

    #[test]
    fn test_no_weekend_dates() {
        let (_, sessions, _) = generate_calendar(program_start(), program_end());
        for session in &sessions {
            let date = NaiveDate::parse_from_str(&session.date, "%Y-%m-%d").unwrap();
            assert_ne!(date.weekday(), Weekday::Sat, "Found Saturday: {}", session.date);
            assert_ne!(date.weekday(), Weekday::Sun, "Found Sunday: {}", session.date);
        }
    }

    #[test]
    fn test_milestones_at_correct_positions() {
        let (_, _, milestones) = generate_calendar(program_start(), program_end());
        assert_eq!(milestones.len(), 4);
        assert_eq!(milestones[0].percent, 25);
        assert_eq!(milestones[1].percent, 50);
        assert_eq!(milestones[2].percent, 75);
        assert_eq!(milestones[3].percent, 100);
        assert_eq!(milestones[3].week_id, "W43");
    }

    #[test]
    fn test_find_next_available_weekday_skips_booked() {
        let from = NaiveDate::from_ymd_opt(2026, 3, 2).unwrap();
        let booked = vec![
            NaiveDate::from_ymd_opt(2026, 3, 3).unwrap(),
        ];
        let end = NaiveDate::from_ymd_opt(2026, 12, 25).unwrap();
        let result = find_next_available_weekday(from, &booked, end);
        assert_eq!(
            result,
            Some(NaiveDate::from_ymd_opt(2026, 3, 4).unwrap())
        );
    }

    #[test]
    fn test_find_next_available_weekday_skips_friday() {
        let from = NaiveDate::from_ymd_opt(2026, 3, 4).unwrap();
        let booked = vec![
            NaiveDate::from_ymd_opt(2026, 3, 5).unwrap(),
        ];
        let end = NaiveDate::from_ymd_opt(2026, 3, 6).unwrap();
        let result = find_next_available_weekday(from, &booked, end);
        assert_eq!(result, None);
    }
}
