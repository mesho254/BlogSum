import React, { useState, useMemo } from 'react';
import { Modal, Input, Button, Tag, Empty } from 'antd';
import { SearchOutlined, CheckOutlined, CameraOutlined, LinkOutlined } from '@ant-design/icons';
import { searchUnsplashPhotos } from '../utils/unsplashLibrary';

const CATEGORIES = ['All', 'Technology', 'Business', 'Design', 'Science', 'Health', 'Travel', 'Lifestyle', 'Productivity'];

const UnsplashModal = ({ open, onClose, onSelectImage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customUrl, setCustomUrl] = useState('');

  const photos = useMemo(() => {
    return searchUnsplashPhotos(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handlePickPhoto = (photo) => {
    onSelectImage({
      url: photo.url,
      credit: `Photo by ${photo.photographer} on Unsplash`,
      photographerUrl: photo.photographerUrl,
    });
    onClose();
  };

  const handlePickCustomUrl = () => {
    if (!customUrl.trim()) return;
    onSelectImage({
      url: customUrl.trim(),
      credit: 'Custom Web Image',
      photographerUrl: '',
    });
    setCustomUrl('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CameraOutlined style={{ color: '#4f46e5', fontSize: '18px' }} />
          <span style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a' }}>
            Unsplash Free Stock Photography
          </span>
        </div>
      }
    >
      <div style={{ padding: '8px 0 16px' }}>
        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 14px' }}>
          Search thousands of high-resolution, royalty-free editorial cover images. Photographer attribution is included automatically.
        </p>

        {/* Search Bar */}
        <Input
          placeholder="Search photos (e.g. artificial intelligence, workspace, mountains, coding)..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          size="large"
          style={{ borderRadius: '12px', marginBottom: '12px' }}
        />

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  border: isActive ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  background: isActive ? '#eef2ff' : '#f8fafc',
                  color: isActive ? '#4f46e5' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '12px',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Photos Grid */}
        <div
          style={{
            maxHeight: '440px',
            overflowY: 'auto',
            paddingRight: '4px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          {photos.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px 0' }}>
              <Empty description="No matching photos found. Try a different search keyword." />
            </div>
          ) : (
            photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => handlePickPhoto(photo)}
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  aspectRatio: '16/10',
                  background: '#0f172a',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
                className="unsplash-card-item"
              >
                <img
                  src={photo.thumb}
                  alt={photo.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  loading="lazy"
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(15,23,42,0.88) 0%, transparent 60%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '8px 10px',
                  }}
                >
                  <span
                    style={{
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {photo.title}
                  </span>
                  <span
                    style={{
                      color: '#cbd5e1',
                      fontSize: '10px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    by {photo.photographer}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Custom URL Fallback */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: '8px',
          }}
        >
          <Input
            placeholder="Or paste any custom image URL directly (e.g. https://...)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            prefix={<LinkOutlined style={{ color: '#94a3b8' }} />}
            style={{ borderRadius: '10px' }}
          />
          <Button
            type="primary"
            onClick={handlePickCustomUrl}
            disabled={!customUrl.trim()}
            style={{ borderRadius: '10px', background: '#4f46e5' }}
          >
            Insert URL
          </Button>
        </div>
      </div>

      <style>{`
        .unsplash-card-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.16);
          border-color: #6366f1;
        }
      `}</style>
    </Modal>
  );
};

export default UnsplashModal;

