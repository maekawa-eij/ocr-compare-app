# Load the content of the file
with open('index.js', 'r') as file:
    index_js_content = file.read()

# Correcting the syntax errors in the provided index.js file
corrected_index_js_content = """
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
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`サーバーエラー: ${res.status} - ${text}`);
      }
      const data = await res.json();
      const flattenedText = data.text.replace(/[\r\n\s]+/g, ''); // 改行と空白を削除
      setOcrText(flattenedText);
      setEditableOcrText(flattenedText);
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

  const clearAll = () => {
    pasteAreaRef.current.innerHTML = '';
    setOcrText('');
    setEditableOcrText('');
    setUserText('');
    setComparisonResult('');
  };

  const normalizeText = (text) =>
    text
      .replace(/[（）()、。.,]/g, '')
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
      .toLowerCase();

  const splitByPunctuation = (text) =>
    text.split(/[、。.,]/).map((s) => normalizeText(s.trim())).filter(Boolean);

  const compareTexts = () => {
    const ocrList = splitByPunctuation(editableOcrText);
    const userList = splitByPunctuation(userText);

    const missingInOcr = userList.filter((item) => !ocrList.includes(item));
    const missingInUser = ocrList.filter((item) => !userList.includes(item));
    const orderDifferences = [];

    const minLength = Math.min(ocrList.length, userList.length);
    for (let i = 0; i < minLength; i++) {
      if (ocrList[i] !== userList[i]) {
        orderDifferences.push(`${ocrList[i]} ↔ ${userList[i]}`);
      }
    }

    let result = '';
    if (missingInOcr.length > 0) {
      result += `<p>② テキスト貼付側にあって、OCR側に無い原材料や成分:</p><ul>`;
      missingInOcr.forEach((item) => {
        result += `<li style="background-color: yellow;">${item}</li>`;
      });
      result += `</ul>`;
    }
    if (missingInUser.length > 0) {
      result += `<p>① OCR側にあって、テキスト貼付側に無い原材料や成分:</p><ul>`;
      missingInUser.forEach((item) => {
        result += `<li style="background-color: yellow;">${item}</li>`;
      });
      result += `</ul>`;
    }
    if (orderDifferences.length > 0) {
      result += `<p>③ 原材料や成分の表記の順番が違うもの:</p><ul>`;
      orderDifferences.forEach((item) => {
        result += `<li style="text-decoration: underline; text-decoration-color: red;">${item}</li>`;
      });
      result += `</ul>`;
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
          height: '300px',
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
"""

# Save the corrected content back to the file
with open('index.js', 'w') as file:
    file.write(corrected_index_js_content)

print("The index.js file has been corrected and updated.")

