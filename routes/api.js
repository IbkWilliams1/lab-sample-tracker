const express = require('express');
const router = express.Router();

router.get('/samples', (req, res) => {
  res.json([]);
});

router.post('/samples/batch', (req, res) => {
  console.log('POST /api/samples/batch hit');
  console.log('Received batch payload:', req.body);

  const startingSerial = Number(req.body.startingSerial) || 1200;
  const tankCount = Array.isArray(req.body.tanks) ? req.body.tanks.length : 0;

  return res.status(201).json({
    message: 'Batch sample records received successfully.',
    nextSerial: startingSerial + tankCount
  });
});

module.exports = router;