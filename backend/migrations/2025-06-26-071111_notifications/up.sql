-- Your SQL goes here
DROP TABLE IF EXISTS notifications;

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
    notified_user_id INTEGER NOT NULL,
    notification_type TEXT CHECK (notification_type IN ( 'NEW_EXPENSE',  'EXPENSE_DELETED','EXPENSE_MODIFIED', 'REMOVED_FROM_GROUP', 'GROUP_DELETED', 'ADMIN_PROMOTION', 'ADMIN_DEMOTION','FRIENDSHIP_REQUEST_ACCEPTED','FRIENDSHIP_REQUEST_DENIED')),
    group_id INTEGER,
    user_id INTEGER,
    expense_id INTEGER,
    creation_date TIMESTAMP NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (notified_user_id) REFERENCES users(id) ON DELETE CASCADE
    FOREIGN KEY (user_id) REFERENCES users(id) 
    FOREIGN KEY (group_id) REFERENCES groups(id) 
    FOREIGN KEY (expense_id) REFERENCES expenses(id) 
);
