// Завантаження даних з commands.json та рендеринг LED-карток
async function loadCommands() {
  try {
    const res = await fetch("/commands.json?nocache=" + Date.now());
    if (res.ok) {
      const data = await res.json();
      renderCommands(data);
    } else {
      console.error("Помилка завантаження команд");
    }
  } catch (e) {
    console.error("Помилка з'єднання", e);
  }
}

// Відображення LED-карток
function renderCommands(commands) {
  const container = document.getElementById("led-container");
  container.innerHTML = "";

  Object.entries(commands).forEach(([key, config]) => {
    const card = document.createElement("div");
    card.className = "led-card";
    card.dataset.ledKey = key;

    // Контейнер для стану (галочка або повзунок)
    const controlContainer = document.createElement("div");
    controlContainer.className = "led-control";

    if (config.type === "regular") {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = config.state === "on";
      checkbox.disabled = true;
      controlContainer.appendChild(checkbox);
    } else if (config.type === "pwa") {
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = 0;
      slider.max = 255;
      slider.value = config.state;
      slider.disabled = true;
      controlContainer.appendChild(slider);
    }

    card.innerHTML = `<div class="led-title">${key.toUpperCase()}</div>`;
    card.appendChild(controlContainer);

    card.addEventListener("click", () => openInfoModal(key, config));

    container.appendChild(card);
  });
}

// Відкриття модального вікна з деталями LED
function openInfoModal(key, config) {
  document.getElementById("modal-title").textContent = key.toUpperCase();
  document.getElementById("modal-type").textContent = config.type;
  document.getElementById("modal-pin").textContent = "GPIO " + config.pin;

  const modalStateContainer = document.getElementById("modal-state");
  modalStateContainer.innerHTML = "";

  if (config.type === "regular") {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = config.state === "on";
    checkbox.addEventListener("change", (event) => {
      updateCommand(key, event.target.checked ? "on" : "off");
    });
    modalStateContainer.appendChild(checkbox);
  } else if (config.type === "pwa") {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 255;
    slider.value = config.state;
    slider.addEventListener("input", (event) => {
      updateCommand(key, Number(event.target.value));
    });
    modalStateContainer.appendChild(slider);
  }

  document.getElementById("info-modal").style.display = "flex";

  document.getElementById("delete-button").onclick = () => deleteCommand(key);
  document.getElementById("edit-button").onclick = () => {
    openEditModal(key, config);
    document.getElementById("info-modal").style.display = "none";
  };
}

// Закриття модального вікна
document.getElementById("close-info-modal").addEventListener("click", () => {
  document.getElementById("info-modal").style.display = "none";
});

// Оновлення стану LED у файлі `commands.json`
async function updateCommand(key, newState) {
  try {
    const res = await fetch("/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ led: key, state: newState }),
    });
    if (res.ok) {
      console.log(`Оновлено ${key}: ${newState}`);
      loadCommands();
    } else {
      console.error("Помилка при оновленні");
    }
  } catch (e) {
    console.error("Помилка з'єднання", e);
  }
}

// Видалення елемента
async function deleteCommand(key) {
  try {
    const res = await fetch("/delete-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (res.ok) {
      document.getElementById("info-modal").style.display = "none";
      loadCommands();
    } else {
      console.error("Помилка при видаленні елемента");
    }
  } catch (e) {
    console.error("Помилка з'єднання", e);
  }
}

// Функція для створення правильного елемента керування станом у модальному вікні редагування
function updateEditStateInput(type, state) {
  const container = document.getElementById("edit-state-container");
  container.innerHTML = ""; // Очищаємо контейнер перед додаванням нового елемента

  if (type === "regular") {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "edit-state-regular";
    checkbox.checked = state === "on";
    container.appendChild(checkbox);
  } else if (type === "pwa") {
    const input = document.createElement("input");
    input.type = "number";
    input.id = "edit-state-pwa";
    input.min = 0;
    input.max = 255;
    input.value = state;
    container.appendChild(input);
  }
}

// Відкриття модального вікна редагування
function openEditModal(key, config) {
  document.getElementById("edit-key").value = key;
  document.getElementById("edit-type").value = config.type;
  document.getElementById("edit-pin").value = config.pin;
  updateEditStateInput(config.type, config.state);
  document.getElementById("edit-modal").style.display = "flex";
}

document.getElementById("edit-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // 🔹 Запобігає перезавантаженню сторінки

  const key = document.getElementById("edit-key").value;
  const type = document.getElementById("edit-type").value;
  const pin = Number(document.getElementById("edit-pin").value);
  let state;

  if (type === "regular") {
    state = document.getElementById("edit-state-regular").checked ? "on" : "off";
  } else if (type === "pwa") {
    state = Number(document.getElementById("edit-state-pwa").value);
  }

  const newData = { type, state, pin };

  try {
    const res = await fetch("/edit-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, newData }),
    });

    if (res.ok) {
      document.getElementById("edit-modal").style.display = "none";
      loadCommands(); // 🔹 Оновлюємо головний екран
    } else {
      console.error("Помилка при редагуванні елемента");
    }
  } catch (e) {
    console.error("Помилка з'єднання", e);
  }
});


// Закриття модального вікна редагування
document.getElementById("close-edit-modal").addEventListener("click", () => {
  document.getElementById("edit-modal").style.display = "none";
});

// Додавання нового LED
document.getElementById("add-button").addEventListener("click", () => {
  document.getElementById("add-modal").style.display = "flex";
});

document.getElementById("add-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = document.getElementById("add-key").value.trim();
  const type = document.getElementById("add-type").value;
  const pin = Number(document.getElementById("add-pin").value.trim());
  const state = type === "regular" ? "off" : 0;

  const newData = { type, state, pin };

  try {
    const res = await fetch("/add-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, newData }),
    });
    if (res.ok) {
      document.getElementById("add-modal").style.display = "none";
      loadCommands();
    } else {
      console.error("Помилка при додаванні нового елемента");
    }
  } catch (e) {
    console.error("Помилка з'єднання", e);
  }
});

// Закриття модального вікна додавання
document.getElementById("close-add-modal").addEventListener("click", () => {
  document.getElementById("add-modal").style.display = "none";
});

// Завантаження даних при запуску сторінки
document.addEventListener("DOMContentLoaded", loadCommands);