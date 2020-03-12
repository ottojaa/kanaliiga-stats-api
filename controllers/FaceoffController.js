const FaceoffModel = require("../models/FaceoffModel");
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const Parser = require("../helpers/replay-parser");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
const { cloneDeep } = require("lodash");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

const acceptedRoles = ["ADMIN", "MAINTAINER"];
/**
 * Faceoff List.
 *
 * @returns {Object}
 */
exports.faceoffList = [
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

function processData(data) {
  const final = { total: [], average: [] };
  const arr = [];
  data.forEach(faceoff => {
    faceoff.matches.forEach(match => {
      match.teams.forEach(team => {
        team.players.forEach(player => {
          const index = arr.findIndex(exists => exists.name === player.name);
          if (index > -1) {
            arr[index].count += 1;
            arr[index].score += player.score;
            arr[index].goals += player.goals;
            arr[index].assists += player.assists;
            arr[index].shots += player.shots;
            arr[index].saves += player.saves;
          } else {
            const playerObject = cloneDeep(player);
            playerObject.count = 1;
            arr.push(playerObject);
          }
        });
      });
    });
  });
  arr.forEach(player => {
    if (player.goals && player.shots) {
      player.shootingPercentage = (player.goals / player.shots) * 100;
    } else {
      player.shootingPercentage = 0;
    }
  });
  final.total = cloneDeep(arr);
  arr.forEach(player => {
    player.score =
      Math.round((player.score / player.count + Number.EPSILON) * 100) / 100;
    player.assists =
      Math.round((player.assists / player.count + Number.EPSILON) * 100) / 100;
    player.saves =
      Math.round((player.saves / player.count + Number.EPSILON) * 100) / 100;
    player.shots =
      Math.round((player.shots / player.count + Number.EPSILON) * 100) / 100;
    player.goals =
      Math.round((player.goals / player.count + Number.EPSILON) * 100) / 100;
  });
  final.average = cloneDeep(arr);
  return final;
}

function getFaceoffEntityWithShootingPercentage(faceoff) {
  faceoff.matches.forEach(match => {
    match.teams.forEach(match => {
      match.players.forEach(player => {
        if (player.goals && player.shots) {
          player.shootingPercentage =
            (player.goals / player.shots + Number.EPSILON) * 100;
        } else {
          player.shootingPercentage = 0;
        }
      });
    });
  });
  return faceoff;
}

exports.faceoffPlayerStats = [
  function(req, res) {
    try {
      FaceoffModel.find({ stageId: req.query.stageId }, "matches.teams").then(
        Faceoffs => {
          if (Faceoffs.length > 0) {
            const response = processData(Faceoffs);
            return apiResponse.successResponseWithData(
              res,
              "Operation success",
              response
            );
          } else {
            return apiResponse.successResponseWithData(
              res,
              "Operation success",
              []
            );
          }
        }
      );
    } catch (err) {
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

exports.faceoffsForStage = [
  function(req, res) {
    try {
      FaceoffModel.find({ stageId: req.query.stageId }, [
        "participants",
        "matchId",
        "stageId",
        "date"
      ])
        .sort("-date")
        .limit(5)
        .exec()
        .then(Faceoffs => {
          if (Faceoffs.length > 0) {
            return apiResponse.successResponseWithData(
              res,
              "Operation success",
              Faceoffs
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
      console.log(err);
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
  function(req, res) {
    try {
      FaceoffModel.findOne({ matchId: req.params.id }).then(Faceoff => {
        if (Faceoff !== null) {
          const response = getFaceoffEntityWithShootingPercentage(Faceoff);
          return apiResponse.successResponseWithData(
            res,
            "Faceoff found",
            response
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
        creator: req.user._id,
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
        id: value,
        matchId: req.params.id,
        creator: req.user._id
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
    try {
      if (!req.user || !acceptedRoles.includes(req.user.role)) {
        return apiResponse.unauthorizedResponse(
          res,
          "Not authorized for this operation.",
          { user: req.user }
        );
      }
      const promise =
        req.user.role === "ADMIN"
          ? FaceoffModel.findOne({ matchId: req.params.id })
          : FaceoffModel.findOne({
              matchId: req.params.id,
              creator: req.user_id
            });

      promise.then(Faceoff => {
        if (Faceoff) {
          FaceoffModel.findOneAndDelete({ matchId: req.params.id }).then(
            Faceoff => {
              if (Faceoff === null) {
                return apiResponse.notFoundResponse(
                  res,
                  "Faceoff with this id does not exist"
                );
              } else {
                return apiResponse.successResponse(
                  res,
                  "Faceoff delete Success."
                );
              }
            }
          );
        } else {
          return apiResponse.unauthorizedResponse(
            res,
            "Not authorized for this operation",
            {}
          );
        }
      });
    } catch (err) {
      console.log(err);
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];

////////////////////// REPLAY PARSER ///////////////////

exports.replayParser = [
  function(req, res) {
    try {
      const buffer = Buffer.from(req.body.data);
      const result = Parser.parse(buffer);
      if (result) {
        return apiResponse.successResponseWithData(
          res,
          "Parse success",
          result
        );
      } else {
        return apiResponse.ErrorResponse(res, "Cannot parse replay file");
      }

      /* FaceoffModel.find({ stageId: req.query.stageId }).then(Faceoffs => {
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
      }); */
    } catch (err) {
      console.log(err);
      //throw error in json response with status 500.
      return apiResponse.ErrorResponse(res, err);
    }
  }
];
