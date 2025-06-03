const MaintenanceRequest = require('../models/MaintenanceRequest');
const Property = require('../models/Property');
const Lease = require('../models/Lease');

exports.createMaintenanceRequest = async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenants can create maintenance requests' });
  }

  const { property_id, description } = req.body;

  if (!property_id || !description) {
    return res.status(400).json({ message: 'Property ID and description are required' });
  }

  try {
    const lease = await Lease.findOne({ property_id, tenant_id: req.user._id });
    if (!lease) {
      return res.status(403).json({ message: 'No active lease for this property' });
    }

    const property = await Property.findById(property_id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const maintenanceRequest = await MaintenanceRequest.create({
      property_id,
      tenant_id: req.user._id,
      description,
      status: 'pending'
    });

    res.status(201).json({ message: 'Maintenance request created', maintenanceRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMaintenanceRequests = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'tenant') {
      query = { tenant_id: req.user._id };
    } else if (req.user.role === 'landlord') {
      query = {
        property_id: { $in: await Property.find({ landlord_id: req.user._id }).select('_id') }
      };
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const maintenanceRequests = await MaintenanceRequest.find(query)
      .populate('property_id', 'title address')
      .select('description status created_at');

    res.json({ message: 'Maintenance requests retrieved', maintenanceRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};