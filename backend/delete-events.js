require('dotenv').config();
const pool = require('./db');

async function deleteEvents() {
  try {
    const eventsToDelete = await pool.query(
      `SELECT event_id FROM events WHERE title IN ($1, $2)`,
      ['Cricket Tournament', 'Puzzle Mania']
    );
    
    if (eventsToDelete.rows.length > 0) {
        const eventIds = eventsToDelete.rows.map(r => r.event_id);
        
        // Delete registrations first
        await pool.query(
            `DELETE FROM registrations WHERE event_id = ANY($1)`,
            [eventIds]
        );
        
        // Delete events
        const res = await pool.query(
            `DELETE FROM events WHERE event_id = ANY($1) RETURNING title`,
            [eventIds]
        );
        
        console.log(`Deleted ${res.rowCount} events:`, res.rows.map(r => r.title));
    } else {
        console.log("No events found to delete.");
    }
  } catch (err) {
    console.error("Error deleting events:", err);
  } finally {
    pool.end();
  }
}

deleteEvents();
