# Phase 8: Admin Dashboard & Analytics - Planning Guide

## 📋 Phase Overview

**Phase**: 8 - Admin Dashboard & Analytics  
**Status**: 📋 Planning  
**Estimated Duration**: 2-3 sessions  
**Estimated LOC**: 1,500-2,000 lines  

---

## 🎯 Phase Objectives

### Primary Goals
1. ✅ Admin payment dashboard with full payment history
2. ✅ Refund management interface
3. ✅ Payment analytics and reporting
4. ✅ Monthly revenue statistics
5. ✅ Email management and resend functionality

### Secondary Goals
1. ✅ Admin user authentication verification
2. ✅ Permission-based access control
3. ✅ Data export functionality
4. ✅ Real-time payment status updates
5. ✅ Payment trend analysis

---

## 📊 Feature Breakdown

### 1. Payment Dashboard (Backend)

**File**: `/server/src/controllers/adminController.js`

**Functions**:

#### getPaymentDashboard()
```javascript
GET /api/admin/payments/dashboard
Purpose: Get dashboard statistics and overview
Returns: {
  totalPayments: number,
  totalRevenue: number,
  successRate: percentage,
  failureCount: number,
  refundCount: number,
  pendingPayments: number,
  averagePaymentAmount: number,
  recentPayments: []
}
Security: JWT + Admin role verification
```

#### getPaymentAnalytics()
```javascript
GET /api/admin/payments/analytics?period=month
Purpose: Get detailed payment analytics
Params: period (day|week|month|year), startDate, endDate
Returns: {
  revenue: number,
  paymentCount: number,
  conversionRate: percentage,
  averageValue: number,
  topServices: [],
  topAreas: [],
  timeSeriesData: []
}
```

#### getAllPayments()
```javascript
GET /api/admin/payments?status=&serviceArea=&limit=&skip=
Purpose: Get all payments with filtering
Params: status, serviceArea, dateRange, userId, paymentIntentId
Returns: {
  payments: [
    {
      id,
      userId,
      amount,
      status,
      serviceName,
      serviceArea,
      createdAt,
      paymentMethod,
      cardLast4
    }
  ],
  total,
  filters
}
Security: JWT + Admin verification
```

#### getPaymentDetails()
```javascript
GET /api/admin/payments/:paymentId
Purpose: Get full payment details for admin review
Returns: {
  payment: { full details },
  booking: { service details },
  user: { user info },
  refund: { refund details if applicable },
  events: [ payment events ]
}
```

#### processRefund()
```javascript
POST /api/admin/payments/:paymentId/process-refund
Purpose: Process refund with admin-specific checks
Input: { reason, notes }
Actions:
  1. Verify admin authorization
  2. Check refund eligibility
  3. Create Stripe refund
  4. Update payment record
  5. Update booking status
  6. Log admin action
  7. Send notification to user
Returns: { success, refundId, amount }
```

#### resendPaymentEmail()
```javascript
POST /api/admin/payments/:paymentId/resend-email
Purpose: Resend payment confirmation emails
Input: { emailType } (receipt|confirmation|refund)
Actions:
  1. Verify email type available
  2. Get payment and booking data
  3. Queue email
  4. Log action
Returns: { success, message }
```

#### exportPayments()
```javascript
GET /api/admin/payments/export?format=csv|json|excel
Purpose: Export payment data for reporting
Params: format, dateRange, status, filters
Returns: File download or JSON data
Actions:
  1. Verify authorization
  2. Build query from filters
  3. Generate export file
  4. Log export action
  5. Return file
```

### 2. Payment Analytics (Backend)

**File**: `/server/src/utils/paymentAnalytics.js`

**Functions**:

#### calculateDashboardMetrics()
```javascript
Input: timeframe (day|week|month|year)
Output: {
  totalRevenue,
  paymentCount,
  successRate,
  averageValue,
  refundCount,
  refundRate
}
```

#### getRevenueByPeriod()
```javascript
Input: startDate, endDate, period (day|week|month)
Output: {
  dates: [],
  revenues: [],
  counts: [],
  trend: 'up'|'down'|'stable'
}
```

#### getPaymentsByStatus()
```javascript
Input: timeframe
Output: {
  completed: number,
  pending: number,
  failed: number,
  refunded: number
}
```

#### getTopServices()
```javascript
Input: limit, timeframe
Output: [
  { serviceName, count, revenue },
  ...
]
```

#### getTopServiceAreas()
```javascript
Input: limit, timeframe
Output: [
  { serviceArea, count, revenue },
  ...
]
```

