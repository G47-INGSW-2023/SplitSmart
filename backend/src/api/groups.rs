use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use crate::Group;
use rocket::{serde::json::Json, State};
use rocket_okapi::{
    okapi::openapi3::OpenApi, openapi, openapi_get_routes_spec, settings::OpenApiSettings,
};

pub fn get_routes_and_docs(settings: &OpenApiSettings) -> (Vec<rocket::Route>, OpenApi) {
    openapi_get_routes_spec![settings: get_group_by_id]
}

#[openapi(tag = "Groups")]
#[get("/<id>")]
fn get_group_by_id(id: usize) -> Option<Json<Group>> {
    None
}

//pub fn routes() -> Vec<rocket::Route> {
//    routes![get_group_by_id]
//}
