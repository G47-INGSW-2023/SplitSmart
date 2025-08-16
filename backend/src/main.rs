#[macro_use]
extern crate rocket;

use diesel::prelude::*;
use rocket_cors::CorsOptions;
use rocket_okapi::okapi::openapi3::OpenApi;
use rocket_okapi::{mount_endpoints_and_merged_docs, swagger_ui::*};
use std::collections::HashMap;
use std::sync::Mutex;

mod api;
mod models;
mod schema;

use dotenvy::dotenv;
use std::env;

pub fn establish_connection() -> SqliteConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}

pub struct SessionStore {
    pub sessions: Mutex<HashMap<String, i32>>,
}

impl SessionStore {
    fn new() -> Self {
        SessionStore {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

#[launch]
fn rocket() -> _ {
    let cors = CorsOptions::default()
        .to_cors()
        .expect("error creating CORS fairing");

    let mut building_rocket = rocket::build()
        .manage(SessionStore::new())
        .attach(cors)
        .mount(
            "/swagger-ui/",
            make_swagger_ui(&SwaggerUIConfig {
                url: "../openapi.json".to_owned(),
                ..Default::default()
            }),
        );

    let openapi_settings = rocket_okapi::settings::OpenApiSettings::default();
    let custom_route_spec = (vec![], custom_openapi_spec());
    mount_endpoints_and_merged_docs! {
        building_rocket, "/".to_owned(), openapi_settings,
        "/external" => custom_route_spec,
        //"/post" => post::get_routes_and_docs(&openapi_settings),
        "/groups" => api::groups::get_routes_and_docs(&openapi_settings),
        "/user" => api::users::get_routes_and_docs(&openapi_settings),
        "/notifications" => api::notifications::get_routes_and_docs(&openapi_settings),
        "/friends" => api::friends::get_routes_and_docs(&openapi_settings),
    };

    building_rocket
}

fn custom_openapi_spec() -> OpenApi {
    use rocket_okapi::okapi::map;
    use rocket_okapi::okapi::openapi3::*;
    use rocket_okapi::okapi::schemars::schema::*;
    OpenApi {
        openapi: OpenApi::default_version(),
        info: Info {
            title: "SplitSmart API".to_owned(),
            description: Some("API doc for the SplitSmart app".to_owned()),
            terms_of_service: Some("----".to_owned()),
            contact: Some(Contact {
                name: Some("okapi example".to_owned()),
                url: Some("https://github.com/GREsau/okapi".to_owned()),
                email: None,
                ..Default::default()
            }),
            license: Some(License {
                name: "MIT".to_owned(),
                url: Some("https://github.com/GREsau/okapi/blob/master/LICENSE".to_owned()),
                ..Default::default()
            }),
            version: env!("CARGO_PKG_VERSION").to_owned(),
            ..Default::default()
        },
        servers: vec![
            Server {
                url: "http://127.0.0.1:8000/".to_owned(),
                description: Some("Localhost".to_owned()),
                ..Default::default()
            },
            Server {
                url: "https://example.com/".to_owned(),
                description: Some("Possible Remote".to_owned()),
                ..Default::default()
            },
        ],
        // Add paths that do not exist in Rocket (or add extra info to existing paths)
        paths: {
            map! {
                "/home".to_owned() => PathItem{
                get: Some(
                    Operation {
                    tags: vec!["HomePage".to_owned()],
                    summary: Some("This is my homepage".to_owned()),
                    responses: Responses{
                        responses: map!{
                        "200".to_owned() => RefOr::Object(
                            Response{
                            description: "Return the page, no error.".to_owned(),
                            content: map!{
                                "text/html".to_owned() => MediaType{
                                schema: Some(SchemaObject{
                                    instance_type: Some(SingleOrVec::Single(Box::new(
                                        InstanceType::String
                                    ))),
                                    ..Default::default()
                                }),
                                ..Default::default()
                                }
                            },
                            ..Default::default()
                            }
                        )
                        },
                        ..Default::default()
                    },
                    ..Default::default()
                    }
                ),
                ..Default::default()
                }
            }
        },
        ..Default::default()
    }
}
