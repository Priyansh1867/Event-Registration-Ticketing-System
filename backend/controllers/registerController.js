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

    const alreadyRegistered = await pool.query(
      "SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );
    if (alreadyRegistered.rows.length > 0) return res.status(400).json({ message: "Already registered" });

    const ticketCode = uuidv4();
    let status = 'registered';

    if (event.rows[0].available_seats <= 0) {
      status = 'waitlisted';
    } else {
      await pool.query("UPDATE events SET available_seats = available_seats - 1 WHERE event_id = $1", [eventId]);
    }

    const registration = await pool.query(
      "INSERT INTO registrations (user_id, event_id, ticket_code, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, eventId, ticketCode, status]
    );

    res.status(201).json({ 
      message: status === 'waitlisted' ? "Added to waitlist" : "Registered successfully", 
      ticket: registration.rows[0],
      status: status
    });
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
      `SELECT r.reg_id, r.ticket_code, r.status, e.title, e.date, e.time, e.venue, e.category, e.price, u.name, u.email
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
    
    // Only allow download if they are actually registered (not just waitlisted)
    if (ticket.status !== 'registered') {
       return res.status(400).json({ message: "Ticket not available yet (Waitlisted)." });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify.html?code=${ticket.ticket_code}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1 });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=ticket_${ticket.reg_id}.pdf`);
    doc.pipe(res);

    // --- Ticket Background & Borders ---
    const startX = 50;
    const startY = 50;
    const ticketWidth = 500;
    const ticketHeight = 220;
    const stubWidth = 140;

    // Draw main ticket body
    doc.roundedRect(startX, startY, ticketWidth, ticketHeight, 10).fillAndStroke('#ffffff', '#333333');
    // Draw colored header strip
    doc.roundedRect(startX, startY, ticketWidth, 40, 10).fill('#4f46e5');
    // Fill bottom corners of header to make it flat at bottom
    doc.rect(startX, startY + 20, ticketWidth, 20).fill('#4f46e5');

    // Header Text
    doc.fillColor('#ffffff').fontSize(18).text("PREMIUM ADMISSION", startX + 20, startY + 12);
    doc.fontSize(12).text(ticket.category ? ticket.category.toUpperCase() : "GENERAL ENTRY", startX + 350, startY + 16, { width: 130, align: 'right' });

    // Perforation line
    doc.strokeColor('#cccccc').dash(5, { space: 5 });
    doc.moveTo(startX + ticketWidth - stubWidth, startY + 40).lineTo(startX + ticketWidth - stubWidth, startY + ticketHeight).stroke();
    doc.undash();

    // --- Main Body Details ---
    doc.fillColor('#111111').fontSize(24).text(ticket.title, startX + 20, startY + 60, { width: 300 });
    
    doc.fillColor('#555555').fontSize(10);
    doc.text("DATE & TIME", startX + 20, startY + 110);
    doc.fillColor('#222222').fontSize(14).text(`${ticket.date.toISOString().split('T')[0]} | ${ticket.time}`, startX + 20, startY + 125);

    doc.fillColor('#555555').fontSize(10);
    doc.text("LOCATION", startX + 20, startY + 155);
    doc.fillColor('#222222').fontSize(14).text(ticket.venue, startX + 20, startY + 170);

    // Attendee info
    doc.fillColor('#555555').fontSize(10);
    doc.text("ATTENDEE", startX + 220, startY + 110);
    doc.fillColor('#222222').fontSize(14).text(ticket.name, startX + 220, startY + 125);

    doc.fillColor('#555555').fontSize(10);
    doc.text("TICKET TYPE", startX + 220, startY + 155);
    doc.fillColor('#222222').fontSize(14).text(ticket.price && parseFloat(ticket.price) > 0 ? `$${ticket.price}` : "FREE", startX + 220, startY + 170);

    // --- Stub Section ---
    const stubX = startX + ticketWidth - stubWidth;
    // Insert QR code
    const qrImage = qrDataUrl.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(qrImage, "base64");
    doc.image(qrBuffer, stubX + 20, startY + 50, { width: 100 });

    doc.fillColor('#111111').fontSize(9).text(ticket.ticket_code.split('-')[0].toUpperCase(), stubX, startY + 160, { width: stubWidth, align: 'center' });
    
    doc.fillColor('blue').fontSize(8).text("Verify Ticket", stubX, startY + 180, { link: verifyUrl, underline: true, align: 'center', width: stubWidth });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating ticket" });
  }
};

exports.verifyTicket = async (req, res) => {
  const { ticket_code } = req.params;

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

    const reg = registration.rows[0];

    // Delete registration
    await pool.query("DELETE FROM registrations WHERE reg_id = $1", [regId]);

    // If they were actually registered (not waitlisted), we might have a free seat
    if (reg.status === 'registered') {
      // Check if there is someone waitlisted
      const waitlist = await pool.query(
        "SELECT reg_id FROM registrations WHERE event_id = $1 AND status = 'waitlisted' ORDER BY registered_at ASC LIMIT 1",
        [reg.event_id]
      );

      if (waitlist.rows.length > 0) {
        // Promote first waitlisted user
        await pool.query("UPDATE registrations SET status = 'registered' WHERE reg_id = $1", [waitlist.rows[0].reg_id]);
      } else {
        // Restore available seats
        await pool.query("UPDATE events SET available_seats = available_seats + 1 WHERE event_id = $1", [reg.event_id]);
      }
    }

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
