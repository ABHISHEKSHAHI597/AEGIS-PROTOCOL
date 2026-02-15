/**
 * Academic Calendar - PDF viewer
 * Integrates the official Academic Calendar PDF (2026)
 */
import { Layout } from '../components/Layout';
import './AcademicCalendar.css';

export const AcademicCalendar = () => {
  return (
    <Layout>
      <div className="container academic-calendar-page">
        <h1>Academic Calendar</h1>
        <p className="subtitle">Official academic calendar – Even Semester, Summer Term & ODD Semester 2026</p>

        <div className="calendar-viewer">
          <iframe
            src="/Acad_Calendar.pdf"
            title="Academic Calendar"
            className="pdf-iframe"
          />
        </div>

        <div className="calendar-fallback">
          <a href="/Acad_Calendar.pdf" target="_blank" rel="noopener noreferrer" className="btn-primary">
            Open Academic Calendar (PDF)
          </a>
          <p className="text-muted text-small mt-2">If the PDF does not display above, click the link to open it in a new tab.</p>
        </div>
      </div>
    </Layout>
  );
};
