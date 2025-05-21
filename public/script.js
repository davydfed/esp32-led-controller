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

function renderCommands(commands) {
  const container = document.getElementById("led-container");
  container.innerHTML = "";

  Object.entries(commands).forEach(([key, config]) => {
    const card = document.createElement("div");
    card.className = "led-card";
    card.dataset.ledKey = key;
    card.innerHTML = `
      <div class="led-title">${key.toUpperCase()}</div>
      <div class="led-control">
        ${
          config.type === "regular"
            ? `<input type="checkbox" ${config.state === "on" ? "checked" : ""} disabled>`
            : `<input type="range" min="0" max="255" value="${config.state}" disabled>`
        }
      </div>
    `;
    // При кліку на картку відкривається інформаційне модальне вікно
    card.addEventListener("click", () => openInfoModal(key, config));
    container.appendChild(card);
  });
}

// Функція відкриття інформаційного модального вікна
function openInfoModal(key, config) {
  document.getElementById("modal-title").textContent = key.toUpperCase();
  document.getElementById("modal-type").textContent = config.type;
  document.getElementById("modal-state").textContent = config.state;
  document.getElementById("modal-pin").textContent = "GPIO " + config.pin;

  const infoModal = document.getElementById("info-modal");
  infoModal.style.display = "flex";

  // Призначення дій кнопкам у модальному вікні
  document.getElementById("delete-button").onclick = () => deleteCommand(key);
  document.getElementById("edit-button").onclick = () => {
    openEditModal(key, config);
    infoModal.style.display = "none";
  };
}

document.getElementById("close-info-modal").addEventListener("click", () => {
  document.getElementById("info-modal").style.display = "none";
});

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

// Редагування: відкриття модального вікна редагування
function openEditModal(key, config) {
  document.getElementById("edit-key").value = key;
  document.getElementById("edit-type").value = config.type;
  document.getElementById("edit-pin").value = config.pin;
  updateEditStateInput(config.type, config.state);
  document.getElementById("edit-modal").style.display = "flex";
}

function updateEditStateInput(type, state) {
  const container = document.getElementById("edit-state-container");
  container.innerHTML = "";
  if (type === "regular") {
    const label = document.createElement("label");
    label.textContent = "Стан: ";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "edit-state-regular";
    checkbox.checked = state === "on";
    container.appendChild(label);
    container.appendChild(checkbox);
  } else if (type === "pwa") {
    const label = document.createElement("label");
    label.textContent = "Стан: ";
    const input = document.createElement("input");
    input.type = "number";
    input.id = "edit-state-pwa";
    input.min = 0;
    input.max = 255;
    input.value = state;
    container.appendChild(label);
    container.appendChild(input);
  }
}

// Оновлення поля стану при зміні типу в формі редагування
document.getElementById("edit-type").addEventListener("change", (e) => {
  const newType = e.target.value;
  updateEditStateInput(newType, newType === "regular" ? "off" : 0);
});

// Обробка форми редагування
document.getElementById("edit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = document.getElementById("edit-key").value;
  const type = document.getElementById("edit-type").value;
  const pin = Number(document.getElementById("edit-pin").value);
  let state;
  if (type === "regular") {
    const checkbox = document.getElementById("edit-state-regular");
    state = checkbox.checked ? "on" : "off";
  } else if (type === "pwa") {
    const input = document.getElementById("edit-state-pwa");
    state = Number(input.value);
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
      loadCommands();
    } else {
      console.error("Помилка при редагуванні елемента");
    }
  } catch (e) {
    console.error("Помилка з'єднання", e);
  }
});

document.getElementById("close-edit-modal").addEventListener("click", () => {
  document.getElementById("edit-modal").style.display = "none";
});

// Обробка форми додавання нового LED
document.getElementById("add-button").addEventListener("click", () => {
  document.getElementById("add-modal").style.display = "flex";
});
document.getElementById("close-add-modal").addEventListener("click", () => {
  document.getElementById("add-modal").style.display = "none";
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

// Завантаження даних після завантаження сторінки
document.addEventListener("DOMContentLoaded", loadCommands);