const Request = require('../models/Request');
const Property = require('../models/Property');

exports.createRequest = async (req, res) => {
  const { property_id } = req.body;

  if (!property_id) {
    return res.status(400).json({ message: 'Property ID is required' });
  }

  try {
    const property = await Property.findById(property_id);
    if (!property || property.status !== 'active') {
      return res.status(404).json({ message: 'Property not found or unavailable' });
    }

    const request = await Request.create({
      user_id: req.user._id,
      property_id,
      status: 'pending'
    });

    res.status(201).json({ message: 'Request created', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const query = req.user.role === 'landlord' ? { property_id: { $in: await Property.find({ landlord_id: req.user._id }).select('_id') } } : { user_id: req.user._id };
    const requests = await Request.find(query).populate('property_id', 'title address');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};