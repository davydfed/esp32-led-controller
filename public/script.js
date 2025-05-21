// Функція для завантаження даних з commands.json та рендерингу елементів
async function loadCommands() {
  try {
    const res = await fetch('/commands.json?nocache=' + Date.now());
    if (res.ok) {
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

    // Відображення назви та GPIO інформації
    const displayName = key.toUpperCase();
    const label = document.createElement('span');
    label.className = 'led-label';
    label.textContent = `${displayName} (GPIO${config.pin})`;
    div.appendChild(label);

    // Створення елемента керування для state
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

    // Додаткові кнопки "Редагувати" та "Видалити"
    const editButton = document.createElement('button');
    editButton.textContent = 'Редагувати';
    editButton.addEventListener('click', () => openEditModal(key, config));
    div.appendChild(editButton);

    const deleteButton = document.createElement('deletebutton');
    deleteButton.textContent = 'Видалити';
    deleteButton.addEventListener('click', () => deleteCommand(key));
    div.appendChild(deleteButton);

    container.appendChild(div);
  });
}

// Оновлення лише state (endpoint /update)
async function updateCommand(key, newState) {
  try {
    const res = await fetch('/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ led: key, state: newState })
    });
    if (!res.ok) {
      console.error('Помилка при оновленні');
    }
  } catch (e) {
    console.error('Помилка з’єднання', e);
  }
}

// Видалення елементу (endpoint /delete-command)
async function deleteCommand(key) {
  try {
    const res = await fetch('/delete-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    if (res.ok) {
      loadCommands();
    } else {
      console.error('Помилка при видаленні елементу');
    }
  } catch (e) {
    console.error('Помилка з’єднання', e);
  }
}

// Відкриття модального вікна для редагування
function openEditModal(key, config) {
  document.getElementById('edit-key').value = key;
  document.getElementById('edit-name').value = key;
  document.getElementById('edit-type').value = config.type;
  document.getElementById('edit-pin').value = config.pin;
  updateEditStateInput(config.type, config.state);
  document.getElementById('edit-modal').style.display = 'flex';
}

function updateEditStateInput(type, state) {
  const container = document.getElementById('edit-state-container');
  container.innerHTML = ''; // Очищення контейнеру
  if (type === 'regular') {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'edit-state-regular';
    checkbox.checked = state === 'on';
    container.appendChild(document.createTextNode('Стан: '));
    container.appendChild(checkbox);
  } else if (type === 'pwa') {
    const label = document.createElement('label');
    label.textContent = 'Стан: ';
    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'edit-state-pwa';
    input.min = 0;
    input.max = 255;
    input.value = state;
    container.appendChild(label);
    container.appendChild(input);
  }
}

// При зміні типу у формі редагування – оновлюємо поле для стану
document.getElementById('edit-type').addEventListener('change', (e) => {
  const newType = e.target.value;
  updateEditStateInput(newType, newType === 'regular' ? 'off' : 0);
});

// Обробка форми редагування
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = document.getElementById('edit-key').value;
  const type = document.getElementById('edit-type').value;
  const pin = Number(document.getElementById('edit-pin').value);
  let state;
  if (type === 'regular') {
    const checkbox = document.getElementById('edit-state-regular');
    state = checkbox.checked ? 'on' : 'off';
  } else if (type === 'pwa') {
    const input = document.getElementById('edit-state-pwa');
    state = Number(input.value);
  }
  const newData = { type, state, pin };
  try {
    const res = await fetch('/edit-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, newData })
    });
    if (res.ok) {
      document.getElementById('edit-modal').style.display = 'none';
      loadCommands();
    } else {
      console.error('Помилка при редагуванні елементу');
    }
  } catch (e) {
    console.error('Помилка з’єднання', e);
  }
});

// Закриття модального вікна редагування
document.getElementById('close-edit-modal').addEventListener('click', () => {
  document.getElementById('edit-modal').style.display = 'none';
});

// Обробка модального вікна для додавання
document.getElementById('add-button').addEventListener('click', () => {
  document.getElementById('add-modal').style.display = 'flex';
});
document.getElementById('close-add-modal').addEventListener('click', () => {
  document.getElementById('add-modal').style.display = 'none';
});

// Обробка форми додавання
document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('led-name').value.trim();
  const type = document.getElementById('led-type').value;
  const pin = Number(document.getElementById('led-pin').value.trim());
  const state = type === 'regular' ? 'off' : 0;
  const newCommandData = { type, state, pin };

  try {
    const res = await fetch('/add-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: name, newData: newCommandData })
    });
    if (res.ok) {
      document.getElementById('add-modal').style.display = 'none';
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