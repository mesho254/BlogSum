import React from 'react';
import Navbar from '../components/NavBar';
import { Typography, Row, Col, Divider, List } from 'antd';

const { Title, Paragraph } = Typography;

function TermsOfService() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: '100px', padding: '0 20px' }}>
        {/* Hero Section */}
        <Row justify="center" align="middle" style={{ minHeight: '40vh', background: '#f0f2f5', borderRadius: '8px', marginBottom: '40px' }}>
          <Col xs={24} md={18} lg={16}>
            <Title level={1} style={{ textAlign: 'center', color: '#1890ff' }}>Terms of Service</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
              These Terms of Service govern your use of BlogSum. By accessing or using our service, you agree to be bound by these terms. Last updated: December 19, 2025.
            </Paragraph>
          </Col>
        </Row>

        {/* Acceptance of Terms Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Acceptance of Terms</Title>
            <Paragraph>
              By using BlogSum, you agree to comply with these Terms of Service. If you do not agree, please do not use our service.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* User Accounts Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>User Accounts</Title>
            <Paragraph>
              To access certain features, you may need to create an account. You must provide accurate information and keep your account secure.
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                'You are responsible for all activities under your account.',
                'You must notify us immediately of any unauthorized use.',
                'We reserve the right to terminate accounts that violate these terms.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Use of Service Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Use of the Service</Title>
            <Paragraph>
              You agree to use BlogSum only for lawful purposes and in accordance with these terms.
            </Paragraph>
            <List
              size="large"
              bordered
              dataSource={[
                'Do not use the service to violate any laws or infringe on third-party rights.',
                'Do not attempt to hack, disrupt, or overload the service.',
                'Do not reproduce, duplicate, or sell any part of the service without permission.'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </Col>
        </Row>

        <Divider />

        {/* Intellectual Property Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Intellectual Property</Title>
            <Paragraph>
              The service and its original content are owned by BlogSum and protected by intellectual property laws.
            </Paragraph>
            <Paragraph>
              You may not use our trademarks or content without written consent.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* Limitation of Liability Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Limitation of Liability</Title>
            <Paragraph>
              In no event shall BlogSum be liable for any indirect, incidental, or consequential damages arising from the use of the service.
            </Paragraph>
            <Paragraph>
              Our total liability shall not exceed the amount paid by you for the service in the past 12 months.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* Governing Law Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Governing Law</Title>
            <Paragraph>
              These terms shall be governed by the laws of the State of California, without regard to its conflict of law provisions.
            </Paragraph>
          </Col>
        </Row>

        <Divider />

        {/* Changes to Terms Section */}
        <Row gutter={[16, 32]} justify="center" style={{ marginBottom: '40px' }}>
          <Col xs={24} md={20}>
            <Title level={2}>Changes to These Terms</Title>
            <Paragraph>
              We may update these Terms of Service from time to time. We will notify you of significant changes by posting the new terms on this page.
            </Paragraph>
            <Paragraph>
              If you have any questions about these Terms, please contact us at terms@blogsum.com.
            </Paragraph>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default TermsOfService;