const { chai, server, should } = require("./testConfig");
const FaceoffModel = require("../models/FaceoffModel");

/**
 * Test cases to test all the Faceoff APIs
 * Covered Routes:
 * (1) Login
 * (2) Store Faceoff
 * (3) Get all Faceoffes
 * (4) Get single Faceoff
 * (5) Update Faceoff
 * (6) Delete Faceoff
 */

describe("Faceoff", () => {
  //Before each test we empty the database
  before(done => {
    FaceoffModel.deleteMany({}, err => {
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
    title: "testing Faceoff",
    description: "testing Faceoff desc",
    isbn: "3214htrff4"
  };

  /*
   * Test the /POST route
   */
  describe("/POST Login", () => {
    it("it should do user Login for Faceoff", done => {
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
  describe("/POST Faceoff Store", () => {
    it("It should send validation error for store Faceoff", done => {
      chai
        .request(server)
        .post("/api/Faceoff")
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
  describe("/POST Faceoff Store", () => {
    it("It should store Faceoff", done => {
      chai
        .request(server)
        .post("/api/Faceoff")
        .send(testData)
        .set("Authorization", "Bearer " + userTestData.token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("Faceoff add Success.");
          done();
        });
    });
  });

  /*
   * Test the /GET route
   */
  describe("/GET All Faceoff", () => {
    it("it should GET all the Faceoffs", done => {
      chai
        .request(server)
        .get("/api/Faceoff")
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
  describe("/GET/:id Faceoff", () => {
    it("it should GET the Faceoffs", done => {
      chai
        .request(server)
        .get("/api/Faceoff/" + testData._id)
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
  describe("/PUT/:id Faceoff", () => {
    it("it should PUT the Faceoffs", done => {
      chai
        .request(server)
        .put("/api/Faceoff/" + testData._id)
        .send(testData)
        .set("Authorization", "Bearer " + userTestData.token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have
            .property("message")
            .eql("Faceoff update Success.");
          done();
        });
    });
  });

  /*
   * Test the /DELETE/:id route
   */
  describe("/DELETE/:id Faceoff", () => {
    it("it should DELETE the Faceoffs", done => {
      chai
        .request(server)
        .delete("/api/Faceoff/" + testData._id)
        .set("Authorization", "Bearer " + userTestData.token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have
            .property("message")
            .eql("Faceoff delete Success.");
          done();
        });
    });
  });
});
