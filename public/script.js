const root = document.getElementById('root');
const statusMessage = document.getElementById('status-message');
const refreshBtn = document.getElementById('refresh-btn');

let ledStates = { led1: "off", led2: "off", led3: "off", led4: 0 };

function showMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.backgroundColor = isError ? 'red' : '#4CAF50';
  statusMessage.style.display = 'block';

  clearTimeout(window._msgTimeout);
  window._msgTimeout = setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

async function fetchStates() {
  try {
    const res = await fetch('/commands.json?nocache=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      ledStates = data;
      renderControls();
    } else {
      showMessage('Помилка завантаження стану', true);
    }
  } catch (e) {
    showMessage('Помилка з’єднання', true);
  }
}

async function updateLED(led, state) {
  try {
    const response = await fetch('/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ led, state }),
    });

    if (response.ok) {
      ledStates[led] = state;
      renderControls();
      if (led === 'led4') {
        showMessage(`Яскравість LED4 встановлено на ${state}`);
      } else {
        showMessage(`Світлодіод ${led.replace('led', '')} ${state === 'on' ? 'увімкнений' : 'вимкнений'}`);
      }
    } else {
      showMessage('Помилка при оновленні', true);
    }
  } catch (error) {
    showMessage('Помилка з’єднання', true);
  }
}

function renderControls() {
  root.innerHTML = '';

  // Керування трьома звичайними світлодіодами
  ['led1', 'led2', 'led3'].forEach(led => {
    const div = document.createElement('div');
    div.className = 'switch';

    const label = document.createElement('label');
    label.htmlFor = led;
    label.textContent = led.toUpperCase();

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = led;
    checkbox.checked = ledStates[led] === 'on';
    checkbox.addEventListener('change', e => {
      updateLED(led, e.target.checked ? 'on' : 'off');
    });

    div.appendChild(label);
    div.appendChild(checkbox);
    root.appendChild(div);
  });

  // Керування яскравістю led4 (повзунок)
  const sliderLabel = document.createElement('label');
  sliderLabel.htmlFor = 'led4-slider';
  sliderLabel.textContent = `Яскравість LED4: ${ledStates.led4}`;

const slider = document.createElement('input');
slider.type = 'range';
slider.id = 'led4';
slider.className = 'led-slider'; // ⬅️ Додали клас
slider.min = 0;
slider.max = 255;
slider.value = ledStates.led4;
  slider.addEventListener('input', e => {
    sliderLabel.textContent = `Яскравість LED4: ${e.target.value}`;
  });
  slider.addEventListener('change', e => {
    updateLED('led4', Number(e.target.value));
  });

  root.appendChild(sliderLabel);
  root.appendChild(slider);
}

refreshBtn.addEventListener('click', () => {
  location.reload(true);
});

fetchStates();

const burger = document.getElementById('burger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

burger.addEventListener('click', () => {
  burger.classList.toggle('active');
  sidebar.classList.toggle('hidden');
  overlay.classList.toggle('hidden');
});

overlay.addEventListener('click', () => {
  burger.classList.remove('active');
  sidebar.classList.add('hidden');
  overlay.classList.add('hidden');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then((reg) => {
    console.log('Service Worker registered:', reg);
  });
}

const addBtn = document.getElementById('add-btn');
const addModal = document.getElementById('add-modal');
const saveLed = document.getElementById('save-led');
const cancelLed = document.getElementById('cancel-led');

addBtn.addEventListener('click', () => {
  addModal.classList.remove('hidden');
});

cancelLed.addEventListener('click', () => {
  addModal.classList.add('hidden');
});

saveLed.addEventListener('click', async () => {
  const name = document.getElementById('led-name').value.trim();
  const ip = document.getElementById('led-ip').value.trim();
  const type = document.getElementById('led-type').value;
  
  if (!name || !ip) {
    showMessage("Заповніть всі поля!", true);
    return;
  }

  try {
    const response = await fetch('/add-led', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ip, type }),
    });

    if (response.ok) {
      showMessage("LED успішно додано!");
      addModal.classList.add('hidden');
      fetchStates(); // Оновлення списку LED
    } else {
      showMessage("Помилка додавання!", true);
    }
  } catch (error) {
    showMessage("Помилка з’єднання!", true);
  }
});