const Property = require('../models/Property');
const path = require('path');
const fs = require('fs');

// Validate utility bill age (not older than 2 months)
const validateUtilityBill = (billDate) => {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  return new Date(billDate) >= twoMonthsAgo;
};

// Create property
exports.createProperty = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can create properties' });
  }

  const { title, description, address, utility_bill_date, rent, lease_duration, type } = req.body;
  const utility_bill = req.files?.utility_bill?.[0]?.path;
  const photos = req.files?.photos?.map(file => file.path);

  if (!title || !description || !address || !utility_bill || !utility_bill_date || !photos?.length || !rent || !lease_duration || !type) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!validateUtilityBill(utility_bill_date)) {
    return res.status(400).json({ message: 'Utility bill must not be older than 2 months' });
  }

  try {
    const property = await Property.create({
      landlord_id: req.user._id,
      title,
      description,
      address,
      utility_bill,
      utility_bill_date,
      photos,
      rent,
      lease_duration,
      type
    });
    res.status(201).json({ message: 'Property created', property });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all properties
exports.getProperties = async (req, res) => {
  try {
    const query = req.user.role === 'landlord' ? { landlord_id: req.user._id, status: { $ne: 'deleted' } } : { status: 'active' };
    const properties = await Property.find(query).populate('landlord_id', 'name email');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single property
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('landlord_id', 'name email');
    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update property
exports.updateProperty = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can update properties' });
  }

  const { title, description, address, utility_bill_date, rent, lease_duration, type, status } = req.body;
  const utility_bill = req.files?.utility_bill?.[0]?.path;
  const photos = req.files?.photos?.map(file => file.path);

  if (utility_bill_date && !validateUtilityBill(utility_bill_date)) {
    return res.status(400).json({ message: 'Utility bill must not be older than 2 months' });
  }

  try {
    const property = await Property.findById(req.params.id);
    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (property.landlord_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    const updateData = {
      title: title || property.title,
      description: description || property.description,
      address: address || property.address,
      utility_bill: utility_bill || property.utility_bill,
      utility_bill_date: utility_bill_date || property.utility_bill_date,
      photos: photos?.length ? photos : property.photos,
      rent: rent || property.rent,
      lease_duration: lease_duration || property.lease_duration,
      type: type || property.type,
      status: status || property.status
    };

    const updated = await Property.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ message: 'Property updated', property: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete property (soft delete)
exports.deleteProperty = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can delete properties' });
  }
  try {
    const property = await Property.findById(req.params.id);
    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (property.landlord_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }
    property.status = 'deleted';
    await property.save();
    res.json({ message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};