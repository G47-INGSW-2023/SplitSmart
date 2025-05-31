use rocket_okapi::okapi::schemars::{self, JsonSchema};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, JsonSchema)]
pub struct Group {
    pub id: Option<usize>,
    pub name: String,
    pub description: String,
}
