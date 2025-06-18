import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const Busboy = (await import('busboy')).default;
  const busboy = Busboy({ headers: req.headers });

  let fileBuffer = Buffer.alloc(0);
  let filePath = '';

  busboy.on('file', (fieldname, file, filename) => {
    const tempFileName = `${randomUUID()}-${filename}`;
    filePath = join(tmpdir(), tempFileName);

    const writeStream = createWriteStream(filePath);
    file.pipe(writeStream);

    file.on('data', (data) => {
      fileBuffer = Buffer.concat([fileBuffer, data]);
    });

    file.on('end', () => {
      console.log(`ファイルアップロード完了: ${filePath}`);
    });
  });

  busboy.on('finish', async () => {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GOOGLE_API_KEY が未設定です。' });
      }

      const base64Image = fileBuffer.toString('base64');

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

      const text = result.responses[0]?.fullTextAnnotation?.text || 'テキストが検出されませんでした';
      res.status(200).json({ text });
    } catch (error) {
      console.error('OCR API 通信エラー:', error);
      res.status(500).json({ error: 'OCR API 通信に失敗しました' });
    }
  });

  req.pipe(busboy);
}
