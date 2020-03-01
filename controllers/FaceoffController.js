const FaceoffModel = require("../models/FaceoffModel");
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

const acceptedRoles = ["ADMIN", "MAINTAINER"];
/**
 * Faceoff List.
 *
 * @returns {Object}
 */
exports.faceoffList = [
  auth,
  function(req, res) {
    try {
      FaceoffModel.find({ stageId: req.query.stageId }).then(Faceoffs => {
        if (Faceoffs.length > 0) {
          return apiResponse.successResponseWithData(
            res,
            "Operation success",
            Faceoffs.map(faceoff => faceoff.matchId)
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
 * Faceoff Detail.
 *
 * @param {string}      id
 *
 * @returns {Object}
 */
exports.faceoffDetail = [
  auth,
  function(req, res) {
    try {
      FaceoffModel.findOne({ matchId: req.params.id }).then(Faceoff => {
        if (Faceoff !== null) {
          return apiResponse.successResponseWithData(
            res,
            "Faceoff found",
            Faceoff
          );
        } else {
          return apiResponse.successResponseWithData(
            res,
            "Faceoff not found",
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
 * Faceoff store.
 *
 * @param {string}      title
 * @param {string}      description
 * @param {string}      isbn
 *
 * @returns {Object}
 */
exports.faceoffStore = [
  auth,
  body("matchId", "MatchId must not be empty.")
    .isLength({ min: 1 })
    .trim()
    .custom(value => {
      return FaceoffModel.findOne({ matchId: value }).then(Faceoff => {
        if (Faceoff) {
          return Promise.reject("Faceoff with this id already exists.");
        }
      });
    }),
  (req, res) => {
    try {
      if (!req.user || !acceptedRoles.includes(req.user.role)) {
        return apiResponse.unauthorizedResponse(
          res,
          "Not authorized for this operation.",
          {}
        );
      }
      const errors = validationResult(req);
      var Faceoff = new FaceoffModel({
        matchId: req.body.matchId,
        stageId: req.body.stageId,
        participants: req.body.participants,
        date: req.body.date
      });
      req.body.matches.forEach(match => {
        Faceoff.matches.push({
          matchIndex: match.matchIndex,
          date: match.date,
          teams: match.teams
        });
      });

      if (!errors.isEmpty()) {
        return apiResponse.validationErrorWithData(
          res,
          "Faceoff entity with this match id already exists.",
          errors.array()
        );
      } else {
        //Save Faceoff.
        Faceoff.save(function(err) {
          if (err) {
            return apiResponse.ErrorResponse(res, err);
          }
          const msg =
            "Faceoff added successfully, MatchId: " + req.body.matchId;
          return apiResponse.successResponse(res, msg);
        });
      }
    } catch (err) {
      console.log(err);
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

/**
 * Faceoff update.
 *
 * @param {string}      title
 * @param {string}      description
 * @param {string}      isbn
 *
 * @returns {Object}
 */
exports.faceoffUpdate = [
  auth,
  body("id", "Faceoff id must not be empty")
    .isLength({ min: 1 })
    .trim()
    .custom((value, { req }) => {
      return Faceoff.findOne({
        isbn: value,
        user: req.user._id,
        _id: { $ne: req.params.id }
      }).then(Faceoff => {
        if (Faceoff) {
          return Promise.reject("Faceoff already exist with this ISBN no.");
        }
      });
    }),
  sanitizeBody("*").escape(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      var Faceoff = new Faceoff({
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
          Faceoff.findById(req.params.id, function(err, foundFaceoff) {
            if (foundFaceoff === null) {
              return apiResponse.notFoundResponse(
                res,
                "Faceoff with this id doesn't exist"
              );
            } else {
              //Check authorized user
              if (foundFaceoff.user.toString() !== req.user._id) {
                return apiResponse.unauthorizedResponse(
                  res,
                  "You are not authorized to do this operation."
                );
              } else {
                //update Faceoff.
                Faceoff.findByIdAndUpdate(req.params.id, Faceoff, {}, function(
                  err
                ) {
                  if (err) {
                    return apiResponse.ErrorResponse(res, err);
                  } else {
                    let FaceoffData = new FaceoffData(Faceoff);
                    return apiResponse.successResponseWithData(
                      res,
                      "Faceoff update Success.",
                      FaceoffData
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
 * Faceoff Delete.
 *
 * @param {string}      id
 *
 * @returns {Object}
 */
exports.faceoffDelete = [
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
      Faceoff.findById(req.params.id, function(err, foundFaceoff) {
        if (foundFaceoff === null) {
          return apiResponse.notFoundResponse(
            res,
            "Faceoff with this id does not exist"
          );
        } else {
          //Check authorized user
          if (foundFaceoff.user.toString() !== req.user._id) {
            return apiResponse.unauthorizedResponse(
              res,
              "You are not authorized to do this operation."
            );
          } else {
            //delete Faceoff.
            Faceoff.findByIdAndRemove(req.params.id, function(err) {
              if (err) {
                return apiResponse.ErrorResponse(res, err);
              } else {
                return apiResponse.successResponse(
                  res,
                  "Faceoff delete Success."
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
