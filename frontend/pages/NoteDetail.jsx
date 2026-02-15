/**
 * Note Detail - PDF/viewer and download analytics
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getNoteById, getNoteFileBlob, downloadNote, getNoteVersions } from '../services/notesService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import './NoteDetail.css';

export const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [note, setNote] = useState(null);
  const [versions, setVersions] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let blobUrl = null;
    const load = async () => {
      try {
        const [n, v] = await Promise.all([
          getNoteById(id),
          getNoteVersions(id).catch(() => []),
        ]);
        setNote(n);
        setVersions(Array.isArray(v) ? v : []);

        if (n?.mimeType === 'application/pdf' || (n?.fileName || '').toLowerCase().endsWith('.pdf')) {
          const blob = await getNoteFileBlob(n._id);
          blobUrl = URL.createObjectURL(blob);
          setPreviewUrl(blobUrl);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Note not found');
        setNote(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [id, toast]);

  const handleDownload = async () => {
    if (!note) return;
    try {
      await downloadNote(note._id);
      const blob = await getNoteFileBlob(note._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = note.fileName || 'note.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded');
    } catch (e) {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container"><p>Loading...</p></div>
      </Layout>
    );
  }
  if (!note) {
    return (
      <Layout>
        <div className="container">
          <p>Note not found.</p>
          <Link to="/notes" className="btn-outline">Back to Notes</Link>
        </div>
      </Layout>
    );
  }

  const isPdf = (note.mimeType === 'application/pdf') || (note.fileName || '').toLowerCase().endsWith('.pdf');

  return (
    <Layout>
      <div className="container note-detail">
        <div className="note-detail-header">
          <Link to="/notes" className="back-link">← Notes</Link>
          <h1>{note.title}</h1>
          <p className="note-detail-meta">
            {note.subject} · {note.semester}
            {note.courseId?.code && ` · ${note.courseId.code}`}
          </p>
          {note.uploadedBy?.name && (
            <p className="note-uploaded-by">Uploaded by {note.uploadedBy.name}</p>
          )}
          <div className="note-detail-stats">
            <span>Version {note.version}</span>
            <span>Downloads: {note.downloadCount}</span>
          </div>
          {note.tags?.length > 0 && (
            <div className="note-detail-tags">
              {note.tags.map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          )}
          <div className="note-detail-actions">
            <button type="button" className="btn-primary" onClick={handleDownload}>
              Download
            </button>
          </div>
        </div>

        {note.description && (
          <div className="note-description card">
            <p>{note.description}</p>
          </div>
        )}

        <div className="note-preview card">
          <h3>Preview</h3>
          {isPdf && previewUrl ? (
            <iframe
              title="Note preview"
              src={previewUrl}
              className="pdf-viewer"
            />
          ) : (
            <p className="text-muted">
              Preview not available for this file type. Use Download to open.
            </p>
          )}
        </div>

        {versions.length > 1 && (
          <div className="note-versions card">
            <h3>Version history</h3>
            <ul>
              {versions.map((v) => (
                <li key={v._id}>
                  v{v.version} – {v.uploadedBy?.name} – {new Date(v.createdAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};
