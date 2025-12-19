import React from 'react';
import Navbar from '../components/NavBar';
import { Typography, Row, Card, Col, Collapse, Divider, List, Space, Button } from 'antd';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

function Doc() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: '100px', padding: '0 20px' }}>
        {/* Hero Section */}
        <Row justify="center" align="middle" style={{ minHeight: '40vh', background: '#f0f2f5', borderRadius: '8px', marginBottom: '40px' }}>
          <Col xs={24} md={18} lg={16}>
            <Title level={1} style={{ textAlign: 'center', color: '#1890ff' }}>BlogSum Documentation</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
              Welcome to the official documentation for BlogSum. Here you'll find guides, references, and resources to get the most out of our platform.
            </Paragraph>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" size="large">Get Started</Button>
            </div>
          </Col>
        </Row>

        {/* Getting Started Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Getting Started</Title>
            <Paragraph>
              New to BlogSum? Follow these steps to begin summarizing and discovering content.
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                '1. Create a free account on our homepage.',
                '2. Explore the dashboard and search for blogs.',
                '3. Input a URL or select an article to generate a summary.',
                '4. Customize your feed and preferences.',
                '5. Join the community for discussions.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Features Documentation Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Features</Title>
            <Collapse accordion>
              <Panel header="AI Summarization" key="1">
                <Paragraph>Learn how to use our AI to generate summaries. Adjust length, focus, and language settings.</Paragraph>
              </Panel>
              <Panel header="Personalized Feeds" key="2">
                <Paragraph>Customize your content stream by topics, authors, or keywords. Set up notifications for updates.</Paragraph>
              </Panel>
              <Panel header="Search and Discovery" key="3">
                <Paragraph>Use advanced search filters to find relevant blogs. Explore trending topics and recommendations.</Paragraph>
              </Panel>
              <Panel header="Community Tools" key="4">
                <Paragraph>Engage via comments, forums, and sharing. Moderate content and report issues.</Paragraph>
              </Panel>
              <Panel header="Export and Integrations" key="5">
                <Paragraph>Export summaries to PDF/CSV. Integrate with third-party apps using our API.</Paragraph>
              </Panel>
            </Collapse>
          </Col>
        </Row>

        <Divider />

        {/* API Reference Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>API Reference</Title>
            <Paragraph>
              For developers: Integrate BlogSum's capabilities into your applications.
            </Paragraph>
            <List
              itemLayout="vertical"
              size="large"
              dataSource={[
                {
                  title: 'Authentication',
                  description: 'Use API keys for authentication. Generate keys from your account settings.'
                },
                {
                  title: 'Summarize Endpoint',
                  description: 'POST /api/summarize - Send a URL and receive a summary. Parameters: url, length, language.'
                },
                {
                  title: 'Search Endpoint',
                  description: 'GET /api/search - Query blogs by keywords. Parameters: query, filters, page.'
                },
                {
                  title: 'Feeds Endpoint',
                  description: 'GET /api/feeds - Retrieve personalized feeds. Requires user token.'
                }
              ]}
              renderItem={item => (
                <List.Item>
                  <Title level={4}>{item.title}</Title>
                  <Paragraph>{item.description}</Paragraph>
                </List.Item>
              )}
            />
            <Paragraph>
              Full API docs available at <a href="/api-docs">/api-docs</a>.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* Tutorials Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Tutorials</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card hoverable title="Beginner Guide" style={{ height: '100%' }}>
                  <Paragraph>Step-by-step walkthrough for new users.</Paragraph>
                  <Button type="link">Read More</Button>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card hoverable title="Advanced Customization" style={{ height: '100%' }}>
                  <Paragraph>Deep dive into feed personalization and API usage.</Paragraph>
                  <Button type="link">Read More</Button>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card hoverable title="Integration Examples" style={{ height: '100%' }}>
                  <Paragraph>Code samples for integrating with popular frameworks.</Paragraph>
                  <Button type="link">Read More</Button>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card hoverable title="Troubleshooting" style={{ height: '100%' }}>
                  <Paragraph>Common issues and solutions.</Paragraph>
                  <Button type="link">Read More</Button>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        {/* Support and Updates Section */}
        <Row gutter={[16, 32]} justify="center" style={{ marginBottom: '40px' }}>
          <Col xs={24} md={20}>
            <Title level={2}>Support and Updates</Title>
            <Paragraph>
              For questions, visit our FAQ or contact support. Check the changelog for recent updates.
            </Paragraph>
            <Paragraph>
              Last updated: December 19, 2025.
            </Paragraph>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Doc; 