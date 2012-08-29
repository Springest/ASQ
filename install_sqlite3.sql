CREATE TABLE queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name varchar(255) NOT NULL,
  query text NOT NULL,
  active enum NOT NULL DEFAULT 'true'
);