#![allow(dead_code)]
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    #[serde(rename = "glass")]
    Glass,
    #[serde(rename = "executive")]
    Executive,
    #[serde(rename = "brutalist")]
    Brutalist,
    #[serde(rename = "console")]
    Console,
}

impl Theme {
    pub fn as_str(&self) -> &'static str {
        match self {
            Theme::Glass => "glass",
            Theme::Executive => "executive",
            Theme::Brutalist => "brutalist",
            Theme::Console => "console",
        }
    }
}

impl Default for Theme {
    fn default() -> Self {
        Theme::Glass
    }
}

impl std::str::FromStr for Theme {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "glass" => Ok(Theme::Glass),
            "executive" => Ok(Theme::Executive),
            "brutalist" => Ok(Theme::Brutalist),
            "console" => Ok(Theme::Console),
            _ => Err(format!("Unknown theme: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub avatar_seed: Option<String>,
    pub theme: Theme,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSummary {
    pub id: String,
    pub name: String,
    pub theme: Theme,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UserUpdate {
    pub name: Option<String>,
    pub email: Option<String>,
    pub avatar_seed: Option<String>,
}
