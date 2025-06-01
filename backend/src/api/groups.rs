use crate::{
    establish_connection,
    models::{self, Group},
};
use chrono::{NaiveDateTime, Utc};
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use rocket::{http::Status, serde::json::Json, State};
use rocket_okapi::{
    okapi::openapi3::OpenApi, openapi, openapi_get_routes_spec, settings::OpenApiSettings,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::schema::groups::dsl::*;

pub fn get_routes_and_docs(settings: &OpenApiSettings) -> (Vec<rocket::Route>, OpenApi) {
    openapi_get_routes_spec![settings:create_group, get_groups,get_group,update_group,delete_group]
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct NewGroup {
    pub name: String,
    pub description: Option<String>,
}

#[openapi(tag = "Groups")]
#[post("/", data = "<new_group>")]
fn create_group(new_group: Json<NewGroup>) -> Status {
    let mut conn = establish_connection();

    // Insert the `Group` into the database, returning the full `Group` (including generated id and creation_date)
    let result = diesel::insert_into(groups)
        .values((
            id.eq(None::<i32>),
            group_name.eq(new_group.name.clone()),
            desc.eq(new_group.description.clone()),
            creation_date.eq(diesel::dsl::now),
        ))
        .execute(&mut conn);

    match result {
        Ok(_) => Status::Ok,                   // Success, return HTTP 200 OK
        Err(_) => Status::InternalServerError, // Failure, return HTTP 500 Internal Server Error
    }
}

#[openapi(tag = "Groups")]
#[get("/")]
fn get_groups() -> Json<Vec<Group>> {
    let mut conn = establish_connection();

    let res_groups = groups.load::<Group>(&mut conn).expect("error");

    Json(res_groups)
}

#[openapi(tag = "Groups")]
#[get("/<gid>")]
fn get_group(gid: i32) -> Result<Json<Group>, Status> {
    let mut conn = establish_connection();

    let result = groups.filter(id.eq(gid)).first(&mut conn);

    match result {
        Ok(group) => Ok(Json(group)),
        Err(_) => Err(Status::NotFound),
    }
}

#[openapi(tag = "Groups")]
#[put("/<gid>", data = "<new_group>")]
fn update_group(gid: i32, new_group: Json<NewGroup>) -> Result<Status, Status> {
    let mut conn = establish_connection();
    // Attempt to find the group by `id`
    let group = groups.filter(id.eq(gid)).first::<Group>(&mut conn);

    match group {
        Ok(mut existing_group) => {
            existing_group.group_name = new_group.name.clone();
            existing_group.desc = new_group.description.clone();

            // Save the updated group back to the database
            diesel::update(groups.filter(id.eq(gid)))
                .set((
                    group_name.eq(existing_group.group_name),
                    desc.eq(existing_group.desc),
                ))
                .execute(&mut conn)
                .map_err(|_| Status::InternalServerError)?;

            Ok(Status::Ok) // Return 200 OK if successful
        }
        Err(_) => Err(Status::NotFound), // Return 404 if group doesn't exist
    }
}

#[openapi(tag = "Groups")]
#[delete("/<gid>")]
fn delete_group(gid: i32) -> Result<Status, Status> {
    let mut conn = establish_connection();

    // Attempt to delete the group by `id`
    let deleted_rows = diesel::delete(groups.filter(id.eq(gid)))
        .execute(&mut conn)
        .map_err(|_| Status::InternalServerError)?;

    if deleted_rows > 0 {
        Ok(Status::Ok) // Return 200 OK if deletion was successful
    } else {
        Err(Status::NotFound) // Return 404 if no group was found
    }
}
