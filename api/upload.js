import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    const imagePath = files.image.filepath;
    const imageBuffer = await fs.promises.readFile(imagePath);

    // Copilot OCR処理（仮のAPIエンドポイント）
    const result = await fetch('https://copilot.microsoft.com/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Authorization': `Bearer ${process.env.COPILOT_API_KEY}`
      },
      body: imageBuffer
    });

    const data = await result.json();
    res.status(200).json({ text: data.text });
  });
}
