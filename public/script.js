// Завантаження даних із commands.json та рендеринг елементів
async function loadCommands() {
  try {
    const res = await fetch('/commands.json?nocache=' + Date.now());
    if (res.ok) {
      // Припустимо, що JSON має формат: { "led1": "regular, off, 2", ... }
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

  Object.entries(commands).forEach(([key, value]) => {
    // value має формат "тип, стан, pin"
    const parts = value.split(',').map(p => p.trim());
    if (parts.length !== 3) return;
    
    const [type, state, pin] = parts;
    const div = document.createElement('div');
    div.className = 'led-item';
    
    // Якщо вам потрібно відображати назву з модифікацією (наприклад, LED4 замість led1),
    // можна додати додаткову логіку перетворення імені.
    const displayName = key.toUpperCase(); // або інша логіка, наприклад: 'LED' + (parseInt(key.replace('led', '')) + 3);
    
    // Створення підпису з назвою та PIN (GPIO)
    const label = document.createElement('span');
    label.className = 'led-label';
    label.textContent = `${displayName} (GPIO${pin})`;
    div.appendChild(label);

    // В залежності від типу створюємо потрібний елемент
    if (type === 'regular') {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = state === 'on';
      checkbox.addEventListener('change', () => {
        updateCommand(key, checkbox.checked ? 'on' : 'off');
      });
      div.appendChild(checkbox);
    } else if (type === 'pwa') {
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 255;
      slider.value = Number(state) || 0;
      const sliderLabel = document.createElement('span');
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

// Надсилання оновленої інформації на сервер, щоб зберегти зміни в commands.json
async function updateCommand(key, newState) {
  // Отримуємо поточні дані (можна спочатку завантажити усі дані та оновити вибраний елемент)
  // Тут продемонстровано спрощений варіант POST-запиту на серверний ендпоінт '/update'
  try {
    const res = await fetch('/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

// Обробка форми додавання
document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('led-name').value.trim();
  const type = document.getElementById('led-type').value;
  const pin = document.getElementById('led-pin').value.trim();

  // Для нового елемента встановлюємо початковий стан:
  // для regular — 'off', для pwa — 0 (повзунок)
  const state = type === 'regular' ? 'off' : '0';
  // Створюємо рядок для запису в commands.json
  const newCommandData = `${type}, ${state}, ${pin}`;

  try {
    // Надсилаємо дані на сервер для збереження (ендпоінт '/add-command' має бути реалізований на сервері)
    const res = await fetch('/add-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: name, value: newCommandData })
    });

    if (res.ok) {
      document.getElementById('add-modal').style.display = 'none';
      // Після збереження оновлюємо відображення
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