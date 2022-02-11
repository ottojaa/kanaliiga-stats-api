const UserModel = require("../models/UserModel");
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const fetch = require("node-fetch");
const btoa = require("btoa");
const { catchAsync } = require("../helpers/utility");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CLIENT_REDIRECT = process.env.CLIENT_REDIRECT;
const CLIENT_REDIRECT_LOCAL = process.env.CLIENT_REDIRECT_LOCAL;
const redirect = encodeURIComponent(CLIENT_REDIRECT);

exports.discordCallback = [
  catchAsync(async (req, res) => {
    if (!req.query.code) throw new Error("NoCodeProvided");
    const code = req.query.code;
    let formData = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: CLIENT_REDIRECT,
      scope: "identify",
    };
    params = _encode(formData);
    const response = await fetch(`https://discordapp.com/api/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const json = await response.json();
    if (!json) {
      return apiResponse.ErrorResponse(res, "If you see this error, contact @rutkula#2543 in kanaliiga discord");
    }
    const discordInternal = await fetch(`https://discordapp.com/api/users/@me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${json.access_token}`,
      },
    });
    const data = await discordInternal.json();
    UserModel.findOne({ discordId: data.id }).then((user) => {
      if (user !== null) {
        let userData = {
          _id: user._id,
          discordId: user.discordId,
          username: user.username,
          role: user.role,
        };
        //Prepare JWT token for authentication
        const jwtPayload = userData;
        const secret = process.env.JWT_SECRET;
        //Generated JWT token with Payload and secret.
        userData.token = jwt.sign(jwtPayload, secret);
        return apiResponse.successResponseWithData(res, "Login With OAUTH2 Success.", userData);
      } else {
        const user = new UserModel({
          username: data.username,
          role: "USER",
          discordId: data.id,
        });
        user.save(function (err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          }
          let userData = {
            _id: user._id,
            discordId: user.id,
            username: user.username,
            role: user.role,
          };
          const jwtPayload = userData;
          const secret = process.env.JWT_SECRET;
          //Generated JWT token with Payload and secret.
          userData.token = jwt.sign(jwtPayload, secret);
          return apiResponse.successResponseWithData(res, "Discord login Success.", userData);
        });
      }
    });
  }),
];

function _encode(obj) {
  let string = "";

  for (const [key, value] of Object.entries(obj)) {
    if (!value) continue;
    string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }

  return string.substring(1);
}

