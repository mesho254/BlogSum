import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import useAuth from '../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: blogs = [] } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/blogs');
      return data;
    },
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });

  const deleteBlog = async (id) => {
    await axiosInstance.delete(`/api/blogs/${id}`, {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    });
    queryClient.setQueryData(['blogs'], (old = []) => old.filter((blog) => blog._id !== id));
    queryClient.invalidateQueries({ queryKey: ['blogs'] });
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div>
        {blogs.map((blog) => (
          <div key={blog._id}>
            <h3>{blog.title}</h3>
            <p>{blog.content}</p>
            <button onClick={() => deleteBlog(blog._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
