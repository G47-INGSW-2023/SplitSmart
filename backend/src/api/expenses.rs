use crate::{
    establish_connection,
    models::{Expense, ExpenseParticipation, Group, GroupInvite, GroupMember, User},
    schema::{
        expense_participations, expenses, group_administrators, group_invites, group_members,
        notifications,
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

pub fn get_routes_and_docs(settings: &OpenApiSettings) -> (Vec<rocket::Route>, OpenApi) {
    openapi_get_routes_spec![settings:add_private_expense,get_private_expenses,delete_private_expense,update_private_expense]
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct PutExpense {
    pub desc: String,
    pub total_amount: f64,
    pub paid_by: i32,
    pub division: Vec<(i32, f64)>,
}

/// adds a private expense, the division array specifies how the expense is divided: 'division: Vec<(i32, f64)>'
#[openapi(tag = "PrivateExpenses")]
#[post("/", data = "<new_expense>")]
fn add_private_expense(new_expense: Json<PutExpense>, user: User) -> Result<Json<Expense>, Status> {
    let mut conn = establish_connection();

    // TODO: check that the division array sum equals the total
    match conn.transaction::<Expense, diesel::result::Error, _>(|conn| {
        let expense = (
            expenses::desc.eq(new_expense.desc.clone()),
            expenses::total_amount.eq(new_expense.total_amount),
            expenses::paid_by.eq(new_expense.paid_by),
            expenses::creation_date.eq(diesel::dsl::now),
            //expenses::group_id.eq(None),
        )
            .insert_into(expenses::table)
            .get_result::<Expense>(conn)?;

        for (d, a) in new_expense.division.iter() {
            (
                expense_participations::expense_id.eq(expense.id),
                expense_participations::user_id.eq(d),
                expense_participations::amount_due.eq(a),
            )
                .insert_into(expense_participations::table)
                .execute(conn)?;

            (
                notifications::notified_user_id.eq(d),
                notifications::notification_type.eq("NEW_EXPENSE"),
                notifications::expense_id.eq(expense.id),
                notifications::user_id.eq(user.id),
            )
                .insert_into(notifications::table)
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

/// returns all the information about the user private expenses, the ones paid by him and the ones
/// where he was included, including the participations
#[openapi(tag = "PrivateExpenses")]
#[get("/")]
fn get_private_expenses(
    user: User,
) -> Result<Json<Vec<(Expense, Vec<ExpenseParticipation>)>>, Status> {
    let mut conn = establish_connection();

    match conn.transaction::<ExpenseList, diesel::result::Error, _>(|conn| {
        let exp_ids = expense_participations::table
            .filter(expense_participations::user_id.eq(user.id))
            .select(expense_participations::expense_id)
            .get_results::<i32>(conn)?;
        let expenses = expenses::table
            .filter(expenses::group_id.is_null())
            .filter(expenses::id.eq_any(exp_ids))
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

/// deletes private expense, needs to be performed by expense creator
#[openapi(tag = "PrivateExpenses")]
#[delete("/<exid>")]
fn delete_private_expense(exid: i32, user: User) -> Result<Json<Expense>, Status> {
    let mut conn = establish_connection();

    match conn.transaction::<Expense, diesel::result::Error, _>(|conn| {
        let res = expense_participations::table
            .filter(expense_participations::expense_id.eq(exid))
            .get_results::<ExpenseParticipation>(conn)?;

        // notify users of expense deletion
        for ep in res {
            (
                notifications::notified_user_id.eq(ep.user_id),
                notifications::notification_type.eq("EXPENSE_DELETED"),
                notifications::user_id.eq(user.id),
            )
                .insert_into(notifications::table)
                .execute(conn)?;
        }

        let expense = diesel::delete(expenses::table.filter(expenses::id.eq(exid)))
            .get_result::<Expense>(conn)?;

        if expense.paid_by != user.id {
            error!("trying to delete expense but user is not creator of expense");
            return Err(diesel::result::Error::RollbackTransaction);
        };

        Ok(expense)
    }) {
        Ok(e) => Ok(Json(e)),
        Err(e) => {
            error!("error running delete_expense transaction: {:?}", e);
            Err(Status::InternalServerError)
        }
    }
}

/// updates a private expense, the division array specifies how the expense is divided: 'division: Vec<(i32, f64)>'
#[openapi(tag = "PrivateExpenses")]
#[put("/<exid>", data = "<new_expense>")]
fn update_private_expense(
    new_expense: Json<PutExpense>,
    user: User,
    exid: i32,
) -> Result<Json<Expense>, Status> {
    let mut conn = establish_connection();

    match conn.transaction::<Expense, diesel::result::Error, _>(|conn| {
        let expense = diesel::update(expenses::table.filter(expenses::id.eq(exid)))
            .set((
                expenses::desc.eq(new_expense.desc.clone()),
                expenses::total_amount.eq(new_expense.total_amount),
                expenses::paid_by.eq(new_expense.paid_by),
                expenses::creation_date.eq(diesel::dsl::now),
            ))
            .get_result::<Expense>(conn)?;

        diesel::delete(
            expense_participations::table.filter(expense_participations::expense_id.eq(exid)),
        )
        .execute(conn)?;

        for (d, a) in new_expense.division.iter() {
            (
                expense_participations::expense_id.eq(expense.id),
                expense_participations::user_id.eq(d),
                expense_participations::amount_due.eq(a),
            )
                .insert_into(expense_participations::table)
                .execute(conn)?;

            (
                notifications::notified_user_id.eq(d),
                notifications::notification_type.eq("NEW_EXPENSE"),
                notifications::expense_id.eq(expense.id),
                notifications::user_id.eq(user.id),
            )
                .insert_into(notifications::table)
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
