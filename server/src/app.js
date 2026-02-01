import express from "express";
import path from "path";
import sessionConfig from "./config/session.js";
import flash from "connect-flash";
import passport from "./config/passport.js";
import nocache from "nocache";
import methodOverride from "method-override";
import preventHTMLCache from "./middlewares/prevent.cache.js";

//importing routers

import authRoute from "./routes/auth.routes.js";
import userRoute from "./routes/user.routes.js";
import adminRoute from "./routes/admin.routes.js";

//Importing dirname

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(nocache());

app.use(methodOverride("_method"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());
app.use(preventHTMLCache);
app.use(flash());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes

app.use("/", authRoute);
app.use("/", adminRoute);
app.use("/", userRoute);

app.use((req, res) => {
  res.status(404).render("404-not-found");
});

export default app;
