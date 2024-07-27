import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Card, Tabs, List, message, Button, Skeleton } from 'antd';
import { EnvironmentOutlined, StopOutlined } from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import BlogCard from './BlogCard';
import Navbar from './NavBar';
import useAuth from '../hooks/useAuth';

const { TabPane } = Tabs;

const OtherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [Blogs, setBlogs] = useState([]);
  const [likedBlogs, setLikedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(`/api/users/${id}`);
        setProfile(response.data);
        setLoading(false);

        // Redirect to 'profile' if the logged-in user is the author
        if (response.data._id === user._id) {
          navigate('/profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };

    const fetchBlogs = async () => {
      try {
        const response = await axiosInstance.get(`/api/blogs/otherBlogs/${id}`);
        setBlogs(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };

    const fetchLikedBlogs = async () => {
      try {
        const response = await axiosInstance.get(`/api/users/otherLiked/${id}`);
        setLikedBlogs(response.data);
      } catch (error) {
        message('Error fetching bookmarked blogs');
      }
    };

    const fetchBlockStatus = async () => {
      try {
        const response = await axiosInstance.get(`/api/users/${id}/blockStatus`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        setBlocked(response.data.isBlocked);
      } catch (error) {
        console.error('Error fetching block status:', error);
      }
    };

    fetchProfile();
    fetchBlogs();
    fetchLikedBlogs();
    fetchBlockStatus();
  }, [id, user._id, user.token, navigate]);

  const handleBlock = async () => {
    try {
      await axiosInstance.put(`/api/users/${id}/block`, null, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setBlocked(true);
      message.success('Successfully Blocked');
    } catch (error) {
      console.error('Error blocking the user', error);
      message.error('Error blocking the user');
    }
  };

  const handleUnBlock = async () => {
    try {
      await axiosInstance.put(`/api/users/${id}/unblock`, null, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setBlocked(false);
      message.success('Successfully Unblocked');
    } catch (error) {
      console.error('Error Unblocking the user', error);
      message.error('Error Unblocking the user');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', margin: '100px auto', width: '100%' }}>
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (!profile) {
    return <div>Error loading profile</div>;
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px', margin: '100px auto', width: '100%' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <Avatar size={64} src={profile.profilePicture} />
            <div style={{ marginLeft: '20px' }}>
              <h2>{profile.username}</h2>
              <p>{profile.email}</p>
              <p><EnvironmentOutlined /> {profile.location}</p>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', margin: '0 10px', border: '1px purple solid', padding: '10px', borderRadius: '20px' }}>
                <p>Followers</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '70px' }}>{profile.followers.length}</p>
              </div>
              <div style={{ textAlign: 'center', margin: '0 10px', border: '1px purple solid', padding: '10px', borderRadius: '20px' }}>
                <p>Following</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '70px' }}>{profile.following.length}</p>
              </div>
              <div style={{ textAlign: 'center', margin: '0 10px', border: '1px purple solid', padding: '10px', borderRadius: '20px' }}>
                <p>Likes</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '70px' }}>{profile.likedBlogs.length}</p>
              </div>
            </div>
            <div>
              {blocked ? (
                <Button style={{ marginLeft: 'auto' }} onClick={handleUnBlock}>Unblock User</Button>
              ) : (
                <Button icon={<StopOutlined />} style={{ marginLeft: 'auto' }} onClick={handleBlock}>Block User</Button>
              )}
            </div>
          </div>
        </Card>
        <Tabs defaultActiveKey="1" style={{ marginTop: 20 }}>
          <TabPane tab="Posts" key="1">
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
              dataSource={Blogs}
              renderItem={(blog) => (
                <List.Item>
                  <BlogCard blog={blog} />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="Liked Blogs" key="2">
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
          <TabPane tab="Following" key="3">
            <List
              style={{ margin: '20px 10px' }}
              dataSource={profile.following}
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
          <TabPane tab="Followers" key="4">
            <List
              style={{ margin: '20px 10px' }}
              dataSource={profile.followers}
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
        </Tabs>
      </div>
    </>
  );
};

export default OtherProfile;
