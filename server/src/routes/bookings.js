/**
 * BOOKING ROUTES
 * Handles all booking-related operations for cleaning services
 */

import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';

const router = express.Router();

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate booking data
 */
const validateBookingData = (data) => {
  const errors = {};

  // Validate service ID
  if (!data.serviceId || !['residential', 'end-of-tenancy', 'airbnb'].includes(data.serviceId)) {
    errors.serviceId = 'Valid service type is required';
  }

  // Validate date
  if (!data.date || isNaN(new Date(data.date))) {
    errors.date = 'Valid booking date is required';
  } else if (new Date(data.date) < new Date()) {
    errors.date = 'Booking date cannot be in the past';
  }

  // Validate time
  if (!data.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
    errors.time = 'Valid time in HH:MM format is required';
  }

  // Validate duration
  if (!data.duration || data.duration < 1 || data.duration > 12) {
    errors.duration = 'Duration must be between 1 and 12 hours';
  }

  // Validate service area
  const validAreas = [
    'Canterbury', 'Dover', 'Maidstone', 'Tunbridge Wells', 'Sevenoaks', 'Ashford',
    'Sheerness-on-Sea', 'Sittingbourne', 'Axminster', 'Croydon'
  ];
  if (!data.serviceArea || !validAreas.includes(data.serviceArea)) {
    errors.serviceArea = 'Valid service area is required';
  }

  // Validate address
  if (!data.address || !data.address.street || !data.address.postCode) {
    errors.address = 'Complete address is required (street, city, postCode)';
  }

  return errors;
};

/**
 * Calculate booking price based on service and duration
 */
const calculatePrice = (serviceId, duration, discount = 0) => {
  const baseRates = {
    residential: 45, // £45 per hour
    'end-of-tenancy': 30, // £30 per hour
    airbnb: 60 // £60 per hour
  };

  const basePrice = baseRates[serviceId] * duration;
  const discountAmount = basePrice * (discount / 100);
  const totalPrice = basePrice - discountAmount;

  return { basePrice, discountAmount, totalPrice };
};

/**
 * Get service name from ID
 */
const getServiceName = (serviceId) => {
  const names = {
    residential: 'Residential Cleaning',
    'end-of-tenancy': 'End of Tenancy Cleaning',
    airbnb: 'Airbnb Turnover Cleaning'
  };
  return names[serviceId] || serviceId;
};

// ============================================
// ROUTES
// ============================================

