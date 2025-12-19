import React from 'react';
import Navbar from '../components/NavBar';
import { Typography, Row, Col, Card, List, Divider, Space } from 'antd';

const { Title, Paragraph, Text } = Typography;

function About() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: '100px', padding: '0 20px' }}>
        {/* Hero Section */}
        <Row justify="center" align="middle" style={{ minHeight: '40vh', background: '#f0f2f5', borderRadius: '8px', marginBottom: '40px' }}>
          <Col xs={24} md={18} lg={16}>
            <Title level={1} style={{ textAlign: 'center', color: '#1890ff' }}>About BlogSum</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
              BlogSum is your ultimate platform for discovering, summarizing, and engaging with the latest blog content from around the web. We make it easy to stay informed without the overwhelm.
            </Paragraph>
          </Col>
        </Row>

        {/* What is BlogSum Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>What is BlogSum?</Title>
            <Paragraph>
              BlogSum is an innovative web application designed to aggregate and summarize blog posts from various sources. Whether you're a avid reader, researcher, or just someone who loves staying updated, BlogSum condenses lengthy articles into concise summaries, saving you time and effort.
            </Paragraph>
            <Paragraph>
              Launched in 2023, our platform uses advanced AI algorithms to provide accurate and insightful summaries. We support multiple languages and cover a wide range of topics including technology, health, finance, lifestyle, and more.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* Features Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Our Key Features</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="AI-Powered Summaries" style={{ height: '100%' }}>
                  <Paragraph>Get quick, accurate summaries of any blog post using state-of-the-art natural language processing.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Customizable Feeds" style={{ height: '100%' }}>
                  <Paragraph>Personalize your content feed based on your interests, favorite authors, or topics.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Search and Discovery" style={{ height: '100%' }}>
                  <Paragraph>Easily search for blogs and discover new content with our intuitive search engine and recommendation system.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Multi-Device Support" style={{ height: '100%' }}>
                  <Paragraph>Access BlogSum seamlessly on desktops, tablets, and mobile devices with our responsive design.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Community Engagement" style={{ height: '100%' }}>
                  <Paragraph>Join discussions, share summaries, and connect with other users through comments and forums.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Export and Share" style={{ height: '100%' }}>
                  <Paragraph>Export summaries to PDF or share them directly on social media platforms.</Paragraph>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        {/* How It Works Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>How It Works</Title>
            <List
              size="large"
              bordered
              dataSource={[
                '1. Browse or search for blog posts on our platform.',
                '2. Select an article and let our AI generate a summary in seconds.',
                '3. Customize the summary length or focus areas as needed.',
                '4. Save, share, or discuss the content with the community.',
                '5. Receive personalized recommendations based on your reading history.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* About the Team Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>About the Team</Title>
            <Paragraph>
              BlogSum was created by a passionate team of developers, AI enthusiasts, and content creators. Our founder, Jane Doe, has over 10 years of experience in tech and journalism.
            </Paragraph>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable>
                  <Title level={4}>Jane Doe</Title>
                  <Text>Founder & CEO</Text>
                  <Paragraph>Expert in AI and content strategy.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable>
                  <Title level={4}>John Smith</Title>
                  <Text>Lead Developer</Text>
                  <Paragraph>Specializes in React and full-stack development.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable>
                  <Title level={4}>Emily Johnson</Title>
                  <Text>AI Specialist</Text>
                  <Paragraph>Focuses on NLP and machine learning models.</Paragraph>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        {/* Future Plans Section */}
        <Row gutter={[16, 32]} justify="center" style={{ marginBottom: '40px' }}>
          <Col xs={24} md={20}>
            <Title level={2}>Future Plans</Title>
            <Paragraph>
              We're constantly evolving! Upcoming features include voice summaries, integration with popular blogging platforms, and advanced analytics for content creators.
            </Paragraph>
            <Paragraph>
              Stay tuned for more updates and feel free to contact us with suggestions.
            </Paragraph>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default About;