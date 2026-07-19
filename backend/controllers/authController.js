const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userCount = await pool.query("SELECT COUNT(*) FROM users");
    const assignedRole = userCount.rows[0].count === "0" ? "admin" : (role || "student");

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role",
      [name, email, hashedPassword, assignedRole]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { user_id: user.rows[0].user_id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.rows[0].user_id,
        name: user.rows[0].name,
        role: user.rows[0].role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const user = await pool.query("SELECT user_id, name, email, role FROM users WHERE user_id = $1", [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.user_id;
  const { name, email, password } = req.body;

  try {
    // Check if email is already taken by someone else
    const emailCheck = await pool.query("SELECT user_id FROM users WHERE email = $1 AND user_id != $2", [email, userId]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email is already in use by another account" });
    }

    let query = "UPDATE users SET name = $1, email = $2";
    let values = [name, email];
    let paramCount = 3;

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = $3`;
      values.push(hashedPassword);
      paramCount = 4;
    }

    query += ` WHERE user_id = $${paramCount} RETURNING user_id, name, email, role`;
    values.push(userId);

    const updatedUser = await pool.query(query, values);

    res.json({ message: "Profile updated successfully", user: updatedUser.rows[0] });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};