#### calculateConversionRate()
```javascript
Input: timeframe
Output: {
  totalBookings,
  paidBookings,
  rate: percentage
}
```

#### getPaymentTrends()
```javascript
Input: days (7|14|30)
Output: {
  trend: 'up'|'down'|'stable',
  percentageChange: number,
  data: timeseries
}
```

### 3. Admin Routes

**File**: `/server/src/routes/admin.js` (new or extended)

**Endpoints**:

```javascript
// Dashboard
GET /api/admin/payments/dashboard
GET /api/admin/payments/analytics

// Payment Management
GET /api/admin/payments
GET /api/admin/payments/:paymentId
POST /api/admin/payments/:paymentId/process-refund
POST /api/admin/payments/:paymentId/resend-email

// Export
GET /api/admin/payments/export

// Statistics
GET /api/admin/statistics/revenue
GET /api/admin/statistics/services
GET /api/admin/statistics/areas
GET /api/admin/statistics/trends

// Users
GET /api/admin/users/payment-history/:userId
```

### 4. Frontend Admin Components

**Location**: `/client/src/pages/AdminDashboard.jsx` (extend)

**Components**:

#### AdminPaymentDashboard
```javascript
Displays:
- Key metrics (total revenue, payment count, success rate)
- Revenue trend chart
- Payment status breakdown (pie chart)
- Recent payments table
- Quick actions (process refund, resend email)
```

#### PaymentList
```javascript
Features:
- Sortable table of all payments
- Filters (status, service, area, date range)
- Pagination
- Search by payment ID or user
- Actions (view details, process refund, resend email)
```

#### PaymentDetail
```javascript
Displays:
- Full payment information
- Booking details
- User information
- Refund information (if applicable)
- Payment events timeline
- Actions (process refund, resend email)
```

#### PaymentAnalytics
```javascript
Displays:
- Revenue charts
- Payment trends
- Service breakdown
- Area breakdown
- Conversion rates
- Export options
```

#### AdminActions
```javascript
Functions:
- Process refund modal
- Resend email dialog
- Payment notes
- Admin logs
```

---

## 🔐 Security Requirements

### Authentication
- ✅ JWT token required
- ✅ Admin role verification (`user.role === 'admin'`)
- ✅ Session timeout
- ✅ IP whitelisting (optional)

### Authorization
- ✅ Admin-only endpoints
- ✅ Verify admin authorization on each route
- ✅ Audit logging of admin actions
- ✅ Prevent non-admins from accessing admin routes

### Data Protection
- ✅ No sensitive data in logs (card numbers, etc.)
- ✅ Mask card details (show only last 4)
- ✅ Mask user email in listings (optional)
- ✅ Secure export files
- ✅ Temporary file cleanup

### Audit Trail
- ✅ Log all admin actions (refund, resend, export)
- ✅ Track who made changes and when
- ✅ Store reason for refunds
- ✅ Log all exports

---

## 📱 User Interface Design

