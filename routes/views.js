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
    const {
      q = '',
      vessel = '',
      client = '',
      cargo = '',
      status = '',
      location = ''
    } = req.query;

    let sql = 'SELECT * FROM samples WHERE 1=1';
    const params = [];

    if (q.trim()) {
      sql += ' AND (labId LIKE ? OR sampleDescription LIKE ?)';
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }

    if (vessel.trim()) {
      sql += ' AND vessel LIKE ?';
      params.push(`%${vessel.trim()}%`);
    }

    if (client.trim()) {
      sql += ' AND client LIKE ?';
      params.push(`%${client.trim()}%`);
    }

    if (cargo.trim()) {
      sql += ' AND cargo LIKE ?';
      params.push(`%${cargo.trim()}%`);
    }

    if (status.trim()) {
      sql += ' AND status = ?';
      params.push(status.trim());
    }

    if (location.trim()) {
      sql += ' AND currentLocation LIKE ?';
      params.push(`%${location.trim()}%`);
    }

    sql += ' ORDER BY id DESC';

    const samples = await all(sql, params);

    res.render('dashboard', {
      samples,
      filters: { q, vessel, client, cargo, status, location }
    });
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    res.render('dashboard', {
      samples: [],
      filters: { q: '', vessel: '', client: '', cargo: '', status: '', location: '' }
    });
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