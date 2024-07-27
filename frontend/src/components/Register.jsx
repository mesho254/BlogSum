import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, notification } from 'antd';
import useAuth from '../hooks/useAuth';  // Import the custom hook
import Navbar from './NavBar';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();  // Destructure the register function from useAuth
  const navigate = useNavigate();

  const submitHandler = async (values) => {
    setLoading(true);
    try {
      const { username, email, password } = values;
      await register(username, email, password);  // Use the register function from useAuth
      notification.success({
        message: 'Registration Successful',
        description: 'You have registered successfully. Please login.',
      });
      navigate('/login');
    } catch (error) {
      notification.error({
        message: 'Registration Failed',
        description: error.response ? error.response.data.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar/>
    <div style={{ minWidth: '300px', margin: '140px auto', padding: '50px',boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{textAlign:"center"}}>Register</h2>
      <Form layout="vertical" onFinish={submitHandler}>
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
        >
          <Input placeholder="Email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Register
          </Button>
        </Form.Item>
          <div>
            <span>Already have an account? </span><Link to='/login' style={{marginBottom:"13px"}}>Login</Link>
          </div>
      </Form>
    </div>
    </>
  );
};

export default Register;
