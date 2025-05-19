const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Дозволити обробку JSON-запитів
app.use(bodyParser.json());

// Слухати всі файли з папки public як статичні
app.use(express.static('public'));

// GET-запит для ESP32 — повертає JSON
app.get('/commands.json', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'commands.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error reading commands.json:', err);
      return res.status(500).send('Error reading JSON');
    }
    res.type('application/json').send(data);
  });
});

// POST-запит від кнопок — оновлює JSON
app.post('/update', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'commands.json');
  const data = req.body;

  fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
    if (err) {
      console.error('❌ Error writing commands.json:', err);
      return res.status(500).send('Update failed');
    }
    console.log('✅ Updated commands.json:', data);
    res.send('Update successful');
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
