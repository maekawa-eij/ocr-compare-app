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
    const base64Image = imageBuffer.toString('base64');

    const response = await fetch(
      'https://vision.googleapis.com/v1/images:annotate?key=' + process.env.GOOGLE_API_KEY,
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
    const text = result.responses[0]?.fullTextAnnotation?.text || 'テキストが検出されませんでした';
    res.status(200).json({ text });
  });
}
