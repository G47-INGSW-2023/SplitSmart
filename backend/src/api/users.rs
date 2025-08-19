use crate::{
    establish_connection,
    models::{GroupInvite, User},
    schema::{group_invites, group_members},
    SessionStore,
};
use chrono::{NaiveDateTime, Utc};
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
    openapi_get_routes_spec![settings:login,logout,register,view_invites,accept_invite,reject_invite,user_info,set_language,activate_account,reset_password_request,reset_password]
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

//#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[derive(Queryable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub struct UserInfo {
    username: String,
    email: String,
    registration_date: NaiveDateTime,
    last_login: Option<NaiveDateTime>,
}

#[openapi(tag = "User")]
#[get("/<uid>")]
fn user_info(uid: i32, _user: User) -> Result<Json<UserInfo>, Status> {
    let mut conn = establish_connection();

    match users
        .filter(id.eq(uid))
        .select((username, email, registration_date, last_login))
        .first::<UserInfo>(&mut conn)
    {
        Ok(u) => Ok(Json(u)),
        Err(NotFound) => Err(Status::NotFound),
        Err(_) => Err(Status::InternalServerError),
    }
}

// TODO
/// set language preference, the `lang` string can be `it` or `eng`
#[openapi(tag = "User")]
#[put("/language/<lang>")]
fn set_language(user: User, lang: String) -> Result<Json<String>, Status> {
    Err(Status::NotImplemented)
}

/// activate account (this is the link received via mail), returns `uid` of user that made the
/// request
#[openapi(tag = "User")]
#[put("/verify/<token>")]
fn activate_account(user: User, token: i32) -> Result<Json<i32>, Status> {
    Err(Status::NotImplemented)
}
// ######################################################################################
// ####################################AUTHENTICATION####################################
// ######################################################################################

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// user can login here and the authentication is stored with a cookie, the api returns the `uid`
/// that refers to the logged user, which can be useful in other api methods
#[openapi(tag = "User")]
#[post("/login", data = "<login>")]
fn login(
    jar: &CookieJar<'_>,
    login: Json<LoginRequest>,
    store: &rocket::State<SessionStore>,
) -> Result<Json<i32>, Status> {
    let mut conn = establish_connection();

    let user = match users
        .filter(email.eq(&login.email))
        .first::<User>(&mut conn)
    {
        Ok(u) => u,
        Err(e) => {
            error!("error trying to find user by email during login: {:?}", e);
            return Err(Status::Unauthorized);
        }
    };

    let parsed_hash = match PasswordHash::new(&user.password_hash) {
        Ok(h) => h,
        Err(e) => {
            error!("error trying to hash user password during login: {:?}", e);
            return Err(Status::InternalServerError);
        }
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
        Ok(Json(user.id))
    } else {
        error!("hashed user password does not match");
        Err(Status::Unauthorized)
    }
}

/// clears authentication cookies
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

/// registers the user, checking before if the user/email have already been used
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

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct ChangePasswordRequest {
    pub oldpassword: String,
    pub newpassword: String,
}

/// changes password of user that makes the request, returns `uid`
#[openapi(tag = "User")]
#[put("/changepassword", data = "<changerequest>")]
fn change_password(
    changerequest: Json<ChangePasswordRequest>,
    user: User,
) -> Result<Json<i32>, Status> {
    Err(Status::NotImplemented)
}

/// request reset of a password, will trigger an email being sent with a reset password token
#[openapi(tag = "User")]
#[put("/requestpasswordreset")]
fn reset_password_request(user: User) -> Result<Json<i32>, Status> {
    Err(Status::NotImplemented)
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct PasswordResetRequest {
    pub token: String,
    pub newpassword: String,
}

/// executes the password reset procedure, user provides a token that was sent by mail, and the new
/// password
#[openapi(tag = "User")]
#[put("/resetpassword", data = "<changerequest>")]
fn reset_password(
    user: User,
    changerequest: Json<PasswordResetRequest>,
) -> Result<Json<i32>, Status> {
    Err(Status::NotImplemented)
}

// ######################################################################################
//                                        INVITES
// ######################################################################################

/// view all invites, regardless of status, about the user making the request
#[openapi(tag = "Invite")]
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

/// accept invite with given id, requires the user to be the one that received the invite
#[openapi(tag = "Invite")]
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
        Err(e) => {
            error!("error trying to update group invite: {:?}", e);
            return Err(Status::InternalServerError);
        }
    };

    match (
        group_members::group_id.eq(invite.group_id),
        group_members::user_id.eq(user.id),
    )
        .insert_into(group_members::table)
        .execute(&mut conn)
    {
        Ok(_) => Ok(Json(invite)),
        Err(e) => {
            error!(
                "error trying to update group members after accepting invite: {:?}",
                e
            );
            Err(Status::InternalServerError)
        }
    }
}

/// reject invite with given id, requires the user to be the one that received the invite
#[openapi(tag = "Invite")]
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
