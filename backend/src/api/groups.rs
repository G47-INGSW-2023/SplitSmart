use crate::{
    establish_connection,
    models::{Expense, ExpenseParticipation, Group, GroupInvite, GroupMember, User},
    schema::{
        expense_participations, expenses, group_administrators, group_invites, group_members,
    },
};

use diesel::{connection::Connection, result::Error::NotFound, SelectableHelper};
use diesel::{dsl::exists, select, ExpressionMethods, Insertable, QueryDsl, RunQueryDsl};
use rocket::{http::Status, serde::json::Json};
use rocket_okapi::{
    okapi::openapi3::OpenApi, openapi, openapi_get_routes_spec, settings::OpenApiSettings,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::schema;
use crate::schema::groups::dsl::*;

pub fn get_routes_and_docs(settings: &OpenApiSettings) -> (Vec<rocket::Route>, OpenApi) {
    openapi_get_routes_spec![settings:create_group, get_groups,get_group,update_group,delete_group,add_member,invite_user,remove_member,promote_to_admin,demote_admin,add_expense,get_expenses,update_expense,delete_expense,view_members,view_admins]
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct PutUser {
    user_id: i32,
}

fn is_member(gid: i32, usrid: i32) -> Result<(), Status> {
    use crate::schema::group_members::dsl::*;

    let mut conn = establish_connection();

    match select(exists(
        group_members
            .filter(group_id.eq(gid))
            .filter(user_id.eq(usrid)),
    ))
    .get_result::<bool>(&mut conn)
    {
        Ok(true) => Ok(()),
        Ok(false) => Err(Status::Unauthorized),
        Err(_) => {
            error!("internal error while checking if user is group member");
            Err(Status::InternalServerError)
        }
    }
}

fn is_admin(gid: i32, usrid: i32) -> Result<(), Status> {
    use crate::schema::group_administrators::dsl::*;

    let mut conn = establish_connection();

    match select(exists(
        group_administrators
            .filter(group_id.eq(gid))
            .filter(user_id.eq(usrid)),
    ))
    .get_result::<bool>(&mut conn)
    {
        Ok(true) => Ok(()),
        Ok(false) => Err(Status::Unauthorized),
        Err(_) => {
            error!("internal error while checking if user is group member");
            Err(Status::InternalServerError)
        }
    }
}

//| aggiungiMembro(utenteDaAggiungere: Utente): void
//| rimuoviMembro(utenteDaRimuovere: Utente, utentePerformanteAzione: Utente): boolean
//O invitaMembro(emailUtenteDaInvitare: String, utenteInvitante: Utente): InvitoGruppo
//| promuoviAdAmministratore(utenteDaPromuovere: Utente, utentePerformanteAzione: Utente): boolean
//| revocaAmministratore(utenteDaRevocare: Utente, utentePerformanteAzione: Utente): boolean
//| aggiungiSpesa(descrizione: String, importo: Decimal, pagatore: Utente, tipoDivisione: TipoDivisioneSpesa, dettagliDivisione: Object): Spesa
//+ rimuoviSpesa(idSpesa: String/UUID, utentePerformanteAzione: Utente): boolean
//| modificaDettagliGruppo(nuovoNome: String, nuovaDescrizione: String, utentePerformanteAzione: Utente): boolean
//+ calcolaSaldiGruppo(): List<Saldo>
//+ calcolaDebitiSemplificati(): List<String>
//+ visualizzaSpeseGruppo(filtri: Object): void
//| cancellaGruppo(utentePerformanteAzione: Utente): boolean
//| visualizzaDettagliGruppo(): void

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct PutGroup {
    pub name: String,
    pub description: Option<String>,
}

/// creates a group with the given name and description, adds to the group the user that made the
/// request, both as member and administrator
///
/// if successful returns the newly created group

#[openapi(tag = "Groups")]
#[post("/", data = "<new_group>")]
fn create_group(new_group: Json<PutGroup>, user: User) -> Result<Json<Group>, Status> {
    let mut conn = establish_connection();

    let res = conn.transaction::<Group, diesel::result::Error, _>(|conn| {
        let group = diesel::insert_into(groups)
            .values((
                // id is not passed as it will be auto generated (hopefully)
                group_name.eq(new_group.name.clone()),
                desc.eq(new_group.description.clone()),
                creation_date.eq(diesel::dsl::now),
            ))
            .get_result::<Group>(conn)?;

        {
            use crate::schema::group_administrators::dsl::*;
            diesel::insert_into(group_administrators)
                .values((group_id.eq(group.id), user_id.eq(user.id)))
                .execute(conn)?;
        }

        {
            use crate::schema::group_members::dsl::*;
            diesel::insert_into(group_members)
                .values((group_id.eq(group.id), user_id.eq(user.id)))
                .execute(conn)?;
        }

        Ok(group)
    });

    match res {
        Ok(g) => Ok(Json(g)),
        Err(e) => {
            error!("error running create_group transaction: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}

/// returns all the groups the user is a member of
#[openapi(tag = "Groups")]
#[get("/")]
fn get_groups(user: User) -> Result<Json<Vec<Group>>, Status> {
    let mut conn = establish_connection();

    let res = diesel::QueryDsl::select(
        schema::groups::table
            .inner_join(group_members::table)
            .filter(group_members::user_id.eq(user.id)),
        Group::as_select(),
    )
    .load::<Group>(&mut conn);

    match res {
        Ok(v) => Ok(Json(v)),
        Err(_) => Err(Status::InternalServerError),
    }
}

/// returns requested group by id, if the user requesting it is a member
#[openapi(tag = "Groups")]
#[get("/<gid>")]
fn get_group(gid: i32, user: User) -> Result<Json<Group>, Status> {
    let mut conn = establish_connection();

    is_member(gid, user.id)?;

    match groups.filter(id.eq(gid)).first::<Group>(&mut conn) {
        Ok(group) => Ok(Json(group)),
        Err(_) => Err(Status::NotFound),
    }
}

/// updates existing_group, needs to be executed by an admin of the group
#[openapi(tag = "Groups")]
#[put("/<gid>", data = "<new_group>")]
fn update_group(gid: i32, new_group: Json<PutGroup>, user: User) -> Result<Status, Status> {
    let mut conn = establish_connection();

    is_admin(gid, user.id)?;

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

/// deletes a group, can only be performed by an admin
#[openapi(tag = "Groups")]
#[delete("/<gid>")]
fn delete_group(gid: i32, user: User) -> Result<Status, Status> {
    let mut conn = establish_connection();

    is_admin(gid, user.id)?;

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

// ---------------------------- EXPENSES

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct PutExpense {
    pub desc: String,
    pub total_amount: f64,
    pub paid_by: i32,
    pub division: Vec<(i32, f64)>,
}

/// adds a group expense, the division array specifies how the expense is divided: division: Vec<(i32, f64)>
#[openapi(tag = "Expenses")]
#[post("/<gid>/expenses", data = "<new_expense>")]
fn add_expense(
    gid: i32,
    new_expense: Json<PutExpense>,
    user: User,
) -> Result<Json<Expense>, Status> {
    let mut conn = establish_connection();

    // TODO: check that the division array sum equals the total
    match conn.transaction::<Expense, diesel::result::Error, _>(|conn| {
        let expense = (
            expenses::desc.eq(new_expense.desc.clone()),
            expenses::total_amount.eq(new_expense.total_amount),
            expenses::paid_by.eq(new_expense.paid_by),
            expenses::creation_date.eq(diesel::dsl::now),
            expenses::group_id.eq(gid),
        )
            .insert_into(expenses::table)
            .get_result::<Expense>(conn)?;

        for (d, a) in new_expense.division.iter() {
            // TODO: check that user is in group
            (
                expense_participations::expense_id.eq(expense.id),
                expense_participations::user_id.eq(d),
                expense_participations::amount_due.eq(a),
            )
                .insert_into(expense_participations::table)
                .execute(conn)?;
        }

        Ok(expense)
    }) {
        Ok(e) => Ok(Json(e)),
        Err(e) => {
            error!("error running add_expense transaction: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}

type ExpenseList = Vec<(Expense, Vec<ExpenseParticipation>)>;

/// returns all the information about the group expenses, including the participations
#[openapi(tag = "Expenses")]
#[get("/<gid>/expenses")]
fn get_expenses(
    gid: i32,
    user: User,
) -> Result<Json<Vec<(Expense, Vec<ExpenseParticipation>)>>, Status> {
    let mut conn = establish_connection();
    // TODO: check user is member

    match conn.transaction::<ExpenseList, diesel::result::Error, _>(|conn| {
        let expenses = expenses::table
            .filter(expenses::group_id.eq(gid))
            .get_results::<Expense>(conn)?;
        let mut v: ExpenseList = Vec::new();
        for e in expenses {
            let participations = expense_participations::table
                .filter(expense_participations::expense_id.eq(e.id))
                .get_results::<ExpenseParticipation>(conn)?;
            v.push((e, participations));
        }
        Ok(v)
    }) {
        Ok(e) => Ok(Json(e)),
        Err(e) => {
            error!("error running get_expenses transaction: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}

/// deletese group expense, needs to be performed either by expense creator or admin user
#[openapi(tag = "Expenses")]
#[delete("/<gid>/expenses/<exid>")]
fn delete_expense(gid: i32, exid: i32, user: User) -> Result<Json<Expense>, Status> {
    let mut conn = establish_connection();

    // TODO: check that the division array sum equals the total
    match conn.transaction::<Expense, diesel::result::Error, _>(|conn| {
        let expense = diesel::delete(expenses::table.filter(expenses::id.eq(exid)))
            .get_result::<Expense>(conn)?;

        if !((expense.paid_by == user.id) || is_admin(gid, user.id).is_ok()) {
            error!("trying to delete expense but user is not admin or creator of expense");
            return Err(diesel::result::Error::RollbackTransaction);
        };

        diesel::delete(
            expense_participations::table.filter(expense_participations::expense_id.eq(exid)),
        )
        .execute(conn)?;
        Ok(expense)
    }) {
        Ok(e) => Ok(Json(e)),
        Err(e) => {
            error!("error running add_expense transaction: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}

/// updates a group expense, the division array specifies how the expense is divided: division: Vec<(i32, f64)>, can only be executed by who inserted the expense or an admin
#[openapi(tag = "Expenses")]
#[put("/<gid>/expenses/<exid>", data = "<new_expense>")]
fn update_expense(
    gid: i32,
    exid: i32,
    new_expense: Json<PutExpense>,
    user: User,
) -> Result<Json<Expense>, Status> {
    let mut conn = establish_connection();

    // TODO: check that the division array sum equals the total
    match conn.transaction::<Expense, diesel::result::Error, _>(|conn| {
        let expense = diesel::update(expenses::table.filter(expenses::id.eq(exid)))
            .set((
                expenses::desc.eq(new_expense.desc.clone()),
                expenses::total_amount.eq(new_expense.total_amount),
                expenses::paid_by.eq(new_expense.paid_by),
            ))
            .get_result::<Expense>(conn)?;

        if !((expense.paid_by == user.id) || is_admin(gid, user.id).is_ok()) {
            error!("trying to update expense but user is not admin or creator of expense");
            return Err(diesel::result::Error::RollbackTransaction);
        };

        diesel::delete(
            expense_participations::table.filter(expense_participations::expense_id.eq(exid)),
        )
        .execute(conn)?;

        for (d, a) in new_expense.division.iter() {
            // TODO: check that user is in group
            (
                expense_participations::expense_id.eq(expense.id),
                expense_participations::user_id.eq(d),
                expense_participations::amount_due.eq(a),
            )
                .insert_into(expense_participations::table)
                .execute(conn)?;
        }

        Ok(expense)
    }) {
        Ok(e) => Ok(Json(e)),
        Err(e) => {
            error!("error running add_expense transaction: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}

// ---------------------------- MEMBERS

/// adds a user to the group, can only be performed by an admin
#[openapi(tag = "Groups")]
#[post("/<gid>/members", data = "<p_user>")]
fn add_member(gid: i32, p_user: Json<PutUser>, user: User) -> Result<(), Status> {
    let mut conn = establish_connection();
    use crate::schema::group_members::dsl::*;
    use crate::schema::users::dsl::*;

    is_admin(gid, user.id)?;

    match users.filter(id.eq(p_user.user_id)).first::<User>(&mut conn) {
        Ok(_) => (),
        Err(_) => return Err(Status::NotFound),
    };

    let result = (group_id.eq(gid), user_id.eq(p_user.user_id))
        .insert_into(group_members)
        .execute(&mut conn);

    match result {
        Ok(_) => Ok(()),
        Err(_) => Err(Status::InternalServerError),
    }
}

/// list of the members of the group
#[openapi(tag = "Groups")]
#[get("/<gid>/members")]
fn view_members(gid: i32, user: User) -> Result<Json<Vec<GroupMember>>, Status> {
    let mut conn = establish_connection();

    is_member(gid, user.id)?;

    match group_members::table
        .filter(group_members::group_id.eq(gid))
        .get_results::<GroupMember>(&mut conn)
    {
        Ok(g) => Ok(Json(g)),
        Err(NotFound) => Err(Status::NotFound),
        Err(e) => {
            error!("error running view_members query: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct InviteUser {
    email: String,
    message: Option<String>,
}

/// invites a user to the group through mail address, executing user needs to be group admin
#[openapi(tag = "Invite")]
#[post("/<gid>/members/invite", data = "<invite>")]
fn invite_user(
    gid: i32,
    invite: Json<InviteUser>,
    user: User,
) -> Result<Json<GroupInvite>, Status> {
    use crate::schema::users;
    let mut conn = establish_connection();

    is_admin(gid, user.id)?;

    let invited_id = match users::table
        .filter(users::email.eq(&invite.email))
        .first::<User>(&mut conn)
    {
        Ok(usr) => usr.id,
        Err(_) => return Err(Status::InternalServerError),
    };

    match (
        group_invites::group_id.eq(gid),
        group_invites::inviting_user_id.eq(user.id),
        group_invites::invited_user_id.eq(invited_id),
        group_invites::invite_status.eq("PENDING"),
        group_invites::optional_message.eq(invite.message.clone()),
        group_invites::invite_date.eq(diesel::dsl::now),
    )
        .insert_into(group_invites::table)
        .get_result::<GroupInvite>(&mut conn)
    {
        Ok(gi) => Ok(Json(gi)),
        Err(e) => {
            error!("error running create_group transaction: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}

/// removes a member from the group(and from admin table if he is admin), can only be performed by another admin
#[openapi(tag = "Groups")]
#[delete("/<gid>/members/<uid>")]
fn remove_member(gid: i32, uid: i32, user: User) -> Result<(), Status> {
    let mut conn = establish_connection();
    use crate::schema::group_members::dsl::*;

    is_admin(gid, user.id)?;

    let r1 = diesel::delete(
        group_members
            .filter(group_id.eq(gid))
            .filter(user_id.eq(uid)),
    )
    .execute(&mut conn);

    let r2 = diesel::delete(
        group_administrators::table
            .filter(group_administrators::group_id.eq(gid))
            .filter(group_administrators::user_id.eq(uid)),
    )
    .execute(&mut conn);

    match (r1, r2) {
        (Ok(rows_deleted), Ok(_)) if rows_deleted > 0 => Ok(()), // Successfully deleted
        (Ok(_), Ok(_)) => Err(Status::NotFound), // User was not a member of the group
        (Err(_), _) | (_, Err(_)) => Err(Status::InternalServerError), // An error occurred
    }
}

/// promotes member to admin, can only be performed by another admin
#[openapi(tag = "Groups")]
#[post("/<gid>/admins/<uid>")]
fn promote_to_admin(gid: i32, uid: i32, user: User) -> Result<(), Status> {
    let mut conn = establish_connection();

    // this ensures that the user that made the request is an admin
    is_admin(gid, user.id)?;
    // this ensures that the uid is of a real user, the gid of a real group, and together that the
    // user to be promoted is part of the group
    is_member(gid, uid)?;

    use crate::schema::group_administrators::dsl::*;

    let result = (group_id.eq(gid), user_id.eq(uid))
        .insert_into(group_administrators)
        .execute(&mut conn);

    match result {
        Ok(_) => Ok(()),
        Err(_) => Err(Status::InternalServerError),
    }
}

/// demotes group admin to member, can only be performed by another admin
#[openapi(tag = "Groups")]
#[delete("/<gid>/admins/<uid>")]
fn demote_admin(gid: i32, uid: i32, user: User) -> Result<(), Status> {
    let mut conn = establish_connection();
    use crate::schema::group_administrators::dsl::*;

    // this ensures that the user that made the request is an admin
    is_admin(gid, user.id)?;

    let result = diesel::delete(
        group_administrators
            .filter(group_id.eq(gid))
            .filter(user_id.eq(uid)),
    )
    .execute(&mut conn);

    match result {
        Ok(deleted_rows) if deleted_rows > 0 => Ok(()), // Successfully deleted
        Ok(_) => Err(Status::NotFound),                 // User was not an admin
        Err(_) => Err(Status::InternalServerError),     // An error occurred
    }
}

/// lists all the admins to the group with `gid`
#[openapi(tag = "Groups")]
#[get("/<gid>/admins")]
fn view_admins(gid: i32, user: User) -> Result<Json<Vec<GroupMember>>, Status> {
    let mut conn = establish_connection();

    is_member(gid, user.id)?;

    match group_administrators::table
        .filter(group_administrators::group_id.eq(gid))
        .get_results::<GroupMember>(&mut conn)
    {
        Ok(g) => Ok(Json(g)),
        Err(NotFound) => Err(Status::NotFound),
        Err(e) => {
            error!("error running view_members query: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}
