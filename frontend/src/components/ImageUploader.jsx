import React, { useCallback, useRef, useState } from 'react';

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export default function ImageUploader({ onFileSelect, disabled }) {
  const [dragover, setDragover] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      setPreview({
        url: URL.createObjectURL(file),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
      });
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragover(false);
      const file = e.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = (e) => { e.preventDefault(); setDragover(true); };
  const onDragLeave = () => setDragover(false);
  const onClick = () => inputRef.current?.click();
  const onInputChange = (e) => handleFile(e.target.files?.[0]);

  return (
    <div className="upload-section glass" id="upload-section">
      <div
        className={`dropzone ${dragover ? 'dragover' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label="Upload an image for benchmarking"
        id="dropzone"
      >
        <div className="dropzone__icon">
          <UploadIcon />
        </div>
        <p className="dropzone__text">
          Drag & drop an image here, or <strong>browse</strong>
        </p>
        <p className="dropzone__hint">JPG, PNG, WebP &mdash; up to 20 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff"
          onChange={onInputChange}
          className="sr-only"
          id="file-input"
        />
      </div>

      {preview && (
        <div className="preview-strip">
          <img src={preview.url} alt="Preview" />
          <div className="preview-strip__info">
            <div className="preview-strip__name">{preview.name}</div>
            <div className="preview-strip__size">{preview.size}</div>
          </div>
        </div>
      )}
    </div>
  );
}
