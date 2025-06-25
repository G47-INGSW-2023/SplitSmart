CREATE TABLE friend_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    invited_user_id INTEGER NOT NULL,
    inviting_user_id INTEGER NOT NULL,
    invite_date TIMESTAMP NOT NULL,
    invite_status TEXT CHECK (invite_status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    FOREIGN KEY (invited_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (inviting_user_id) REFERENCES users(id) ON DELETE CASCADE
);
