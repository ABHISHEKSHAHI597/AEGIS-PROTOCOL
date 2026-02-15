/**
 * Profile Page
 * Student profile management with editable form and digital ID card
 */
import { useState, useEffect, useRef } from 'react';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getProfileQR,
  getProfileImageUrl,
  getMyDocuments,
  uploadProfileDocument,
  downloadDocument as apiDownloadDocument,
  deleteDocument as apiDeleteDocument,
} from '../services/profileService';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import './Profile.css';

const YEARS = ['1st', '2nd', '3rd', '4th', '5th'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'Other'];

function profileCompleteness(p) {
  if (!p) return 0;
  const fields = [
    p.name?.trim(),
    p.rollNumber?.trim(),
    p.department?.trim(),
    p.year?.trim(),
    p.semester?.trim(),
    p.phone?.trim(),
    p.profileImage,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / 7) * 100);
}

export const Profile = () => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    department: '',
    year: '',
    semester: '',
    phone: '',
  });
  const [documents, setDocuments] = useState([]);
  const [docUploading, setDocUploading] = useState(false);
  const docInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setForm({
        name: data.name || '',
        rollNumber: data.rollNumber || '',
        department: data.department || '',
        year: data.year || '',
        semester: data.semester || '',
        phone: data.phone || '',
      });
      const docs = await getMyDocuments();
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchQR = async () => {
    try {
      const data = await getProfileQR();
      setQr(data);
    } catch (err) {
      setQr(null);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?._id) fetchQR();
  }, [profile?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setProfile(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Select an image first');
      return;
    }
    setUploading(true);
    try {
      const updated = await uploadProfilePhoto(file);
      setProfile(updated);
      setPreview(null);
      fileInputRef.current.value = '';
      toast.success('Photo uploaded');
      fetchQR();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const imageUrl = preview || (profile?.profileImage && getProfileImageUrl(profile.profileImage));

  if (loading) {
    return (
      <Layout>
        <div className="container flex-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p className="profile-subtitle">Manage your student profile and digital ID</p>
          <div className="profile-completeness">
            <span className="completeness-label">Profile completeness</span>
            <div className="completeness-bar">
              <div className="completeness-fill" style={{ width: `${profileCompleteness(profile)}%` }} />
            </div>
            <span className="completeness-pct">{profileCompleteness(profile)}%</span>
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-form-section">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row photo-row">
                <div className="photo-upload">
                  <div
                    className="photo-preview"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt="Profile" />
                    ) : (
                      <span className="photo-placeholder">+ Photo</span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {preview && (
                    <button
                      type="button"
                      className="btn-primary btn-sm mt-2"
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  value={form.rollNumber}
                  onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                  placeholder="e.g. 21CS001"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Select</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Year</label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                >
                  <option value="">Select</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                >
                  <option value="">Select</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </section>

          <section className="id-card-section">
            <h2>Digital ID Card</h2>
            <div className="id-card">
              <div className="id-card-header">
                <span className="id-card-logo">Campus Portal</span>
                <span className="id-card-badge">Student ID</span>
              </div>
              <div className="id-card-body">
                <div className="id-card-photo">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Profile" />
                  ) : (
                    <span>{profile?.name?.[0]?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="id-card-info">
                  <div className="id-name">{profile?.name || '—'}</div>
                  <div className="id-row">
                    <span>Roll No</span>
                    <strong>{profile?.rollNumber || '—'}</strong>
                  </div>
                  <div className="id-row">
                    <span>Dept</span>
                    <strong>{profile?.department || '—'}</strong>
                  </div>
                  <div className="id-row">
                    <span>Year</span>
                    <strong>{profile?.year || '—'}</strong>
                  </div>
                  <div className="id-row">
                    <span>Sem</span>
                    <strong>{profile?.semester || '—'}</strong>
                  </div>
                  <div className="id-row">
                    <span>Email</span>
                    <strong className="id-email">{profile?.email || '—'}</strong>
                  </div>
                </div>
              </div>
              <div className="id-card-footer">
                {qr?.qr ? (
                  <img src={qr.qr} alt="QR Code" className="id-qr" />
                ) : (
                  <div className="id-qr-placeholder">QR Code</div>
                )}
                <p className="id-qr-hint">Scan for verification</p>
              </div>
            </div>
          </section>
        </div>

        <section className="profile-documents-section">
          <h2>My Documents</h2>
          <p className="documents-hint">Upload certificates or ID proofs. Only you can access these (private).</p>
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setDocUploading(true);
              try {
                const formData = new FormData();
                formData.append('document', file);
                formData.append('name', file.name);
                await uploadProfileDocument(formData);
                const docs = await getMyDocuments();
                setDocuments(Array.isArray(docs) ? docs : []);
                toast.success('Document uploaded');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Upload failed');
              } finally {
                setDocUploading(false);
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => docInputRef.current?.click()}
            disabled={docUploading}
          >
            {docUploading ? 'Uploading...' : '+ Add document'}
          </button>
          <ul className="documents-list">
            {documents.length === 0 ? (
              <li className="text-muted">No documents yet.</li>
            ) : (
              documents.map((doc) => (
                <li key={doc._id} className="document-item">
                  <span className="doc-name">{doc.name || doc.originalName || 'Document'}</span>
                  <div className="doc-actions">
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={async () => {
                        try {
                          const blob = await apiDownloadDocument(doc._id);
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = doc.originalName || doc.name || 'document';
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (err) {
                          toast.error('Download failed');
                        }
                      }}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="btn-outline btn-sm danger"
                      onClick={async () => {
                        if (!window.confirm('Delete this document?')) return;
                        try {
                          await apiDeleteDocument(doc._id);
                          setDocuments((d) => d.filter((x) => x._id !== doc._id));
                          toast.success('Document deleted');
                        } catch (err) {
                          toast.error('Delete failed');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </Layout>
  );
};
