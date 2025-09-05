use diesel::{
    result::Error, BoolExpressionMethods, Connection, ExpressionMethods, Insertable, QueryDsl,
    RunQueryDsl,
};
use rocket::{http::Status, serde::json::Json};
use rocket_okapi::{
    okapi::openapi3::OpenApi, openapi, openapi_get_routes_spec, settings::OpenApiSettings,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::{
    establish_connection,
    models::{FriendInvite, Friendship, Group, User},
    schema::{friend_invites, friendships, notifications},
};

pub fn get_routes_and_docs(settings: &OpenApiSettings) -> (Vec<rocket::Route>, OpenApi) {
    openapi_get_routes_spec![settings:remove_friend,get_friends,view_invites,invite_friend,accept_invite,reject_invite]
}

/// view all friends of user making the request
#[openapi(tag = "Friends")]
#[get("/")]
fn get_friends(user: User) -> Result<Json<Vec<Friendship>>, Status> {
    let mut conn = establish_connection();

    match friendships::table
        .filter(
            friendships::user1
                .eq(user.id)
                .or(friendships::user2.eq(user.id)),
        )
        .get_results::<Friendship>(&mut conn)
    {
        Ok(v) => Ok(Json(v)),
        Err(_) => Err(Status::InternalServerError),
    }
}

/// remove friends of requesting user with id `fid`
#[openapi(tag = "Friends")]
#[delete("/<fid>")]
fn remove_friend(user: User, fid: i32) -> Result<Json<Vec<Friendship>>, Status> {
    let mut conn = establish_connection();

    match diesel::delete(
        friendships::table.filter(
            (friendships::user1
                .eq(user.id)
                .and(friendships::user2.eq(fid)))
            .or(friendships::user2
                .eq(user.id)
                .and(friendships::user1.eq(fid))),
        ),
    )
    .get_results::<Friendship>(&mut conn)
    {
        Ok(v) => Ok(Json(v)),
        Err(_) => Err(Status::InternalServerError),
    }
}

// ---------------------------------------------------------------------------------------------------------
// -----------------------------------------INVITES---------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------

/// views the friendship invites that the user received
#[openapi(tag = "Friends")]
#[get("/invites")]
fn view_invites(user: User) -> Result<Json<Vec<FriendInvite>>, Status> {
    let mut conn = establish_connection();

    match friend_invites::table
        .filter(friend_invites::invited_user_id.eq(user.id))
        .get_results::<FriendInvite>(&mut conn)
    {
        Ok(v) => Ok(Json(v)),
        Err(_) => Err(Status::InternalServerError),
    }
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct InviteUser {
    email: String,
}

/// invites a friend by mail address
#[openapi(tag = "Friends")]
#[post("/invites", data = "<invite>")]
fn invite_friend(invite: Json<InviteUser>, user: User) -> Result<Json<FriendInvite>, Status> {
    use crate::schema::users;
    let mut conn = establish_connection();

    let invited_id = match users::table
        .filter(users::email.eq(&invite.email))
        .first::<User>(&mut conn)
    {
        Ok(usr) => usr.id,
        Err(_) => return Err(Status::InternalServerError),
    };

    match (
        friend_invites::inviting_user_id.eq(user.id),
        friend_invites::invited_user_id.eq(invited_id),
        friend_invites::invite_status.eq("PENDING"),
        friend_invites::invite_date.eq(diesel::dsl::now),
    )
        .insert_into(friend_invites::table)
        .get_result::<FriendInvite>(&mut conn)
    {
        Ok(fi) => Ok(Json(fi)),
        Err(e) => {
            error!("error inviting user: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}

/// accept invite with given id, requires the user to be the one that received the invite, returns
/// the updated invite
#[openapi(tag = "Friends")]
#[put("/invites/<invite_id>/accept")]
fn accept_invite(user: User, invite_id: i32) -> Result<Json<FriendInvite>, Status> {
    let mut conn = establish_connection();

    let res = conn.transaction::<FriendInvite, diesel::result::Error, _>(|conn| {
        // try to update the single affected friend invite and mark it as accepted
        let invite = diesel::update(
            friend_invites::table
                // find the unique friend invite
                .filter(friend_invites::id.eq(invite_id))
                // check that it's invite to the current user
                .filter(friend_invites::invited_user_id.eq(user.id)),
        )
        .set(friend_invites::invite_status.eq("ACCEPTED"))
        .get_result::<FriendInvite>(conn)?;

        // add friendship to database
        let friendship = (
            friendships::user1.eq(invite.inviting_user_id.min(user.id)),
            friendships::user2.eq(user.id.max(invite.inviting_user_id)),
        )
            .insert_into(friendships::table)
            .execute(conn)?;

        // add notification of FRIENDSHIP_REQUEST_ACCEPTED
        (
            notifications::notified_user_id.eq(invite.inviting_user_id),
            notifications::notification_type.eq("FRIENDSHIP_REQUEST_ACCEPTED"),
            notifications::user_id.eq(invite.invited_user_id),
            notifications::creation_date.eq(diesel::dsl::now),
        )
            .insert_into(notifications::table)
            .execute(conn)?;

        Ok(invite)
    });
    match res {
        Ok(v) => Ok(Json(v)),
        Err(Error::NotFound) => return Err(Status::NotFound),
        Err(e) => {
            error!("error trying to accept friendship invite: {:?}", e);
            return Err(Status::InternalServerError);
        }
    }
}

/// reject friendship invite with id `invite_id`, creates notification to the inviting user that
/// the request has been rejected
#[openapi(tag = "Friends")]
#[put("/invites/<invite_id>/reject")]
fn reject_invite(user: User, invite_id: i32) -> Result<Json<FriendInvite>, Status> {
    let mut conn = establish_connection();

    let res = conn.transaction::<FriendInvite, diesel::result::Error, _>(|conn| {
        let invite = diesel::update(
            friend_invites::table
                // find the unique friend invite
                .filter(friend_invites::id.eq(invite_id))
                // check that it's invite to the current user
                .filter(friend_invites::invited_user_id.eq(user.id)),
        )
        .set(friend_invites::invite_status.eq("REJECTED"))
        .get_result::<FriendInvite>(conn)?;

        (
            notifications::notified_user_id.eq(invite.inviting_user_id),
            notifications::notification_type.eq("FRIENDSHIP_REQUEST_DENIED"),
            notifications::user_id.eq(invite.invited_user_id),
            notifications::creation_date.eq(diesel::dsl::now),
        )
            .insert_into(notifications::table)
            .execute(conn)?;

        Ok(invite)
    });
    match res {
        Ok(v) => Ok(Json(v)),
        Err(Error::NotFound) => Err(Status::NotFound),
        Err(e) => {
            error!("error trying to reject friendship invite: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*; // Importa le route e le struct dal modulo corrente
    use crate::api::users::{LoginRequest, RegisterRequest};
    use crate::models::{FriendInvite, Friendship};
    use rocket::http::{Cookie, ContentType, Status};
    use rocket::local::blocking::Client;
    use serde_json::json;
    use diesel::prelude::*;
    use crate::establish_connection;
    use diesel::dsl::exists;

    // --- FUNZIONI HELPER PER I TEST ---

    // Funzione di setup base che pulisce il DB e crea il client.
    fn setup_client() -> Client {
        let mut conn = establish_connection();
        // ... (codice di pulizia del DB come negli altri file di test) ...
        diesel::delete(crate::schema::expense_participations::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::notifications::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::expenses::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::group_members::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::group_administrators::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::group_invites::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::friendships::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::friend_invites::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::notification_preferences::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::groups::table).execute(&mut conn).unwrap();
        diesel::delete(crate::schema::users::table).execute(&mut conn).unwrap();

        let rocket = rocket::build()
            .manage(crate::SessionStore::new())
            .mount("/user", crate::api::users::get_routes_and_docs(&Default::default()).0)
            .mount("/friends", routes![get_friends, view_invites, invite_friend, accept_invite, reject_invite]);
        
        Client::tracked(rocket).expect("Failed to create a Rocket client for testing")
    }

    // Helper per registrare un utente e restituire il suo ID e le credenziali.
    fn register_user(client: &Client, username: &str, email: &str) -> (i32, LoginRequest) {
        let password = "Password123";
        let reg_data = json!({
            "username": username,
            "email": email,
            "password": password
        });
        let response = client.post("/user/register").body(reg_data.to_string()).dispatch();
        assert_eq!(response.status(), Status::Ok);

        let login_data = LoginRequest { email: email.to_string(), password: password.to_string() };
        let login_response = client.post("/user/login").json(&login_data).dispatch();
        let user_id = login_response.into_json::<i32>().unwrap();
        (user_id, login_data)
    }

    // Helper per fare il login e ottenere il cookie.
    fn login_user(client: &Client, login_data: &LoginRequest) -> Cookie<'static> {
        let response = client.post("/user/login").json(login_data).dispatch();
        assert_eq!(response.status(), Status::Ok);
        response.cookies().get("session_id").unwrap().clone()
    }

    // --- TEST PER LA GESTIONE DELLE AMICIZIE ---

    /// [FRND-01, FRND-02, FRND-03]
    /// Testa il ciclo di vita completo di una richiesta di amicizia:
    /// 1. Utente A invita Utente B.
    /// 2. Utente B accetta l'invito.
    /// 3. Utente C invita Utente D.
    /// 4. Utente D rifiuta l'invito.
    #[test]
    fn test_friend_invite_full_lifecycle() {
        // ARRANGE: Crea 4 utenti per i due scenari
        let client = setup_client();
        let (user_a_id, login_a) = register_user(&client, "userA", "a@test.com");
        let (user_b_id, login_b) = register_user(&client, "userB", "b@test.com");
        let (_user_c_id, login_c) = register_user(&client, "userC", "c@test.com");
        let (_user_d_id, login_d) = register_user(&client, "userD", "d@test.com");
        
        // --- Scenario 1: Accettazione Invito ---

        // [FRND-01] ACT: Utente A (loggato) invita Utente B
        let cookie_a = login_user(&client, &login_a);
        let invite_data = json!({ "email": "b@test.com" });
        let invite_response = client.post("/friends/invites")
            .cookie(cookie_a)
            .json(&invite_data)
            .dispatch();
        
        // ASSERT
        assert_eq!(invite_response.status(), Status::Ok, "L'invio della richiesta di amicizia dovrebbe avere successo");
        let friend_invite = invite_response.into_json::<FriendInvite>().unwrap();
        assert_eq!(friend_invite.inviting_user_id, user_a_id);
        assert_eq!(friend_invite.invited_user_id, user_b_id);

        // [FRND-02] ACT: Utente B (loggato) accetta l'invito
        let cookie_b = login_user(&client, &login_b);
        let accept_response = client.put(format!("/friends/invites/{}/accept", friend_invite.id))
            .cookie(cookie_b)
            .dispatch();
        
        // ASSERT
        assert_eq!(accept_response.status(), Status::Ok, "L'accettazione dell'invito dovrebbe avere successo");
        
        // Verifica DB: Controlla che la relazione di amicizia sia stata creata
        let mut conn = establish_connection();
        let friendship_exists: bool = diesel::select(exists(
            crate::schema::friendships::table.find((user_a_id, user_b_id))
        )).get_result(&mut conn).unwrap();
        assert!(friendship_exists, "La relazione di amicizia dovrebbe esistere nel DB dopo l'accettazione");

        // --- Scenario 2: Rifiuto Invito ---

        // ACT: Utente C (loggato) invita Utente D
        let cookie_c = login_user(&client, &login_c);
        let invite_data_2 = json!({ "email": "d@test.com" });
        let invite_response_2 = client.post("/friends/invites")
            .cookie(cookie_c)
            .json(&invite_data_2)
            .dispatch();
        let friend_invite_2 = invite_response_2.into_json::<FriendInvite>().unwrap();

        // [FRND-03] ACT: Utente D (loggato) rifiuta l'invito
        let cookie_d = login_user(&client, &login_d);
        let reject_response = client.put(format!("/friends/invites/{}/reject", friend_invite_2.id))
            .cookie(cookie_d)
            .dispatch();
        
        // ASSERT
        assert_eq!(reject_response.status(), Status::Ok, "Il rifiuto dell'invito dovrebbe avere successo");
        let rejected_invite = reject_response.into_json::<FriendInvite>().unwrap();
        assert_eq!(rejected_invite.invite_status, Some("REJECTED".to_string()));
    }
}