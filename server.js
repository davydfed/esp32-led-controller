const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const app = express();
require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = "your-username/esp32-led-controller";
const FILE_PATH = "commands.json"; // у корені репозиторію

app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/update", async (req, res) => {
  const { led1, led2, led3 } = req.body;

  try {
    // Отримуємо поточний файл
    const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const getData = await getRes.json();
    const sha = getData.sha;
    const content = JSON.parse(Buffer.from(getData.content, "base64").toString("utf8"));

    // Оновлюємо значення
    const updatedContent = {
      led1: led1 || content.led1,
      led2: led2 || content.led2,
      led3: led3 || content.led3,
    };

    // Кодуємо в base64
    const newContentEncoded = Buffer.from(JSON.stringify(updatedContent, null, 2)).toString("base64");

    // Відправляємо оновлення
    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: "Update LED states",
        content: newContentEncoded,
        sha: sha,
      }),
    });

    res.json({ success: true, updatedContent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
