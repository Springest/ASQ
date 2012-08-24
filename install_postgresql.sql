CREATE TYPE active AS ENUM ('true','false');
CREATE SEQUENCE asq_queries_sequence;

CREATE TABLE queries (
  id char(5) PRIMARY KEY UNIQUE DEFAULT NEXTVAL('asq_queries_sequence'),
  name varchar(255) NOT NULL,
  query text NOT NULL,
  active active
);