import { useCallback, useRef, useState } from 'react';

interface Props {
  imageUrl: string | null;
  onImageLoaded: (dataUrl: string) => void;
  onImageCleared: () => void;
}

export function ImageDropzone({ imageUrl, onImageLoaded, onImageCleared }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') onImageLoaded(result);
      };
      reader.readAsDataURL(file);
    },
    [onImageLoaded],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  if (imageUrl) {
    return (
      <div style={styles.preview}>
        <img src={imageUrl} alt="reference" style={styles.previewImg} />
        <button onClick={onImageCleared} style={styles.clearBtn} title="画像を削除">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      style={{ ...styles.dropzone, ...(dragging ? styles.dragging : {}) }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <span style={styles.icon}>📷</span>
      <span style={styles.label}>参照画像をドロップ<br />またはクリックして選択</span>
      <span style={styles.hint}>(任意) PNG / JPEG</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    border: '2px dashed #aaa',
    borderRadius: 8,
    padding: '16px 12px',
    cursor: 'pointer',
    background: '#fafafa',
    minHeight: 100,
    userSelect: 'none',
    transition: 'border-color 0.15s, background 0.15s',
  },
  dragging: {
    borderColor: '#4a90d9',
    background: '#eef4fb',
  },
  icon: { fontSize: 28 },
  label: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 1.5 },
  hint: { fontSize: 11, color: '#999' },
  preview: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid #ddd',
  },
  previewImg: {
    display: 'block',
    width: '100%',
    height: 'auto',
    maxHeight: 120,
    objectFit: 'contain',
    background: '#f0f0f0',
  },
  clearBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
};
