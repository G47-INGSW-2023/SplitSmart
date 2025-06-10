use crate::{
    establish_connection,
    models::{self, Group, User},
    schema::group_members,
};
use chrono::{NaiveDateTime, Utc};
use diesel::{ExpressionMethods, Insertable, QueryDsl, RunQueryDsl};
use rocket::{http::Status, serde::json::Json, State};
use rocket_okapi::{
    okapi::openapi3::OpenApi, openapi, openapi_get_routes_spec, settings::OpenApiSettings,
};

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2, PasswordHash, PasswordVerifier,
};

use crate::schema::users::dsl::*;

use diesel::prelude::*;

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use rocket::{http::Cookie, http::CookieJar, post};

pub fn get_routes_and_docs(settings: &OpenApiSettings) -> (Vec<rocket::Route>, OpenApi) {
    openapi_get_routes_spec![settings:login,register]
}

//| registra(nome: String, email: String, password: String): void
//| login(email: String, password: String): boolean
//+ loginConGoogle(idGoogle: String, email: String, nome: String): boolean
//+ attivaAccount(tokenAttivazione: String): boolean
//+ richiediResetPassword(email: String): void
//+ resetPassword(tokenResetPassword: String, nuovaPassword: String): boolean
//+ logout(): void
//+ modificaProfilo(nuovoNome: String, nuovaEmail: String): boolean
//+ cambiaPassword(passwordCorrente: String, nuovaPassword: String): boolean
//+ aggiornaPreferenzeNotifiche(nuovePreferenze: PreferenzeNotifiche): void
//+ impostaLingua(codiceLingua: String): void
//+ creaGruppo(nomeGruppo: String, descrizioneGruppo: String): Gruppo
//+ visualizzaDashboard(): void
//+ visualizzaSaldiComplessivi(): void
//+ visualizzaStoricoTransazioni(filtri: Object): void

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[openapi(tag = "User")]
#[post("/login", data = "<login>")]
fn login(cookies: &CookieJar<'_>, login: Json<LoginRequest>) -> Status {
    let mut conn = establish_connection();

    let user = match users
        .filter(email.eq(&login.email))
        .first::<User>(&mut conn)
    {
        Ok(u) => u,
        Err(_) => return Status::Unauthorized,
    };

    let parsed_hash = match PasswordHash::new(&user.password_hash) {
        Ok(h) => h,
        Err(_) => return Status::InternalServerError,
    };

    if Argon2::default()
        .verify_password(login.password.as_bytes(), &parsed_hash)
        .is_ok()
    {
        cookies.add(Cookie::new("user_id", format!("{:?}", user.id)));
        Status::Ok
    } else {
        Status::Unauthorized
    }
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[openapi(tag = "User")]
#[post("/register", data = "<register_data>")]
pub fn register(register_data: Json<RegisterRequest>) -> Status {
    let mut conn = establish_connection();

    // Check if a user with the same email or username already exists
    let existing_user = users
        .filter(
            email
                .eq(register_data.email.clone())
                .or(username.eq(register_data.username.clone())),
        )
        .count()
        .get_result::<i64>(&mut conn);

    match existing_user {
        Ok(count) if count > 0 => {
            return Status::Conflict; // 409 Conflict
        }
        Err(_) => {
            return Status::InternalServerError;
        }
        _ => {} // User does not exist, proceed
    }

    // Hash the user's password securely with Argon2
    let salt = SaltString::generate(&mut OsRng);
    let hashed_pass =
        match Argon2::default().hash_password(register_data.password.as_bytes(), &salt) {
            Ok(hash) => hash.to_string(),
            Err(_) => return Status::InternalServerError,
        };

    // Insert the new user into the database and retrieve the created record
    match diesel::insert_into(users)
        .values((
            username.eq(register_data.username.clone()),
            email.eq(register_data.email.clone()),
            password_hash.eq(hashed_pass),
            registration_date.eq(Utc::now().naive_utc()),
            preferred_language.eq("it"),
            account_status.eq("active"),
        ))
        .execute(&mut conn)
    {
        Ok(_) => Status::Ok,
        Err(_) => Status::InternalServerError,
    }
}
