import React, { useState } from 'react';
import { useNavigate, Link} from 'react-router-dom';
import { Form, Input, Button, notification } from 'antd';
import useAuth from '../hooks/useAuth';
import Navbar from './NavBar';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submitHandler = async (values) => {
    setLoading(true);
    try {
      const { email, password } = values;
      await login(email, password);
      notification.success({
        message: 'Login Successful',
        description: 'You have logged in successfully.',
      });
      navigate('/');
    } catch (error) {
      notification.error({
        message: 'Login Failed',
        description: error.response ? error.response.data.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar/>
    <div style={{ maxWidth: '700px', margin: '150px auto', padding: '50px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Login</h2>
      <Form layout="vertical" onFinish={submitHandler} style={{borderRadius:"10px"}}>
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
          <Input.Password placeholder="Password"/>
        </Form.Item>
        <div style={{ textAlign: 'center', marginTop: '10px', marginBottom:"20px" }}>
          <Link to="/forgotPassword">Forgot Password?</Link>
          <span style={{ margin: '0 10px' }}>|</span>
          <Link to="/register">Create Account</Link>
        </div>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
    </>
  );
};

export default Login;
