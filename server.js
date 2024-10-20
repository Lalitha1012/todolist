const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const SECRET_KEY = "your_secret_key"; // Replace with a secure secret key
const db = new sqlite3.Database("./mydb.sqlite");
const PORT = 5000; // Explicitly set the port to 5000

app.use(express.json());
app.use(cors()); // Enable CORS for all routes

app.use(express.static(process.cwd()+"/my-todo-app/build/"));

function formatDate(date) {
  return date.toISOString().split("T")[0]; // Convert to "YYYY-MM-DD"
}

// User Registration API

app.post("/api/register", async (req, res) => {
  const { user_name, password } = req.body;

  try {
    // Validate inputs
    if (!isValidEmail(user_name)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({
          message: "Password does not meet the complexity requirements.",
        });
    }

    // Example: Insert into database
    await createUser(user_name, password)
      .then(() => res.status(201).json({ message: "Signup successful" }))
      .catch((err) => {
        console.error("Error during signup:", error.message || error);
        res
          .status(500)
          .json({ message: "Internal server error. Please try again later." });
      }); // Ensure this function is correct
  } catch (error) {
    console.error("Error during signup:", error.message || error);
    res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
    password
  );
}

async function createUser(email, password) {
  try {
    // Hash the password before storing it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Get the current date for created_date
    const createdDate = new Date().toISOString().split('T')[0]; // Format the date as YYYY-MM-DD

    // Insert the new user into the login_details_new table
    db.run(`INSERT INTO login_details (user_name, password, created_date) VALUES (?, ?, ?)`, 
        [email, hashedPassword, createdDate], function(err) {
            if (err) {
                console.error('Error creating user:', err.message);
                throw new Error('Could not create user'); // Re-throw the error for the caller to handle
            } else {
                console.log(`User created with ID: ${this.lastID}`);
            }
        });
} catch (error) {
    console.error('Error in createUser function:', error.message);
    throw error;
}
}

// User Login API
app.post("/api/login", (req, res) => {
  const { user_name, password } = req.body;

  db.get(
    `SELECT * FROM login_details WHERE user_name = ?`,
    [user_name],
    (err, user) => {
      if (err || !user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.user_id }, SECRET_KEY, {
        expiresIn: "1h",
      });
      res.json({ token });
    }
  );
});

// Middleware to verify the token
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const token = bearerHeader.split(" ")[1];
    jwt.verify(token, SECRET_KEY, (err, authData) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }
      req.userId = authData.userId;
      next();
    });
  } else {
    res.status(403).json({ error: "Token required" });
  }
}

// Add Task API
app.post("/api/tasks", verifyToken, (req, res) => {
  const { task_name,description, deadline_date, status } = req.body;
  const created_date = formatDate(new Date());
  const modified_date = created_date;
  const user_id = req.userId;
  try {
    db.run(
      `INSERT INTO my_task_details (user_id, task_name,description, created_date, deadline_date, modified_date, status) VALUES (?, ?,?, ?, ?, ?, ?)`,
      [user_id, task_name,description, created_date, deadline_date, modified_date, status],
      function (err) {
        if (err) {
          return res
            .status(400)
            .json({ error: "Task creation failed", details: err.message });
        }
        res.json({ message: "Task created successfully!" });
      }
    );
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Get User Tasks API
app.get("/api/tasks", verifyToken, (req, res) => {
  const user_id = req.userId;

  db.all(
    `SELECT * FROM my_task_details WHERE user_id = ?`,
    [user_id],
    (err, rows) => {
      if (err) {
        return res
          .status(400)
          .json({ error: "Failed to retrieve tasks", details: err.message });
      }
      res.json(rows);
    }
  );
});

// Get Specific Task API
app.get("/api/tasks/:task_id", verifyToken, (req, res) => {
  const user_id = req.userId;
  const task_id = req.params.task_id;

  db.get(
    `SELECT * FROM my_task_details WHERE user_id = ? AND task_id = ?`,
    [user_id, task_id],
    (err, row) => {
      if (err) {
        return res
          .status(400)
          .json({ error: "Failed to retrieve task", details: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(row);
    }
  );
});

// Update Task API
app.put("/api/tasks/:task_id", verifyToken, (req, res) => {
  const { task_name,description, deadline_date, status } = req.body;
  const modified_date = formatDate(new Date());
  const task_id = req.params.task_id;
  const user_id = req.userId;

  db.run(
    `UPDATE my_task_details SET task_name = ?,description=?, deadline_date = ?, modified_date = ?, status = ? WHERE task_id = ? AND user_id = ?`,
    [task_name, description,deadline_date, modified_date, status, task_id, user_id],
    function (err) {
      if (err) {
        return res
          .status(400)
          .json({ error: "Task update failed", details: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ error: "Task not found or not authorized" });
      }
      res.json({ message: "Task updated successfully!" });
    }
  );
});

// Delete Task API
app.delete("/api/tasks/:task_id", verifyToken, (req, res) => {
  const task_id = req.params.task_id;
  const user_id = req.userId;

  db.run(
    `DELETE FROM my_task_details WHERE task_id = ? AND user_id = ?`,
    [task_id, user_id],
    function (err) {
      if (err) {
        return res
          .status(400)
          .json({ error: "Error deleting task", details: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ error: "Task not found or not authorized" });
      }
      res.json({ message: "Task deleted successfully!" });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
