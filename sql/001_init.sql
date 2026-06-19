CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.books (
  book_id serial PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.borrows (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES app.users(id),
  book_id integer NOT NULL REFERENCES app.books(book_id),
  borrowed_at timestamptz NOT NULL DEFAULT now(),
  due_date date NOT NULL,
  returned_at timestamptz
);

INSERT INTO app.books (title, author, available)
VALUES
  ('Node.js Zero to Hero', 'Course Team', true),
  ('Database System Concepts', 'Silberschatz et al.', true)
ON CONFLICT DO NOTHING;