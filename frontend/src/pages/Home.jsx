import React from 'react'
import Navbar from '../components/NavBar'
import BlogList from '../components/BlogList'
import Banner from '../components/Banner'

function Home({loading}) {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      <Navbar/>
      <div style={{ position: 'relative', zIndex: 1, paddingTop: '96px' }}>
        <Banner/>
      </div>
      <div>
        <BlogList loading={loading}/>
      </div>
    </div>
  )
}

export default Home
