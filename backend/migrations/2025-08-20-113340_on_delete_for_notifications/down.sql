PRAGMA foreign_keys = OFF;

-- Step 1: Rename the current table
ALTER TABLE notifications RENAME TO notifications_new;

-- Step 2: Recreate the original table structure (no ON DELETE SET NULL)
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
    notified_user_id INTEGER NOT NULL,
    notification_type TEXT CHECK (notification_type IN ( 
        'NEW_EXPENSE', 'EXPENSE_DELETED', 'EXPENSE_MODIFIED', 
        'REMOVED_FROM_GROUP', 'GROUP_DELETED', 'ADMIN_PROMOTION', 
        'ADMIN_DEMOTION', 'FRIENDSHIP_REQUEST_ACCEPTED', 'FRIENDSHIP_REQUEST_DENIED')),
    group_id INTEGER,
    user_id INTEGER,
    expense_id INTEGER,
    creation_date TIMESTAMP NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (notified_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (expense_id) REFERENCES expenses(id)
);

-- Step 3: Copy data back
INSERT INTO notifications (
    id, notified_user_id, notification_type, group_id, user_id, 
    expense_id, creation_date, read
)
SELECT 
    id, notified_user_id, notification_type, group_id, user_id, 
    expense_id, creation_date, read
FROM notifications_new;

-- Step 4: Drop the temporary table
DROP TABLE notifications_new;

PRAGMA foreign_keys = ON;

