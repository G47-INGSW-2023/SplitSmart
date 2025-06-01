use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use crate::{
    establish_connection,
    models::{self, Group},
};
use diesel::RunQueryDsl;
use rocket::{serde::json::Json, State};
use rocket_okapi::{
    okapi::openapi3::OpenApi, openapi, openapi_get_routes_spec, settings::OpenApiSettings,
};

use crate::schema::groups::dsl::*;

pub fn get_routes_and_docs(settings: &OpenApiSettings) -> (Vec<rocket::Route>, OpenApi) {
    openapi_get_routes_spec![settings: get_groups]
}

#[openapi(tag = "Groups")]
#[get("/")]
fn get_groups() -> Json<Vec<Group>> {
    let mut conn = establish_connection();

    let res_groups = groups.load::<Group>(&mut conn).expect("error");

    Json(res_groups)
}
