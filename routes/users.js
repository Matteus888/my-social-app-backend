var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");
const User = require("../models/users");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

// Route pour s'inscrire sur le site
router.post("/signup", async (req, res) => {
  if (!checkBody(req.body, ["emailValue", "passwordValue", "firstnameValue", "lastnameValue", "birthdateValue", "avatarPath"])) {
    return res.status(400).json({ result: false, error: "Please complete all fields." });
  }

  const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${req.body.emailValue}$`, "i") } });

  if (existingUser) {
    return res.status(409).json({ result: false, error: "This user already exists." });
  }

  const newUser = new User({
    email: req.body.emailValue,
    token: uid2(32),
    passwordHash: bcrypt.hashSync(req.body.passwordValue, 10),
    profile: {
      firstname: req.body.firstnameValue,
      lastname: req.body.lastnameValue,
      avatar: req.body.avatarPath,
      bio: req.body.bio || "",
      location: req.body.location || "",
      birthdate: req.body.birthdateValue,
      gender: req.body.genderValue,
    },
  });

  try {
    const newUserDoc = await newUser.save();
    return res.status(201).json({ result: true, user: newUserDoc }); // A adapter pour les besoins du frontend
  } catch (saveError) {
    console.error("Error saving user:", saveError);
    return res.status(500).json({ result: false, error: "Unable to save the user. Please try again." });
  }
});

// Route pour se connecter à son compte
router.post("/signin", async (req, res) => {
  if (!checkBody(req.body, ["emailValue", "passwordValue"])) {
    return res.status(400).json({ result: false, error: "Please complete all fields." });
  }
  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${req.body.emailValue}$`, "i") } });

    if (!user) {
      return res.status(404).json({ result: false, error: "Can't find user in database." });
    }

    const isPasswordValid = bcrypt.compareSync(req.body.passwordValue, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ result: false, error: "Wrong password" });
    }

    return res.status(200).json({ result: true, user }); // A adapter pour les besoins du frontend
  } catch (err) {
    console.error("Error during signin process:", err);
    return res.status(500).json({ result: false, error: "An unexpected error occurred. Please try again." });
  }
});

module.exports = router;
