const FaceoffModel = require("../models/FaceoffModel");
const apiResponse = require("../helpers/apiResponse");
const { cloneDeep } = require("lodash");

exports.findTeams = [
  function (req, res) {
    try {
      FaceoffModel.find({
        "participants.participant.id": req.query.teamId,
      })
        .sort("-date")
        .then((teamStats) => {
          if (teamStats && teamStats.length) {
            const playerStats = getTeamPlayerData(teamStats, req.query.teamId);
            return apiResponse.successResponseWithData(res, "Team found", {
              teamStats,
              playerStats,
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

function getTeamPlayerData(data, teamId) {
  const final = { total: [], average: [] };
  const arr = [];
  data.forEach((faceoff) => {
    faceoff.matches.forEach((match) => {
      match.teams.forEach((team) => {
        if (team.teamId === teamId) {
          team.players.forEach((player) => {
            const index = arr.findIndex((exists) => exists.name === player.name);
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
        }
      });
    });
  });
  arr.forEach((player) => {
    if (player.goals && player.shots) {
      player.shootingPercentage = (player.goals / player.shots) * 100;
    } else {
      player.shootingPercentage = 0;
    }
  });
  final.total = cloneDeep(arr);
  arr.forEach((player) => {
    player.score = Math.round((player.score / player.count + Number.EPSILON) * 100) / 100;
    player.assists = Math.round((player.assists / player.count + Number.EPSILON) * 100) / 100;
    player.saves = Math.round((player.saves / player.count + Number.EPSILON) * 100) / 100;
    player.shots = Math.round((player.shots / player.count + Number.EPSILON) * 100) / 100;
    player.goals = Math.round((player.goals / player.count + Number.EPSILON) * 100) / 100;
  });
  final.average = cloneDeep(arr);
  return final;
}
