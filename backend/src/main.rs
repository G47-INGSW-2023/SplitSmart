#[macro_use]
extern crate rocket;

use rocket::serde::{json::Json, Deserialize};
use serde::Serialize;

#[derive(Deserialize, Serialize)]
struct Item {
    id: i32,
    name: String,
}

#[get("/api/items")]
fn get_items() -> Json<Vec<Item>> {
    let items = vec![
        Item {
            id: 1,
            name: "Item 1".to_string(),
        },
        Item {
            id: 2,
            name: "Item 2".to_string(),
        },
    ];
    Json(items) // Return the items as JSON
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![get_items])
}
