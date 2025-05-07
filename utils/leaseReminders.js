const cron = require('node-cron');
const Lease = require('../models/Lease');
const User = require('../models/User');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Run daily at midnight
const setupLeaseReminders = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const leases = await Lease.find({
        end_date: { $gte: now, $lte: thirtyDaysFromNow },
        status: { $ne: 'expired' }
      }).populate('tenant_id', 'email name').populate('property_id', 'title address');

      for (const lease of leases) {
        const msg = {
          to: lease.tenant_id.email,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: 'Lease Renewal Reminder',
          text: `Dear ${lease.tenant_id.name},\n\nYour lease for ${lease.property_id.title} at ${lease.property_id.address} is set to expire on ${lease.end_date.toDateString()}. Please contact your landlord to discuss renewal options.\n\nBest regards,\nProperty Management System`
        };
        await sgMail.send(msg);
        console.log(`Reminder sent to ${lease.tenant_id.email}`);
      }
    } catch (error) {
      console.error('Error sending lease reminders:', error.message);
    }
  });
};

module.exports = { setupLeaseReminders };