const UserModel = require("../models/UserModel");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");

exports.findUsers = [
  auth,
  function (req, res) {
    if (req.user.role !== "ADMIN") {
      return apiResponse.ErrorResponse(res, "Not authorized.");
    }
    try {
      UserModel.find({}).then((users) => {
        if (users !== null) {
          return apiResponse.successResponseWithData(res, "Users found", {
            users,
          });
        } else {
          return apiResponse.successResponseWithData(res, "No users found", {
            data: [],
          });
        }
      });
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.updateUserRole = [
  auth,
  function (req, res) {
    if (req.user.role !== "ADMIN") {
      return apiResponse.ErrorResponse(res, "Not authorized.");
    }
    try {
      UserModel.findByIdAndUpdate(
        { _id: req.body.id },
        { role: req.body.role }
      ).then(() => {
        return apiResponse.successResponse(res, "Success");
      });
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
