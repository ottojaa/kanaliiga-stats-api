const express = require("express");
const authRouter = require("./auth");
const faceoffRouter = require("./faceoff");

const app = express();

app.use("/auth/", authRouter);
app.use("/faceoff/", faceoffRouter);

module.exports = app;
