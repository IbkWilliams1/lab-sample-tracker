const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');

function extractSerial(labId) {
  if (!labId) return null;

  const parts = labId.split('/');
  if (parts.length < 3) return null;

  const serial = Number(parts[parts.length - 2]);
  return Number.isFinite(serial) ? serial : null;
}

async function getNextSerialFromDb() {
  const rows = await all('SELECT labId FROM samples');
  const serials = rows
    .map(row => extractSerial(row.labId))
    .filter(value => value !== null);

  return serials.length ? Math.max(...serials) + 1 : 1200;
}

router.get('/samples', async (req, res) => {
  try {
    const samples = await all('SELECT * FROM samples ORDER BY id DESC');
    res.json(samples);
  } catch (error) {
    console.error('Failed to fetch samples:', error);
    res.status(500).json({ message: 'Failed to load samples.' });
  }
});

router.post('/samples/batch', async (req, res) => {
  try {
    const {
      date,
      labPrefix,
      labSuffix,
      vessel,
      operationStage,
      relatedParty,
      sampleDescription,
      client,
      cargo,
      port,
      dateSampled,
      dateReceived,
      samplingMethod,
      chemist,
      surveyor,
      tanks
    } = req.body;

    if (
      !date ||
      !labPrefix ||
      !labSuffix ||
      !vessel ||
      !operationStage ||
      !sampleDescription ||
      !client ||
      !cargo ||
      !port ||
      !dateSampled ||
      !dateReceived ||
      !samplingMethod ||
      !chemist ||
      !Array.isArray(tanks) ||
      !tanks.length
    ) {
      return res.status(400).json({
        message: 'All required batch fields must be completed.'
      });
    }

    await run('BEGIN IMMEDIATE TRANSACTION');

    try {
      let nextSerial = await getNextSerialFromDb();
      let createdCount = 0;

      for (let i = 0; i < tanks.length; i++) {
        const tank = tanks[i];

        if (
          !tank.source ||
          !tank.sampleVolume ||
          !tank.rack ||
          !tank.shelf ||
          !tank.position ||
          !tank.status
        ) {
          throw new Error(
            'Every selected tank row must have tank, sample volume, rack, shelf, position, and status.'
          );
        }

        const recordLabId = `${labPrefix}/${nextSerial}/${labSuffix}`;

        await run(
          `
          INSERT INTO samples (
            date, labId, vessel, operationStage, relatedParty, sampleDescription,
            client, cargo, source, port, sealNumber, dateSampled, dateReceived,
            sampleVolume, samplingMethod, chemist, surveyor, rack, shelf, position,
            status, remarks, loggedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            date,
            recordLabId,
            vessel,
            operationStage,
            relatedParty || '',
            sampleDescription,
            client,
            cargo,
            tank.source,
            port,
            tank.sealNumber || '',
            dateSampled,
            dateReceived,
            tank.sampleVolume,
            samplingMethod,
            chemist,
            surveyor || '',
            tank.rack,
            tank.shelf,
            tank.position,
            tank.status,
            tank.remarks || '',
            new Date().toLocaleString()
          ]
        );

        createdCount++;
        nextSerial++;
      }

      await run('COMMIT');

      return res.status(201).json({
        message: `${createdCount} batch sample record(s) saved successfully.`,
        nextSerial
      });
    } catch (innerError) {
      await run('ROLLBACK');

      if (
        innerError.message &&
        innerError.message.includes('Every selected tank row')
      ) {
        return res.status(400).json({ message: innerError.message });
      }

      if (
        innerError.message &&
        innerError.message.includes('UNIQUE constraint failed')
      ) {
        return res.status(409).json({
          message: 'Duplicate Lab ID detected. This Lab ID has already been used.'
        });
      }

      throw innerError;
    }
  } catch (error) {
    console.error('Failed to save batch:', error);
    return res.status(500).json({
      message: 'Server error. Failed to save batch.'
    });
  }
});

router.post('/samples/:id/movements', async (req, res) => {
  try {
    const sampleId = req.params.id;
    const {
      movementType,
      fromLocation,
      toLocation,
      quantityMoved,
      quantityReturned,
      remainingQuantity,
      unit,
      note
    } = req.body;

    const sample = await get('SELECT * FROM samples WHERE id = ?', [sampleId]);

    if (!sample) {
      return res.status(404).json({ message: 'Sample not found.' });
    }

    if (!movementType) {
      return res.status(400).json({ message: 'Movement type is required.' });
    }

    await run('BEGIN IMMEDIATE TRANSACTION');

    try {
      let newStatus = sample.status;

      if (movementType === 'TRANSFERRED_TO_LAGOS') newStatus = 'Moved to Lagos';
      else if (movementType === 'TRANSFERRED_TO_LOME') newStatus = 'Moved to Lomé';
      else if (movementType === 'RETRIEVED_FOR_TEST') newStatus = 'Retrieved for Test';
      else if (movementType === 'RETURNED_TO_STORE') newStatus = 'Returned to Store';
      else if (movementType === 'CONSUMED_IN_TEST') newStatus = 'Consumed in Test';
      else if (movementType === 'DISPOSED') newStatus = 'Disposed';

      await run(
        `
        INSERT INTO sample_movements (
          sampleId, movementType, fromLocation, toLocation,
          quantityMoved, quantityReturned, remainingQuantity,
          unit, note, movedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          sampleId,
          movementType,
          fromLocation || '',
          toLocation || '',
          quantityMoved || null,
          quantityReturned || null,
          remainingQuantity || null,
          unit || '',
          note || '',
          new Date().toLocaleString()
        ]
      );

      await run(
        `
        UPDATE samples
        SET
          status = ?,
          currentQuantity = ?,
          quantityUnit = ?,
          currentLocation = ?,
          movementCount = COALESCE(movementCount, 0) + 1
        WHERE id = ?
        `,
        [
          newStatus,
          remainingQuantity || sample.currentQuantity || null,
          unit || sample.quantityUnit || '',
          toLocation || sample.currentLocation || '',
          sampleId
        ]
      );

      await run('COMMIT');

      return res.json({
        message: 'Sample movement logged successfully.',
        newStatus
      });
    } catch (innerError) {
      await run('ROLLBACK');
      throw innerError;
    }
  } catch (error) {
    console.error('Failed to log movement:', error);
    return res.status(500).json({
      message: 'Failed to log movement.'
    });
  }
});

module.exports = router;