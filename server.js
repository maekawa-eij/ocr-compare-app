const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.json());

app.post('/upload', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;

  try {
    const result = await Tesseract.recognize(imagePath, 'eng');
    fs.unlinkSync(imagePath); // 一時ファイル削除
    res.json({ text: result.data.text });
  } catch (error) {
    res.status(500).json({ error: 'OCR failed' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
