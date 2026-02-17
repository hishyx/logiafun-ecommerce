import session from "express-session";

const sessionConfig = session({
  secret: process.env.SESSION_SECRET,
  name: "user.sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: "lax",
  },
});

export default sessionConfig;
