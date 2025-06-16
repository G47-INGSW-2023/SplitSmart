CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    account_status TEXT CHECK (account_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    auth_provider TEXT CHECK (auth_provider IN ('CREDENTIALS', 'GOOGLE')),
    google_id TEXT,
    activation_token TEXT,
    activation_token_expiry TIMESTAMP,
    reset_password_token TEXT,
    reset_password_token_expiry TIMESTAMP,
    registration_date TIMESTAMP NOT NULL,
    last_login TIMESTAMP,
    preferred_language TEXT NOT NULL,
    notification_preferences TEXT
);

CREATE TABLE groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    group_name TEXT NOT NULL,
    desc TEXT,
    creation_date TIMESTAMP NOT NULL
);

CREATE TABLE group_administrators (
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE group_members (
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    desc TEXT NOT NULL,
    total_amount DECIMAL NOT NULL,
    expense_date TIMESTAMP NOT NULL,
    registration_date TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    group_id INTEGER,
    division_type TEXT CHECK (division_type IN ('EQUAL_SHARES', 'PERCENTAGES', 'FIXED_SHARES', 'PERSONAL')),
    division_participants TEXT,
    personal_beneficiary_user_id INTEGER,
    attachments TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE expense_participations (
    expense_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount_due DECIMAL,
    percentage_due DECIMAL,
    PRIMARY KEY (expense_id, user_id),
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    debtor_user_id INTEGER NOT NULL,
    creditor_user_id INTEGER NOT NULL,
    amount DECIMAL NOT NULL,
    group_id INTEGER,
    FOREIGN KEY (debtor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (creditor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
    recipient_user_id INTEGER NOT NULL,
    notification_type TEXT CHECK (notification_type IN ('GROUP_INVITE', 'NEW_EXPENSE', 'EXPENSE_MODIFIED', 'BALANCE_REQUESTED', 'PAYMENT_RECEIVED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'ADMIN_CHANGED')),
    message TEXT NOT NULL,
    creation_date TIMESTAMP NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    referenced_object INTEGER,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE group_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    group_id INTEGER NOT NULL,
    invited_user_id INTEGER NOT NULL,
    inviting_user_id INTEGER NOT NULL,
    invite_date TIMESTAMP NOT NULL,
    invite_status TEXT CHECK (invite_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    optional_message TEXT,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (inviting_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notification_preferences (
    user_id INTEGER PRIMARY KEY NOT NULL,
    notify_new_group_expense BOOLEAN NOT NULL DEFAULT TRUE,
    notify_group_expense_modified BOOLEAN NOT NULL DEFAULT TRUE,
    notify_group_invite BOOLEAN NOT NULL DEFAULT TRUE,
    notify_personal_debt BOOLEAN NOT NULL DEFAULT TRUE,
    send_email_new_group_expense BOOLEAN NOT NULL DEFAULT TRUE,
    send_email_group_invite BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
