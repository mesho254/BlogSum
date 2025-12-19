import React from 'react';
import Navbar from '../components/NavBar';
import { Typography, Row, Col, Divider, List } from 'antd';

const { Title, Paragraph } = Typography;

function ReturnPolicy() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: '100px', padding: '0 20px' }}>
        {/* Hero Section */}
        <Row justify="center" align="middle" style={{ minHeight: '40vh', background: '#f0f2f5', borderRadius: '8px', marginBottom: '40px' }}>
          <Col xs={24} md={18} lg={16}>
            <Title level={1} style={{ textAlign: 'center', color: '#1890ff' }}>Return Policy</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
              At BlogSum, we strive to provide the best service possible. This Return Policy outlines our guidelines for refunds and returns. Last updated: December 19, 2025.
            </Paragraph>
          </Col>
        </Row>

        {/* Introduction Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Introduction</Title>
            <Paragraph>
              BlogSum offers digital services including AI-powered blog summarization and content curation. As a software-as-a-service (SaaS) platform, our return policy focuses on subscription refunds rather than physical product returns. We aim to ensure customer satisfaction through fair and transparent practices.
            </Paragraph>
            <Paragraph>
              By subscribing to or using our services, you agree to this Return Policy. If you are not satisfied, please review the eligibility criteria below.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* Eligibility for Refunds Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Eligibility for Refunds</Title>
            <Paragraph>
              Refunds may be issued under the following circumstances:
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                'Within 14 days of initial subscription purchase for unused services.',
                'If there is a billing error on our part.',
                'In cases where the service fails to meet the described functionality due to a technical issue on our end.',
                'For annual subscriptions, prorated refunds may be available if canceled mid-term under specific conditions.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
            <Paragraph>
              Note: Free trials do not qualify for refunds as no payment is involved.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* Refund Process Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Refund Process</Title>
            <Paragraph>
              To request a refund, follow these steps:
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                '1. Contact our support team via email at refunds@blogsum.com or through the Contact Us form on our website.',
                '2. Provide your account details, subscription information, and reason for the refund request.',
                '3. Our team will review your request within 5-7 business days.',
                '4. If approved, the refund will be processed to your original payment method within 10 business days.',
                '5. You will receive a confirmation email once the refund is complete.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Exceptions and Non-Refundable Items Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Exceptions and Non-Refundable Items</Title>
            <Paragraph>
              Refunds will not be issued in the following cases:
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                'After the 14-day refund window has passed.',
                'For services that have been substantially used (e.g., extensive summarizations or API calls).',
                'Due to changes in personal circumstances or dissatisfaction not related to service quality.',
                'For violations of our Terms of Service, which may result in account termination without refund.',
                'For third-party fees or charges (e.g., payment processing fees).'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Contact Information Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Contact Information</Title>
            <Paragraph>
              If you have questions about this Return Policy or need assistance with a refund request, please reach out to us:
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                'Email: refunds@blogsum.com',
                'Phone: +1 (123) 456-7890',
                'Address: 123 BlogSum Street, Tech City, CA 94043, USA'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Changes to Policy Section */}
        <Row gutter={[16, 32]} justify="center" style={{ marginBottom: '40px' }}>
          <Col xs={24} md={20}>
            <Title level={2}>Changes to This Return Policy</Title>
            <Paragraph>
              We may update this Return Policy from time to time to reflect changes in our practices or legal requirements. We will notify users of significant changes via email or on our website.
            </Paragraph>
            <Paragraph>
              Continued use of our services after changes constitutes acceptance of the updated policy.
            </Paragraph>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default ReturnPolicy;