const pool = require("../db");

// =======================
// Create Event (Admin only)
// =======================
exports.createEvent = async (req, res) => {
  const { title, description, date, time, venue, total_seats, category, price, image_url } = req.body;
  const userId = req.user.user_id;

  const defaultImages = {
    'Music': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
    'Tech': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
    'Workshop': 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&q=80',
    'General': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'
  };

  const finalCategory = category || 'General';
  const finalImageUrl = image_url && image_url.trim() !== '' 
      ? image_url 
      : (defaultImages[finalCategory] || defaultImages['General']);

  try {
    const event = await pool.query(
      `INSERT INTO events 
       (title, description, date, time, venue, total_seats, available_seats, created_by, category, price, image_url) 
       VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10) RETURNING *`,
      [title, description, date, time, venue, total_seats, userId, finalCategory, price || 0.00, finalImageUrl]
    );

    res.status(201).json(event.rows[0]);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Get All Events (Public)
// =======================
exports.getEvents = async (req, res) => {
  try {
    const events = await pool.query("SELECT * FROM events ORDER BY date ASC");
    res.json(events.rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Get Single Event by ID (Public)
// =======================
exports.getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await pool.query("SELECT * FROM events WHERE event_id = $1", [id]);
    if (event.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event.rows[0]);
  } catch (err) {
    console.error("Error fetching event by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// Update Event (Admin only)
// =======================
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, date, time, venue, total_seats, available_seats, category, price, image_url } = req.body;

  try {
    const result = await pool.query("SELECT * FROM events WHERE event_id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = result.rows[0];

    const updatedEvent = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, date = $3, time = $4, venue = $5, total_seats = $6, available_seats = $7, category = $9, price = $10, image_url = $11
       WHERE event_id = $8 RETURNING *`,
      [
        title ?? event.title,
        description ?? event.description,
        date ?? event.date,
        time ?? event.time,
        venue ?? event.venue,
        total_seats ?? event.total_seats,
        available_seats ?? event.available_seats,
        id,
        category ?? event.category,
        price ?? event.price,
        image_url ?? event.image_url
      ]
    );

    res.json(updatedEvent.rows[0]);
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ message: "Error updating event" });
  }
};

// =======================
// Delete Event (Admin only)
// =======================
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await pool.query("DELETE FROM events WHERE event_id = $1 RETURNING *", [id]);
    if (event.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ message: "Error deleting event" });
  }
};
