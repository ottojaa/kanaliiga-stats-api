const express = require("express");
const authRouter = require("./auth");
const matchRouter = require("./match");

const app = express();

app.use("/auth/", authRouter);
app.use("/match/", matchRouter);

module.exports = app;
