import React, { useEffect, useState } from 'react';
import { Row, Col, Pagination, Typography, Skeleton, Button, Dropdown, Menu, Input } from 'antd';
import BlogCard from './BlogCard';
import axiosInstance from '../axiosConfig';

const { Text, Title } = Typography;

const categories = ['All', 'Technology', 'Health', 'Lifestyle', 'Education', 'Travel'];
const sortOptions = ['Newest', 'Oldest'];

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Oldest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const getBlogs = async () => {
      const response = await axiosInstance.get('/api/blogs/');
      setBlogs(response.data);
      setFilteredBlogs(response.data);
      setLoading(false);
    };

    getBlogs();
  }, []);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    filterAndSortBlogs(category, selectedSort, searchQuery);
  };

  const handleSortChange = ({ key }) => {
    setSelectedSort(key);
    filterAndSortBlogs(selectedCategory, key, searchQuery);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterAndSortBlogs(selectedCategory, selectedSort, query);
  };

  const filterAndSortBlogs = (category, sort, query) => {
    let filtered = blogs;
    if (category !== 'All') {
      filtered = blogs.filter(blog => blog.category === category);
    }

    if (query) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(query.toLowerCase()) ||
        blog.author.username.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (sort === 'Newest') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    setFilteredBlogs(filtered);
    setCurrentPage(1);
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const paginatedBlogs = filteredBlogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: '20px', margin: '10px auto', alignItems: 'center', width: '90%' }}>
      <Title level={1} style={{  }}>Blogs</Title>
      <Text style={{ display: 'block', marginBottom: '20px', fontSize:"20px", flexWrap:"wrap" }}>
        Here, we share travel tips, destination guides, and stories that inspire your next adventure.
      </Text>
      <Input
        placeholder="Search blogs by title or author"
        onChange={handleSearchChange}
        style={{ marginBottom: '20px', maxWidth: '400px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', width: '100%' }}>
        <div>
          {categories.map(category => (
            <Button
              key={category}
              type={selectedCategory === category ? 'primary' : 'default'}
              onClick={() => handleCategoryChange(category)}
              style={{ marginRight: '10px', marginBottom: '10px' }}
            >
              {category}
            </Button>
          ))}
        </div>
        <Dropdown
          overlay={
            <Menu onClick={handleSortChange}>
              {sortOptions.map(option => (
                <Menu.Item key={option}>
                  {option}
                </Menu.Item>
              ))}
            </Menu>
          }
        >
          <Button>
            Sort by: {selectedSort}
          </Button>
        </Dropdown>
      </div>
      {filteredBlogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text>{loading ? <div style={{ padding: '20px', margin: '100px auto', width: '100%' }}>
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      </div> : 'No blogs available'}</Text>
        </div>
      ) : (
        <>
          <div style={{ minHeight: '300px' }}>
            <Row gutter={[16, 16]}>
              {paginatedBlogs.map(blog => (
                <Col xs={24} sm={12} md={8} lg={8} key={blog._id} style={{minWidth:"330px"}}>
                  <BlogCard blog={blog} />
                </Col>
              ))}
            </Row>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredBlogs.length}
            onChange={handlePageChange}
          />
          </div>
        </>
      )}
    </div>
  );
};

export default BlogList;
