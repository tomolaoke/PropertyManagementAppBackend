// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
  scope: ['profile', 'email'],
  passReqToCallback: true // Allow access to the request object
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth - Profile:', profile); // Debug
    console.log('Google OAuth - State:', req.query.state); // Debug
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (!user) {
      const role = req.query.state; // Get role from state
      if (!role || !['tenant', 'landlord'].includes(role)) {
        console.log('Invalid or missing role:', role);
        return done(new Error('Role is required for new users'), null);
      }
      user = await User.create({
        name: profile.displayName,
        email,
        role: role, // Explicitly use the role from state
        email_verified: true,
        auth_provider: 'google'
      });
      console.log('Created new user:', user); // Debug
    } else {
      console.log('Existing user found:', user); // Debug
    }

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});