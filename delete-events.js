require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function deleteEvents() {
  try {
    const res = await pool.query(
      `DELETE FROM events WHERE title IN ($1, $2) RETURNING title`,
      ['Cricket Tournament', 'Puzzle Mania']
    );
    console.log(`Deleted ${res.rowCount} events:`, res.rows.map(r => r.title));
  } catch (err) {
    console.error("Error deleting events:", err);
  } finally {
    pool.end();
  }
}

deleteEvents();
