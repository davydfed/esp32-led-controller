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
      checkbox.disabled = true; // Відображення без редагування
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

    // Натискання відкриває модальне вікно
    card.addEventListener("click", () => openInfoModal(key, config));

    container.appendChild(card);
  });
}

// Відкриття модального вікна з деталями LED
function openInfoModal(key, config) {
  document.getElementById("modal-title").textContent = key.toUpperCase();
  document.getElementById("modal-type").textContent = config.type;
  document.getElementById("modal-pin").textContent = "GPIO " + config.pin;

  // Очищаємо контейнер стану
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
      loadCommands(); // Оновлюємо головний екран
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

// Завантаження даних при запуску сторінки
document.addEventListener("DOMContentLoaded", loadCommands);