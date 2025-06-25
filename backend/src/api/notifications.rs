use diesel::{result::Error, ExpressionMethods, QueryDsl, RunQueryDsl};
use rocket::{http::Status, serde::json::Json};
use rocket_okapi::{
    okapi::openapi3::OpenApi, openapi, openapi_get_routes_spec, settings::OpenApiSettings,
};

use crate::{
    establish_connection,
    models::{Notification, User},
    schema::notifications,
};

pub fn get_routes_and_docs(settings: &OpenApiSettings) -> (Vec<rocket::Route>, OpenApi) {
    openapi_get_routes_spec![settings:get_notifications]
}

#[openapi(tag = "Notifications")]
#[get("/")]
fn get_notifications(user: User) -> Result<Json<Vec<Notification>>, Status> {
    let mut conn = establish_connection();

    let res = notifications::table
        .filter(notifications::recipient_user_id.eq(user.id))
        .get_results::<Notification>(&mut conn);

    match res {
        Ok(v) => Ok(Json(v)),
        Err(Error::NotFound) => Ok(Json(Vec::new())),
        Err(e) => {
            error!("error running get notification: {}", e);
            Err(Status::InternalServerError)
        }
    }
}
