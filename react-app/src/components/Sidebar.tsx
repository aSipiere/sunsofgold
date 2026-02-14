import type { Gazeteer } from "../types";

interface Props {
  gazeteer: Gazeteer | null;
  onFileUpload: (file: File) => void;
  onDownload: () => void;
}

export function Sidebar({ gazeteer, onFileUpload, onDownload }: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  };

  return (
    <aside className="sidebar">
      <h1 className="sidebar-title">Sectors With Suns of Gold</h1>
      <p className="sidebar-description">
        A simple interface for Suns of Gold trade generation using your Sectors
        Without Number file.
      </p>

      <div className="form-group">
        <label htmlFor="file-upload">Choose a File:</label>
        <input
          id="file-upload"
          type="file"
          accept=".json"
          onChange={handleFileChange}
        />
        <p className="hint">Upload your Sectors Without Number file here.</p>
      </div>

      {gazeteer && (
        <button className="btn btn-primary" onClick={onDownload}>
          Download System Gazeteer
        </button>
      )}
    </aside>
  );
}
