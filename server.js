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

// Обробка POST-запитів на /update
app.post('/update', async (req, res) => {
  const { led, state } = req.body;

  try {
    // Зчитування поточного JSON
    const data = await fs.readJson(filePath);

    // Оновлення стану заданого LED
    data[led] = state;

    // Запис оновленого JSON у файл
    await fs.writeJson(filePath, data, { spaces: 2 });

    res.sendStatus(200); // Все ок
  } catch (err) {
    console.error('Помилка при оновленні JSON:', err);
    res.sendStatus(500); // Помилка сервера
  }
});

// Додатковий ендпоінт для додавання нового елементу
app.post('/add-command', async (req, res) => {
  const { key, newData } = req.body; // newData має містити: { type, state, pin }

  try {
    // Зчитаємо поточний JSON
    const data = await fs.readJson(filePath);

    // Уникаємо перезапису існуючого елементу
    if (data[key]) {
      return res.status(400).json({ error: 'Команда з таким ключем вже існує' });
    }

    // Додаємо новий елемент
    data[key] = newData;

    // Записуємо оновлений JSON у файл
    await fs.writeJson(filePath, data, { spaces: 2 });

    res.sendStatus(200); // Все ок
  } catch (err) {
    console.error('Помилка при додаванні нового елементу:', err);
    res.sendStatus(500); // Помилка сервера
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущено на порту ${PORT}`);
});