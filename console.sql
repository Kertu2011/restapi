DROP TRIGGER IF EXISTS todo_update_updated_at_trigger ON todo;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS todo;
DROP TABLE IF EXISTS users; -- Quoted here in DROP to be explicit, matching potential mixed case from previous runs.

CREATE TABLE users ( -- Using quotes here to maintain compatibility if previous version was created with quotes.
                       id SERIAL PRIMARY KEY,
                       username VARCHAR(191) NOT NULL UNIQUE,
                       password VARCHAR(191) NOT NULL
);

CREATE TABLE todo (
                      id SERIAL PRIMARY KEY,
                      title VARCHAR(255) NOT NULL,
                      description TEXT NULL,
                      completed BOOLEAN NOT NULL DEFAULT false,
                      created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      user_id INTEGER NOT NULL,
                      CONSTRAINT todo_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todo_update_updated_at_trigger
    BEFORE UPDATE ON todo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

WITH inserted_user AS (
INSERT INTO users (username, "password") -- "password" is also a keyword in some SQL dialects, safer to quote if any doubt or keep as is if known to be fine.
VALUES ('kertu', '$2b$10$lK9fOjcq03huqMLLCrC/Y.bU1voQH.0RnDknLPq5KofLWoInl0qA2')
    RETURNING id
    )
INSERT INTO todo (title, description, completed, user_id)
VALUES
    ('Buy groceries', 'Milk, Bread, Cheese, Eggs', false, (SELECT id FROM inserted_user)),
    ('Finish project report', 'Complete the final sections and review.', false, (SELECT id FROM inserted_user)),
    ('Schedule dentist appointment', NULL, true, (SELECT id FROM inserted_user)),
    ('Read a book', 'Chapter 3 of "The Great Gatsby"', false, (SELECT id FROM inserted_user)),
    ('Go for a run', '30 minutes morning run', true, (SELECT id FROM inserted_user));

DO $$
    DECLARE
target_user_id INT;
BEGIN
SELECT id INTO target_user_id FROM users WHERE username = 'kertu' LIMIT 1;

IF FOUND THEN
            FOR i IN 1..45 LOOP
            INSERT INTO todo (title, description, completed, user_id)
            VALUES
                ('Task ' || i, 'Description for task ' || i, (i % 2 = 0), target_user_id);
END LOOP;
ELSE
            RAISE NOTICE 'User kertu not found, additional todos not seeded by loop.';
END IF;
END $$;