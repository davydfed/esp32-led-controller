
const express = require('express');
const fs = require('fs-extra');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const filePath = './public/commands.json';

app.post('/update', async (req, res) => {
  const { led, state } = req.body;
  try {
    const data = await fs.readJson(filePath);
    data[led] = state;
    await fs.writeJson(filePath, data, { spaces: 2 });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
