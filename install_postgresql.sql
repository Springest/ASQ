CREATE TYPE active AS ENUM ('true','false');
CREATE SEQUENCE asq_queries_sequence;

CREATE TABLE queries (
  id INT4 DEFAULT NEXTVAL('asq_queries_sequence') PRIMARY KEY,
  name varchar(255) NOT NULL,
  query text NOT NULL,
  active boolean DEFAULT true NOT NULL
);

