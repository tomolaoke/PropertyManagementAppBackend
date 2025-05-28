// Controller for invitation-related business logic
// Handles sending, accepting, and declining invitations for tenants and landlords
// Each exported function corresponds to a route in routes/invitations.js
//
// Example usage:
//   POST /api/invitations (landlord only)
//   GET /api/invitations (landlord: sent, tenant: received)
//
// See comments in each function for details.

const Invitation = require('../models/Invitation');
const Property = require('../models/Property');
const User = require('../models/User');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create invitation
exports.createInvitation = async (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ message: 'Only landlords can send invitations' });
  }

  const { tenant_email, property_id, lease_id } = req.body;

  if (!tenant_email || !property_id) {
    return res.status(400).json({ message: 'Tenant email and property ID are required' });
  }

  try {
    const property = await Property.findById(property_id);
    if (!property || property.landlord_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Property not found or not authorized' });
    }

    if (lease_id) {
      const lease = await Lease.findById(lease_id);
      if (!lease || lease.property_id.toString() !== property_id) {
        return res.status(400).json({ message: 'Invalid lease' });
      }
    }

    const invitation = await Invitation.create({
      landlord_id: req.user._id,
      tenant_email,
      property_id,
      lease_id,
      status: 'pending'
    });

    const msg = {
      to: tenant_email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Invitation to Join Property',
      text: `You have been invited to join ${property.title} as a tenant. Please sign up or log in to accept: http://localhost:3000/invitation/${invitation._id}`
    };
    await sgMail.send(msg);

    res.status(201).json({ message: 'Invitation sent', invitation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get invitations
exports.getInvitations = async (req, res) => {
  try {
    const query = req.user.role === 'landlord' ? { landlord_id: req.user._id } : { tenant_email: req.user.email };
    const invitations = await Invitation.find(query)
      .populate('property_id', 'title address')
      .populate('lease_id', 'start_date end_date');
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Accept invitation
exports.acceptInvitation = async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenants can accept invitations' });
  }

  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation || invitation.tenant_email !== req.user.email) {
      return res.status(403).json({ message: 'Invitation not found or not authorized' });
    }
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    invitation.status = 'accepted';
    await invitation.save();

    if (invitation.lease_id) {
      const lease = await Lease.findById(invitation.lease_id);
      lease.tenant_id = req.user._id;
      await lease.save();
    }

    res.json({ message: 'Invitation accepted', invitation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Decline invitation
exports.declineInvitation = async (req, res) => {
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenants can decline invitations' });
  }

  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation || invitation.tenant_email !== req.user.email) {
      return res.status(403).json({ message: 'Invitation not found or not authorized' });
    }
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    invitation.status = 'declined';
    await invitation.save();

    res.json({ message: 'Invitation declined', invitation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};