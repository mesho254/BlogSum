import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      const { data } = await axios.get(`/api/blogs`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setBlogs(data);
    };

    fetchBlogs();
  }, [user]);

  const deleteBlog = async (id) => {
    await axios.delete(`/api/blogs/${id}`, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });
    setBlogs(blogs.filter(blog => blog._id !== id));
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div>
        {blogs.map(blog => (
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
