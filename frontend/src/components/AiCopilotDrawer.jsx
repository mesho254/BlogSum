import React, { useState } from 'react';
import { Drawer, Button, Spin, Tag, Card, Progress, message } from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleFilled,
  PlusOutlined,
  ReadOutlined,
  BulbOutlined,
  TagsOutlined,
  StarOutlined,
} from '@ant-design/icons';
import axiosInstance from '../axiosConfig';

const AiCopilotDrawer = ({
  open,
  onClose,
  title,
  subtitle,
  content,
  category,
  tags = [],
  onApplyTitle,
  onApplySubtitle,
  onAddTag,
  onInsertTakeaways,
}) => {
  const [activeTab, setActiveTab] = useState('headlines'); // 'headlines' | 'tldr' | 'readability'
  const [loading, setLoading] = useState(false);
  const [headlines, setHeadlines] = useState([]);
  const [tldrData, setTldrData] = useState(null);
  const [readabilityData, setReadabilityData] = useState(null);

  const fetchInsights = async (action) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/blogs/ai-assist', {
        action,
        title,
        subtitle,
        content,
        category,
        tags,
      });

      if (action === 'generate-headlines') {
        setHeadlines(response.data.headlines || []);
        message.success('5 headline recommendations generated!');
      } else if (action === 'generate-tldr') {
        setTldrData(response.data);
        message.success('Executive summary & key takeaways generated!');
      } else if (action === 'analyze-readability') {
        setReadabilityData(response.data);
        message.success('Readability and SEO audit complete!');
      }
    } catch (err) {
      console.error('AI Copilot assistance error:', err);
      message.error(err.response?.data?.message || 'Could not complete AI analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'headlines' && headlines.length === 0) {
      fetchInsights('generate-headlines');
    } else if (tab === 'tldr' && !tldrData) {
      fetchInsights('generate-tldr');
    } else if (tab === 'readability' && !readabilityData) {
      fetchInsights('analyze-readability');
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThunderboltOutlined style={{ color: '#d97706', fontSize: '18px' }} />
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>
            AI Editorial Copilot
          </span>
        </div>
      }
      placement="right"
      width={480}
      onClose={onClose}
      open={open}
    >
      <div style={{ paddingBottom: '24px' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '4px',
            background: '#f1f5f9',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => handleOpenTab('headlines')}
            style={{
              flex: 1,
              padding: '7px 8px',
              border: 'none',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'headlines' ? '#ffffff' : 'transparent',
              color: activeTab === 'headlines' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'headlines' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Headlines
          </button>
          <button
            type="button"
            onClick={() => handleOpenTab('tldr')}
            style={{
              flex: 1,
              padding: '7px 8px',
              border: 'none',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'tldr' ? '#ffffff' : 'transparent',
              color: activeTab === 'tldr' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'tldr' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            TL;DR & Takeaways
          </button>
          <button
            type="button"
            onClick={() => handleOpenTab('readability')}
            style={{
              flex: 1,
              padding: '7px 8px',
              border: 'none',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'readability' ? '#ffffff' : 'transparent',
              color: activeTab === 'readability' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'readability' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Readability & SEO
          </button>
        </div>

        {/* Tab 1: Headline Recommendations */}
        {activeTab === 'headlines' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                AI-Suggested Viral Headlines
              </span>
              <Button
                size="small"
                onClick={() => fetchInsights('generate-headlines')}
                loading={loading}
                style={{ borderRadius: '8px', fontSize: '11.5px' }}
              >
                Regenerate
              </Button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin tip="Generating high-impact headlines..." />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {headlines.map((hl, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
                      {hl}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          onApplyTitle(hl);
                          message.success('Headline applied to story title!');
                        }}
                        style={{
                          borderRadius: '8px',
                          fontSize: '11px',
                          background: '#4f46e5',
                          fontWeight: 700,
                        }}
                      >
                        Use Headline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: TL;DR & Key Takeaways */}
        {activeTab === 'tldr' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                Executive Summary & Takeaways
              </span>
              <Button
                size="small"
                onClick={() => fetchInsights('generate-tldr')}
                loading={loading}
                style={{ borderRadius: '8px', fontSize: '11.5px' }}
              >
                Regenerate
              </Button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin tip="Synthesizing takeaways..." />
              </div>
            ) : tldrData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Summary Card */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                    Executive Summary
                  </span>
                  <p style={{ margin: '6px 0 10px', fontSize: '13.5px', color: '#1e293b', lineHeight: 1.5 }}>
                    {tldrData.summary}
                  </p>
                  <Button
                    size="small"
                    onClick={() => {
                      onApplySubtitle(tldrData.summary);
                      message.success('Summary set as article subtitle!');
                    }}
                    style={{ borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}
                  >
                    Set as Subtitle
                  </Button>
                </div>

                {/* Takeaways Card */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                    Key Takeaways
                  </span>
                  <ul style={{ margin: '8px 0 12px', paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                    {tldrData.takeaways?.map((t, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      onInsertTakeaways(tldrData.takeaways);
                      message.success('Takeaways inserted into article body!');
                    }}
                    style={{ borderRadius: '8px', fontSize: '11.5px', background: '#059669' }}
                  >
                    Insert Takeaways into Body
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 3: Readability & SEO */}
        {activeTab === 'readability' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                Readability & Topic Scoring
              </span>
              <Button
                size="small"
                onClick={() => fetchInsights('analyze-readability')}
                loading={loading}
                style={{ borderRadius: '8px', fontSize: '11.5px' }}
              >
                Re-Analyze
              </Button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin tip="Analyzing readability metrics..." />
              </div>
            ) : readabilityData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Score Card */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                      READING EASE SCORE
                    </span>
                    <h3 style={{ margin: '2px 0 0', fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>
                      {readabilityData.readingEase} / 100
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
                      {readabilityData.difficultyLabel} ({readabilityData.gradeLevel})
                    </span>
                  </div>
                  <Progress
                    type="circle"
                    percent={readabilityData.readingEase}
                    width={56}
                    strokeColor="#4f46e5"
                    format={() => `${readabilityData.readingEase}`}
                  />
                </div>

                {/* Metrics Breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>WORDS</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800 }}>{readabilityData.wordCount}</h4>
                  </div>
                  <div style={{ padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>SENTENCES</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800 }}>{readabilityData.sentenceCount}</h4>
                  </div>
                  <div style={{ padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>EST. TIME</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800 }}>{readabilityData.readTimeMinutes}m</h4>
                  </div>
                </div>

                {/* Suggested Tags */}
                {readabilityData.suggestedTags?.length > 0 && (
                  <div style={{ padding: '14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <TagsOutlined style={{ color: '#4f46e5' }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        Suggested Topic Tags
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {readabilityData.suggestedTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            onAddTag(tag);
                            message.success(`Added #${tag} to story tags!`);
                          }}
                          style={{
                            border: '1px solid #c7d2fe',
                            background: '#eef2ff',
                            color: '#4f46e5',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <PlusOutlined style={{ fontSize: '10px' }} /> #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default AiCopilotDrawer;

