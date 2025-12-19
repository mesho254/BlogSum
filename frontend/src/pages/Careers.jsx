import React from 'react';
import Navbar from '../components/NavBar';
import { Typography, Row, Col, Card, List, Divider, Space, Button, Tag } from 'antd';

const { Title, Paragraph, Text } = Typography;

function Careers() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: '100px', padding: '0 20px' }}>
        {/* Hero Section */}
        <Row justify="center" align="middle" style={{ minHeight: '40vh', background: '#f0f2f5', borderRadius: '8px', marginBottom: '40px' }}>
          <Col xs={24} md={18} lg={16}>
            <Title level={1} style={{ textAlign: 'center', color: '#1890ff' }}>Careers at BlogSum</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
              Join our innovative team and help shape the future of content summarization. We're looking for passionate individuals who thrive in a dynamic environment.
            </Paragraph>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" size="large">View Open Positions</Button>
            </div>
          </Col>
        </Row>

        {/* Why Join Us Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Why Join BlogSum?</Title>
            <Paragraph>
              At BlogSum, we foster a culture of innovation, collaboration, and growth. Our team is dedicated to making information accessible and efficient for everyone.
            </Paragraph>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Innovative Projects" style={{ height: '100%' }}>
                  <Paragraph>Work on cutting-edge AI technologies and contribute to real-world solutions.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Growth Opportunities" style={{ height: '100%' }}>
                  <Paragraph>Access to continuous learning, mentorship, and career advancement paths.</Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card hoverable title="Work-Life Balance" style={{ height: '100%' }}>
                  <Paragraph>Flexible hours, remote work options, and wellness programs.</Paragraph>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        {/* Open Positions Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Open Positions</Title>
            <List
              itemLayout="vertical"
              size="large"
              dataSource={[
                {
                  title: 'Senior AI Engineer',
                  description: 'Develop and optimize AI models for content summarization. Requires 5+ years in ML/AI.',
                  location: 'Remote',
                  type: 'Full-Time',
                  tags: ['AI', 'Machine Learning', 'Python']
                },
                {
                  title: 'Frontend Developer',
                  description: 'Build responsive UIs using React and Ant Design. Experience with modern web technologies required.',
                  location: 'San Francisco, CA',
                  type: 'Full-Time',
                  tags: ['React', 'JavaScript', 'UI/UX']
                },
                {
                  title: 'Content Specialist',
                  description: 'Curate and manage blog sources, ensure quality of summaries. Background in journalism or content creation.',
                  location: 'Remote',
                  type: 'Part-Time',
                  tags: ['Content', 'Writing', 'Research']
                },
                {
                  title: 'Product Manager',
                  description: 'Lead product development, gather user feedback, and define roadmaps.',
                  location: 'New York, NY',
                  type: 'Full-Time',
                  tags: ['Product Management', 'Agile', 'User Experience']
                }
              ]}
              renderItem={item => (
                <List.Item>
                  <Title level={4}>{item.title}</Title>
                  <Paragraph>{item.description}</Paragraph>
                  <Text>Location: {item.location} | Type: {item.type}</Text>
                  <br />
                  <Space>
                    {item.tags.map(tag => <Tag color="blue" key={tag}>{tag}</Tag>)}
                  </Space>
                  <br />
                  <Button type="link">Apply Now</Button>
                </List.Item>
              )}
            />
          </Col>
        </Row>

        <Divider />

        {/* Benefits Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Employee Benefits</Title>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
              dataSource={[
                'Competitive salary and equity options',
                'Health, dental, and vision insurance',
                '401(k) matching',
                'Paid time off and holidays',
                'Professional development stipend',
                'Remote work flexibility',
                'Team building events',
                'Wellness programs'
              ]}
              renderItem={item => (
                <List.Item>
                  <Card>{item}</Card>
                </List.Item>
              )}
            />
          </Col>
        </Row>

        <Divider />

        {/* How to Apply Section */}
        <Row gutter={[16, 32]} justify="center" style={{ marginBottom: '40px' }}>
          <Col xs={24} md={20}>
            <Title level={2}>How to Apply</Title>
            <Paragraph>
              To apply, send your resume and cover letter to careers@blogsum.com. Include the position title in the subject line.
            </Paragraph>
            <Paragraph>
              We are an equal opportunity employer and value diversity at our company.
            </Paragraph>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Careers;