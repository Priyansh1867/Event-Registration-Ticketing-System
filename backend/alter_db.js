const pool = require('./db');

async function updateSchema() {
  try {
    // Add columns to events table if they don't exist
    await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General'`);
    await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00`);
    await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'`);

    // Add status to registrations if it doesn't exist
    await pool.query(`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'registered'`);

    console.log("Schema updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating schema:", err);
    process.exit(1);
  }
}

updateSchema();
