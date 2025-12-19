import React, { useState } from 'react';
import axiosInstance from '../axiosConfig'; // Ensure axiosInstance includes auth headers
import BlogCard from '../components/BlogCard';
import { List, Skeleton, Alert, Tabs, Avatar, Button, message, Upload, Modal, Form, Input, Tooltip, Card, notification } from 'antd';
import { UploadOutlined, EditOutlined, LockOutlined, EnvironmentOutlined, DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons';
import Navbar from '../components/NavBar';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const { TabPane } = Tabs;

function Profile() {
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const { email } = useAuth()

  const postedQuery = useQuery({
    queryKey: ['postedBlogs'],
    queryFn: async () => (await axiosInstance.get('/api/blogs/user/blogs')).data
  });

  const bookmarkedQuery = useQuery({
    queryKey: ['bookmarkedBlogs'],
    queryFn: async () => (await axiosInstance.get('/api/users/bookmarked-blogs')).data
  });

  const likedQuery = useQuery({
    queryKey: ['likedBlogs'],
    queryFn: async () => (await axiosInstance.get('/api/users/liked-blogs')).data
  });

  const profileQuery = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => (await axiosInstance.get('/api/users/profile')).data
  });

  if (postedQuery.isLoading || bookmarkedQuery.isLoading || likedQuery.isLoading || profileQuery.isLoading) {
    return (
      <div style={{ padding: '20px', margin: '100px auto', width: '100%' }}>
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (postedQuery.error || bookmarkedQuery.error || likedQuery.error || profileQuery.error) {
    return <Alert message="Error" description="Error fetching data" type="error" showIcon />;
  }

  const postedBlogs = postedQuery.data || [];
  const bookmarkedBlogs = bookmarkedQuery.data || [];
  const likedBlogs = likedQuery.data || [];
  const profileData = profileQuery.data || {
    email: "",
    username: '',
    location: '',
    profilePicture: '',
    followers: [],
    following: [],
    likedBlogs: []
  };

  const handleEditProfile = async (values) => {
    setLoading(true);
    try {
      const response = await axiosInstance.put('/api/users/profile', values);
      profileQuery.refetch();
      setProfileModalVisible(false);
      setLoading(false);
      message.success('Profile updated successfully');
    } catch (error) {
      message.error('Error updating profile');
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await axiosInstance.put('/api/auth/changePassword', { email, ...values });
      notification.success({ message: 'Password changed successfully' });
      setPasswordModalVisible(false);
    } catch (error) {
      console.error('Error changing password:', error);
      notification.error({ message: 'Failed to change password' });
    }
  };

  const handleFileChange = ({ file }) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return;
    }
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file)); // Set the preview image URL
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      message.error('No file selected for upload.');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      await axiosInstance.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          authorization: 'Bearer ' + localStorage.getItem('token'),
        },
      });
      profileQuery.refetch();
      message.success('Profile picture uploaded successfully');
      setAvatarModalVisible(false); // Close the modal after upload
      setPreviewImage(null); // Clear the preview image
    } catch (error) {
      message.error('Error uploading profile picture');
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await axiosInstance.delete('/api/users/profile/avatar');
      profileQuery.refetch();
      message.success('Profile picture deleted successfully');
      setAvatarModalVisible(false); // Close the modal after delete
      setPreviewImage(null); // Clear the preview image
    } catch (error) {
      message.error('Error deleting profile picture');
    }
  };

  const NavNew = () => {
    navigate('/createBlog')
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px', margin: "100px auto", width: "90%" }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', flexWrap: "wrap" }}>
            <Avatar size={64} src={profileData.profilePicture} onClick={() => setAvatarModalVisible(true)} style={{cursor:"pointer"}}/>
            <div style={{ marginLeft: '20px' }}>
              <h2>{profileData.username}</h2>
              <p>{profileData.email}</p>
              <p><EnvironmentOutlined /> {profileData.location}</p>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', margin: '0 10px', border:"1px purple solid", padding:"10px", borderRadius:"20px" }}>
                <p>Followers</p>
                <p style={{fontSize:"20px", fontWeight:"bold", minWidth:"70px"}}>{profileData.followers.length}</p>
              </div>
              <div style={{ textAlign: 'center', margin: '0 10px', border:"1px purple solid", padding:"10px", borderRadius:"20px"  }}>
                <p>Following</p>
                <p style={{fontSize:"20px", fontWeight:"bold", minWidth:"70px"}}>{profileData.following.length}</p>
              </div>
              <div style={{ textAlign: 'center', margin: '0 10px' , border:"1px purple solid", padding:"10px", borderRadius:"20px" }}>
                <p>Likes</p>
                <p style={{fontSize:"20px", fontWeight:"bold", minWidth:"70px"}}>{profileData.likedBlogs.length}</p>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <Tooltip title="Edit Profile">
                <Button icon={<EditOutlined />} onClick={() => setProfileModalVisible(true)} />
              </Tooltip>
              <Tooltip title="Change Password">
                <Button icon={<LockOutlined />} onClick={() => setPasswordModalVisible(true)} />
              </Tooltip>
            </div>
          </div>
        </Card>
        <Tabs defaultActiveKey="1" style={{ marginTop: '20px' }}>
          <TabPane tab="Posts" key="1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3>{`${profileData.username}'s Posts`}</h3>
              <Button type="primary" icon={<PlusCircleOutlined />} onClick={NavNew}>New Blog</Button>
            </div>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
              dataSource={postedBlogs}
              renderItem={(blog) => (
                <List.Item>
                  <BlogCard blog={blog} />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="Bookmarks" key="2">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
              dataSource={bookmarkedBlogs}
              renderItem={(blog) => (
                <List.Item>
                  <BlogCard blog={blog} />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="Liked Blogs" key="3">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
              dataSource={likedBlogs}
              renderItem={(blog) => (
                <List.Item>
                  <BlogCard blog={blog} />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="Following" key="4">
            <List
              style={{ margin: '20px 10px' }}
              dataSource={profileData.following}
              renderItem={(followed) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={followed.profilePicture} />}
                    title={followed.username}
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane tab="Followers" key="5">
            <List
              style={{ margin: '20px 10px' }}
              dataSource={profileData.followers}
              renderItem={(follower) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={follower.profilePicture} />}
                    title={follower.username}
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane tab="Groups" key="6">
            <p>Groups content goes here...</p>
          </TabPane>
          <TabPane tab="Newsletters" key="7">
            <p>Newsletters content goes here...</p>
          </TabPane>
        </Tabs>
        <Modal
          title="Edit Profile"
          visible={profileModalVisible}
          onCancel={() => setProfileModalVisible(false)}
          footer={null}
        >
          <Form
            layout="vertical"
            initialValues={profileData}
            onFinish={handleEditProfile}
          >
            <Form.Item label="Username" name="username">
              <Input />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input />
            </Form.Item>
            <Form.Item label="Location" name="location">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title="Change Password"
          visible={passwordModalVisible}
          onCancel={() => setPasswordModalVisible(false)}
          footer={null}
        >
          <Form
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item label="Current Password" name="currentPassword">
              <Input.Password />
            </Form.Item>
            <Form.Item label="New Password" name="newPassword">
              <Input.Password />
            </Form.Item>
            <Form.Item label="Confirm New Password" name="confirmNewPassword">
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title="Profile photo"
          visible={avatarModalVisible}
          onCancel={() => setAvatarModalVisible(false)}
          footer={null}
        >
          <div style={{ textAlign: 'center' }}>
            {previewImage ? (
              <>
                <Avatar size={128} src={previewImage} />
                <p>{selectedFile.name}</p>
              </>
            ) : (
              <Avatar size={128} src={profileData.profilePicture} />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '50px' }}>
              <Upload
                beforeUpload={() => false} // Prevent automatic upload
                onChange={handleFileChange}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Add photo</Button>
              </Upload>
              <Button onClick={handleUpload} loading={loading} style={{backgroundColor:"blue", color:"#fff"}}>{loading ? 'Uploading' : 'Upload'}</Button>
              <Tooltip title='Delete photo'>
                 <DeleteOutlined onClick={handleDeleteAvatar} style={{ color:"red", fontSize:"30px"}} size={'large'}/>
              </Tooltip>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}

export default Profile;