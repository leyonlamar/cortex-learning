use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Domain {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub color: String,
    pub icon: Option<String>,
    pub sort_order: i32,
    pub is_custom: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Topic {
    pub id: String,
    pub domain_id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub slug: String,
    pub depth: i32,
    pub created_at: String,
}

/// Default domains to seed on first launch
pub fn default_domains() -> Vec<Domain> {
    vec![
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Data Science".into(),
            slug: "data-science".into(),
            color: "#6366f1".into(),
            icon: Some("brain".into()),
            sort_order: 0,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Engineering".into(),
            slug: "engineering".into(),
            color: "#f59e0b".into(),
            icon: Some("code".into()),
            sort_order: 1,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Business Intelligence".into(),
            slug: "bi".into(),
            color: "#10b981".into(),
            icon: Some("bar-chart-3".into()),
            sort_order: 2,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Logistics".into(),
            slug: "logistics".into(),
            color: "#3b82f6".into(),
            icon: Some("truck".into()),
            sort_order: 3,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Operations".into(),
            slug: "operations".into(),
            color: "#8b5cf6".into(),
            icon: Some("settings".into()),
            sort_order: 4,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Finance / Accounting".into(),
            slug: "finance".into(),
            color: "#ef4444".into(),
            icon: Some("dollar-sign".into()),
            sort_order: 5,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Database Systems".into(),
            slug: "database-systems".into(),
            color: "#0ea5e9".into(),
            icon: Some("database".into()),
            sort_order: 6,
            is_custom: false,
        },
        Domain {
            id: uuid::Uuid::new_v4().to_string(),
            name: "IT Architecture & Infrastructure".into(),
            slug: "it-architecture".into(),
            color: "#d946ef".into(),
            icon: Some("server".into()),
            sort_order: 7,
            is_custom: false,
        },
    ]
}

/// Default topics to seed for each domain.
/// Returns (domain_slug, topic_name, topic_slug) triples.
pub fn default_topics() -> Vec<(&'static str, &'static str, &'static str)> {
    vec![
        // ── Data Science ──────────────────────────────────────────────
        ("data-science", "Python for Data Science", "python-ds"),
        ("data-science", "Statistical Analysis", "statistics"),
        ("data-science", "Machine Learning Fundamentals", "ml-fundamentals"),
        ("data-science", "Data Visualization", "data-viz"),
        ("data-science", "Feature Engineering", "feature-engineering"),
        ("data-science", "Model Evaluation & Validation", "model-eval"),
        // ── Engineering ───────────────────────────────────────────────
        ("engineering", "Software Design Patterns", "design-patterns"),
        ("engineering", "API Design & REST", "api-design"),
        ("engineering", "Version Control & Git", "version-control"),
        ("engineering", "CI/CD Pipelines", "cicd"),
        ("engineering", "Code Quality & Testing", "code-quality"),
        ("engineering", "System Architecture", "system-arch"),
        // ── Business Intelligence ─────────────────────────────────────
        ("bi", "Dashboard Design", "dashboard-design"),
        ("bi", "KPI Definition & Metrics", "kpi-metrics"),
        ("bi", "ETL Processes", "etl"),
        ("bi", "Data Warehousing", "data-warehouse"),
        ("bi", "Report Automation", "report-automation"),
        ("bi", "Stakeholder Communication", "stakeholder-comm"),
        // ── Logistics ─────────────────────────────────────────────────
        ("logistics", "Supply Chain Optimization", "supply-chain"),
        ("logistics", "Inventory Management", "inventory-mgmt"),
        ("logistics", "Transportation Planning", "transport-plan"),
        ("logistics", "Warehouse Operations", "warehouse-ops"),
        ("logistics", "Demand Forecasting", "demand-forecast"),
        ("logistics", "Last-Mile Delivery", "last-mile"),
        // ── Operations ────────────────────────────────────────────────
        ("operations", "Process Improvement", "process-improve"),
        ("operations", "Lean & Six Sigma", "lean-six-sigma"),
        ("operations", "Project Management", "project-mgmt"),
        ("operations", "Resource Planning", "resource-plan"),
        ("operations", "Quality Assurance", "qa"),
        ("operations", "Change Management", "change-mgmt"),
        // ── Finance / Accounting ──────────────────────────────────────
        ("finance", "Financial Statements", "financial-stmts"),
        ("finance", "Cost Analysis", "cost-analysis"),
        ("finance", "Budgeting & Forecasting", "budgeting"),
        ("finance", "Internal Controls", "internal-controls"),
        ("finance", "Cash Flow Management", "cash-flow"),
        ("finance", "Financial Modeling", "financial-modeling"),
        // ── Database Systems ──────────────────────────────────────────
        ("database-systems", "SQL Fundamentals", "sql-fundamentals"),
        ("database-systems", "Database Design & Normalization", "db-design"),
        ("database-systems", "Query Optimization", "query-optimization"),
        ("database-systems", "Transactions & ACID", "transactions"),
        ("database-systems", "NoSQL Databases", "nosql"),
        ("database-systems", "Data Migration & ETL", "data-migration"),
        // ── IT Architecture & Infrastructure ──────────────────────────
        ("it-architecture", "Network Fundamentals", "networking"),
        ("it-architecture", "Cloud Computing", "cloud"),
        ("it-architecture", "Security & IAM", "security-iam"),
        ("it-architecture", "Containerization & Docker", "containers"),
        ("it-architecture", "Monitoring & Observability", "monitoring"),
        ("it-architecture", "Disaster Recovery & BCP", "disaster-recovery"),
    ]
}
