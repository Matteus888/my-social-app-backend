var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");
const User = require("../models/users");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

// Route pour s'inscrire sur le site
router.post("/signup", async (req, res) => {
  if (!checkBody(req.body, ["username", "email", "password", "firstname", "lastname"])) {
    res.json({ result: false, error: "❌ BACKEND users/signup: Please complete all fields." });
    return;
  }
  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${req.body.email}$`, "i") } });

    if (user === null) {
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
      try {
        const newUserDoc = await newUser.save();
        res.json({ result: true, user: newUserDoc }); // A adapter pour les besoins du frontend
      } catch (err) {
        res.json({ result: false, error: "❌ BACKEND users/signup: Can't save new user in database" });
      }
    } else {
      res.json({ result: false, error: "❌ BACKEND users/signup: This user already exist" });
      return;
    }
  } catch (err) {
    res.json({ result: false, error: "❌ BACKEND users/signup: Can't find any user in database" });
  }
});

// Route pour se connecter à son compte
router.post("/signin", async (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "❌ BACKEND users/signup: Please complete all fields." });
    return;
  }
  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${req.body.email}$`, "i") } });

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      res.json({ result: true, user: user }); // A dapter pour les besoins du frontend
    } else {
      res.json({ result: false, error: "❌ BACKEND users/signin: User not found or wrong password" });
    }
  } catch (err) {
    res.json({ result: false, error: "❌ BACKEND users/signin: Can't find user in database" });
  }
});

module.exports = router;
