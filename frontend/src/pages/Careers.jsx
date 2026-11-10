import React, { useState, useEffect } from 'react';
import Navbar from '../components/NavBar';
import {
  Modal,
  Tag,
  Button,
  Input,
  Form,
  message,
  Spin,
  Empty,
  Divider,
} from 'antd';
import {
  CompassOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  LaptopOutlined,
  CoffeeOutlined,
  CheckCircleFilled,
  UploadOutlined,
  FilePdfOutlined,
  PaperClipOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';

const { TextArea } = Input;

const CULTURE_PILLARS = [
  {
    icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#4f46e5' }} />,
    title: 'Autonomous Craft',
    desc: 'We are a small, focused team where every member has deep ownership over their domain. No excessive bureaucracy, just clean execution.',
  },
  {
    icon: <CoffeeOutlined style={{ fontSize: 24, color: '#0ea5e9' }} />,
    title: 'Deep Work Culture',
    desc: 'We prioritize long, uninterrupted blocks for thinking, designing, and coding. Asynchronous communication is our default operating rhythm.',
  },
  {
    icon: <LaptopOutlined style={{ fontSize: 24, color: '#10b981' }} />,
    title: 'Remote-First by Design',
    desc: 'Work from wherever you produce your finest ideas. We coordinate across time zones with clear documentation and mutual trust.',
  },
  {
    icon: <TeamOutlined style={{ fontSize: 24, color: '#f59e0b' }} />,
    title: 'Generous Learning & Stipends',
    desc: 'Annual book allowances, conference grants, home-office stipends, and comprehensive health packages tailored to your country of residence.',
  },
];

function Careers() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All');
  const [activeJobModal, setActiveJobModal] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get('/api/admin/jobs');
        if (Array.isArray(data)) {
          setJobs(data);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error('Error fetching jobs from backend:', err);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const departments = ['All', ...new Set(jobs.map((j) => j.department || 'Editorial'))];

  const filteredJobs = jobs.filter((job) => {
    if (selectedDept === 'All') return true;
    return job.department === selectedDept;
  });

  const handleApplySubmit = async (values) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name.trim());
      formData.append('email', values.email.trim());
      formData.append('portfolio', values.portfolio ? values.portfolio.trim() : '');
      formData.append('notes', values.notes ? values.notes.trim() : '');
      formData.append('jobId', activeJobModal?._id || '');
      formData.append('jobTitle', activeJobModal?.title || 'General Editorial Application');
      formData.append('department', activeJobModal?.department || 'Editorial');
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      await axiosInstance.post('/api/admin/jobs/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmitted(true);
      form.resetFields();
      setResumeFile(null);
      setFileError('');
      message.success('Your application has been received by our editorial team!');
    } catch (error) {
      console.error('Application submission error:', error);
      const errorMsg =
        error.response?.data?.message || 'Failed to submit application. Please try again.';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const closeJobModal = () => {
    setActiveJobModal(null);
    setSubmitted(false);
    setResumeFile(null);
    setFileError('');
    form.resetFields();
  };

  return (
    <>
      <Navbar />
      <div className="ed-careers-page">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

          .ed-careers-page {
            min-height: calc(100vh - 80px);
            background: #ffffff;
            color: #0f172a;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            padding-bottom: 100px;
          }

          /* Hero Section */
          .ed-careers-hero {
            background: #0f172a;
            color: #f8fafc;
            padding: 90px 24px 80px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }

          .ed-careers-hero-inner {
            max-width: 840px;
            margin: 0 auto;
            position: relative;
            z-index: 2;
          }

          .ed-careers-kicker {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #818cf8;
            font-weight: 700;
            margin-bottom: 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(129, 140, 248, 0.12);
            padding: 6px 14px;
            border-radius: 999px;
            border: 1px solid rgba(129, 140, 248, 0.25);
          }

          .ed-careers-title {
            font-family: 'Newsreader', serif;
            font-size: clamp(34px, 5vw, 56px);
            font-weight: 600;
            line-height: 1.15;
            letter-spacing: -0.02em;
            color: #ffffff;
            margin: 0 0 20px;
          }

          .ed-careers-subtitle {
            font-size: clamp(16px, 2vw, 19px);
            line-height: 1.6;
            color: #94a3b8;
            max-width: 700px;
            margin: 0 auto 36px;
          }

          .ed-careers-cta-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
          }

          .ed-careers-btn-primary {
            background: #4f46e5;
            color: #ffffff;
            font-weight: 600;
            padding: 12px 28px;
            border-radius: 999px;
            border: none;
            cursor: pointer;
            font-size: 15px;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .ed-careers-btn-primary:hover {
            background: #4338ca;
            transform: translateY(-1px);
          }

          /* Culture Section */
          .ed-careers-section {
            max-width: 1180px;
            margin: 0 auto;
            padding: 80px 24px 40px;
          }

          .ed-careers-section-header {
            text-align: center;
            max-width: 680px;
            margin: 0 auto 50px;
          }

          .ed-careers-section-kicker {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #4f46e5;
            margin-bottom: 8px;
          }

          .ed-careers-section-title {
            font-family: 'Newsreader', serif;
            font-size: 36px;
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 12px;
            letter-spacing: -0.01em;
          }

          .ed-careers-section-desc {
            font-size: 16px;
            color: #64748b;
            line-height: 1.6;
            margin: 0;
          }

          .ed-culture-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            margin-bottom: 60px;
          }

          .ed-culture-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 32px 24px;
            transition: all 0.2s ease;
          }

          .ed-culture-card:hover {
            transform: translateY(-3px);
            border-color: #cbd5e1;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
          }

          .ed-culture-icon {
            margin-bottom: 18px;
          }

          .ed-culture-title {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 10px;
          }

          .ed-culture-desc {
            font-size: 14px;
            color: #64748b;
            line-height: 1.6;
            margin: 0;
          }

          /* Job Listings */
          .ed-jobs-filter-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 36px;
          }

          .ed-jobs-dept-btn {
            border: 1px solid #e2e8f0;
            background: #ffffff;
            color: #64748b;
            padding: 8px 18px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .ed-jobs-dept-btn:hover {
            border-color: #cbd5e1;
            color: #0f172a;
          }

          .ed-jobs-dept-btn.active {
            background: #0f172a;
            color: #ffffff;
            border-color: #0f172a;
          }

          .ed-jobs-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .ed-job-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px 32px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            flex-wrap: wrap;
          }

          .ed-job-card:hover {
            border-color: #4f46e5;
            box-shadow: 0 12px 30px -5px rgba(79, 70, 229, 0.08);
            transform: translateY(-2px);
          }

          .ed-job-title {
            font-family: 'Newsreader', serif;
            font-size: 22px;
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 8px;
          }

          .ed-job-meta-row {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 12px;
            font-size: 13px;
            color: #64748b;
          }

          .ed-job-meta-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .ed-job-desc {
            font-size: 14px;
            color: #475569;
            line-height: 1.6;
            margin: 0 0 14px;
            max-width: 720px;
          }
        `}</style>

        {/* Hero Section */}
        <div className="ed-careers-hero">
          <div className="ed-careers-hero-inner">
            <div className="ed-careers-kicker">
              <CompassOutlined />
              <span>We Are Hiring — BlogSum Publishing</span>
            </div>
            <h1 className="ed-careers-title">
              Craft the future of thoughtful digital publishing.
            </h1>
            <p className="ed-careers-subtitle">
              We are a team of writers, designers, and software engineers dedicated to typographic
              beauty, longform intellectual depth, and independent publishing platforms.
            </p>
            <div className="ed-careers-cta-row">
              <button
                type="button"
                className="ed-careers-btn-primary"
                onClick={() => {
                  const el = document.getElementById('open-positions');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>
                  {jobs.length > 0
                    ? `View ${jobs.length} Open Position${jobs.length > 1 ? 's' : ''}`
                    : 'Check Open Positions (0)'}
                </span>
                <ArrowRightOutlined />
              </button>
            </div>
          </div>
        </div>

        {/* Culture & Pillars */}
        <div className="ed-careers-section">
          <div className="ed-careers-section-header">
            <div className="ed-careers-section-kicker">How We Operate</div>
            <h2 className="ed-careers-section-title">Designed for craft and autonomy</h2>
            <p className="ed-careers-section-desc">
              We believe great essays and elegant software are built when capable professionals are
              given space, trust, and high standards.
            </p>
          </div>

          <div className="ed-culture-grid">
            {CULTURE_PILLARS.map((p, idx) => (
              <div key={idx} className="ed-culture-card">
                <div className="ed-culture-icon">{p.icon}</div>
                <h3 className="ed-culture-title">{p.title}</h3>
                <p className="ed-culture-desc">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Open Positions */}
          <div id="open-positions" style={{ paddingTop: 40 }}>
            <div className="ed-careers-section-header">
              <div className="ed-careers-section-kicker">Current Openings</div>
              <h2 className="ed-careers-section-title">Open Positions at BlogSum</h2>
              <p className="ed-careers-section-desc">
                Join our fully remote global publication team. All roles receive competitive global
                pay and full benefits.
              </p>
            </div>

            {/* Department Filter Tabs */}
            <div className="ed-jobs-filter-bar">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={`ed-jobs-dept-btn ${selectedDept === dept ? 'active' : ''}`}
                  onClick={() => setSelectedDept(dept)}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Job Cards */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin tip="Loading open positions from editorial office..." />
              </div>
            ) : jobs.length === 0 ? (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 18,
                  padding: '50px 24px',
                  textAlign: 'center',
                  maxWidth: 640,
                  margin: '20px auto 40px',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>🖋️</div>
                <h3
                  style={{
                    fontFamily: 'Newsreader, serif',
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#0f172a',
                    margin: '0 0 8px',
                  }}
                >
                  No Open Positions at the Moment
                </h3>
                <p
                  style={{
                    color: '#64748b',
                    fontSize: 14,
                    lineHeight: 1.6,
                    maxWidth: 500,
                    margin: '0 auto 24px',
                  }}
                >
                  We are not actively recruiting for specific openings right now. However, we are always
                  excited to discover exceptional writers, reviewers, typographers, and software engineers.
                  Feel free to submit a general application with your portfolio and resume!
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Button
                    type="primary"
                    onClick={() =>
                      setActiveJobModal({
                        _id: '',
                        title: 'General Editorial & Platform Application',
                        department: 'Editorial & Platform',
                        location: 'Remote (Global)',
                        type: 'Open Inquiry',
                        experience: 'All Levels',
                        description:
                          'Submit your resume, published essays, and background for future openings across editorial writing, review panels, software engineering, and typographic design.',
                      })
                    }
                    style={{
                      background: '#0f172a',
                      borderColor: '#0f172a',
                      borderRadius: 999,
                      fontWeight: 600,
                      height: 42,
                      padding: '0 24px',
                    }}
                  >
                    Submit General Application & Resume →
                  </Button>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No open positions currently in this department. Check back soon!"
                style={{ margin: '40px 0' }}
              />
            ) : (
              <div className="ed-jobs-list">
                {filteredJobs.map((job) => (
                  <div key={job._id} className="ed-job-card">
                    <div style={{ flex: 1 }}>
                      <h3 className="ed-job-title">{job.title}</h3>
                      <div className="ed-job-meta-row">
                        <Tag color="geekblue" style={{ borderRadius: 999 }}>
                          {job.department}
                        </Tag>
                        <Tag color="purple" style={{ borderRadius: 999 }}>
                          {job.type}
                        </Tag>
                        <span className="ed-job-meta-item">
                          <EnvironmentOutlined />
                          <span>{job.location}</span>
                        </span>
                        {job.salaryRange && (
                          <span className="ed-job-meta-item">
                            <DollarOutlined />
                            <span>{job.salaryRange}</span>
                          </span>
                        )}
                        <span className="ed-job-meta-item">
                          <ClockCircleOutlined />
                          <span>{job.experience || 'Mid-Level'}</span>
                        </span>
                      </div>
                      <p className="ed-job-desc">{job.description}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(job.tags || []).map((tag, tIdx) => (
                          <Tag
                            key={tIdx}
                            style={{
                              background: '#f1f5f9',
                              borderColor: 'transparent',
                              borderRadius: 6,
                              fontSize: 11,
                              color: '#475569',
                            }}
                          >
                            #{tag}
                          </Tag>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Button
                        type="primary"
                        onClick={() => setActiveJobModal(job)}
                        style={{
                          borderRadius: 999,
                          background: '#0f172a',
                          borderColor: '#0f172a',
                          fontWeight: 600,
                          padding: '0 24px',
                          height: 42,
                        }}
                      >
                        Apply for Role →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Application Modal */}
        <Modal
          open={!!activeJobModal}
          onCancel={closeJobModal}
          footer={null}
          width={720}
          style={{ top: 40 }}
          bodyStyle={{ padding: '24px 28px' }}
        >
          {activeJobModal && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <Tag color="geekblue" style={{ borderRadius: 999 }}>
                  {activeJobModal.department}
                </Tag>
                <Tag color="purple" style={{ borderRadius: 999 }}>
                  {activeJobModal.type}
                </Tag>
                <h2
                  style={{
                    fontFamily: 'Newsreader, serif',
                    fontSize: 28,
                    fontWeight: 600,
                    margin: '12px 0 6px',
                    color: '#0f172a',
                  }}
                >
                  {activeJobModal.title}
                </h2>
                <div style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 13 }}>
                  <span>
                    <EnvironmentOutlined /> {activeJobModal.location}
                  </span>
                  {activeJobModal.salaryRange && (
                    <span>
                      <DollarOutlined /> {activeJobModal.salaryRange}
                    </span>
                  )}
                  <span>
                    <ClockCircleOutlined /> {activeJobModal.experience || 'Mid-Level'}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, marginBottom: 20 }}>
                {activeJobModal.description}
              </div>

              {activeJobModal.responsibilities?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    Key Responsibilities:
                  </h4>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14, color: '#475569' }}>
                    {activeJobModal.responsibilities.map((r, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeJobModal.requirements?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    What We Look For:
                  </h4>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14, color: '#475569' }}>
                    {activeJobModal.requirements.map((req, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Divider />

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <CheckCircleFilled style={{ fontSize: 44, color: '#10b981', marginBottom: 12 }} />
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
                    Application Submitted!
                  </h3>
                  <p style={{ color: '#64748b', fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
                    Thank you for applying to BlogSum. Our team will review your profile and follow
                    up within 3 to 5 business days.
                  </p>
                  <Button onClick={closeJobModal} style={{ borderRadius: 999 }}>
                    Close Window
                  </Button>
                </div>
              ) : (
                <div>
                  <h3
                    style={{
                      fontFamily: 'Newsreader, serif',
                      fontSize: 22,
                      fontWeight: 600,
                      marginBottom: 16,
                    }}
                  >
                    Apply for this Position
                  </h3>
                  <Form form={form} layout="vertical" onFinish={handleApplySubmit}>
                    <Form.Item
                      name="name"
                      label="Full Name"
                      rules={[{ required: true, message: 'Please enter your full name' }]}
                    >
                      <Input placeholder="e.g. Alex Mercer" />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      label="Email Address"
                      rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email address' },
                      ]}
                    >
                      <Input placeholder="you@example.com" />
                    </Form.Item>

                    <Form.Item
                      name="portfolio"
                      label="Portfolio, GitHub, or LinkedIn Profile URL"
                      rules={[{ required: true, message: 'Please share a link to your work' }]}
                    >
                      <Input placeholder="https://..." prefix={<LinkOutlined style={{ color: '#94a3b8' }} />} />
                    </Form.Item>

                    <Form.Item
                      label={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Attach Resume / CV Document</span>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>
                            (Optional: PDF, DOC, DOCX, TXT - max 20MB)
                          </span>
                        </div>
                      }
                    >
                      <div
                        style={{
                          border: resumeFile ? '1.5px solid #4f46e5' : '1.5px dashed #cbd5e1',
                          background: resumeFile ? '#f5f3ff' : '#f8fafc',
                          borderRadius: 12,
                          padding: '16px 20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => document.getElementById('applicant-resume-input')?.click()}
                      >
                        <input
                          id="applicant-resume-input"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 20 * 1024 * 1024) {
                                setFileError('Selected file exceeds the 20MB limit.');
                                setResumeFile(null);
                              } else {
                                setResumeFile(file);
                                setFileError('');
                              }
                            }
                          }}
                        />
                        {resumeFile ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 12,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <FilePdfOutlined style={{ fontSize: 28, color: '#4f46e5' }} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                                  {resumeFile.name}
                                </div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>
                                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · Attached &amp; ready to upload
                                </div>
                              </div>
                            </div>
                            <Button
                              size="small"
                              danger
                              type="text"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResumeFile(null);
                                const input = document.getElementById('applicant-resume-input');
                                if (input) input.value = '';
                              }}
                            >
                              Remove File
                            </Button>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <UploadOutlined style={{ fontSize: 24, color: '#64748b', marginBottom: 6 }} />
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                              Click to browse and attach your resume
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                              Formats: PDF, DOCX, DOC, TXT (up to 20MB)
                            </div>
                          </div>
                        )}
                      </div>
                      {fileError && (
                        <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                          {fileError}
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item
                      name="notes"
                      label="Why BlogSum? / Brief Introduction"
                      rules={[
                        { required: true, message: 'Please include a brief note about yourself' },
                      ]}
                    >
                      <TextArea
                        rows={4}
                        placeholder="Tell us about your background, relevant essays or projects, and what excites you about this role..."
                      />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <Button onClick={closeJobModal}>Cancel</Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        style={{
                          background: '#0f172a',
                          borderColor: '#0f172a',
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                      >
                        Submit Application
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}

export default Careers;
