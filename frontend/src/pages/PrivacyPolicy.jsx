import React from 'react';
import Navbar from '../components/NavBar';
import { Typography, Row, Col, Divider, List } from 'antd';

const { Title, Paragraph } = Typography;

function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: '100px', padding: '0 20px' }}>
        {/* Hero Section */}
        <Row justify="center" align="middle" style={{ minHeight: '40vh', background: '#f0f2f5', borderRadius: '8px', marginBottom: '40px' }}>
          <Col xs={24} md={18} lg={16}>
            <Title level={1} style={{ textAlign: 'center', color: '#1890ff' }}>Privacy Policy</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
              At BlogSum, we value your privacy. This policy explains how we collect, use, and protect your personal information. Last updated: December 19, 2025.
            </Paragraph>
          </Col>
        </Row>

        {/* Introduction Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Introduction</Title>
            <Paragraph>
              BlogSum ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy outlines our practices regarding the collection, use, and disclosure of your information when you use our website and services.
            </Paragraph>
            <Paragraph>
              By using BlogSum, you agree to the collection and use of information in accordance with this policy.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* Information Collection Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Information We Collect</Title>
            <Paragraph>
              We collect several types of information for various purposes to provide and improve our service to you.
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                'Personal Data: Email address, name, and other information you provide when registering.',
                'Usage Data: Information on how the service is accessed and used (e.g., IP address, browser type).',
                'Cookies and Tracking Data: We use cookies to track activity and enhance user experience.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Use of Data Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Use of Data</Title>
            <Paragraph>
              BlogSum uses the collected data for various purposes:
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                'To provide and maintain our service.',
                'To notify you about changes to our service.',
                'To allow you to participate in interactive features.',
                'To provide customer support.',
                'To gather analysis or valuable information so that we can improve our service.',
                'To monitor the usage of our service.',
                'To detect, prevent, and address technical issues.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Disclosure of Data Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Disclosure of Data</Title>
            <Paragraph>
              We may disclose your personal data in the good faith belief that such action is necessary to:
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                'Comply with a legal obligation.',
                'Protect and defend the rights or property of BlogSum.',
                'Prevent or investigate possible wrongdoing in connection with the service.',
                'Protect the personal safety of users or the public.',
                'Protect against legal liability.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Security Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Security of Data</Title>
            <Paragraph>
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* Changes to Policy Section */}
        <Row gutter={[16, 32]} justify="center" style={{ marginBottom: '40px' }}>
          <Col xs={24} md={20}>
            <Title level={2}>Changes to This Privacy Policy</Title>
            <Paragraph>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </Paragraph>
            <Paragraph>
              If you have any questions about this Privacy Policy, please contact us at privacy@blogsum.com.
            </Paragraph>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default PrivacyPolicy;