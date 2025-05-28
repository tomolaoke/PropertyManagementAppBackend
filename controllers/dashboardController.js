// Controller for dashboard summary endpoints
// Provides summary statistics for landlords and tenants
// Each exported function corresponds to a route in routes/dashboard.js
//
// Example usage:
//   GET /api/dashboard/landlord
//   GET /api/dashboard/tenant
//
// See comments in each function for details.

const Property = require('../models/Property');
const Lease = require('../models/Lease');
const Invitation = require('../models/Invitation');

exports.getLandlordDashboard = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can access this dashboard' });
  }

  try {
    const properties = await Property.countDocuments({ landlord_id: req.user._id, status: { $ne: 'deleted' } });
    const leases = await Lease.countDocuments({ property_id: { $in: await Property.find({ landlord_id: req.user._id }).select('_id') } });
    const invitations = await Invitation.countDocuments({ landlord_id: req.user._id, status: 'pending' });

    res.json({
      properties,
      leases,
      pending_invitations: invitations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTenantDashboard = async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenants can access this dashboard' });
  }

  try {
    const leases = await Lease.countDocuments({ tenant_id: req.user._id });
    const invitations = await Invitation.countDocuments({ tenant_email: req.user.email, status: 'pending' });

    res.json({
      leases,
      pending_invitations: invitations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};