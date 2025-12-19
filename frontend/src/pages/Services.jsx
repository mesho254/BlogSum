import React from 'react';
import Navbar from '../components/NavBar';
import { Typography, Row, Col, Card, List, Divider, Space, Button } from 'antd';

const { Title, Paragraph, Text } = Typography;

function Services() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: '100px', padding: '0 20px' }}>
        {/* Hero Section */}
        <Row justify="center" align="middle" style={{ minHeight: '40vh', background: '#f0f2f5', borderRadius: '8px', marginBottom: '40px' }}>
          <Col xs={24} md={18} lg={16}>
            <Title level={1} style={{ textAlign: 'center', color: '#1890ff' }}>Our Services</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
              At BlogSum, we offer a range of services designed to make blog consumption effortless and engaging. From AI-driven summaries to personalized content curation, discover how we can enhance your reading experience.
            </Paragraph>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" size="large">Get Started</Button>
            </div>
          </Col>
        </Row>

        {/* Core Services Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Core Services</Title>
            <Paragraph>
              Our services are built on cutting-edge technology to provide you with the best tools for managing and enjoying blog content.
            </Paragraph>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="AI Blog Summarization" style={{ height: '100%' }}>
                  <Paragraph>Instantly generate concise summaries of any blog post using advanced AI models. Customize summary length and focus.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Personalized Content Feeds" style={{ height: '100%' }}>
                  <Paragraph>Create custom feeds tailored to your interests, authors, or topics. Receive daily updates and recommendations.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Advanced Search & Discovery" style={{ height: '100%' }}>
                  <Paragraph>Search across millions of blogs with powerful filters and discover trending content through our recommendation engine.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Community & Collaboration" style={{ height: '100%' }}>
                  <Paragraph>Engage with other users, share summaries, and collaborate on content curation through forums and comments.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Export & Integration Tools" style={{ height: '100%' }}>
                  <Paragraph>Export summaries in various formats (PDF, TXT) and integrate with your favorite apps via APIs and webhooks.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Multi-Language Support" style={{ height: '100%' }}>
                  <Paragraph>Summarize and search blogs in multiple languages, with real-time translation options for global accessibility.</Paragraph>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        {/* How Our Services Work Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>How Our Services Work</Title>
            <List
              size="large"
              bordered
              dataSource={[
                '1. Sign up for a free account to access basic summarization tools.',
                '2. Upgrade to premium for advanced features like custom feeds and API access.',
                '3. Input a blog URL or search for content directly on the platform.',
                '4. Receive AI-generated summaries and personalized recommendations.',
                '5. Engage with the community and export content as needed.',
                '6. Integrate BlogSum services into your workflow with our developer tools.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Pricing Plans Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Pricing Plans</Title>
            <Paragraph>
              Choose a plan that fits your needs. All plans come with a 14-day free trial.
            </Paragraph>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Free Plan" style={{ height: '100%' }}>
                  <Paragraph>Basic summarization, limited searches, and community access.</Paragraph>
                  <Text strong>$0/month</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Pro Plan" style={{ height: '100%' }}>
                  <Paragraph>Unlimited summaries, custom feeds, and priority support.</Paragraph>
                  <Text strong>$9.99/month</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Enterprise Plan" style={{ height: '100%' }}>
                  <Paragraph>API access, team collaboration, and custom integrations.</Paragraph>
                  <Text strong>Contact Us</Text>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        {/* Additional Features Section */}
        <Row gutter={[16, 32]} justify="center" style={{ marginBottom: '40px' }}>
          <Col xs={24} md={20}>
            <Title level={2}>Additional Features</Title>
            <Paragraph>
              Beyond our core services, we offer extras to enhance your experience:
            </Paragraph>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
              dataSource={[
                'Real-time notifications for new content',
                'Analytics on reading habits',
                'Mobile app integration',
                'Secure data storage',
                '24/7 customer support',
                'Regular updates and new features'
              ]}
              renderItem={item => (
                <List.Item>
                  <Card>{item}</Card>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Services;