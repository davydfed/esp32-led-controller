const root = document.getElementById('root');
const statusMessage = document.getElementById('status-message');
const refreshBtn = document.getElementById('refresh-btn');
const addLedBtn = document.getElementById('add-led-btn');
const saveConfigBtn = document.getElementById('save-config-btn');

const burger = document.getElementById('burger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

let ledStates = {};
let ledConfig = [];

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
      ledConfig = Object.entries(data).map(([key, val], idx) => ({
        name: key,
        pin: typeof val === 'string' ? 2 + idx : 5 + idx,
        type: typeof val === 'number' ? 'pwm' : 'onoff',
      }));
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
      showMessage(`Оновлено ${led}: ${state}`);
    } else {
      showMessage('Помилка при оновленні', true);
    }
  } catch {
    showMessage('Помилка з’єднання', true);
  }
}

function renderControls() {
  root.innerHTML = '';

  ledConfig.forEach((led, index) => {
    const div = document.createElement('div');
    div.className = 'switch';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = led.name;
    nameInput.placeholder = 'Назва';
    nameInput.addEventListener('input', (e) => {
      ledConfig[index].name = e.target.value;
    });

    const pinInput = document.createElement('input');
    pinInput.type = 'number';
    pinInput.value = led.pin;
    pinInput.placeholder = 'Пін';
    pinInput.addEventListener('input', (e) => {
      ledConfig[index].pin = parseInt(e.target.value);
    });

    div.appendChild(nameInput);
    div.appendChild(pinInput);

    if (led.type === 'onoff') {
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = ledStates[led.name] === 'on';
      toggle.addEventListener('change', (e) => {
        updateLED(led.name, e.target.checked ? 'on' : 'off');
      });
      div.appendChild(toggle);
    } else if (led.type === 'pwm') {
      const sliderLabel = document.createElement('label');
      sliderLabel.textContent = `Яскравість: ${ledStates[led.name]}`;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 255;
      slider.value = ledStates[led.name];
      slider.addEventListener('input', (e) => {
        sliderLabel.textContent = `Яскравість: ${e.target.value}`;
      });
      slider.addEventListener('change', (e) => {
        updateLED(led.name, Number(e.target.value));
      });

      div.appendChild(sliderLabel);
      div.appendChild(slider);
    }

    root.appendChild(div);
  });
}

addLedBtn.addEventListener('click', () => {
  ledConfig.push({ name: `led${ledConfig.length + 1}`, pin: 2, type: 'onoff' });
  ledStates[`led${ledConfig.length}`] = 'off';
  renderControls();
});

saveConfigBtn.addEventListener('click', async () => {
  const stateToSave = {};
  ledConfig.forEach((led) => {
    stateToSave[led.name] = ledStates[led.name] ?? (led.type === 'pwm' ? 0 : 'off');
  });

  try {
    const response = await fetch('/save-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stateToSave),
    });

    if (response.ok) {
      showMessage('Конфігурація збережена');
    } else {
      showMessage('Помилка при збереженні', true);
    }
  } catch (e) {
    showMessage('Помилка з’єднання', true);
  }
});

refreshBtn.addEventListener('click', () => {
  location.reload(true);
});

// ☰ Бургер-меню
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

// ✅ PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then((reg) => {
    console.log('Service Worker зареєстровано:', reg);
  });
}

fetchStates();
