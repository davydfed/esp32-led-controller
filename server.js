function toggleLed(ledId, state) {
  fetch('/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ led: ledId, state })
  })
    .then(response => {
      if (response.ok) {
        showStatusMessage(`ЛЕД ${ledId.replace('led', '')} ${state === 'on' ? 'увімкнений' : 'вимкнений'}`);
      } else {
        showStatusMessage('Помилка оновлення стану ЛЕД', true);
      }
    })
    .catch(() => {
      showStatusMessage('Сервер недоступний', true);
    });
}

function showStatusMessage(message, isError = false) {
  const statusDiv = document.getElementById('status-message');
  statusDiv.textContent = message;
  statusDiv.style.backgroundColor = isError ? '#e74c3c' : '#4CAF50';
  statusDiv.classList.remove('hidden');

  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 3000);
}
