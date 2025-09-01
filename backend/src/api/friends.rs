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
