import os

# Create the necessary directory structure
os.makedirs('pages/api', exist_ok=True)

# Create the pages/index.js file with the required React component
index_js_content = """
import { useState } from 'react';

export default function Home() {
  const [ocrText, setOcrText] = useState('');

  const handlePaste = (event) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.style.maxWidth = '100%';
        document.getElementById('pasteArea').innerHTML = '';
        document.getElementById('pasteArea').appendChild(img);
        uploadImage(blob);
      }
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    console.log('Sending image to /api/upload');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`サーバーエラー: ${res.status} - ${text}`);
      }

      const data = await res.json();
      console.log('OCR result:', data);
      setOcrText(data.text);
    } catch (error) {
      console.error('OCRエラー:', error);
      alert('OCR処理中にエラーが発生しました。コンソールを確認してください。');
    }
  };

  const startOCR = () => {
    const pasteArea = document.getElementById('pasteArea');
    const img = pasteArea.querySelector('img');
    if (img) {
      const file = dataURLtoBlob(img.src);
      uploadImage(file);
    } else {
      alert('画像が貼り付けられていません');
    }
  };

  const dataURLtoBlob = (dataURL) => {
    const parts = dataURL.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <div>
      <h1>OCR Comparison Tool</h1>
      <div
        id="pasteArea"
        onPaste={handlePaste}
        style={{
          border: '2px dashed #ccc',
          padding: '20px',
          width: '300px',
          height: '300px',
          marginBottom: '20px'
        }}
      >
        ここに画像を貼り付けてください
      </div>
      <button onClick={startOCR}>OCR開始</button>
      <textarea
        id="ocrText"
        value={ocrText}
        placeholder="OCR結果がここに表示されます"
        readOnly
        style={{ width: '100%', height: '100px' }}
      />
    </div>
  );
}
"""

# Write the content to pages/index.js
with open('pages/index.js', 'w') as f:
    f.write(index_js_content)

print("The pages/index.js file has been created successfully.")

