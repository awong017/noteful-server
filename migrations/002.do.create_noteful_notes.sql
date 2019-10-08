CREATE TABLE noteful_notes (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    folder TEXT REFERENCES noteful_folders(id)
    ON DELETE SET NULL,
    modified TIMESTAMP DEFAULT now() NOT NULL
);