### Dashboard Layout
```
┌─────────────────────────────────────┐
│  Admin Dashboard                     │
├─────────────────────────────────────┤
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ │
│  │ Revenue│ │Payments│ │Success │ │
│  │ £XXX   │ │ XXX    │ │ XX%    │ │
│  └────────┘ └────────┘ └────────┘ │
│                                     │
│  Revenue Trend (Chart)              │
│  [════════════════════════════]     │
│                                     │
│  Payment Status (Pie Chart)         │
│  Completed: 85% | Pending: 10%      │
│  Failed: 3% | Refunded: 2%          │
│                                     │
│  Recent Payments (Table)            │
│  ┌──────┬─────┬───────┬──────────┐ │
│  │ID    │User │Amount │Status    │ │
│  ├──────┼─────┼───────┼──────────┤ │
│  │py_1  │user1│£120   │Completed │ │
│  │py_2  │user2│£85    │Pending   │ │
│  └──────┴─────┴───────┴──────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Payment List Layout
```
┌─────────────────────────────────────┐
│ Payments                             │
├─────────────────────────────────────┤
│ Filters: [Status ▼] [Area ▼]        │
│          [Date Range] [Search...]    │
├─────────────────────────────────────┤
│ ┌────┬──────┬────────┬────┬─────┬──┐│
│ │ID  │User  │Amount  │Type│Area │..││
│ ├────┼──────┼────────┼────┼─────┼──┤│
│ │py_1│John D│£120.00 │Paid│West │⋯ ││
│ │py_2│Jane S│£85.50  │Paid│East │⋯ ││
│ │py_3│Bob J │£95.00  │Ref │North│⋯ ││
│ └────┴──────┴────────┴────┴─────┴──┘│
│ [◄ Prev] [1] [2] [3] [Next ►]      │
└─────────────────────────────────────┘
```

### Payment Detail Modal
```
┌─────────────────────────────────────┐
│ Payment Details              [✕]    │
├─────────────────────────────────────┤
│ Payment ID: py_xyz                  │
│ User: John Doe                      │
│ Email: john@example.com             │
│ Amount: £120.00                     │
│ Status: Completed                   │
│ Date: Jan 28, 2026 2:30 PM         │
│                                     │
│ Booking Information:                │
│ Service: Full House Clean           │
│ Area: West London                   │
│ Date: Jan 30, 2026                 │
│ Price: £120.00                      │
│                                     │
│ Card Details:                       │
│ Brand: Visa                         │
│ Last 4: 4242                        │
│                                     │
│ Actions:                            │
│ [Process Refund] [Resend Email]     │
│ [View Booking] [View User]          │
│                                     │
└─────────────────────────────────────┘
```

---

## 📈 Analytics Visualization

### Revenue Trend Chart
- X-axis: Date (daily/weekly/monthly)
- Y-axis: Revenue (£)
- Line chart showing trend
- Interactive (hover for details)

### Payment Status Pie Chart
- Completed: Blue (85%)
- Pending: Yellow (10%)
- Failed: Red (3%)
- Refunded: Orange (2%)

### Service Breakdown Bar Chart
- X-axis: Service names
- Y-axis: Count or Revenue
- Bars for each service
- Top 10 services

### Area Breakdown Bar Chart
- X-axis: Service areas
- Y-axis: Count or Revenue
- Bars for each area
- All areas or top 10

---

## 🧪 Testing Plan

### Unit Tests
```javascript
// adminController.js tests
describe('adminController', () => {
  describe('getPaymentDashboard', () => {
    it('should return dashboard metrics');
    it('should require admin role');
    it('should exclude refunded payments');
  });
  
  describe('getAllPayments', () => {
    it('should filter by status');
    it('should filter by service area');
    it('should paginate results');
    it('should search by payment ID');
  });
  
  describe('processRefund', () => {
    it('should refund to Stripe');
    it('should update payment record');
    it('should notify user');
    it('should log admin action');
    it('should prevent duplicate refunds');
  });
});
```

### Integration Tests
```javascript
// Full admin workflow
1. Admin logs in
2. Views dashboard
3. Filters payment list
4. Views payment details
5. Processes refund
6. Resends confirmation email
7. Exports payment data
```

### Manual Testing
```
1. Admin authentication
   - Log in as admin
   - Verify role check
   - Try accessing admin routes as non-admin

2. Dashboard metrics
   - Verify calculation accuracy
   - Check date range filtering
   - Confirm trend direction

3. Payment filtering
   - Filter by status
   - Filter by area
   - Search by payment ID
   - Verify pagination

4. Refund processing
   - Process refund via admin
   - Verify Stripe refund
   - Check email sent
   - Confirm audit log entry

5. Email resend
   - Resend receipt
   - Resend confirmation
   - Verify email content
```

---

## 💾 Database Queries

### Required Indexes
```javascript
// Payment model
db.payments.createIndex({ userId: 1, createdAt: -1 });
db.payments.createIndex({ status: 1, createdAt: -1 });
db.payments.createIndex({ bookingId: 1 });
db.payments.createIndex({ stripePaymentIntentId: 1 });

// Booking model
db.bookings.createIndex({ paymentId: 1 });
db.bookings.createIndex({ serviceArea: 1, createdAt: -1 });
db.bookings.createIndex({ userId: 1, createdAt: -1 });

// Admin action log
db.adminLogs.createIndex({ adminId: 1, createdAt: -1 });
db.adminLogs.createIndex({ action: 1, createdAt: -1 });
```

### Queries Needed
```javascript
// Revenue by period
db.payments.aggregate([
  { $match: { status: 'completed', createdAt: { $gte: startDate } } },
  { $group: { _id: '$createdAt', total: { $sum: '$amount' } } },
  { $sort: { _id: 1 } }
]);

