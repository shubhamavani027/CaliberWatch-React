const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { normalizeEmail } = require('../services/emailOtp');

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

if (!clientID || !clientSecret) {
  console.warn('Google OAuth is not configured: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  module.exports = passport;
  return;
}

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL: `${backendUrl}/api/auth/google/callback`,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = normalizeEmail(profile.emails?.[0]?.value);
        if (!email) {
          return done(new Error('Google account did not provide an email address'));
        }

        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

        if (!user) {
          user = new User({
            googleId: profile.id,
            name: profile.displayName || email.split('@')[0],
            email,
            role: 'user',
          });
          await user.save();
        } else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
