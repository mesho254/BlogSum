import React from 'react';
import Navbar from '../components/NavBar';
import { Typography, Row, Col, Collapse, Divider, Space } from 'antd';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

function Faqs() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: '100px', padding: '0 20px' }}>
        {/* Hero Section */}
        <Row justify="center" align="middle" style={{ minHeight: '40vh', background: '#f0f2f5', borderRadius: '8px', marginBottom: '40px' }}>
          <Col xs={24} md={18} lg={16}>
            <Title level={1} style={{ textAlign: 'center', color: '#1890ff' }}>Frequently Asked Questions</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
              Find answers to common questions about BlogSum. If you can't find what you're looking for, feel free to contact us.
            </Paragraph>
          </Col>
        </Row>

        {/* General FAQs Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>General Questions</Title>
            <Collapse accordion>
              <Panel header="What is BlogSum?" key="1">
                <Paragraph>BlogSum is an AI-powered platform that aggregates and summarizes blog posts from various sources, helping users stay informed efficiently.</Paragraph>
              </Panel>
              <Panel header="How do I get started with BlogSum?" key="2">
                <Paragraph>Simply sign up for a free account on our website, and you can start searching and summarizing blogs right away.</Paragraph>
              </Panel>
              <Panel header="Is BlogSum free to use?" key="3">
                <Paragraph>Yes, we offer a free plan with basic features. For advanced functionalities, check out our Pro and Enterprise plans.</Paragraph>
              </Panel>
              <Panel header="What devices does BlogSum support?" key="4">
                <Paragraph>BlogSum is fully responsive and works on desktops, tablets, and mobile devices.</Paragraph>
              </Panel>
            </Collapse>
          </Col>
        </Row>

        <Divider />

        {/* Account and Security FAQs Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Account and Security</Title>
            <Collapse accordion>
              <Panel header="How do I reset my password?" key="5">
                <Paragraph>Go to the login page, click 'Forgot Password', and follow the instructions to reset it via email.</Paragraph>
              </Panel>
              <Panel header="Is my data secure on BlogSum?" key="6">
                <Paragraph>We use industry-standard encryption and security measures to protect your data. Read our Privacy Policy for more details.</Paragraph>
              </Panel>
              <Panel header="Can I delete my account?" key="7">
                <Paragraph>Yes, you can delete your account from the settings page. All your data will be permanently removed.</Paragraph>
              </Panel>
              <Panel header="What should I do if I suspect unauthorized access?" key="8">
                <Paragraph>Contact our support team immediately at support@blogsum.com.</Paragraph>
              </Panel>
            </Collapse>
          </Col>
        </Row>

        <Divider />

        {/* Features and Usage FAQs Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Features and Usage</Title>
            <Collapse accordion>
              <Panel header="How accurate are the AI summaries?" key="9">
                <Paragraph>Our summaries are generated using advanced NLP models and are highly accurate, but we recommend verifying with the original source for critical information.</Paragraph>
              </Panel>
              <Panel header="Can I customize the summary length?" key="10">
                <Paragraph>Yes, premium users can adjust summary length and focus areas.</Paragraph>
              </Panel>
              <Panel header="Does BlogSum support multiple languages?" key="11">
                <Paragraph>Yes, we support summarization in multiple languages with translation options.</Paragraph>
              </Panel>
              <Panel header="How do I share a summary?" key="12">
                <Paragraph>Use the share button to export to PDF or post directly to social media.</Paragraph>
              </Panel>
            </Collapse>
          </Col>
        </Row>

        <Divider />

        {/* Billing and Support FAQs Section */}
        <Row gutter={[16, 32]} justify="center" style={{ marginBottom: '40px' }}>
          <Col xs={24} md={20}>
            <Title level={2}>Billing and Support</Title>
            <Collapse accordion>
              <Panel header="How do I upgrade my plan?" key="13">
                <Paragraph>Visit the Services page and select the plan you want to upgrade to.</Paragraph>
              </Panel>
              <Panel header="What payment methods do you accept?" key="14">
                <Paragraph>We accept major credit cards, PayPal, and other secure payment options.</Paragraph>
              </Panel>
              <Panel header="How can I contact support?" key="15">
                <Paragraph>Use the Contact Us form or email us at support@blogsum.com.</Paragraph>
              </Panel>
              <Panel header="Do you offer refunds?" key="16">
                <Paragraph>Refunds are available within 14 days of purchase for unused services.</Paragraph>
              </Panel>
            </Collapse>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Faqs;