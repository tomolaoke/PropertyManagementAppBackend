// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
  scope: ['profile', 'email'],
  passReqToCallback: true // Allow access to the request object for state
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (!user) {
      const role = req.query.state; // Get role from state parameter
      if (!role || !['tenant', 'landlord'].includes(role)) {
        return done(new Error('Role is required for new users'), null);
      }
      user = await User.create({
        name: profile.displayName,
        email,
        role, // Use the role passed via state
        email_verified: true,
        auth_provider: 'google'
      });
    }

  }, async (req, accessToken, refreshToken, profile, done) => {
    console.log('Google Profile:', profile);
    console.log('State Role:', req.query.state);

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));