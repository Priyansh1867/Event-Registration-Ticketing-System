const pool = require("../db");
const { v4: uuidv4 } = require("uuid");   // ✅ keep only one
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");


exports.registerForEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.user_id;

  try {
    const event = await pool.query("SELECT * FROM events WHERE event_id = $1", [eventId]);
    if (event.rows.length === 0) return res.status(404).json({ message: "Event not found" });

    if (event.rows[0].available_seats <= 0) return res.status(400).json({ message: "No seats available" });

    const alreadyRegistered = await pool.query(
      "SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );
    if (alreadyRegistered.rows.length > 0) return res.status(400).json({ message: "Already registered" });

    const ticketCode = uuidv4();
    const registration = await pool.query(
      "INSERT INTO registrations (user_id, event_id, ticket_code) VALUES ($1, $2, $3) RETURNING *",
      [userId, eventId, ticketCode]
    );

    await pool.query("UPDATE events SET available_seats = available_seats - 1 WHERE event_id = $1", [eventId]);

    res.status(201).json({ message: "Registered successfully", ticket: registration.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.downloadTicket = async (req, res) => {
  const { regId } = req.params;
  const userId = req.user.user_id;

  try {
    const registration = await pool.query(
      `SELECT r.reg_id, r.ticket_code, e.title, e.date, e.time, e.venue, u.name, u.email
       FROM registrations r
       JOIN events e ON r.event_id = e.event_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.reg_id = $1 AND r.user_id = $2`,
      [regId, userId]
    );

    if (registration.rows.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const ticket = registration.rows[0];

    // Verification URL
    const verifyUrl = `http://localhost:3000/verify.html?code=${ticket.ticket_code}`;

    // Generate QR code (base64 image) pointing to verify URL
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);

    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=ticket_${ticket.reg_id}.pdf`);
    doc.pipe(res);

    doc.fontSize(22).text("🎟 Event Ticket", { align: "center" });
    doc.moveDown();

    doc.fontSize(16).text(`Event: ${ticket.title}`);
    doc.text(`Date: ${ticket.date}`);
    doc.text(`Time: ${ticket.time}`);
    doc.text(`Venue: ${ticket.venue}`);
    doc.moveDown();

    doc.text(`Name: ${ticket.name}`);
    doc.text(`Email: ${ticket.email}`);
    doc.moveDown();

    doc.text(`Ticket Code: ${ticket.ticket_code}`);
    doc.text(`Verify Link: ${verifyUrl}`, { link: verifyUrl, underline: true, color: 'blue' });

    // Insert QR code
    const qrImage = qrDataUrl.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(qrImage, "base64");
    doc.image(qrBuffer, { fit: [150, 150], align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating ticket" });
  }
};

exports.verifyTicket = async (req, res) => {
  const { ticket_code } = req.body;

  try {
    const ticket = await pool.query(
      `SELECT r.ticket_code, e.title, e.date, e.venue, u.name, u.email
       FROM registrations r
       JOIN events e ON r.event_id = e.event_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.ticket_code = $1`,
      [ticket_code]
    );

    if (ticket.rows.length === 0) {
      return res.status(404).json({ valid: false, message: "Invalid ticket" });
    }

    res.json({
      valid: true,
      message: "Ticket verified ✅",
      ticket: ticket.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying ticket" });
  }
};

exports.cancelRegistration = async (req, res) => {
  const { regId } = req.params;
  const userId = req.user.user_id;

  try {
    const registration = await pool.query(
      "SELECT * FROM registrations WHERE reg_id = $1 AND user_id = $2",
      [regId, userId]
    );

    if (registration.rows.length === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Restore available seats
    await pool.query("UPDATE events SET available_seats = available_seats + 1 WHERE event_id = $1", [
      registration.rows[0].event_id,
    ]);

    // Delete registration
    await pool.query("DELETE FROM registrations WHERE reg_id = $1", [regId]);

    res.json({ message: "Registration canceled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error canceling registration" });
  }
};

exports.getMyRegistrations = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT r.reg_id, r.ticket_code, r.registered_at,
              e.title, e.date, e.time, e.venue
       FROM registrations r
       JOIN events e ON r.event_id = e.event_id
       WHERE r.user_id = $1
       ORDER BY r.registered_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching registrations" });
  }
};
