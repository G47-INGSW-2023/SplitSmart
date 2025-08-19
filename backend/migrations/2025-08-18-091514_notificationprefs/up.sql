DROP TABLE IF EXISTS notification_preferences;

ALTER TABLE  users
DROP COLUMN notification_preferences;

ALTER TABLE  users
ADD COLUMN notification_preferences TEXT CHECK (notification_preferences IN('SILENCED','PERSONAL','ALL'))  ;
