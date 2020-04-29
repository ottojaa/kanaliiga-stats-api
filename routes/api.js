const express = require("express");
const authRouter = require("./auth");
const faceoffRouter = require("./faceoff");
const usersRouter = require("./users");
const teamsRouter = require("./teams");

const app = express();

app.use("/auth/", authRouter);
app.use("/faceoff/", faceoffRouter);
app.use("/users", usersRouter);
app.use("/teams", teamsRouter);

module.exports = app;
