// Dokumentenablage — aus BootsCRM_reference.jsx (DocumentRow, Zeilen
// 1879-1903, und die Dropzone aus CustomerDetail, Zeilen 2233-2266).
//
// Inhaltlich unverändert bis auf den Kern der Umstellung: Dateien werden
// nicht mehr als Base64 im Datensatz gehalten, sondern per FormData
// hochgeladen und liegen als echte Dateien unter server/uploads/. Vorschau
// und Download zeigen deshalb auf eine URL statt auf einen data:-String.
import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Upload, Eye, Download, Trash2, Loader2, Info } from "lucide-react";
import api from "../../api.js";
import { WarnBox } from "../../components/ui.jsx";

const MAX_MB = 5;

function DocumentRow({ doc, onDelete }) {
  const url = api.customers.documentUrl(doc.id);
  return (
    <div className="doc-row">
      <FileText size={16} />
      <div className="doc-info">
        <span className="doc-name">{doc.filename}</span>
        <span className="doc-meta">
          {(doc.size / 1024).toFixed(0)} KB · {new Date(doc.uploaded_at).toLocaleDateString("de-AT")}
        </span>
      </div>
      <a className="icon-btn" title="Vorschau" href={url} target="_blank" rel="noreferrer"><Eye size={15} /></a>
      <a className="icon-btn" title="Herunterladen" href={url} download={doc.filename}><Download size={15} /></a>
      <button className="icon-btn icon-btn--danger" title="Löschen" onClick={() => onDelete(doc.id)}><Trash2 size={15} /></button>
    </div>
  );
}

export default function DokumenteTab({ customer, onCustomersChanged }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try { setDocs(await api.customers.documents(customer.id)); } catch (e) { setDocs([]); }
    setLoading(false);
  }, [customer.id]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleFiles = async (fileList) => {
    setUploadError("");
    const alle = Array.from(fileList);
    const zuGross = alle.filter((f) => f.size > MAX_MB * 1024 * 1024);
    const passend = alle.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    if (zuGross.length > 0) {
      setUploadError(`${zuGross.map((f) => `"${f.name}"`).join(", ")} ${zuGross.length === 1 ? "ist" : "sind"} größer als ${MAX_MB} MB und wurde${zuGross.length === 1 ? "" : "n"} übersprungen.`);
    }
    if (passend.length === 0) return;

    setUploading(true);
    try {
      await api.customers.uploadDocuments(customer.id, passend);
    } catch (e) {
      setUploadError(`Fehler beim Hochladen: ${e.message}`);
    }
    setUploading(false);
    await loadDocs();
    if (onCustomersChanged) await onCustomersChanged();   // der Historie-Eintrag kommt vom Server
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm("Dokument wirklich löschen? Die Datei wird von der Festplatte entfernt.")) return;
    await api.customers.deleteDocument(docId);
    await loadDocs();
  };

  return (
    <>
      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={20} />
        <span>Dateien hierher ziehen oder klicken zum Hochladen</span>
        <span className="dropzone-hint">PDF, JPG, PNG · max. {MAX_MB} MB pro Datei — wird nur abgelegt, nicht automatisch ausgelesen</span>
        <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>
      <p className="dropzone-extract-hint">
        <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
        Für automatische Datenübernahme aus einer Polizze: Datei zusätzlich im Chat an Claude schicken — die
        ausgelesenen Daten kannst du danach über den <strong>Import</strong>-Tab bei diesem Kunden übernehmen.
      </p>
      {uploading && <div className="uploading"><Loader2 size={14} className="spin" /> Wird hochgeladen…</div>}
      {uploadError && <WarnBox>{uploadError}</WarnBox>}

      <div className="doc-list">
        {loading ? (
          <div className="uploading"><Loader2 size={14} className="spin" /> Dokumente werden geladen…</div>
        ) : docs.length === 0 ? (
          <p className="empty-hint">Noch keine Dokumente hinterlegt.</p>
        ) : (
          docs.map((d) => <DocumentRow key={d.id} doc={d} onDelete={deleteDoc} />)
        )}
      </div>
    </>
  );
}
