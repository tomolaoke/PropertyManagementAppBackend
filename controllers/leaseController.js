// Controller for lease-related business logic
// Handles CRUD operations for leases and enforces landlord/tenant permissions
// Each exported function corresponds to a route in routes/leases.js
//
// Example usage:
//   POST /api/leases (landlord only)
//   GET /api/leases (all users)
//
// See comments in each function for details.

const Lease = require('../models/Lease');
const Property = require('../models/Property');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Create lease
exports.createLease = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can create leases' });
  }

  const { property_id, tenant_id, start_date, end_date, rent_amount, payment_terms } = req.body;
  const document = req.files?.document?.[0]?.path;

  if (!property_id || !tenant_id || !start_date || !end_date || !rent_amount || !payment_terms) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  try {
    // Verify property exists and belongs to landlord
    const property = await Property.findById(property_id);
    if (!property || property.landlord_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Property not found or not authorized' });
    }

    // Verify tenant exists and is a tenant
    const tenant = await User.findById(tenant_id);
    if (!tenant || tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'Invalid tenant' });
    }

    // Validate dates
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const lease = await Lease.create({
      property_id,
      tenant_id,
      start_date,
      end_date,
      rent_amount,
      payment_terms,
      document,
      status: new Date(start_date) > new Date() ? 'upcoming' : 'active'
    });

    res.status(201).json({ message: 'Lease created', lease });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all leases
exports.getLeases = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'landlord') {
      const properties = await Property.find({ landlord_id: req.user._id });
      const propertyIds = properties.map(p => p._id);
      query = { property_id: { $in: propertyIds } };
    } else {
      query = { tenant_id: req.user._id };
    }
    const leases = await Lease.find(query)
      .populate('property_id', 'title address')
      .populate('tenant_id', 'name email');
    res.json(leases);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single lease
exports.getLease = async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property_id', 'title address')
      .populate('tenant_id', 'name email');
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    if (req.user.role === 'landlord') {
      const property = await Property.findById(lease.property_id);
      if (property.landlord_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else if (lease.tenant_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(lease);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update lease
exports.updateLease = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can update leases' });
  }

  const { start_date, end_date, rent_amount, payment_terms } = req.body;
  const document = req.files?.document?.[0]?.path;

  try {
    const lease = await Lease.findById(req.params.id);
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    const property = await Property.findById(lease.property_id);
    if (property.landlord_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const updateData = {
      start_date: start_date || lease.start_date,
      end_date: end_date || lease.end_date,
      rent_amount: rent_amount || lease.rent_amount,
      payment_terms: payment_terms || lease.payment_terms,
      document: document || lease.document,
      status: start_date && new Date(start_date) > new Date() ? 'upcoming' : lease.status
    };

    const updated = await Lease.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ message: 'Lease updated', lease: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete lease
exports.deleteLease = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can delete leases' });
  }
  try {
    const lease = await Lease.findById(req.params.id);
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    const property = await Property.findById(lease.property_id);
    if (property.landlord_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Lease.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lease deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};