// @generated automatically by Diesel CLI.

diesel::table! {
    expense_participations (expense_id, user_id) {
        expense_id -> Integer,
        user_id -> Integer,
        amount_due -> Nullable<Double>,
    }
}

diesel::table! {
    expenses (id) {
        id -> Integer,
        desc -> Text,
        total_amount -> Double,
        creation_date -> Timestamp,
        paid_by -> Integer,
        group_id -> Nullable<Integer>,
    }
}

diesel::table! {
    friend_invites (id) {
        id -> Integer,
        invited_user_id -> Integer,
        inviting_user_id -> Integer,
        invite_date -> Timestamp,
        invite_status -> Nullable<Text>,
    }
}

diesel::table! {
    friendships (user1, user2) {
        user1 -> Integer,
        user2 -> Integer,
    }
}

diesel::table! {
    group_administrators (group_id, user_id) {
        group_id -> Integer,
        user_id -> Integer,
    }
}

diesel::table! {
    group_invites (id) {
        id -> Integer,
        group_id -> Integer,
        invited_user_id -> Integer,
        inviting_user_id -> Integer,
        invite_date -> Timestamp,
        invite_status -> Nullable<Text>,
        optional_message -> Nullable<Text>,
    }
}

diesel::table! {
    group_members (group_id, user_id) {
        group_id -> Integer,
        user_id -> Integer,
    }
}

diesel::table! {
    groups (id) {
        id -> Integer,
        group_name -> Text,
        desc -> Nullable<Text>,
        creation_date -> Timestamp,
    }
}

diesel::table! {
    notifications (id) {
        id -> Integer,
        notified_user_id -> Integer,
        notification_type -> Nullable<Text>,
        group_id -> Nullable<Integer>,
        user_id -> Nullable<Integer>,
        expense_id -> Nullable<Integer>,
        creation_date -> Timestamp,
        read -> Bool,
    }
}

diesel::table! {
    users (id) {
        id -> Integer,
        username -> Text,
        email -> Text,
        password_hash -> Text,
        account_status -> Nullable<Text>,
        auth_provider -> Nullable<Text>,
        google_id -> Nullable<Text>,
        activation_token -> Nullable<Text>,
        activation_token_expiry -> Nullable<Timestamp>,
        reset_password_token -> Nullable<Text>,
        reset_password_token_expiry -> Nullable<Timestamp>,
        registration_date -> Timestamp,
        last_login -> Nullable<Timestamp>,
        preferred_language -> Text,
        notification_preferences -> Nullable<Text>,
    }
}

diesel::joinable!(expense_participations -> expenses (expense_id));
diesel::joinable!(expense_participations -> users (user_id));
diesel::joinable!(expenses -> groups (group_id));
diesel::joinable!(expenses -> users (paid_by));
diesel::joinable!(group_administrators -> groups (group_id));
diesel::joinable!(group_administrators -> users (user_id));
diesel::joinable!(group_invites -> groups (group_id));
diesel::joinable!(group_members -> groups (group_id));
diesel::joinable!(group_members -> users (user_id));
diesel::joinable!(notifications -> expenses (expense_id));
diesel::joinable!(notifications -> groups (group_id));

diesel::allow_tables_to_appear_in_same_query!(
    expense_participations,
    expenses,
    friend_invites,
    friendships,
    group_administrators,
    group_invites,
    group_members,
    groups,
    notifications,
    users,
);