exports.checkSession = [
  function (req, res) {
    try {
      const token = req.params.token;
      const secret = process.env.JWT_SECRET;
      jwt.verify(token, secret, (err, verifiedJwt) => {
        if (err) {
          res.send(err.message);
        } else {
          res.send(verifiedJwt);
        }
      });
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.discordAuth = [
  function (req, res) {
    try {
      const url = `https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${redirect}`;
      return apiResponse.successResponseWithData(res, "Redirect url received", url);
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.findExistingEmail = [
  function (req, res) {
    try {
      UserModel.findOne({ email: req.query.email }).then((email) => {
        if (email !== null) {
          return apiResponse.successResponseWithData(res, "Email is already taken.", { taken: true });
        } else {
          return apiResponse.successResponseWithData(res, "Email is not taken.", { taken: false });
        }
      });
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

exports.findExistingUser = [
  function (req, res) {
    try {
      UserModel.findOne({ username: req.query.username }).then((username) => {
        if (username !== null) {
          return apiResponse.successResponseWithData(res, "Username is already taken.", { taken: true });
        } else {
          return apiResponse.successResponseWithData(res, "Username is not taken.", { taken: false });
        }
      });
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * User registration.
 *
 * @param {string}      username
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.register = [
  // Validate fields.
  body("username")
    .isLength({ min: 1 })
    .trim()
    .withMessage("User name must be specified.")
    .isAlphanumeric()
    .withMessage("User name has non-alphanumeric characters.")
    .custom((value) => {
      return UserModel.findOne({ username: value }).then((user) => {
        if (user) {
          return Promise.reject("Username already in use");
        }
      });
    }),
  body("email"),
  body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
  // Sanitize fields.
  sanitizeBody("username").escape(),
  sanitizeBody("email").escape(),
  sanitizeBody("password").escape(),
  // Process request after validation and sanitization.
  (req, res) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Display sanitized values/errors messages.
        return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
      } else {
        //hash input password
        bcrypt.hash(req.body.password, 10, function (err, hash) {
          // generate OTP for confirmation
          let otp = utility.randomNumber(4);
          // Create User object with escaped and trimmed data
          var user = new UserModel({
            username: req.body.username,
            email: req.body.email,
            password: hash,
            role: "USER",
            confirmOTP: otp,
          });
          // Html email body
          let html = "<p>Please Confirm your Account.</p><p>OTP: " + otp + "</p>";
          // Send confirmation email
          mailer
            .send(constants.confirmEmails.from, req.body.email, "Confirm Account", html)
            .then(function () {
              // Save user.
              user.save(function (err) {
                if (err) {
                  return apiResponse.ErrorResponse(res, err);
                }
                let userData = {
                  _id: user._id,
                  username: user.username,
                  email: user.email,
                };
                return apiResponse.successResponseWithData(res, "Registration Success.", userData);
              });
            })
            .catch((err) => {
              console.log(err);
              return apiResponse.ErrorResponse(res, err);
            });
        });
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
  body("email"),
  body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
  sanitizeBody("email").escape(),
  sanitizeBody("password").escape(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
      } else {
        UserModel.findOne({ email: req.body.email }).then((user) => {
          if (user) {
            //Compare given password with db's hash.
            bcrypt.compare(req.body.password, user.password, function (err, same) {
              if (same) {
                //Check account confirmation.
                if (user.isConfirmed) {
                  // Check User's account active or not.
                  if (user.status) {
                    let userData = {
                      _id: user._id,
                      username: user.username,
                      role: user.role,
                      email: user.email,
                    };
                    //Prepare JWT token for authentication
                    const jwtPayload = userData;
                    const secret = process.env.JWT_SECRET;
                    //Generated JWT token with Payload and secret.
                    userData.token = jwt.sign(jwtPayload, secret);
                    return apiResponse.successResponseWithData(res, "Login Success.", userData);
                  } else {
                    return apiResponse.unauthorizedResponse(res, "Account is not active. Please contact admin.");
                  }
                } else {
                  return apiResponse.unauthorizedResponse(
                    res,
                    "Account is not confirmed. Please confirm your account.",
                    { errorCode: 2 }
                  );
                }
              } else {
                return apiResponse.unauthorizedResponse(res, "Email or Password wrong.", { errorCode: 1 });
              }
            });
          } else {
            return apiResponse.unauthorizedResponse(res, "Email or Password wrong.", { errorCode: 1 });
          }
        });
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
exports.verifyConfirm = [
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
      } else {
        var query = { email: req.body.email };
        UserModel.findOne(query).then((user) => {
          if (user) {
            //Check already confirmed or not.
            if (!user.isConfirmed) {
              //Check account confirmation.
              if (user.confirmOTP == req.body.otp) {
                //Update user as confirmed
                UserModel.findOneAndUpdate(query, {
                  isConfirmed: 1,
                  confirmOTP: null,
                })
                  .then((userData) => {
                    return apiResponse.successResponseWithData(res, "Account confirmation success!", userData);
                  })
                  .catch((err) => {
                    return apiResponse.ErrorResponse(res, err);
                  });
              } else {
                return apiResponse.unauthorizedResponse(res, "One time password is incorrect.", { errorCode: 2 });
              }
            } else {
              return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
            }
          } else {
            return apiResponse.unauthorizedResponse(res, "Specified email not found.");
          }
        });
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];

/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
  body("email")
    .isLength({ min: 1 })
    .trim()
    .withMessage("Email must be specified.")
    .isEmail()
    .withMessage("Email must be a valid email address."),
  sanitizeBody("email").escape(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
      } else {
        var query = { email: req.body.email };
        UserModel.findOne(query).then((user) => {
          if (user) {
            //Check already confirm or not.
            if (!user.isConfirmed) {
              // Generate otp
              let otp = utility.randomNumber(4);
              // Html email body
              let html = "<p>Please Confirm your Account.</p><p>OTP: " + otp + "</p>";
              // Send confirmation email
              mailer.send(constants.confirmEmails.from, req.body.email, "Confirm Account", html).then(function () {
                user.isConfirmed = 0;
                user.confirmOTP = otp;
                // Save user.
                user.save(function (err) {
                  if (err) {
                    return apiResponse.ErrorResponse(res, err);
                  }
                  return apiResponse.successResponse(res, "Confirm otp sent.");
                });
              });
            } else {
              return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
            }
          } else {
            return apiResponse.unauthorizedResponse(res, "Specified email not found.");
          }
        });
      }
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
