const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.json());

const LANG_DATA_DIR = path.join(__dirname, 'lang-data');
const LANG_DATA_PATH = path.join(LANG_DATA_DIR, 'jpn.traineddata');
const LANG_DATA_URL = 'https://github.com/tesseract-ocr/tessdata/raw/main/jpn.traineddata';

// lang-data フォルダがなければ作成
if (!fs.existsSync(LANG_DATA_DIR)) {
    fs.mkdirSync(LANG_DATA_DIR);
}

// jpn.traineddata がなければダウンロード
if (!fs.existsSync(LANG_DATA_PATH)) {
    console.log('Downloading jpn.traineddata...');
    const file = fs.createWriteStream(LANG_DATA_PATH);
    https.get(LANG_DATA_URL, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close();
            console.log('Download complete.');
        });
    }).on('error', function(err) {
        fs.unlinkSync(LANG_DATA_PATH);
        console.error('Error downloading jpn.traineddata:', err.message);
    });
}

app.post('/upload', upload.single('image'), async (req, res) => {
    const imagePath = req.file.path;

    try {
        const result = await Tesseract.recognize(imagePath, 'jpn', {
            langPath: LANG_DATA_DIR
        });
        fs.unlinkSync(imagePath); // 一時ファイル削除
        res.json({ text: result.data.text });
    } catch (error) {
        res.status(500).json({ error: 'OCR failed' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
