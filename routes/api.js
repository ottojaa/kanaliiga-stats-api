const express = require("express");
const authRouter = require("./auth");
const faceoffRouter = require("./faceoff");
const usersRouter = require("./users");

const app = express();

app.use("/auth/", authRouter);
app.use("/faceoff/", faceoffRouter);
app.use("/users", usersRouter);

module.exports = app;
