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


ALTER TABLE  users
DROP COLUMN notification_preferences;

ALTER TABLE  users
ADD COLUMN notification_preferences TEXT;
