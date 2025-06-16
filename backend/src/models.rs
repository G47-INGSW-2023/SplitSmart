use std::sync::Mutex;

use crate::{establish_connection, schema::*, SessionStore};
use chrono::NaiveDateTime;
use diesel::{prelude::*, sqlite::Sqlite};
use rocket::{
    http::Status,
    request::{FromRequest, Outcome},
    State,
};
use rocket_okapi::request::OpenApiFromRequest;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

//#[derive(Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
//#[diesel(table_name = balances)]
//#[diesel(check_for_backend(Sqlite))]
//pub struct Balance {
//    pub id: Option<i32>,
//    pub debtor_user_id: i32,
//    pub creditor_user_id: i32,
//    pub amount: f64,
//    pub group_id: Option<i32>,
//}

#[derive(Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[diesel(table_name = expense_participations)]
#[diesel(primary_key(expense_id, user_id))]
#[diesel(check_for_backend(Sqlite))]
pub struct ExpenseParticipation {
    pub expense_id: i32,
    pub user_id: i32,
    pub amount_due: Option<f64>,
}

#[derive(Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[diesel(table_name = expenses)]
#[diesel(check_for_backend(Sqlite))]
pub struct Expense {
    pub id: Option<i32>,
    pub desc: String,
    pub total_amount: f64,
    pub creation_date: NaiveDateTime,
    pub paid_by: i32,
    pub group_id: Option<i32>,
}

#[derive(Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[diesel(primary_key(group_id, user_id))]
#[diesel(table_name = group_administrators)]
#[diesel(check_for_backend(Sqlite))]
pub struct GroupAdministrator {
    pub group_id: i32,
    pub user_id: i32,
}

#[derive(Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[diesel(table_name = group_invites)]
#[diesel(check_for_backend(Sqlite))]
pub struct GroupInvite {
    pub id: i32,
    pub group_id: i32,
    pub invited_user_id: i32,
    pub inviting_user_id: i32,
    pub invite_date: NaiveDateTime,
    pub invite_status: Option<String>,
    pub optional_message: Option<String>,
}

#[derive(Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[diesel(primary_key(group_id, user_id))]
#[diesel(table_name = group_members)]
#[diesel(check_for_backend(Sqlite))]
pub struct GroupMember {
    pub group_id: i32,
    pub user_id: i32,
}

#[derive(Selectable, Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[diesel(table_name = groups)]
#[diesel(check_for_backend(Sqlite))]
pub struct Group {
    pub id: i32,
    pub group_name: String,
    pub desc: Option<String>,
    pub creation_date: NaiveDateTime,
}

#[derive(Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[diesel(primary_key(user_id))]
#[diesel(table_name = notification_preferences)]
#[diesel(check_for_backend(Sqlite))]
pub struct NotificationPreference {
    pub user_id: i32,
    pub notify_new_group_expense: bool,
    pub notify_group_expense_modified: bool,
    pub notify_group_invite: bool,
    pub notify_personal_debt: bool,
    pub send_email_new_group_expense: bool,
    pub send_email_group_invite: bool,
}

#[derive(Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[diesel(table_name = notifications)]
#[diesel(check_for_backend(Sqlite))]
pub struct Notification {
    pub id: i32,
    pub recipient_user_id: i32,
    pub notification_type: Option<String>,
    pub message: String,
    pub creation_date: NaiveDateTime,
    pub read: bool,
    pub referenced_object: Option<i32>,
}

#[derive(Queryable, Identifiable, Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[diesel(table_name = users)]
#[diesel(check_for_backend(Sqlite))]
#[derive(OpenApiFromRequest)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub account_status: Option<String>,
    pub auth_provider: Option<String>,
    pub google_id: Option<String>,
    pub activation_token: Option<String>,
    pub activation_token_expiry: Option<NaiveDateTime>,
    pub reset_password_token: Option<String>,
    pub reset_password_token_expiry: Option<NaiveDateTime>,
    pub registration_date: NaiveDateTime,
    pub last_login: Option<NaiveDateTime>,
    pub preferred_language: String,
    pub notification_preferences: Option<String>,
}

// request guard to check that user is authenticated
#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = ();

    async fn from_request(
        req: &'r rocket::Request<'_>,
    ) -> rocket::request::Outcome<Self, Self::Error> {
        if let Some(cookie) = req.cookies().get("session_id") {
            let session_store = req.guard::<&State<SessionStore>>().await;

            match session_store {
                rocket::outcome::Outcome::Success(s) => {
                    let s = s.sessions.lock().unwrap();
                    match s.get(cookie.value()) {
                        Some(usrid) => {
                            use crate::schema::users::dsl::*;
                            let mut conn = establish_connection();

                            let result = users.filter(id.eq(usrid)).first::<User>(&mut conn);

                            match result {
                                Ok(usr) => Outcome::Success(usr),
                                Err(_) => {
                                    error!("User request guard failed, no matching user found for uid {}",usrid);
                                    Outcome::Error((Status::NotFound, ()))
                                }
                            }
                        }
                        None => {
                            error!("User request guard failed, no matching user found for given cookie");
                            Outcome::Error((Status::NotFound, ()))
                        }
                    }
                }
                rocket::outcome::Outcome::Error(_) | rocket::outcome::Outcome::Forward(_) => {
                    error!("User request guard failed, could not retrieve rocket state");
                    Outcome::Error((Status::InternalServerError, ()))
                }
            }
        } else {
            error!("missing required authentication cookie");
            Outcome::Error((Status::Unauthorized, ()))
        }
    }
}
