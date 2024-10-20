const sqlite3 = require('sqlite3').verbose();

// Connect to the SQLite database
const db = new sqlite3.Database('../mydb.sqlite', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Begin transaction
        db.serialize(() => {
            // Create a new table with the desired schema
            db.run(`CREATE TABLE IF NOT EXISTS login_details_new (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_name TEXT NOT NULL,
                password TEXT NOT NULL,
                created_date DATE NOT NULL
            )`, (err) => {
                if (err) {
                    console.log('Error creating login_details_new table ' + err.message);
                } else {
                    console.log('Table login_details_new created.');
                }
            });

            // // Copy data from the old login_details table to the new table
            // db.run(`INSERT INTO login_details_new (user_id, user_name, password, created_date)
            //         SELECT user_id, user_name, password, created_date
            //         FROM login_details`, (err) => {
            //     if (err) {
            //         console.log('Error copying data to login_details_new table ' + err.message);
            //     } else {
            //         console.log('Table values to new table');
            //     }
            // });

            // // Drop the old login_details table
            // db.run(`DROP TABLE login_details`, (err) => {
            //     if (err) {
            //         console.log('Error dropping login_details table ' + err.message);
            //     }
            // });

            // Rename the new table to the original table name
            db.run(`ALTER TABLE login_details_new RENAME TO login_details`, (err) => {
                if (err) {
                    console.log('Error renaming login_details_new to login_details ' + err.message);
                }
            });

            // Repeat the process for the my_task_details table
            db.run(`CREATE TABLE IF NOT EXISTS my_task_details_new (
                task_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                task_name TEXT NOT NULL,
                description TEXT NOT NULL,
                created_date DATE NOT NULL,
                deadline_date DATE NOT NULL,
                modified_date DATE,
                status TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES login_details(user_id)
            )`, (err) => {
                if (err) {
                    console.log('Error creating my_task_details_new table ' + err.message);
                } else {
                    console.log('Table my_task_details_new created.');
                }
            });

            db.run(`INSERT INTO my_task_details_new (task_id, user_id, task_name, created_date, deadline_date, modified_date, status)
                    SELECT task_id, user_id, task_name, created_date, deadline_date, modified_date, status
                    FROM my_task_details`, (err) => {
                if (err) {
                    console.log('Error copying data to my_task_details_new table ' + err.message);
                }
            });

            db.run(`DROP TABLE my_task_details`, (err) => {
                if (err) {
                    console.log('Error dropping my_task_details table ' + err.message);
                }
            });

            db.run(`ALTER TABLE my_task_details_new RENAME TO my_task_details`, (err) => {
                if (err) {
                    console.log('Error renaming my_task_details_new to my_task_details ' + err.message);
                }
            });
        });

        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing the database ' + err.message);
            } else {
                console.log('Closed the database connection.');
            }
        });
    }
});