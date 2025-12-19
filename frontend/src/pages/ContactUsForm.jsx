import React from 'react';
import Navbar from '../components/NavBar';
import { Typography, Row, Col, Card, Form, Input, Button, Divider, List, Space, message } from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, FacebookOutlined, TwitterOutlined, LinkedinOutlined, InstagramOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input; 

function ContactUsForm() {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    // Simulate form submission
    console.log('Received values:', values);
    message.success('Your message has been sent successfully!');
    form.resetFields();
  };

  return (
    <>
      <Navbar />
      <div style={{ marginTop: '100px', padding: '0 20px' }}>
        {/* Hero Section */}
        <Row justify="center" align="middle" style={{ minHeight: '40vh', background: '#f0f2f5', borderRadius: '8px', marginBottom: '40px' }}>
          <Col xs={24} md={18} lg={16}>
            <Title level={1} style={{ textAlign: 'center', color: '#1890ff' }}>Contact Us</Title>
            <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
              We're here to help! Whether you have questions, feedback, or need support with BlogSum, get in touch with our team. We respond within 24-48 hours.
            </Paragraph>
          </Col>
        </Row>

        {/* Contact Form Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={12}>
            <Title level={2}>Send Us a Message</Title>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Form.Item
                name="name"
                label="Your Name"
                rules={[{ required: true, message: 'Please enter your name!' }]}
              >
                <Input placeholder="Enter your full name" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Your Email"
                rules={[{ required: true, message: 'Please enter your email!', type: 'email' }]}
              >
                <Input placeholder="Enter your email address" />
              </Form.Item>
              <Form.Item
                name="subject"
                label="Subject"
                rules={[{ required: true, message: 'Please enter a subject!' }]}
              >
                <Input placeholder="What is this about?" />
              </Form.Item>
              <Form.Item
                name="message"
                label="Message"
                rules={[{ required: true, message: 'Please enter your message!' }]}
              >
                <TextArea rows={4} placeholder="Describe your query or feedback" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </Col>
          <Col xs={24} md={12}>
            <Title level={2}>Contact Information</Title>
            <Card style={{ height: '100%', borderRadius: '8px' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Paragraph>
                  <MailOutlined style={{ marginRight: '10px', color: '#1890ff' }} />
                  <Text strong>Email:</Text> support@blogsum.com
                </Paragraph>
                <Paragraph>
                  <PhoneOutlined style={{ marginRight: '10px', color: '#1890ff' }} />
                  <Text strong>Phone:</Text> +1 (123) 456-7890
                </Paragraph>
                <Paragraph>
                  <EnvironmentOutlined style={{ marginRight: '10px', color: '#1890ff' }} />
                  <Text strong>Address:</Text> 123 BlogSum Street, Tech City, CA 94043, USA
                </Paragraph>
                <Paragraph>
                  <Text strong>Business Hours:</Text> Monday - Friday, 9 AM - 5 PM (PST)
                </Paragraph>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* FAQ Section */}
        <Row gutter={[16, 32]} justify="center">
          <Col xs={24} md={20}>
            <Title level={2}>Frequently Asked Questions</Title>
            <List
              size="large"
              bordered
              dataSource={[
                {
                  question: 'How do I reset my password?',
                  answer: 'Go to the login page and click on "Forgot Password" to receive a reset link via email.'
                },
                {
                  question: 'What subscription plans do you offer?',
                  answer: 'We have Free, Pro, and Enterprise plans. Check our Services page for details.'
                },
                {
                  question: 'How accurate are the AI summaries?',
                  answer: 'Our summaries are generated using advanced NLP models and are highly accurate, but we recommend reading the full article for complete context.'
                },
                {
                  question: 'Can I integrate BlogSum with my website?',
                  answer: 'Yes, our Enterprise plan includes API access for integrations.'
                },
                {
                  question: 'How do I report a bug?',
                  answer: 'Use the contact form above or email us directly at bugs@blogsum.com.'
                }
              ]}
              renderItem={item => (
                <List.Item>
                  <Paragraph strong>{item.question}</Paragraph>
                  <Paragraph>{item.answer}</Paragraph>
                </List.Item>
              )}
            />
          </Col>
        </Row>

        <Divider />

        {/* Social Media Section */}
        <Row gutter={[16, 32]} justify="center" style={{ marginBottom: '40px' }}>
          <Col xs={24} md={20}>
            <Title level={2}>Connect With Us</Title>
            <Paragraph style={{ textAlign: 'center' }}>
              Follow us on social media for updates, tips, and more!
            </Paragraph>
            <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
              <a href="https://facebook.com/blogsum" target="_blank" rel="noopener noreferrer">
                <FacebookOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              </a>
              <a href="https://twitter.com/blogsum" target="_blank" rel="noopener noreferrer">
                <TwitterOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              </a>
              <a href="https://linkedin.com/company/blogsum" target="_blank" rel="noopener noreferrer">
                <LinkedinOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              </a>
              <a href="https://instagram.com/blogsum" target="_blank" rel="noopener noreferrer">
                <InstagramOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              </a>
            </Space>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default ContactUsForm;