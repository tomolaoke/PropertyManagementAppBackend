const User = require('../models/User');

exports.updateProfile = async (req, res) => {
  const { name, phone, occupation, next_of_kin, emergency_contact } = req.body;
  const profile_picture = req.file?.path;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      name: name || user.name,
      phone: phone || user.phone,
      occupation: occupation || user.occupation,
      next_of_kin: next_of_kin || user.next_of_kin,
      emergency_contact: emergency_contact || user.emergency_contact,
      profile_picture: profile_picture || user.profile_picture
    };

    const updated = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json({ message: 'Profile updated', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};