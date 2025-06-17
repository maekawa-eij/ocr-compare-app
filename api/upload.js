const formidable = require('formidable');
const fs = require('fs');
const Tesseract = require('tesseract.js');

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

    try {
      const result = await Tesseract.recognize(imagePath, 'jpn');
      res.status(200).json({ text: result.data.text });
    } catch (error) {
      res.status(500).json({ error: 'OCR failed' });
    }
  });
}