// Top services
db.bookings.aggregate([
  { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
  { $group: { _id: '$serviceName', count: { $sum: 1 }, revenue: { $sum: '$price' } } },
  { $sort: { revenue: -1 } },
  { $limit: 10 }
]);

// Payment status breakdown
db.payments.aggregate([
  { $match: { createdAt: { $gte: startDate } } },
  { $group: { _id: '$status', count: { $sum: 1 } } }
]);
```

---

## 📦 Dependencies

### Backend
```json
{
  "express": "^4.18.0",
  "mongoose": "^7.0.0",
  "stripe": "^11.0.0",
  "jsonwebtoken": "^9.0.0",
  "xlsx": "^0.18.0"  // For Excel export
}
```

### Frontend
```json
{
  "react": "^18.0.0",
  "recharts": "^2.0.0",  // Charts
  "react-table": "^8.0.0",  // Advanced tables
  "date-fns": "^2.0.0"  // Date formatting
}
```

---

## 🚀 Implementation Timeline

### Session 1: Backend (Backend + Admin Routes)
1. Create adminController.js (5 functions: dashboard, analytics, payments, refund, resend)
2. Create paymentAnalytics.js (7 analytics functions)
3. Create/extend admin routes (8-10 endpoints)
4. Add admin middleware (role verification)
5. Create admin action logging

**Output**: ~700 lines, 15 endpoints working

### Session 2: Frontend Components
1. Create AdminPaymentDashboard component
2. Create PaymentList component with filters
3. Create PaymentDetail modal
4. Create PaymentAnalytics component
5. Implement refund action
6. Implement email resend

**Output**: ~500 lines, full UI working

### Session 3: Analytics & Polish
1. Create analytics dashboard
2. Implement export functionality
3. Add charts and visualizations
4. Testing and bug fixes
5. Documentation

**Output**: ~300 lines, complete analytics

---

## 📚 Documentation Required

### Technical Docs
1. **PHASE_8_IMPLEMENTATION.md** - Technical overview
2. **Admin API Documentation** - API endpoint reference
3. **Database Schema Updates** - New models/indexes

### User Docs
1. **Admin Guide** - How to use admin dashboard
2. **Refund Procedure** - Step-by-step refund process
3. **Analytics Guide** - Understanding the metrics

---

## 🎯 Success Criteria

### Functionality
- ✅ Dashboard displays accurate metrics
- ✅ Payment filtering works correctly
- ✅ Refund processing works end-to-end
- ✅ Email resend sends correct email
- ✅ Data export works

### Performance
- ✅ Dashboard loads < 2 seconds
- ✅ Payment list loads < 3 seconds
- ✅ Charts render smoothly

### Security
- ✅ Only admins can access
- ✅ All actions logged
- ✅ No sensitive data exposed
- ✅ Export files secured

### User Experience
- ✅ Intuitive navigation
- ✅ Clear data presentation
- ✅ Responsive design
- ✅ Error handling

---

## 📋 Checklist for Phase 8

**Backend**
- [ ] Admin controller created with 5+ functions
- [ ] Payment analytics utility created
- [ ] Admin routes registered (8+ endpoints)
- [ ] Admin middleware implemented
- [ ] Admin action logging implemented
- [ ] Refund processing working
- [ ] Email resend working
- [ ] Data export working
- [ ] Database indexes created
- [ ] Error handling implemented

**Frontend**
- [ ] Admin dashboard component created
- [ ] Payment list with filters created
- [ ] Payment detail modal created
- [ ] Analytics dashboard created
- [ ] Refund modal working
- [ ] Email resend dialog working
- [ ] Export button working
- [ ] Charts displaying correctly
- [ ] Responsive design verified
- [ ] Error handling working

**Testing**
- [ ] Unit tests for admin functions
- [ ] Integration tests for workflows
- [ ] Manual testing completed
- [ ] Performance verified
- [ ] Security verified

**Documentation**
- [ ] Implementation guide written
- [ ] API documentation created
- [ ] Admin guide written
- [ ] Comments in code complete

---

## 🔗 Related Phases

- **Phase 6**: Frontend payment form (provides user data)
- **Phase 7**: Backend payment controller (provides payment data)
- **Phase 8**: Admin Dashboard (consumes payment data)
- **Phase 9**: Analytics & Reporting (extends analytics)

---

## 📊 Expected Outcomes

### Code Stats
- ~1,500+ lines of backend code
- ~800+ lines of frontend code
- 15+ API endpoints
- 20+ analytics functions
- ~1,000+ lines of documentation

### Features Delivered
- ✅ Complete admin dashboard
- ✅ Payment management interface
- ✅ Refund management
- ✅ Payment analytics
- ✅ Data export
- ✅ Audit logging

### User Value
- Complete visibility into payments
- Ability to manage refunds
- Business insights via analytics
- Export capabilities for reporting
- Audit trail for compliance

---

**Ready to start Phase 8 when needed!**

**Commit this plan**: Use as reference during implementation
