import { useState } from 'react';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { Card, Button } from '../shared';
import { exportJson, importJson, exportCsvToFile } from '../../lib/tauri-bridge';

// Pass the sentinel "~desktop"; the Rust command resolves it to the user's Desktop.
function desktopExportDir(): string {
  const ts = new Date().toISOString().slice(0, 10);
  return `~desktop/learning-os-export-${ts}`;
}

export function DataExport() {
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const json = await exportJson();
      // Copy to clipboard as a simple export mechanism
      await navigator.clipboard.writeText(json);
      setStatus('Exported to clipboard!');
    } catch (err) {
      setStatus(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleImport = async () => {
    try {
      const json = await navigator.clipboard.readText();
      await importJson(json);
      setStatus('Imported successfully!');
    } catch (err) {
      setStatus(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleExportCsv = async () => {
    try {
      setStatus('Exporting CSV...');
      const outDir = await exportCsvToFile(desktopExportDir());
      setStatus(`CSV files saved to: ${outDir}`);
    } catch (err) {
      setStatus(`CSV export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <Card>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Data Management
      </h3>
      <div className="flex gap-3 mb-3 flex-wrap">
        <Button size="sm" variant="secondary" onClick={handleExport}>
          <Download size={14} />
          Export JSON
        </Button>
        <Button size="sm" variant="secondary" onClick={handleImport}>
          <Upload size={14} />
          Import JSON
        </Button>
        <Button size="sm" variant="secondary" onClick={handleExportCsv}>
          <FileSpreadsheet size={14} />
          Export CSV
        </Button>
      </div>
      {status && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{status}</p>
      )}
    </Card>
  );
}
