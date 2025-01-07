var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");
const User = require("../models/users");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/signup", async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    token: uid2(32),
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    profile: {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      avatar: req.body.avatar,
      bio: req.body.bio,
      location: req.body.location,
    },
  });
  const newUserDoc = await newUser.save();
  res.json({ result: true, message: "Nouvel utilisateur créé", user: newUserDoc });
});

module.exports = router;
