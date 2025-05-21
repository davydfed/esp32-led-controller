const express = require('express');
const fs = require('fs-extra');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Дозволяємо CORS
app.use(cors());

// Дозволяємо читати JSON-запити
app.use(express.json());

// Роздача статичних файлів з папки public
app.use(express.static('public'));

const filePath = './public/commands.json';

// Оновлення стану (лише властивості state)
app.post('/update', async (req, res) => {
  const { led, state } = req.body;

  try {
    const data = await fs.readJson(filePath);
    if (!data[led]) {
      return res.status(404).json({ error: 'LED не знайдено' });
    }
    // Оновлюємо лише властивість state
    data[led].state = state;
    await fs.writeJson(filePath, data, { spaces: 2 });
    res.sendStatus(200);
  } catch (err) {
    console.error('Помилка при оновленні JSON:', err);
    res.sendStatus(500);
  }
});

// Додавання нового елементу
app.post('/add-command', async (req, res) => {
  const { key, newData } = req.body; // newData має містити { type, state, pin }

  try {
    const data = await fs.readJson(filePath);
    if (data[key]) {
      return res.status(400).json({ error: 'Команда з таким ключем вже існує' });
    }
    data[key] = newData;
    await fs.writeJson(filePath, data, { spaces: 2 });
    res.sendStatus(200);
  } catch (err) {
    console.error('Помилка при додаванні нового елементу:', err);
    res.sendStatus(500);
  }
});

// Редагування існуючого елементу (оновлення всіх даних: type, state, pin)
app.post('/edit-command', async (req, res) => {
  const { key, newData } = req.body;
  
  try {
    const data = await fs.readJson(filePath);
    if (!data[key]) {
      return res.status(404).json({ error: "LED не знайдено" });
    }
    data[key] = newData;
    await fs.writeJson(filePath, data, { spaces: 2 });
    res.sendStatus(200);
  } catch (err) {
    console.error('Помилка при редагуванні елементу:', err);
    res.sendStatus(500);
  }
});

// Видалення елементу
app.post('/delete-command', async (req, res) => {
  const { key } = req.body;

  try {
    const data = await fs.readJson(filePath);
    if (!data[key]) {
      return res.status(404).json({ error: 'LED не знайдено' });
    }
    delete data[key];
    await fs.writeJson(filePath, data, { spaces: 2 });
    res.sendStatus(200);
  } catch (err) {
    console.error('Помилка при видаленні елементу:', err);
    res.sendStatus(500);
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущено на порту ${PORT}`);
});