// Завантаження даних з commands.json та рендеринг елементів
async function loadCommands() {
  try {
    const res = await fetch('/commands.json?nocache=' + Date.now());
    if (res.ok) {
      // JSON має формат:
      // {
      //   "led1": { "type": "regular", "state": "off", "pin": 2 },
      //   "led2": { "type": "pwa", "state": 128, "pin": 4 }
      // }
      const data = await res.json();
      renderCommands(data);
    } else {
      console.error('Помилка завантаження даних');
    }
  } catch (e) {
    console.error('Помилка з’єднання', e);
  }
}

function renderCommands(commands) {
  const container = document.getElementById('led-container');
  container.innerHTML = ''; // Очищення контейнеру

  Object.entries(commands).forEach(([key, config]) => {
    const div = document.createElement('div');
    div.className = 'led-item';

    // Формуємо відображувану назву, наприклад, LED1
    const displayName = key.toUpperCase();

    // Створення підпису з назвою та GPIO інформацією
    const label = document.createElement('span');
    label.className = 'led-label';
    label.textContent = `${displayName} (GPIO${config.pin})`;
    div.appendChild(label);

    // Залежно від типу створюємо потрібний елемент управління
    if (config.type === 'regular') {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = config.state === 'on';
      checkbox.addEventListener('change', () => {
        updateCommand(key, checkbox.checked ? 'on' : 'off');
      });
      div.appendChild(checkbox);
    } else if (config.type === 'pwa') {
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 255;
      slider.value = Number(config.state) || 0;

      const sliderLabel = document.createElement('span');
      sliderLabel.style.marginRight = '0.5rem';
      sliderLabel.textContent = slider.value;

      slider.addEventListener('input', () => {
        sliderLabel.textContent = slider.value;
      });
      slider.addEventListener('change', () => {
        updateCommand(key, slider.value);
      });
      div.appendChild(sliderLabel);
      div.appendChild(slider);
    }
    container.appendChild(div);
  });
}

// Надсилання оновленої інформації на сервер для запису змін у commands.json
async function updateCommand(key, newState) {
  try {
    const res = await fetch('/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Сервер має оновлювати властивість state для відповідного елементу
      body: JSON.stringify({ key, newState })
    });
    if (res.ok) {
      console.log(`Оновлено ${key}: ${newState}`);
    } else {
      console.error('Помилка при оновленні');
    }
  } catch (e) {
    console.error('Помилка з’єднання', e);
  }
}

// Обробка модального вікна для додавання нового елементу
document.getElementById('add-button').addEventListener('click', () => {
  document.getElementById('add-modal').style.display = 'flex';
});

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('add-modal').style.display = 'none';
});

// Обробка форми додавання нового елементу
document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('led-name').value.trim();
  const type = document.getElementById('led-type').value;
  const pin = Number(document.getElementById('led-pin').value.trim());

  // Початкове значення: для regular — 'off', для pwa — 0 (повзунок)
  const state = type === 'regular' ? 'off' : 0;
  // Формуємо об’єкт для запису у JSON
  const newCommandData = { type, state, pin };

  try {
    // Надсилаємо дані на сервер для збереження нового елементу
    // Ендпоінт '/add-command' повинен обробити додавання нового ключа з об’єктом
    const res = await fetch('/add-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: name, newData: newCommandData })
    });

    if (res.ok) {
      document.getElementById('add-modal').style.display = 'none';
      // Оновлюємо відображення після додавання
      loadCommands();
    } else {
      console.error('Помилка при збереженні нового елементу');
    }
  } catch (e) {
    console.error('Помилка з’єднання', e);
  }
});

// Завантаження даних після завантаження сторінки
document.addEventListener('DOMContentLoaded', loadCommands);