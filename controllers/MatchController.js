const Match = require("../models/MatchModel");
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

// Match Schema
function MatchData(data) {
  this.id = data._id;
  this.title = data.title;
  this.description = data.description;
  this.isbn = data.isbn;
  this.createdAt = data.createdAt;
}

/**
 * Match List.
 *
 * @returns {Object}
 */
exports.matchList = [
  auth,
  function(req, res) {
    try {
      Match.find(
        { user: req.user._id },
        "_id title description isbn createdAt"
      ).then(Matches => {
        if (Matches.length > 0) {
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            Matchs
          );
        } else {
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            []
          );
        }
      });
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

/**
 * Match Detail.
 *
 * @param {string}      id
 *
 * @returns {Object}
 */
exports.matchDetail = [
  auth,
  function(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return apiResponse.successResponseWithData(res, "Operation success", {});
    }
    try {
      Match.findOne(
        { _id: req.params.id, user: req.user._id },
        "_id title description isbn createdAt"
      ).then(Match => {
        if (Match !== null) {
          let MatchData = new MatchData(Match);
          return apiResponse.successResponseWithData(
            res,
            "Match found",
            MatchData
          );
        } else {
          return apiResponse.successResponseWithData(
            res,
            "Match not found",
            {}
          );
        }
      });
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

/**
 * Match store.
 *
 * @param {string}      title
 * @param {string}      description
 * @param {string}      isbn
 *
 * @returns {Object}
 */
exports.matchStore = [
  auth,
  body("title", "Title must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("description", "Description must not be empty.")
    .isLength({ min: 1 })
    .trim(),
  body("isbn", "ISBN must not be empty")
    .isLength({ min: 1 })
    .trim()
    .custom((value, { req }) => {
      return Match.findOne({ isbn: value, user: req.user._id }).then(Match => {
        if (Match) {
          return Promise.reject("Match already exist with this ISBN no.");
        }
      });
    }),
  sanitizeBody("*").escape(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var Match = new Match({
        title: req.body.title,
        user: req.user,
        description: req.body.description,
        isbn: req.body.isbn
      });

      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        //Save Match.
        Match.save(function(err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          }
          let MatchData = new MatchData(Match);
          return apiResponse.successResponseWithData(
            res,
            "Match add Success.",
            MatchData
          );
        });
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

/**
 * Match update.
 *
 * @param {string}      title
 * @param {string}      description
 * @param {string}      isbn
 *
 * @returns {Object}
 */
exports.matchUpdate = [
  auth,
  body("id", "Match id must not be empty")
    .isLength({ min: 1 })
    .trim()
    .custom((value, { req }) => {
      return Match.findOne({
        isbn: value,
        user: req.user._id,
        _id: { $ne: req.params.id }
      }).then(Match => {
        if (Match) {
          return Promise.reject("Match already exist with this ISBN no.");
        }
      });
    }),
  sanitizeBody("*").escape(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var Match = new Match({
        title: req.body.title,
        description: req.body.description,
        isbn: req.body.isbn,
        _id: req.params.id
      });

      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Validation Error.",
          errors.array()
        );
      } else {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return apiResponse.validationErrorWithData(
            res,
            "Invalid Error.",
            "Invalid ID"
          );
        } else {
          Match.findById(req.params.id, function(err, foundMatch) {
            if (foundMatch === null) {
              return apiResponse.notFoundResponse(
                res,
                "Match with this id doesn't exist"
              );
            } else {
              //Check authorized user
              if (foundMatch.user.toString() !== req.user._id) {
                return apiResponse.unauthorizedResponse(
                  res,
                  "You are not authorized to do this operation."
                );
              } else {
                //update Match.
                Match.findByIdAndUpdate(req.params.id, Match, {}, function(
                  err
                ) {
                  if (err) {
                    return apiResponse.ErrorResponse(res, err);
                  } else {
                    let MatchData = new MatchData(Match);
                    return apiResponse.successResponseWithData(
                      res,
                      "Match update Success.",
                      MatchData
                    );
                  }
                });
              }
            }
          });
        }
      }
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

/**
 * Match Delete.
 *
 * @param {string}      id
 *
 * @returns {Object}
 */
exports.matchDelete = [
  auth,
  function(req, res) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return apiResponse.validationErrorWithData(
        res,
        "Invalid Error.",
        "Invalid ID"
      );
    }
    try {
      Match.findById(req.params.id, function(err, foundMatch) {
        if (foundMatch === null) {
          return apiResponse.notFoundResponse(
            res,
            "Match with this id does not exist"
          );
        } else {
          //Check authorized user
          if (foundMatch.user.toString() !== req.user._id) {
            return apiResponse.unauthorizedResponse(
              res,
              "You are not authorized to do this operation."
            );
          } else {
            //delete Match.
            Match.findByIdAndRemove(req.params.id, function(err) {
              if (err) {
                return apiResponse.ErrorResponse(res, err);
              } else {
                return apiResponse.successResponse(
                  res,
                  "Match delete Success."
                );
              }
            });
          }
        }
      });
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];