/**
 * CREATE BOOKING
 * POST /api/bookings
 * Create a new booking for authenticated user
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      serviceId,
      date,
      time,
      duration,
      serviceArea,
      address,
      notes,
      discount = 0
    } = req.body;

    // Validate input
    const errors = validateBookingData({ serviceId, date, time, duration, serviceArea, address });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check member discount eligibility (10% OFF for members)
    const user = await User.findById(req.user.id);
    let finalDiscount = discount;
    if (user.role === 'member') {
      finalDiscount = Math.max(discount, 10); // At least 10% for members
    }

    // Calculate pricing
    const { basePrice, discountAmount, totalPrice } = calculatePrice(serviceId, duration, finalDiscount);

    // Create booking
    const booking = new Booking({
      userId: req.user.id,
      serviceId,
      serviceName: getServiceName(serviceId),
      date: new Date(date),
      time,
      duration,
      serviceArea,
      address,
      notes,
      basePrice,
      discount: finalDiscount,
      totalPrice,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please proceed to payment.',
      booking: {
        id: booking._id,
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        serviceArea: booking.serviceArea,
        address: booking.address,
        basePrice: booking.basePrice,
        discount: booking.discount,
        totalPrice: booking.totalPrice,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt
      }
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

/**
 * GET USER'S BOOKINGS
 * GET /api/bookings
 * Retrieve all bookings for authenticated user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, serviceId, limit = 50, skip = 0 } = req.query;
    const filter = { userId: req.user.id };

    // Apply optional filters
    if (status) filter.status = status;
    if (serviceId) filter.serviceId = serviceId;

    const bookings = await Booking.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Booking.countDocuments(filter);

    // Add status labels and cancellation ability
    const enrichedBookings = bookings.map(booking => ({
      ...booking,
      statusLabel: Booking.prototype.constructor.schema.methods.getStatusLabel?.call?.(booking) || booking.status,
      canBeCancelled: booking.status === 'pending' || booking.status === 'confirmed'
    }));

    res.json({
      success: true,
      bookings: enrichedBookings,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Booking retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message
    });
  }
});

/**
 * GET BOOKING DETAILS
 * GET /api/bookings/:id
 * Retrieve specific booking details for authenticated user
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedCleaner', 'firstName lastName phone')
      .populate('paymentId');

    // Authorization check: user can only view their own bookings
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      booking: {
        ...booking.toObject(),
        canBeCancelled: booking.canBeCancelled(),
        canBeRescheduled: booking.canBeRescheduled(),
        statusLabel: booking.getStatusLabel()
      }
    });
  } catch (error) {
    console.error('Booking detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking details',
      error: error.message
    });
  }
});

/**
 * UPDATE BOOKING
 * PUT /api/bookings/:id
 * Update booking details (reschedule or modify notes)
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    // Authorization check
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Check if booking can be rescheduled
    if (!booking.canBeRescheduled()) {
      return res.status(400).json({
        success: false,
        message: `Cannot update booking with status: ${booking.status}`
      });
    }

    // Allowed updates
    const { date, time, duration, serviceArea, address, notes } = req.body;

    // Validate if date/time is being changed
    if (date || time || duration) {
      const updateData = {
        date: date ? new Date(date) : booking.date,
        time: time || booking.time,
        duration: duration || booking.duration,
        serviceArea: serviceArea || booking.serviceArea
      };

      // Validate updated data
      const errors = validateBookingData({
        serviceId: booking.serviceId,
        ...updateData,
        address: address || booking.address
      });

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      // Update booking
      booking.date = updateData.date;
      booking.time = updateData.time;
      booking.duration = updateData.duration;
      booking.serviceArea = updateData.serviceArea;
      booking.status = 'rescheduled';

      // Recalculate price if duration changed
      if (duration) {
        const { basePrice, totalPrice } = calculatePrice(
          booking.serviceId,
          duration,
          booking.discount
        );
        booking.basePrice = basePrice;
        booking.totalPrice = totalPrice;
      }
    }

    // Update address and notes
    if (address) {
      booking.address = { ...booking.address, ...address };
    }
    if (notes) {
      booking.notes = notes;
    }

    booking.updatedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: {
        id: booking._id,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        status: booking.status,
        basePrice: booking.basePrice,
        totalPrice: booking.totalPrice,
        updatedAt: booking.updatedAt
      }
    });
  } catch (error) {
    console.error('Booking update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
});

/**
 * CANCEL BOOKING
 * DELETE /api/bookings/:id
 * Cancel a pending or confirmed booking
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    // Authorization check
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      const hoursUntilBooking = (booking.date - Date.now()) / (1000 * 60 * 60);
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled. Status: ${booking.status}. Hours until booking: ${hoursUntilBooking.toFixed(1)}`,
        reason: 'Bookings must be cancelled at least 24 hours in advance'
      });
    }

    // Cancel booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || 'User cancelled';

    // If payment was made, flag for refund
    if (booking.paymentStatus === 'completed') {
      booking.paymentStatus = 'refunded';
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      refund: booking.paymentStatus === 'refunded' ? {
        amount: booking.totalPrice,
        status: 'Refund initiated',
        message: 'Refund will be processed within 5-7 business days'
      } : null,
      booking: {
        id: booking._id,
        status: booking.status,
        cancelledAt: booking.cancelledAt
      }
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

/**
 * ADD BOOKING REVIEW
 * POST /api/bookings/:id/review
 * Add rating and review after completed booking
 */
router.post('/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);

    // Authorization check
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this booking'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Add review
    booking.rating = rating;
    booking.review = review || '';
    booking.reviewDate = new Date();

    await booking.save();

    res.json({
      success: true,
      message: 'Review added successfully',
      booking: {
        id: booking._id,
        rating: booking.rating,
        review: booking.review,
        reviewDate: booking.reviewDate
      }
    });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: error.message
    });
  }
});

/**
 * GET BOOKING STATISTICS
 * GET /api/bookings/stats/overview
 * Get user's booking statistics and summary
 */
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Booking.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId) } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalSpent: { $sum: '$totalPrice' },
          totalSavings: { $sum: { $multiply: ['$basePrice', { $divide: ['$discount', 100] }] } },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    const result = stats[0] || {
      totalBookings: 0,
      completedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      totalSpent: 0,
      totalSavings: 0,
      averageRating: 0
    };

    res.json({
      success: true,
      stats: {
        ...result,
        averageRating: result.averageRating?.toFixed(1) || 0
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

export default router;
