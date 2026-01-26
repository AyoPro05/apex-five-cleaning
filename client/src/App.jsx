import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import Home from './pages/Home'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import ServiceAreas from './pages/ServiceAreas'
import ServiceArea from './pages/ServiceArea'
import About from './pages/About'
import Contact from './pages/Contact'
import Quote from './pages/Quote'
import Testimonials from './pages/Testimonials'
import FAQ from './pages/FAQ'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:serviceId" element={<ServiceDetail />} />
          <Route path="/service-areas" element={<ServiceAreas />} />
          <Route path="/service-areas/:areaSlug" element={<ServiceArea />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/request-a-quote" element={<Quote />} />
          <Route path="/admin/quotes" element={<AdminDashboard />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default App
