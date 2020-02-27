const { chai, server, should } = require("./testConfig");
const MatchModel = require("../models/MatchModel");

/**
 * Test cases to test all the Match APIs
 * Covered Routes:
 * (1) Login
 * (2) Store Match
 * (3) Get all Matches
 * (4) Get single Match
 * (5) Update Match
 * (6) Delete Match
 */

describe("Match", () => {
  //Before each test we empty the database
  before(done => {
    MatchModel.deleteMany({}, err => {
      done();
    });
  });

  // Prepare data for testing
  const userTestData = {
    password: "Test@123",
    email: "maitraysuthar@test12345.com"
  };

  // Prepare data for testing
  const testData = {
    title: "testing Match",
    description: "testing Match desc",
    isbn: "3214htrff4"
  };

  /*
   * Test the /POST route
   */
  describe("/POST Login", () => {
    it("it should do user Login for Match", done => {
      chai
        .request(server)
        .post("/api/auth/login")
        .send({ email: userTestData.email, password: userTestData.password })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("Login Success.");
          userTestData.token = res.body.data.token;
          done();
        });
    });
  });

  /*
   * Test the /POST route
   */
  describe("/POST Match Store", () => {
    it("It should send validation error for store Match", done => {
      chai
        .request(server)
        .post("/api/Match")
        .send()
        .set("Authorization", "Bearer " + userTestData.token)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
  });

  /*
   * Test the /POST route
   */
  describe("/POST Match Store", () => {
    it("It should store Match", done => {
      chai
        .request(server)
        .post("/api/Match")
        .send(testData)
        .set("Authorization", "Bearer " + userTestData.token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("Match add Success.");
          done();
        });
    });
  });

  /*
   * Test the /GET route
   */
  describe("/GET All Match", () => {
    it("it should GET all the Matchs", done => {
      chai
        .request(server)
        .get("/api/Match")
        .set("Authorization", "Bearer " + userTestData.token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("Operation success");
          testData._id = res.body.data[0]._id;
          done();
        });
    });
  });

  /*
   * Test the /GET/:id route
   */
  describe("/GET/:id Match", () => {
    it("it should GET the Matchs", done => {
      chai
        .request(server)
        .get("/api/Match/" + testData._id)
        .set("Authorization", "Bearer " + userTestData.token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("Operation success");
          done();
        });
    });
  });

  /*
   * Test the /PUT/:id route
   */
  describe("/PUT/:id Match", () => {
    it("it should PUT the Matchs", done => {
      chai
        .request(server)
        .put("/api/Match/" + testData._id)
        .send(testData)
        .set("Authorization", "Bearer " + userTestData.token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("Match update Success.");
          done();
        });
    });
  });

  /*
   * Test the /DELETE/:id route
   */
  describe("/DELETE/:id Match", () => {
    it("it should DELETE the Matchs", done => {
      chai
        .request(server)
        .delete("/api/Match/" + testData._id)
        .set("Authorization", "Bearer " + userTestData.token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("Match delete Success.");
          done();
        });
    });
  });
});
