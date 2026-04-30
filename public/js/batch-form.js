  const vesselInput = document.getElementById('vessel');
  const operationStageInput = document.getElementById('operationStage');
  const customOperationStageInput = document.getElementById('customOperationStage');
  const relatedPartyInput = document.getElementById('relatedParty');
  const descriptionPreview = document.getElementById('descriptionPreview');
  const tankRowsContainer = document.getElementById('tankRows');
  const messageBox = document.getElementById('messageBox');
  const batchForm = document.getElementById('batchForm');

  // FIX: Disable inputs when "Use tank" is unchecked to bypass HTML5 validation
  tankRowsContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('useTank')) {
      const card = e.target.closest('.tank-card');
      // Select all inputs inside the grid, excluding the read-only Tank Code
      const inputs = card.querySelectorAll('.grid input:not(.tankCode), .grid select, .grid textarea');
      
      inputs.forEach(input => {
        input.disabled = !e.target.checked;
      });
      
      // Visually dim the card to indicate it is inactive
      card.style.opacity = e.target.checked ? '1' : '0.55';
    }
  });

  function getOperationStage() {
    if (operationStageInput.value === 'Other') {
      return customOperationStageInput.value.trim();
    }
    return operationStageInput.value.trim();
  }

  function updatePreview() {
    const vessel = vesselInput.value.trim();
    const operationStage = getOperationStage();
    const relatedParty = relatedPartyInput.value.trim();

    if (!vessel || !operationStage) {
      descriptionPreview.textContent = 'Description preview will appear here.';
      return;
    }

    let text = vessel + ' - ' + operationStage;
    if (relatedParty) {
      text += ' - ' + relatedParty;
    }

    descriptionPreview.textContent = text;
  }

  vesselInput.addEventListener('input', updatePreview);
  operationStageInput.addEventListener('change', updatePreview);
  customOperationStageInput.addEventListener('input', updatePreview);
  relatedPartyInput.addEventListener('input', updatePreview);

  function generateTankCodes() {
    const rowCount = parseInt(document.getElementById('rowCount').value, 10) || 0;
    const slopCount = parseInt(document.getElementById('slopCount').value, 10) || 0;
    const hasPort = document.getElementById('hasPort').checked;
    const hasCenter = document.getElementById('hasCenter').checked;
    const hasStarboard = document.getElementById('hasStarboard').checked;

    const codes = [];

    for (let i = 1; i <= rowCount; i++) {
      if (hasPort) codes.push(i + 'P');
      if (hasCenter) codes.push(i + 'C');
      if (hasStarboard) codes.push(i + 'S');
    }

    for (let i = 1; i <= slopCount; i++) {
      codes.push('SLOP-' + i);
    }

    return codes;
  }

  function renderTankRows() {
    const codes = generateTankCodes();
    const prefix = document.getElementById('labPrefix').value.trim();
    const suffix = document.getElementById('labSuffix').value.trim();
    const startingSerial = parseInt(document.getElementById('startingSerial').value, 10) || 0;

    if (!codes.length) {
      tankRowsContainer.innerHTML = '<p>No tank rows generated yet.</p>';
      return;
    }

    tankRowsContainer.innerHTML = codes.map((code, index) => {
      const previewLabId = prefix && suffix && startingSerial
        ? prefix + '/' + (startingSerial + index) + '/' + suffix
        : 'Lab ID preview unavailable';

      return `
        <div class="tank-card" data-code="${code}">
          <div class="use-row">
            <input type="checkbox" class="useTank" id="useTank_${index}" checked />
            <label for="useTank_${index}"><strong>Use tank ${code}</strong></label>
          </div>

          <div class="preview">Planned Lab ID: ${previewLabId}</div>

          <div class="grid">
            <div>
              <label>Tank / Source</label>
              <input type="text" class="tankCode" value="${code}" readonly />
            </div>

            <div>
              <label>Seal Number</label>
              <input type="text" class="sealNumber" placeholder="Seal number" />
            </div>

            <div>
              <label>Sample Volume</label>
              <input type="text" class="sampleVolume" placeholder="e.g. 1 L or 500 mL" required />
            </div>

            <div>
              <label>Rack</label>
              <input type="text" class="rack" placeholder="e.g. R1" required />
            </div>

            <div>
              <label>Shelf</label>
              <input type="text" class="shelf" placeholder="e.g. S2" required />
            </div>

            <div>
              <label>Position</label>
              <input type="text" class="position" placeholder="e.g. P4" required />
            </div>

            <div>
              <label>Status</label>
              <select class="status">
                <option value="In Store">In Store</option>
                <option value="Retrieved for Test">Retrieved for Test</option>
                <option value="Returned">Returned</option>
                <option value="Disposed">Disposed</option>
              </select>
            </div>

            <div style="grid-column: 1 / -1;">
              <label>Remarks</label>
              <textarea class="remarks" rows="2" placeholder="Optional remarks"></textarea>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('generateTanksBtn').addEventListener('click', renderTankRows);
  document.getElementById('startingSerial').addEventListener('input', renderTankRows);
  document.getElementById('labPrefix').addEventListener('input', renderTankRows);
  document.getElementById('labSuffix').addEventListener('input', renderTankRows);

  batchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const vessel = vesselInput.value.trim();
    const operationStage = getOperationStage();
    const relatedParty = relatedPartyInput.value.trim();
    const sampleDescription = operationStage && vessel
      ? (relatedParty ? `${vessel} - ${operationStage} - ${relatedParty}` : `${vessel} - ${operationStage}`)
      : '';

    const tankCards = Array.from(document.querySelectorAll('.tank-card'));
    const selectedTanks = tankCards
      .filter(card => card.querySelector('.useTank').checked)
      .map(card => ({
        source: card.querySelector('.tankCode').value.trim(),
        sealNumber: card.querySelector('.sealNumber').value.trim(),
        sampleVolume: card.querySelector('.sampleVolume').value.trim(),
        rack: card.querySelector('.rack').value.trim(),
        shelf: card.querySelector('.shelf').value.trim(),
        position: card.querySelector('.position').value.trim(),
        status: card.querySelector('.status').value,
        remarks: card.querySelector('.remarks').value.trim()
      }));

    if (!selectedTanks.length) {
      messageBox.style.display = 'block';
      messageBox.className = 'message error';
      messageBox.textContent = 'Please generate and select at least one tank row.';
      return;
    }

    const payload = {
      date: document.getElementById('date').value,
      labPrefix: document.getElementById('labPrefix').value.trim(),
      labSuffix: document.getElementById('labSuffix').value.trim(),
      startingSerial: parseInt(document.getElementById('startingSerial').value, 10),
      vessel,
      operationStage,
      relatedParty,
      sampleDescription,
      client: document.getElementById('client').value.trim(),
      cargo: document.getElementById('cargo').value.trim(),
      port: document.getElementById('port').value,
      dateSampled: document.getElementById('dateSampled').value,
      dateReceived: document.getElementById('dateReceived').value,
      samplingMethod: document.getElementById('samplingMethod').value,
      chemist: document.getElementById('chemist').value.trim(),
      surveyor: document.getElementById('surveyor').value.trim(),
      tanks: selectedTanks
    };

    try {
      const response = await fetch('/api/samples/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      messageBox.style.display = 'block';

      if (response.ok) {
        messageBox.className = 'message success';
        messageBox.textContent = data.message;
        batchForm.reset();
        descriptionPreview.textContent = 'Description preview will appear here.';
        tankRowsContainer.innerHTML = '<p>No tank rows generated yet.</p>';
        document.getElementById('labPrefix').value = 'INSP/04';
        document.getElementById('labSuffix').value = 'TG26';
        document.getElementById('startingSerial').value = data.nextSerial;
      } else {
        messageBox.className = 'message error';
        messageBox.textContent = data.message || 'Failed to save batch.';
      }
    } catch (error) {
      messageBox.style.display = 'block';
      messageBox.className = 'message error';
      messageBox.textContent = 'Server error. Please try again.';
    }
  });
