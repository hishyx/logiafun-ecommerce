import express from "express";
import path from "path";
import sessionConfig from "./config/session.js";
import flash from "connect-flash";
import passport from "./config/passport.js";

//importing routers

import userRoute from "./routes/user.routes.js";

//Importing dirname

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(sessionConfig);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes

app.use("/", userRoute);

export default app;
