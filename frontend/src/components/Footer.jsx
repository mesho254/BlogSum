import React from 'react';
import { Layout, Row, Col, Input, Button, Typography } from 'antd';
import {
  InstagramOutlined,
  TwitterOutlined,
  FacebookOutlined,
  DiscordOutlined,
  TikTokOutlined,
} from '@ant-design/icons';
import { Link as RouterLink } from 'react-router-dom';
import Logo from '../assets/logo.png';

const { Footer } = Layout;
const { Text } = Typography;

function CustomFooter() {
  return (
    <Footer style={{ backgroundColor: '#000', color: '#fff', padding: '20px 20px', borderRadius: '10px', margin: '10px 10px' }}>
      <Row justify="space-between" gutter={[16, 16]}>
        <Col xs={24} sm={24} md={8} lg={8}>
          <div style={{ marginBottom: '20px' }}>
            <img src={Logo} alt="BlogSum Logo" style={{ width: '70px', height: '70px', borderRadius: '5px' }} />
          </div>
          <Text style={{ color: '#fff' }}>
            Our mission is to equip modern explorers with cutting-edge, functional, and stylish bags that elevate every adventure.
          </Text>
        </Col>
        <Col xs={24} sm={12} md={4} lg={4}>
          <Text strong style={{ color: '#fff' }}>About</Text>
          <div>
            <RouterLink to="/about" style={{ color: '#fff', display: 'block', marginTop: '10px' }}>About Us</RouterLink>
            <RouterLink to="/" style={{ color: '#fff', display: 'block', marginTop: '10px' }}>Blog</RouterLink>
            <RouterLink to="/careers" style={{ color: '#fff', display: 'block', marginTop: '10px' }}>Career</RouterLink>
          </div>
        </Col>
        <Col xs={24} sm={12} md={4} lg={4}>
          <Text strong style={{ color: '#fff' }}>Support</Text>
          <div>
            <RouterLink to="/contactus" style={{ color: '#fff', display: 'block', marginTop: '10px' }}>Contact Us</RouterLink>
            <RouterLink to="/doc" style={{ color: '#fff', display: 'block', marginTop: '10px' }}>Doc</RouterLink>
            <RouterLink to="/faq" style={{ color: '#fff', display: 'block', marginTop: '10px' }}>FAQ</RouterLink>
          </div>
        </Col>
        <Col xs={24} sm={24} md={8} lg={8}>
          <Text strong style={{ color: '#fff' }}>Get Updates</Text>
          <div style={{ display: 'flex', marginTop: '10px' }}>
            <Input placeholder="Enter your email" style={{ marginRight: '10px' }} />
            <Button type="primary">Subscribe</Button>
          </div>
          <div style={{ marginTop: '20px' }}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <InstagramOutlined style={{ color: '#fff', fontSize: '24px', marginRight: '20px' }} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <TwitterOutlined style={{ color: '#fff', fontSize: '24px', marginRight: '20px' }} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FacebookOutlined style={{ color: '#fff', fontSize: '24px', marginRight: '20px' }} />
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
              <DiscordOutlined style={{ color: '#fff', fontSize: '24px', marginRight: '20px' }} />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
              <TikTokOutlined style={{ color: '#fff', fontSize: '24px', marginRight: '20px' }} />
            </a>
          </div>
        </Col>
      </Row>
      <Row justify="space-between" style={{ marginTop: '40px', borderTop: '1px solid #fff', paddingTop: '20px' }}>
        <Col>
          <Text style={{ color: '#fff' }}>© 2024 BlogSum. All rights reserved.</Text>
        </Col>
        <Col>
          <RouterLink to="/privacypolicy" style={{ color: '#fff', marginRight: '20px' }}>Privacy Policy</RouterLink>
          <RouterLink to="/terms-of-service" style={{ color: '#fff' }}>Terms of Service</RouterLink>
        </Col>
      </Row>
    </Footer>
  );
}

export default CustomFooter;