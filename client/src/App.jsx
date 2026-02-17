import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import AnnouncementBanner from "./components/AnnouncementBanner";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import TrustSection from "./components/TrustSection";
import Footer from "./components/Footer";
import { useAnnouncement } from "./context/AnnouncementContext";
import ChatWidget from "./components/ChatWidget";
import ProtectedRoute from "./components/ProtectedRoute";

// Eager load – above-the-fold / high-traffic
import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Testimonials from "./pages/Testimonials";
import FAQ from "./pages/FAQ";

// Lazy load – heavier routes (split into separate chunks)
const ServiceAreas = lazy(() => import("./pages/ServiceAreas"));
const ServiceArea = lazy(() => import("./pages/ServiceArea"));
const Quote = lazy(() => import("./pages/Quote"));
const PayOnline = lazy(() => import("./pages/PayOnline"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentError = lazy(() => import("./pages/PaymentError"));
const PaymentPending = lazy(() => import("./pages/PaymentPending"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
    </div>
  );
}

function App() {
  const { visible: bannerVisible } = useAnnouncement()

  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <AnnouncementBanner />
      <Navbar />
      <main className={bannerVisible ? 'pt-[calc(4vh+5rem)]' : 'pt-20'}>
        <Suspense fallback={<PageLoader />}>
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
          <Route path="/pay-online" element={<PayOnline />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-error" element={<PaymentError />} />
          <Route path="/payment-pending" element={<PaymentPending />} />
          <Route path="/request-a-quote" element={<Quote />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/quotes" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </main>
      <TrustSection />
      <Footer />
      <ChatWidget />
    </div>
  );
}

export default App;
