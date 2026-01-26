// Google Analytics 4 Configuration for Apex Five Cleaning
// Last Updated: 2026-01-26

// ============================================
// GA4 SETUP INSTRUCTIONS
// ============================================

/**
 * STEP 1: Create GA4 Property
 * 1. Go to https://analytics.google.com/
 * 2. Sign in with your Google Business account
 * 3. Click "Create" → "Property"
 * 4. Property name: "Apex Five Cleaning"
 * 5. Timezone: Europe/London
 * 6. Currency: GBP
 * 7. Complete setup wizard
 * 8. Copy your MEASUREMENT ID (format: G-XXXXXXXXXX)
 */

// ============================================
// GA4 MEASUREMENT ID - ADD YOUR ID HERE
// ============================================
export const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX' // Replace with your actual ID from Google Analytics

// ============================================
// GA4 EVENT TRACKING IDS
// ============================================
export const GA4_EVENTS = {
  // Form submissions
  CONTACT_FORM_SUBMITTED: 'contact_form_submitted',
  QUOTE_FORM_SUBMITTED: 'quote_form_submitted',
  NEWSLETTER_SIGNUP: 'newsletter_signup',

  // Service interactions
  SERVICE_VIEWED: 'service_viewed',
  SERVICE_AREA_VIEWED: 'service_area_viewed',
  BLOG_POST_VIEWED: 'blog_post_viewed',

  // Phone/WhatsApp interactions
  PHONE_CALL_CLICKED: 'phone_call_clicked',
  WHATSAPP_CLICKED: 'whatsapp_clicked',

  // CTA clicks
  QUOTE_BUTTON_CLICKED: 'quote_button_clicked',
  BOOK_NOW_CLICKED: 'book_now_clicked',

  // Navigation
  TESTIMONIALS_VIEWED: 'testimonials_viewed',
  FAQ_VIEWED: 'faq_viewed',

  // Conversions (set as conversion events in GA4 dashboard)
  CONTACT_FORM_CONVERSION: 'contact_form_conversion',
  QUOTE_REQUEST_CONVERSION: 'quote_request_conversion'
}

// ============================================
// ANALYTICS TRACKING HELPER
// ============================================
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      ...parameters,
      timestamp: new Date().toISOString()
    })
  } else {
    console.log('GA4 not loaded yet or gtag not available')
  }
}

// ============================================
// PAGE VIEW TRACKING
// ============================================
export const trackPageView = (pageName, path) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA4_MEASUREMENT_ID, {
      page_path: path,
      page_title: pageName
    })
  }
}

// ============================================
// CONVERSION TRACKING HELPERS
// ============================================
export const trackPhoneClick = (areaOrService = 'general') => {
  trackEvent(GA4_EVENTS.PHONE_CALL_CLICKED, {
    context: areaOrService
  })
}

export const trackWhatsAppClick = (areaOrService = 'general') => {
  trackEvent(GA4_EVENTS.WHATSAPP_CLICKED, {
    context: areaOrService
  })
}

export const trackQuoteButtonClick = (source = 'unknown') => {
  trackEvent(GA4_EVENTS.QUOTE_BUTTON_CLICKED, {
    source: source
  })
}

export const trackServiceViewed = (serviceId, serviceName) => {
  trackEvent(GA4_EVENTS.SERVICE_VIEWED, {
    service_id: serviceId,
    service_name: serviceName
  })
}

export const trackServiceAreaViewed = (areaSlug, areaName) => {
  trackEvent(GA4_EVENTS.SERVICE_AREA_VIEWED, {
    area_slug: areaSlug,
    area_name: areaName
  })
}

export const trackBlogPostViewed = (slug, title, category) => {
  trackEvent(GA4_EVENTS.BLOG_POST_VIEWED, {
    post_slug: slug,
    post_title: title,
    post_category: category
  })
}

export const trackFormSubmitted = (formType) => {
  const eventName = formType === 'contact' 
    ? GA4_EVENTS.CONTACT_FORM_SUBMITTED 
    : GA4_EVENTS.QUOTE_FORM_SUBMITTED
  
  trackEvent(eventName, {
    form_type: formType,
    timestamp: new Date().toISOString()
  })

  // Also track as conversion
  const conversionEvent = formType === 'contact'
    ? GA4_EVENTS.CONTACT_FORM_CONVERSION
    : GA4_EVENTS.QUOTE_REQUEST_CONVERSION

  trackEvent(conversionEvent, {
    form_type: formType,
    value: formType === 'quote' ? 1 : 0 // Quote has higher value
  })
}

// ============================================
// GA4 SCRIPT TAG (Add to HTML head)
// ============================================
/*
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

Replace G-XXXXXXXXXX with your actual Measurement ID
*/

// ============================================
// CONVERSION GOALS TO SET UP IN GA4 DASHBOARD
// ============================================
/*
Set these up as "Events" > "Mark as Conversion" in GA4:

1. contact_form_conversion
   - Trigger: User submits contact form
   - Value: 1
   - Description: New contact inquiry

2. quote_request_conversion
   - Trigger: User submits quote request
   - Value: 2 (higher priority)
   - Description: Quote request - higher intent

3. phone_call_clicked
   - Trigger: User clicks phone number
   - Value: 0.5
   - Description: Phone click - engagement signal

4. whatsapp_clicked
   - Trigger: User clicks WhatsApp button
   - Value: 0.5
   - Description: WhatsApp click - engagement signal
*/

// ============================================
// USEFUL ANALYTICS RESOURCES
// ============================================
/*
Google Analytics 4 Documentation:
https://support.google.com/analytics/answer/9304153

Setup Guide:
https://support.google.com/analytics/answer/10089681

Event Tracking Guide:
https://support.google.com/analytics/answer/9234069

Conversion Tracking:
https://support.google.com/analytics/answer/9267568

YouTube: Google Analytics 4 Course (free)
*/

// ============================================
// TESTING GA4
// ============================================
/*
1. Go to your GA4 property
2. Click "Real-time" in left menu
3. Open your website in another tab
4. Trigger events (click phone, fill form, etc.)
5. Watch events appear in Real-time report in seconds

Once events appear there, your GA4 is working correctly!
*/
