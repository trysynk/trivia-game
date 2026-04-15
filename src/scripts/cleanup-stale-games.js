require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/env');
const { Game } = require('../models');

const STALE_HOURS = parseInt(process.env.STALE_GAME_HOURS) || 48;

async function cleanup() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

    const result = await Game.updateMany(
      {
        status: 'in_progress',
        lastActivityAt: { $lt: cutoff }
      },
      {
        $set: { status: 'abandoned', endedAt: new Date() }
      }
    );

    console.log(`Marked ${result.modifiedCount} stale games as abandoned (inactive > ${STALE_HOURS}h)`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    process.exit(1);
  }
}

cleanup();
