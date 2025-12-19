import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Card, Tabs, List, message, Button, Skeleton } from 'antd';
import { EnvironmentOutlined, StopOutlined } from '@ant-design/icons';
import axiosInstance from '../axiosConfig';
import BlogCard from './BlogCard';
import Navbar from './NavBar';
import useAuth from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { TabPane } = Tabs;

const OtherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch user profile
  const profileQuery = useQuery({
    queryKey: ['otherProfile', id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/users/${id}`);
      const profileData = response.data;

      // If viewing own profile, redirect to /profile
      if (profileData._id === user?._id) {
        navigate('/profile', { replace: true });
      }

      return profileData;
    },
    enabled: !!user?._id, // Wait until user is loaded
  });

  // Fetch user's blogs
  const blogsQuery = useQuery({
    queryKey: ['otherBlogs', id],
    queryFn: () => axiosInstance.get(`/api/blogs/otherBlogs/${id}`).then(res => res.data),
  });

  // Fetch user's liked blogs
  const likedBlogsQuery = useQuery({
    queryKey: ['otherLikedBlogs', id],
    queryFn: () => axiosInstance.get(`/api/users/otherLiked/${id}`).then(res => res.data),
  });

  // Fetch block status
  const blockStatusQuery = useQuery({
    queryKey: ['blockStatus', id],
    queryFn: () =>
      axiosInstance
        .get(`/api/users/${id}/blockStatus`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        .then(res => res.data.isBlocked),
    enabled: !!user?.token,
  });

  // Mutation: Block user
  const blockMutation = useMutation({
    mutationFn: () =>
      axiosInstance.put(
        `/api/users/${id}/block`,
        null,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      ),
    onSuccess: () => {
      queryClient.setQueryData(['blockStatus', id], true);
      message.success('User blocked successfully');
    },
    onError: () => message.error('Failed to block user'),
  });

  // Mutation: Unblock user
  const unblockMutation = useMutation({
    mutationFn: () =>
      axiosInstance.put(
        `/api/users/${id}/unblock`,
        null,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      ),
    onSuccess: () => {
      queryClient.setQueryData(['blockStatus', id], false);
      message.success('User unblocked successfully');
    },
    onError: () => message.error('Failed to unblock user'),
  });

  const handleBlock = () => blockMutation.mutate();
  const handleUnblock = () => unblockMutation.mutate();

  const isLoading =
    profileQuery.isLoading ||
    blogsQuery.isLoading ||
    likedBlogsQuery.isLoading ||
    blockStatusQuery.isLoading;

  const isError =
    profileQuery.isError ||
    blogsQuery.isError ||
    likedBlogsQuery.isError ||
    blockStatusQuery.isError;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '20px', margin: '100px auto', width: '100%' }}>
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </div>
      </>
    );
  }

  if (isError || !profileQuery.data) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '20px', textAlign: 'center', marginTop: '100px' }}>
          <p>Error loading profile. Please try again later.</p>
        </div>
      </>
    );
  }

  const profile = profileQuery.data;
  const Blogs = blogsQuery.data || [];
  const likedBlogs = likedBlogsQuery.data || [];
  const blocked = blockStatusQuery.data || false;

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
              <p>
                <EnvironmentOutlined /> {profile.location || 'No location set'}
              </p>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  textAlign: 'center',
                  margin: '0 10px',
                  border: '1px purple solid',
                  padding: '10px',
                  borderRadius: '20px',
                }}
              >
                <p>Followers</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '70px' }}>
                  {profile.followers?.length || 0}
                </p>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  margin: '0 10px',
                  border: '1px purple solid',
                  padding: '10px',
                  borderRadius: '20px',
                }}
              >
                <p>Following</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '70px' }}>
                  {profile.following?.length || 0}
                </p>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  margin: '0 10px',
                  border: '1px purple solid',
                  padding: '10px',
                  borderRadius: '20px',
                }}
              >
                <p>Likes</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '70px' }}>
                  {profile.likedBlogs?.length || 0}
                </p>
              </div>
            </div>
            <div>
              {blocked ? (
                <Button onClick={handleUnblock} loading={unblockMutation.isPending}>
                  Unblock User
                </Button>
              ) : (
                <Button
                  icon={<StopOutlined />}
                  onClick={handleBlock}
                  loading={blockMutation.isPending}
                >
                  Block User
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Tabs defaultActiveKey="1" style={{ marginTop: 20 }}>
          <TabPane tab="Posts" key="1">
            {Blogs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>No posts yet.</p>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
                dataSource={Blogs}
                renderItem={(blog) => (
                  <List.Item>
                    <BlogCard blog={blog} />
                  </List.Item>
                )}
              />
            )}
          </TabPane>

          <TabPane tab="Liked Blogs" key="2">
            {likedBlogs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>No liked blogs.</p>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
                dataSource={likedBlogs}
                renderItem={(blog) => (
                  <List.Item>
                    <BlogCard blog={blog} />
                  </List.Item>
                )}
              />
            )}
          </TabPane>

          <TabPane tab="Following" key="3">
            {profile.following?.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>Not following anyone.</p>
            ) : (
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
            )}
          </TabPane>

          <TabPane tab="Followers" key="4">
            {profile.followers?.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>No followers yet.</p>
            ) : (
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
            )}
          </TabPane>
        </Tabs>
      </div>
    </>
  );
};

export default OtherProfile;