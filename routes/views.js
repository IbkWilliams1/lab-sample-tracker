const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');

function extractSerial(labId) {
  if (!labId) return null;

  const parts = labId.split('/');
  if (parts.length < 3) return null;

  const serial = Number(parts[parts.length - 2]);
  return Number.isFinite(serial) ? serial : null;
}

router.get('/', async (req, res) => {
  try {
    const rows = await all('SELECT labId FROM samples');
    const serials = rows
      .map(row => extractSerial(row.labId))
      .filter(value => value !== null);

    const nextSerial = serials.length ? Math.max(...serials) + 1 : 1200;

    res.render('index', { nextSerial });
  } catch (error) {
    console.error('Failed to load next serial:', error);
    res.render('index', { nextSerial: 1200 });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const samples = await all('SELECT * FROM samples ORDER BY id DESC');
    res.render('dashboard', { samples });
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    res.render('dashboard', { samples: [] });
  }
});

router.get('/samples/:id', async (req, res) => {
  try {
    const sample = await get('SELECT * FROM samples WHERE id = ?', [req.params.id]);

    if (!sample) {
      return res.status(404).send('Sample not found');
    }

    const movements = await all(
      'SELECT * FROM sample_movements WHERE sampleId = ? ORDER BY id DESC',
      [req.params.id]
    );

    res.render('sample-details', { sample, movements });
  } catch (error) {
    console.error('Failed to load sample details:', error);
    res.status(500).send('Failed to load sample details');
  }
});

module.exports = router;