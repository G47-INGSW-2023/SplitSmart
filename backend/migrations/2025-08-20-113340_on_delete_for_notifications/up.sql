
PRAGMA foreign_keys = OFF;

-- Step 1: Rename the existing table
ALTER TABLE notifications RENAME TO notifications_old;

-- Step 2: Create the new table with updated foreign key
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL
);

-- Step 3: Copy data from old table to new table
INSERT INTO notifications (
    id, notified_user_id, notification_type, group_id, user_id, 
    expense_id, creation_date, read
)
SELECT 
    id, notified_user_id, notification_type, group_id, user_id, 
    expense_id, creation_date, read
FROM notifications_old;

-- Step 4: Drop the old table
DROP TABLE notifications_old;

PRAGMA foreign_keys = ON;



