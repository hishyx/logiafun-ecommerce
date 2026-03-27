import passport from "passport";
import User from "../models/user.model.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { googleUserExist } from "../services/auth.services.js";

const googleStrategyConfig = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await googleUserExist(profile);

      if (user) {
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  },
);

passport.use(googleStrategyConfig);

// Store ONLY the ID in the session cookie
passport.serializeUser((user, done) => {
  done(null, {
    id: user._id,
    isNew: user.isNew || false,
  });
});

// Use the ID to get the full user back from MongoDB on every request
passport.deserializeUser(async (sessionUser, done) => {
  try {
    const user = await User.findById(sessionUser.id).select(
      "-password -googleId",
    );

    // attach temporary session flag
    user.isNew = sessionUser.isNew;

    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
