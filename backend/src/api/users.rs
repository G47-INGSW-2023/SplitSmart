use crate::{
    establish_connection,
    models::{GroupInvite, GroupMember, User},
    schema::{group_invites, group_members},
    SessionStore,
};
use chrono::Utc;
use diesel::{result::Error::NotFound, ExpressionMethods, Insertable, QueryDsl, RunQueryDsl};
use rocket::{http::Status, serde::json::Json, time::Duration};
use rocket_okapi::{
    okapi::openapi3::OpenApi, openapi, openapi_get_routes_spec, settings::OpenApiSettings,
};

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2, PasswordHash, PasswordVerifier,
};
use uuid::Uuid;

use crate::schema::users::dsl::*;

use diesel::prelude::*;

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use rocket::{http::Cookie, http::CookieJar, post};

pub fn get_routes_and_docs(settings: &OpenApiSettings) -> (Vec<rocket::Route>, OpenApi) {
    openapi_get_routes_spec![settings:login,logout,register,view_invites,accept_invite,reject_invite]
}

//| registra(nome: String, email: String, password: String): void
//| login(email: String, password: String): boolean
//+ loginConGoogle(idGoogle: String, email: String, nome: String): boolean
//+ attivaAccount(tokenAttivazione: String): boolean
//+ richiediResetPassword(email: String): void
//+ resetPassword(tokenResetPassword: String, nuovaPassword: String): boolean
//| logout(): void
//+ modificaProfilo(nuovoNome: String, nuovaEmail: String): boolean
//+ cambiaPassword(passwordCorrente: String, nuovaPassword: String): boolean
//+ aggiornaPreferenzeNotifiche(nuovePreferenze: PreferenzeNotifiche): void
//+ impostaLingua(codiceLingua: String): void
//+ visualizzaDashboard(): void
//+ visualizzaSaldiComplessivi(): void
//+ visualizzaStoricoTransazioni(filtri: Object): void
//
// will not implement (here):
//| creaGruppo(nomeGruppo: String, descrizioneGruppo: String): Gruppo

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[openapi(tag = "User")]
#[post("/login", data = "<login>")]
fn login(
    jar: &CookieJar<'_>,
    login: Json<LoginRequest>,
    store: &rocket::State<SessionStore>,
) -> Status {
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
        let uuid = Uuid::new_v4();

        let mut store = store.sessions.lock().unwrap();
        store.insert(uuid.to_string(), user.id);
        jar.add(
            Cookie::build(("session_id", uuid.to_string()))
                .same_site(rocket::http::SameSite::Strict)
                .http_only(true)
                .max_age(Duration::days(30)), //TODO .secure(true)
        );
        Status::Ok
    } else {
        Status::Unauthorized
    }
}

#[openapi(tag = "User")]
#[post("/logout")]
fn logout(jar: &CookieJar<'_>, store: &rocket::State<SessionStore>) -> Status {
    match jar.get("session_id") {
        Some(cookie) => {
            let mut store = store.sessions.lock().unwrap();
            store.remove(cookie.name());
            jar.remove("session_id");
            Status::Ok
        }
        None => Status::NotAcceptable,
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
            error!("requested user registration but user already exists");
            return Status::Conflict; // 409 Conflict
        }
        Err(_) => {
            error!("internal error when searching for existing user in register request");
            return Status::InternalServerError;
        }
        _ => {} // User does not exist, proceed
    }

    // Hash the user's password securely with Argon2
    let salt = SaltString::generate(&mut OsRng);
    let hashed_pass =
        match Argon2::default().hash_password(register_data.password.as_bytes(), &salt) {
            Ok(hash) => hash.to_string(),
            Err(_) => {
                error!("error hashing password when registering user");
                return Status::InternalServerError;
            }
        };

    match diesel::insert_into(users)
        .values((
            username.eq(register_data.username.clone()),
            email.eq(register_data.email.clone()),
            password_hash.eq(hashed_pass),
            registration_date.eq(Utc::now().naive_utc()),
            preferred_language.eq("it"),
            account_status.eq("ACTIVE"),
        ))
        .execute(&mut conn)
    {
        Ok(_) => Status::Ok,
        Err(e) => {
            error!("could not add user to database when registering: {}", e);
            Status::InternalServerError
        }
    }
}

// INVITES

// view all invites, regardless of status, about the user making the request
#[openapi(tag = "User")]
#[get("/invites")]
fn view_invites(user: User) -> Result<Json<Vec<GroupInvite>>, Status> {
    let mut conn = establish_connection();

    match group_invites::table
        .filter(group_invites::invited_user_id.eq(user.id))
        .get_results::<GroupInvite>(&mut conn)
    {
        Ok(v) => Ok(Json(v)),
        Err(_) => Err(Status::InternalServerError),
    }
}

// accept invite with given id, requires the user to be the one that received the invite
#[openapi(tag = "User")]
#[put("/invites/<invite_id>/accept")]
fn accept_invite(user: User, invite_id: i32) -> Result<Json<GroupInvite>, Status> {
    let mut conn = establish_connection();

    // try to update the single affected group invite and mark it as accepted
    let invite = match diesel::update(
        group_invites::table
            // find the unique group_invite
            .filter(group_invites::id.eq(invite_id))
            // check that it's invite to the current user
            .filter(group_invites::invited_user_id.eq(user.id)),
    )
    .set(group_invites::invite_status.eq("ACCEPTED"))
    .get_result::<GroupInvite>(&mut conn)
    {
        Ok(v) => v,
        Err(NotFound) => return Err(Status::NotFound),
        Err(_) => return Err(Status::InternalServerError),
    };

    match (
        group_members::group_id.eq(invite.group_id),
        group_members::user_id.eq(user.id),
    )
        .insert_into(group_members::table)
        .execute(&mut conn)
    {
        Ok(_) => Ok(Json(invite)),
        Err(_) => Err(Status::InternalServerError),
    }
}

// reject invite with given id, requires the user to be the one that received the invite
#[openapi(tag = "User")]
#[put("/invites/<invite_id>/reject")]
fn reject_invite(user: User, invite_id: i32) -> Result<Json<GroupInvite>, Status> {
    let mut conn = establish_connection();

    // try to update the single affected group invite and mark it as accepted
    match diesel::update(
        group_invites::table
            // find the unique group_invite
            .filter(group_invites::id.eq(invite_id))
            // check that it's invite to the current user
            .filter(group_invites::invited_user_id.eq(user.id)),
    )
    .set(group_invites::invite_status.eq("REJECTED"))
    .get_result::<GroupInvite>(&mut conn)
    {
        Ok(v) => Ok(Json(v)),
        Err(NotFound) => Err(Status::NotFound),
        Err(_) => Err(Status::InternalServerError),
    }
}
