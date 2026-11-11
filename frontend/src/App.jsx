import { Route, Routes } from 'react-router-dom';
import './App.css';
import React, { lazy, Suspense } from "react";
import { Skeleton } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';
import 'antd/dist/reset.css';
import CustomFooter from './components/Footer';
import ProtectedRoute from './utils/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axiosInstance from './axiosConfig';
import Home from './pages/Home';
import { registerServiceWorker } from './utils/pushManager';

// Register Service Worker for offline PWA & Web Push
registerServiceWorker();

const getCachedBlogs = () => {
  try {
    const raw = localStorage.getItem('blogsum_blogs_cache');
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

// Seed cache from localStorage immediately and start background prefetch before React mounts
const initialCachedBlogs = getCachedBlogs();
if (initialCachedBlogs) {
  queryClient.setQueryData(['blogs'], initialCachedBlogs);
}
queryClient.prefetchQuery({
  queryKey: ['blogs'],
  queryFn: async () => {
    const response = await axiosInstance.get('/api/blogs');
    try {
      localStorage.setItem('blogsum_blogs_cache', JSON.stringify(response.data));
    } catch {
      // Ignore quota errors
    }
    return response.data;
  },
});

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
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SeriesDetails = lazy(() => import('./pages/SeriesDetails'));
const PublicationDetail = lazy(() => import('./pages/PublicationDetail'));



function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <div className="App">
            <main className="app-main-content">
              <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}><div style={{ padding: '24px', margin: '100px auto', maxWidth: '1560px', width: '94%' }}>
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
                  <Route path='/notifications' element={<ProtectedRoute><Notification/></ProtectedRoute>}/>
                  <Route path='/notifications/:id' element={<ProtectedRoute><Notification/></ProtectedRoute>}/>
                  <Route path='/message' element={<ProtectedRoute><Message/></ProtectedRoute>}/>

                  <Route path='/about' element={<About/>}/>
                  <Route path='/contactus' element={<Help/>}/>
                  <Route path='/services' element={<About/>}/>
                  <Route path='/careers' element={<Careers/>}/>
                  <Route path='/doc' element={<Doc/>}/>
                  <Route path='/faq' element={<Faqs/>}/>
                  <Route path='/return' element={<ReturnPolicy/>}/>
                  <Route path='/terms-of-service' element={<TermsAndConditions/>}/>
                  <Route path='/privacypolicy' element={<PrivacyPolicy/>}/>
                  <Route path='/help' element={<Help/>}/>
                  <Route path='/settings' element={<ProtectedRoute><Settings/></ProtectedRoute>}/>
                  <Route path='/admin' element={<ProtectedRoute><AdminDashboard/></ProtectedRoute>}/>
                  <Route path='/series/:id' element={<SeriesDetails/>}/>
                  <Route path='/p/:slug' element={<PublicationDetail/>}/>
                  <Route path='/publication/:slug' element={<PublicationDetail/>}/>

                  <Route path='*' element={<ErrorBoundary/>}/>
                </Routes>
              </Suspense>
            </main>
            <CustomFooter/>
          </div>
          </SocketProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;