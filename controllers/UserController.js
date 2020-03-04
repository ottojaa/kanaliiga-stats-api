const UserModel = require("../models/UserModel");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");

exports.findUsers = [
  auth,
  function(req, res) {
    if (req.user.role !== "admin") {
      return apiResponse.ErrorResponse(res, err);
    }
    try {
      UserModel.find({}).then(users => {
        console.log(users);
        if (users !== null) {
          return apiResponse.successResponseWithData(res, "No users found", {
            taken: true
          });
        } else {
          console.log(users);
          return apiResponse.successResponseWithData(res, "Users found", {
            data: users
          });
        }
      });
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];
