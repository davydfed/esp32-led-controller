const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const jsonFilePath = path.join(__dirname, 'public', 'commands.json');

// Читаємо JSON, якщо файл відсутній — створюємо з дефолтними значеннями
function readCommands() {
  try {
    const data = fs.readFileSync(jsonFilePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return { led1: "off", led2: "off", led3: "off" };
  }
}

// Записуємо JSON у файл
function writeCommands(commands) {
  fs.writeFileSync(jsonFilePath, JSON.stringify(commands, null, 2));
}

app.post('/update', (req, res) => {
  const { led, state } = req.body;

  if (!['led1', 'led2', 'led3'].includes(led) || !['on', 'off'].includes(state)) {
    return res.status(400).json({ error: 'Невірні параметри' });
  }

  const commands = readCommands();

  commands[led] = state; // Оновлюємо потрібне поле

  writeCommands(commands);

  res.json({ success: true, commands });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
