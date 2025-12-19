import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message, Select, Card, Row, Col, Checkbox, DatePicker } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';
import Navbar from './NavBar';
import { useNavigate, useParams } from 'react-router-dom';

const { Option } = Select;

const BlogForm = () => {
  const { id } = useParams(); // Get the blog id from the route params
  const [form] = Form.useForm();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('');
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState('Technology'); // Default category
  const [allowComments, setAllowComments] = useState(true);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axiosInstance.get(`/api/blogs/${id}`);
        const fetchedBlog = response.data;
        // Set initial form values based on fetchedBlog
        form.setFieldsValue({
          title: fetchedBlog.title,
          content: fetchedBlog.content,
          readTime: fetchedBlog.readTime,
          category: fetchedBlog.category,
          allowComments: fetchedBlog.allowComments,
          // Set other fields as needed
        });
        setTitle(fetchedBlog.title);
        setContent(fetchedBlog.content);
        setReadTime(fetchedBlog.readTime);
        setCategory(fetchedBlog.category);
        setAllowComments(fetchedBlog.allowComments);
      } catch (error) {
        console.error('Error fetching blog:', error);
        // Handle error state if needed
      }
    };

    if (id) {
      fetchBlog();
    }
  }, [id, form]);

  const submitHandler = async (values) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('content', values.content);
    formData.append('readTime', values.readTime);
    formData.append('category', values.category); // Add category to formData
    formData.append('allowComments', values.allowComments);
    if (image) {
      formData.append('image', image);
    }

    // Add author to formData
    formData.append('author', user._id);

    try {
      if (id) {
        setLoading(true)
        await axiosInstance.put(`/api/blogs/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`
          }
        });
        navigate(`/blog/${id}`)
      } else {
        await axiosInstance.post('/api/blogs', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`
          }
        });
        navigate('/')
      }
      message.success('Blog submitted successfully');
      setLoading(false)
    } catch (error) {
      console.error('There was an error submitting the form', error);
      message.error('There was an error submitting the form');
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
      [{size: []}],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, 
       {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image', 'video'],
      ['clean']                                         
    ],
  };

  return (
    <>
    <Navbar/>
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      marginBottom:"0px", 
      marginTop:"100px" 
    }}>
      <Card style={{ width: '80%', padding: '20px'}}>
       <h1 style={{textAlign:"center"}}>{id ? 'Edit Blog' : 'Create New Blog'}</h1>
        <Form
          form={form}
          layout="vertical"
          onFinish={submitHandler}
          initialValues={{
            title: title,
            content: content,
            readTime: readTime,
            category: category, // Set initial category value
            allowComments: allowComments
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Image" name="image">
                <Upload
                  beforeUpload={(file) => {
                    setImage(file);
                    return false;
                  }}
                  onRemove={() => setImage(null)}
                  listType="picture-card"
                  style={{ width: '100%' }}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Select Image</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="Blog Title" name="title" rules={[{ required: true, message: 'Please input the blog title!' }]}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Form.Item>
              <Form.Item label="Author" name="author">
                {user.username}
              </Form.Item>
              <Form.Item label="Read Time" name="readTime" rules={[{ required: true, message: 'Please input the read time!' }]}>
                <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder='Read time in minutes(min)'/>
              </Form.Item>
              <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Please select a category!' }]}>
                <Select value={category} onChange={(value) => setCategory(value)}>
                  <Option value="Technology">Technology</Option>
                  <Option value="Health">Health</Option>
                  <Option value="Lifestyle">Lifestyle</Option>
                  <Option value="Education">Education</Option>
                  <Option value="Travel">Travel</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Publish Date" name="date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="allowComments" valuePropName="checked">
                <Checkbox checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)}>Allow Comments</Checkbox>
              </Form.Item>
              <Form.Item label="Content" name="content" rules={[{ required: true, message: 'Please input the content!' }]} style={{maxHeight:"400px", overflowY:"auto"}} >
                <ReactQuill value={content} onChange={setContent} theme="snow" modules={quillModules} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ marginRight: 8 }} loading={loading}>
                {id ? 'Update' : 'Publish'}
            </Button>
            <Button onClick={() => navigate('/')} loading={loading}>
                Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
    </>
  );
};

export default BlogForm;
