import { Route, Routes } from 'react-router-dom';
import './App.css';
import React, { lazy, Suspense } from "react";
import { Skeleton } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import 'antd/dist/reset.css';
import CustomFooter from './components/Footer';
import ProtectedRoute from './utils/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(()=> import('./components/Login'))
const Register = lazy(()=> import('./components/Register'))
const BlogForm = lazy(()=> import('./components/BlogForm'))
const BlogDetails = lazy(()=> import('./components/BlogDetails'))
const Profile = lazy(()=> import('./pages/Profile'))
const OtherProfile = lazy(()=> import('./components/OtherProfile'))
const Notification = lazy(()=> import('./components/Notification'))
const Message = lazy(()=> import('./components/Message/Message'))
const ForgotPassword = lazy(()=> import('./components/ForgotPassword'))
const ResetPassword = lazy(()=> import('./components/ResetPassword'))

const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const ContactUsForm = lazy(() => import('./pages/ContactUsForm'))
const ErrorBoundary = lazy(() => import('./utils/ErrorBoundary'))
const Careers = lazy(() => import('./pages/Careers'))
const Doc = lazy(() => import('./pages/Doc'))
const Faqs = lazy(() => import('./pages/Faqs'))
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'))
const TermsAndConditions = lazy(() => import('./pages/TermsOfService'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Help = lazy(() => import('./pages/Help'));
const Settings = lazy(() => import('./pages/Settings'));



function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <div id="root" style={{ minHeight: '100vh' }}>
          <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div style={{ flex: 1 }}>
              <Suspense fallback={<div><div style={{ padding: '20px', margin: '100px auto', width: '100%' }}>
                <Skeleton active avatar paragraph={{ rows: 4 }} />
              </div></div>}>
                <Routes>
                  <Route path='/' element={<Home/>}/>
                  <Route path='/login' element={<Login/>}/>
                  <Route path='/register' element={<Register/>}/>
                  <Route path="/forgotPassword" element={<ForgotPassword/>}/>
                  <Route path="/password-reset/:id/:token" element={<ResetPassword/>}/>
                  <Route path='/profile' element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
                  <Route path="/profile/:id" element={<ProtectedRoute><OtherProfile /></ProtectedRoute>} />
                  <Route path='/createBlog' element={<ProtectedRoute><BlogForm/></ProtectedRoute>}/>
                  <Route path='/edit/:id' element={<ProtectedRoute><BlogForm /></ProtectedRoute>} /> 
                  <Route path='/blog/:id' element={<BlogDetails/>}/>
                  <Route path='/notifications/:id' element={<ProtectedRoute><Notification/></ProtectedRoute>}/>
                  <Route path='/message' element={<ProtectedRoute><Message/></ProtectedRoute>}/>

                  <Route path='/about' element={<About/>}/>
                  <Route path='/contactus' element={<ContactUsForm/>}/>
                  <Route path='/services' element={<Services/>}/>
                   <Route path='/careers' element={<Careers/>}/>
                  <Route path='/doc' element={<Doc/>}/>
                  <Route path='/faq' element={<Faqs/>}/>
                  <Route path='/return' element={<ReturnPolicy/>}/>
                  <Route path='/terms-of-service' element={<TermsAndConditions/>}/>
                  <Route path='/privacypolicy' element={<PrivacyPolicy/>}/>
                  <Route path='/help' element={<Help/>}/>
                  <Route path='/settings' element={<ProtectedRoute><Settings/></ProtectedRoute>}/>



                  <Route path='*' element={<ErrorBoundary/>}/>
                </Routes>
             </Suspense>
             </div>
             <CustomFooter/>
          </div>
        </div>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;