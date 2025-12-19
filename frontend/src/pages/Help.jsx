import React from 'react';
import { Typography, Row, Col, Card, Divider, List } from 'antd';
import Navbar from '../components/NavBar';

const { Title, Paragraph } = Typography;

function Help() {
  return (
    <>
    <Navbar/>
    <div style={{ padding: '20px', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto', marginTop: '100px' }}>
      <Row justify="center" style={{ marginBottom: '40px' }}>
        <Col span={24}>
          <Title level={1} style={{ textAlign: 'center' }}>About BlogSum</Title>
          <Paragraph style={{ textAlign: 'center', fontSize: '18px' }}>
            Welcome to BlogSum, your ultimate platform for discovering, reading, and engaging with insightful blog articles across a wide range of topics. We bring together passionate writers and curious readers in a vibrant community dedicated to knowledge sharing and inspiration.
          </Paragraph>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Our Mission" style={{ height: '100%' }}>
            <Paragraph>
              At BlogSum, our core mission is to democratize access to high-quality content. We strive to inspire individuals by providing in-depth articles on Travel, Technology, Health, Lifestyle, and Education. Our goal is to foster a space where writers can express their expertise and experiences, while readers gain valuable insights that enrich their lives. We believe in the power of storytelling to connect people and drive positive change in the world.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Our Vision" style={{ height: '100%' }}>
            <Paragraph>
              We envision BlogSum as the leading hub for thought-provoking content that transcends boundaries. By leveraging modern technology and user-centric design, we aim to create an ecosystem where knowledge flows freely, encouraging lifelong learning and global conversations. In the future, we plan to expand our categories, integrate AI-driven recommendations, and host virtual events to further engage our community.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} md={12}>
          <Card title="What We Offer" style={{ height: '100%' }}>
            <List>
              <List.Item>A diverse selection of categories including Travel adventures, cutting-edge Technology updates, Health and wellness tips, Lifestyle inspirations, and Educational resources.</List.Item>
              <List.Item>Detailed, well-researched articles complete with estimated reading times to help you manage your schedule.</List.Item>
              <List.Item>Comprehensive author profiles showcasing their backgrounds, previous works, and areas of expertise.</List.Item>
              <List.Item>Interactive engagement features such as likes, comments, shares, and discussion forums to build community.</List.Item>
              <List.Item>A sleek, modern interface that's fully responsive, ensuring a seamless experience on desktops, tablets, and mobile devices.</List.Item>
              <List.Item>Regular updates with fresh content, trending topics, and personalized recommendations based on your reading history.</List.Item>
            </List>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Our History" style={{ height: '100%' }}>
            <Paragraph>
              Founded in 2023, BlogSum started as a simple idea to summarize and curate blog content from around the web. Over the years, it has evolved into a full-fledged platform with original contributions from a growing network of writers. We've expanded our reach globally, partnering with influencers and experts to deliver authentic, diverse perspectives. Today, BlogSum serves thousands of users daily, continuing to grow through user feedback and innovation.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Divider style={{ marginTop: '40px' }} />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Our Values" style={{ height: '100%' }}>
            <Paragraph>
              - Integrity: We prioritize accurate, unbiased information.<br />
              - Inclusivity: Welcoming diverse voices and viewpoints.<br />
              - Innovation: Constantly improving with new features.<br />
              - Community: Building connections through shared knowledge.<br />
              - Sustainability: Promoting eco-friendly practices in our content.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Meet the Team" style={{ height: '100%' }}>
            <Paragraph>
              Our team consists of dedicated professionals from various fields:<br />
              - Jane Doe: Founder & CEO, with a background in journalism.<br />
              - John Smith: Lead Developer, expert in web technologies.<br />
              - Emily Johnson: Content Curator, passionate about education.<br />
              - Michael Lee: Marketing Specialist, focused on community growth.<br />
              We are a small but mighty group committed to making BlogSum the best it can be.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Contact Us" style={{ height: '100%' }}>
            <Paragraph>
              Have questions or feedback? Reach out to us!<br />
              - Email: support@blogsum.com<br />
              - Social Media: Follow us on X (@BlogSumOfficial), Instagram, and LinkedIn.<br />
              - Address: 123 Innovation Lane, Tech City, CA 94043<br />
              We're here to help and love hearing from our users.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Divider style={{ marginTop: '40px' }} />

      <Row justify="center" style={{ marginTop: '40px' }}>
        <Col span={24}>
          <Title level={2} style={{ textAlign: 'center' }}>Join Our Community</Title>
          <Paragraph style={{ textAlign: 'center', fontSize: '16px' }}>
            Whether you're a avid reader seeking fresh perspectives, a budding writer eager to share your stories, or someone looking to connect with like-minded individuals, BlogSum is the perfect place for you. Sign up today, explore our extensive library of blogs, and become part of a growing community dedicated to learning and inspiration!
          </Paragraph>
        </Col>
      </Row>
    </div>
    </>

  );
}

export default Help;