const FaceoffModel = require("../models/FaceoffModel");
const apiResponse = require("../helpers/apiResponse");

exports.findTeams = [
  function (req, res) {
    try {
      FaceoffModel.find({
        "participants.participant.id": req.query.teamId,
      })
        .sort("-updatedAt")
        .then((Team) => {
          if (Team && Team.length) {
            console.log(Team);
            return apiResponse.successResponseWithData(res, "Team found", {
              Team,
            });
          } else {
            return apiResponse.successResponseWithData(res, "No team found", {
              data: [],
            });
          }
        });
    } catch (err) {
      return apiResponse.ErrorResponse(res, err);
    }
  },
];
