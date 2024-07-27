import React from 'react'
import Navbar from '../components/NavBar'
import BlogList from '../components/BlogList'
import Banner from '../components/Banner'

function Home({loading}) {
  return (
    <>
      <Navbar/>
      <div  style={{ position: 'relative', zIndex: 1000, marginTop:"100px", marginLeft:"20px", marginRight:"20px" }}>
        <Banner/>
      </div>
      <div style={{ padding: '20px', margin:"15px auto", alignContent:"center", alignItems:"center", justifyContent:"center" }}>
        <BlogList loading={loading}/>
      </div>
    </>
  )
}

export default Home
