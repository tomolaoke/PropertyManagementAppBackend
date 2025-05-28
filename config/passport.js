// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
  scope: ['profile', 'email'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth - Request Query:', req.query);
    console.log('Google OAuth - Profile:', profile);
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (!user) {
      const role = req.query.state;
      console.log('Google OAuth - Role from state:', role);
      if (!role || !['tenant', 'landlord'].includes(role)) {
        console.log('Invalid or missing role:', role);
        return done(new Error('Role is required for new users'), null);
      }
      user = await User.create({
        name: profile.displayName,
        email,
        role,
        email_verified: true,
        auth_provider: 'google'
      });
      console.log('Created new user:', user);
    } else {
      console.log('Existing user found:', user);
    }

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error.message);
    console.error('Error stack:', error.stack);
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