import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [ocrText, setOcrText] = useState('');
  const [editableOcrText, setEditableOcrText] = useState('');
  const [userText, setUserText] = useState('');
  const [comparisonResult, setComparisonResult] = useState('');
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
        method: 'POST,
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`サーバーエラー: ${res.status} - ${text}`);
      }

      const data = await res.json();
      const cleanedText = data.text.replace(/\s+/g, '');
      setOcrText(cleanedText);
      setEditableOcrText(cleanedText);
    } catch (error) {
      console.error('OCRエラー:', error);
      alert('OCR処理中にエラーが発生しました。');
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

  const clearAll = () => {
    pasteAreaRef.current.innerHTML = '';
    setOcrText('');
    setEditableOcrText('');
    setUserText('');
    setComparisonResult('');
  };

  const normalize = (text) =>
    text
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[（]/g, '(')
      .replace(/[）]/g, ')')
      .replace(/[／]/g, '/')
      .replace(/[％]/g, '%')
      .replace(/[．]/g, '.')
      .replace(/[ー]/g, '-')
      .replace(/[\s]/g, '')
      .toLowerCase();

  const diffHighlight = (source, target) => {
    let result = '';
    for (let i = 0; i < source.length; i++) {
      const srcChar = source[i];
      const tgtChar = target[i] || '';
      result += srcChar !== tgtChar ? `<mark>${srcChar}</mark>` : srcChar;
    }
    return result;
  };

  const compareTexts = () => {
    const normOcr = normalize(editableOcrText);
    const normUser = normalize(userText);

    const diffExists = normOcr !== normUser;
    let result = '';

    if (diffExists) {
      result += `<p>① OCRから抽出されたテキスト</p>`;
      result += `<div style="border:1px solid #ccc;padding:8px;margin-bottom:10px;">${diffHighlight(normOcr, normUser)}</div>`;

      result += `<p>② テキスト貼り付け入力</p>`;
      result += `<div style="border:1px solid #ccc;padding:8px;margin-bottom:10px;">${diffHighlight(normUser, normOcr)}</div>`;
    } else {
      result += `<p>① OCRから抽出されたテキスト</p>`;
      result += `<div style="border:1px solid #ccc;padding:8px;margin-bottom:10px;">${editableOcrText}</div>`;

      result += `<p>② テキスト貼り付け入力</p>`;
      result += `<div style="border:1px solid #ccc;padding:8px;margin-bottom:10px;">${userText}</div>`;

      result += `<p style="color:green;">差分はありません。</p>`;
    }

    setComparisonResult(result);
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
          height: '225px', // 300px の 75% に調整
          marginBottom: '20px',
        }}
      >
        ここに画像を貼り付けてください
      </div>
      <button onClick={startOCR}>OCR開始</button>
      <button onClick={clearAll} style={{ marginLeft: '10px' }}>クリア</button>

      <h3>OCR結果（編集可能）</h3>
      <textarea
        value={editableOcrText}
        onChange={(e) => setEditableOcrText(e.target.value)}
        placeholder="OCR結果がここに表示されます"
        style={{ width: '100%', height: '100px', marginTop: '10px' }}
      />

      <h3>任意のテキスト貼り付け欄</h3>
      <textarea
        value={userText}
        onChange={(e) => setUserText(e.target.value)}
        placeholder="任意のテキストをここに貼り付けてください"
        style={{ width: '100%', height: '100px', marginTop: '10px' }}
      />

      <button onClick={compareTexts} style={{ marginTop: '10px' }}>比較開始</button>

      <h3>比較結果</h3>
      <div
        dangerouslySetInnerHTML={{ __html: comparisonResult }}
        style={{ marginTop: '10px', border: '1px solid #ccc', padding: '10px' }}
      />
    </>
  );
}
