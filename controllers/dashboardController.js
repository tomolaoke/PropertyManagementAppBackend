const Property = require('../models/Property');
const Lease = require('../models/Lease');
const Invitation = require('../models/Invitation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Payment = require('../models/Payment');
const User = require('../models/User');

exports.getLandlordDashboard = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can access this dashboard' });
  }

  try {
    // Count properties, leases, and pending invitations
    const propertiesCount = await Property.countDocuments({ landlord_id: req.user._id, status: { $ne: 'deleted' } });
    const propertyIds = await Property.find({ landlord_id: req.user._id }).select('_id');
    const leasesCount = await Lease.countDocuments({ property_id: { $in: propertyIds } });
    const pendingInvitations = await Invitation.countDocuments({ landlord_id: req.user._id, status: 'pending' });

    // Fetch active leases with property and tenant details
    const activeLeases = await Lease.find({ property_id: { $in: propertyIds }, status: 'active' })
      .populate({
        path: 'property_id',
        select: 'title address'
      })
      .populate({
        path: 'tenant_id',
        select: 'name email'
      })
      .select('rent_amount status');

    // Calculate total revenue from active leases
    const totalRevenue = activeLeases.reduce((sum, lease) => sum + lease.rent_amount, 0);

    // Fetch recent maintenance requests (last 5)
    const maintenanceRequests = await MaintenanceRequest.find({ property_id: { $in: propertyIds } })
      .populate({
        path: 'property_id',
        select: 'title'
      })
      .select('description status')
      .sort({ created_at: -1 })
      .limit(5);

    // Fetch recent properties (last 5)
    const propertiesList = await Property.find({ landlord_id: req.user._id, status: { $ne: 'deleted' } })
      .select('title address status')
      .sort({ created_at: -1 })
      .limit(5);

    res.json({
      landlord: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      properties: propertiesCount,
      leases: leasesCount,
      pending_invitations: pendingInvitations,
      active_leases: activeLeases.map(lease => ({
        id: lease._id,
        property: {
          title: lease.property_id.title,
          address: lease.property_id.address
        },
        tenant: {
          name: lease.tenant_id.name,
          email: lease.tenant_id.email
        },
        rent_amount: lease.rent_amount,
        status: lease.status
      })),
      total_revenue: totalRevenue,
      maintenance_requests: maintenanceRequests.map(req => ({
        id: req._id,
        property_title: req.property_id.title,
        description: req.description,
        status: req.status
      })),
      properties_list: propertiesList.map(prop => ({
        id: prop._id,
        title: prop.title,
        address: prop.address,
        status: prop.status
      }))
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
    const { lease_id, amount } = req.query;

    // Count total leases and pending invitations
    const leasesCount = await Lease.countDocuments({ tenant_id: req.user._id });
    const invitations = await Invitation.countDocuments({ tenant_email: req.user.email, status: 'pending' });

    // Fetch the active lease (by lease_id if provided, else latest active lease)
    let leaseQuery = { tenant_id: req.user._id, status: 'active' };
    if (lease_id) {
      leaseQuery._id = lease_id;
    }
    const lease = await Lease.findOne(leaseQuery)
      .populate({
        path: 'property_id',
        populate: {
          path: 'landlord_id',
          select: 'name email'
        },
        select: 'title address type landlord_id'
      });

    if (!lease) {
      return res.status(404).json({ message: 'No active lease found' });
    }

    // Validate amount if provided
    if (amount && parseInt(amount) !== lease.rent_amount) {
      return res.status(400).json({ message: 'Provided amount does not match lease rent' });
    }

    // Calculate payment status and next payment date
    const latestPayment = await Payment.findOne({ lease_id: lease._id, status: 'paid' })
      .sort({ created_at: -1 });
    let paymentStatus = 'due';
    let nextPaymentDate = null;

    if (latestPayment) {
      paymentStatus = 'paid';
      const lastPaymentDate = new Date(latestPayment.created_at);
      if (lease.payment_terms === 'Monthly') {
        nextPaymentDate = new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 1));
        nextPaymentDate.setDate(15); // Assume due on the 15th
        if (nextPaymentDate < new Date()) {
          paymentStatus = 'overdue';
        }
      }
    } else if (new Date() > new Date(lease.start_date)) {
      paymentStatus = 'overdue';
      nextPaymentDate = new Date();
      nextPaymentDate.setDate(15);
    }

    // Count open maintenance requests
    const maintenanceRequests = await MaintenanceRequest.countDocuments({
      tenant_id: req.user._id,
      status: { $in: ['pending', 'in_progress'] }
    });

    // Fetch payment history (last 4 payments)
    const paymentHistory = await Payment.find({ lease_id: lease._id, status: 'paid' })
      .select('created_at amount status payment_method')
      .sort({ created_at: -1 })
      .limit(4);

    res.json({
      leases: leasesCount,
      pending_invitations: invitations,
      current_lease: {
        id: lease._id,
        property: {
          title: lease.property_id.title,
          address: lease.property_id.address,
          type: lease.property_id.type
        },
        monthly_rent: lease.rent_amount,
        payment_terms: lease.payment_terms,
        end_date: lease.end_date,
        landlord: {
          id: lease.property_id.landlord_id._id,
          name: lease.property_id.landlord_id.name,
          email: lease.property_id.landlord_id.email
        },
        status: lease.status
      },
      payment_status: paymentStatus,
      next_payment_date: nextPaymentDate ? nextPaymentDate.toISOString().split('T')[0] : null,
      maintenance_requests: maintenanceRequests,
      payment_history: paymentHistory.map(payment => ({
        id: payment._id,
        date: payment.created_at.toISOString().split('T')[0],
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method || 'Paystack'
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};