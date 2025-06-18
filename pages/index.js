import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [ocrText, setOcrText] = useState('');
  const pasteAreaRef = useRef(null);

  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const img = document.createElement('img');
          img.src = URL.createObjectURL(blob);
          img.style.maxWidth = '100%';
          pasteAreaRef.current.innerHTML = '';
          pasteAreaRef.current.appendChild(img);
          uploadImage(blob);
        }
      }
    };

    const pasteArea = pasteAreaRef.current;
    pasteArea.addEventListener('paste', handlePaste);
    return () => pasteArea.removeEventListener('paste', handlePaste);
  }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`サーバーエラー: ${res.status} - ${text}`);
      }

      const data = await res.json();
      setOcrText(data.text);
    } catch (error) {
      console.error('OCRエラー:', error);
      alert('OCR処理中にエラーが発生しました。コンソールを確認してください。');
    }
  };

  const startOCR = () => {
    const img = pasteAreaRef.current.querySelector('img');
    if (img && img.src.startsWith('data:image')) {
      const file = dataURLtoBlob(img.src);
      uploadImage(file);
    } else {
      alert('画像が貼り付けられていません。');
    }
  };

  const dataURLtoBlob = (dataURL) => {
    try {
      const parts = dataURL.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    } catch (error) {
      console.error('dataURL変換エラー:', error);
      alert('画像の形式が正しくありません。');
      return null;
    }
  };

  return (
    <>
      <h1>OCR Comparison Tool</h1>
      <div
        ref={pasteAreaRef}
        style={{
          border: '2px dashed #ccc',
          padding: '20px',
          width: '300px',
          height: '300px',
          marginBottom: '20px',
        }}
      >
        ここに画像を貼り付けてください
      </div>
      <button onClick={startOCR}>OCR開始</button>
      <textarea
        value={ocrText}
        placeholder="OCR結果がここに表示されます"
        style={{ width: '100%', height: '100px' }}
        readOnly
      />
    </>
  );
}
