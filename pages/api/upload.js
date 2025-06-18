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
      console.error('Form parse error:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_API_KEY が設定されていません。');
      return res.status(500).json({ error: 'GOOGLE_API_KEY が未設定です。' });
    }

    try {
      const imagePath = files.image.filepath;
      const imageBuffer = await fs.promises.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [{ type: 'TEXT_DETECTION' }],
              },
            ],
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Google Vision API エラー:', result);
        return res.status(500).json({ error: 'Google Vision API エラー', details: result });
      }

      const text =
        result.responses[0]?.fullTextAnnotation?.text ||
        'テキストが検出されませんでした';

      res.status(200).json({ text });
    } catch (error) {
      console.error('OCR API 通信エラー:', error);
      res.status(500).json({ error: 'OCR API 通信に失敗しました' });
    }
  });
}
