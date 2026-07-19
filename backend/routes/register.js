const express = require("express");
const {
  registerForEvent,
  downloadTicket,
  verifyTicket,
  cancelRegistration,
} = require("../controllers/registerController");
const { authenticate, isAdmin } = require("../middleware/authMiddleware");
const pool = require("../db");

const router = express.Router();

// Register for an event
router.post("/:eventId", authenticate, registerForEvent);

// Download ticket
router.get("/ticket/:regId", authenticate, downloadTicket);

// Verify ticket (Public - for QR code scanning)
router.get("/verify/:ticket_code", verifyTicket);

// Cancel registration
router.delete("/:regId", authenticate, cancelRegistration);

// Get all registrations for the logged-in user
router.get("/my", authenticate, async (req, res) => {
  const userId = req.user.user_id;  // 👈 comes from JWT

  try {
    const result = await pool.query(
      `SELECT r.reg_id, e.title, e.description, e.date, e.time, e.venue, r.ticket_code
       FROM registrations r
       JOIN events e ON r.event_id = e.event_id
       WHERE r.user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching registrations" });
  }
});

module.exports = router;
