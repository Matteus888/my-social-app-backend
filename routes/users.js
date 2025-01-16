var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");
const { authenticate } = require("../modules/authenticate");
const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const JWT_SECRET = process.env.JWT_SECRET;

// Route pour s'inscrire sur le site
router.post("/signup", async (req, res) => {
  if (!checkBody(req.body, ["emailValue", "passwordValue", "firstnameValue", "lastnameValue", "birthdateValue", "avatarPath"])) {
    return res.status(400).json({ result: false, error: "Please complete all fields." });
  }

  try {
    const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${req.body.emailValue}$`, "i") } });

    if (existingUser) {
      return res.status(409).json({ result: false, error: "This user already exists." });
    }

    const newUser = new User({
      email: req.body.emailValue,
      passwordHash: bcrypt.hashSync(req.body.passwordValue, 10),
      publicId: uuidv4(),
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

    const savedUser = await newUser.save();

    const token = jwt.sign(
      {
        publicId: savedUser.publicId,
        email: savedUser.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res
      .status(201)
      .json({ result: true, token, user: { publicId: savedUser.publicId, email: savedUser.email, profile: savedUser.profile } });
  } catch (error) {
    console.error("Error in /signup route:", error);
    return res.status(500).json({ result: false, error: "An error occurred during signup. Please try again" });
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

    const token = jwt.sign(
      {
        publicId: user.publicId,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({ result: true, token, user: { publicId: user.publicId, email: user.email, profile: user.profile } });
  } catch (err) {
    console.error("Error during signin process:", err);
    return res.status(500).json({ result: false, error: "An unexpected error occurred. Please try again." });
  }
});

// Route pour récupérer les infos d'un utilisateur
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findOne({ publicId: id });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    res.status(200).json({ result: true, user: user });
  } catch (error) {
    console.error("Error fetching user infos:", error);
    res.status(500).json({ result: false, error: "Internal server error" });
  }
});

// Route pour récupérer tous les posts d'un utilisateur
router.get("/:id/posts", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findOne({ publicId: id }).populate("posts");

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    res.status(200).json({ result: true, posts: user.posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ result: false, error: "Internal server error" });
  }
});

// Route pour ajouter un ami à un utilisateur
router.post("/:id/friends", authenticate, async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.publicId;

  try {
    const currentUser = await User.findOne({ publicId: currentUserId });
    const friendUser = await User.findOne({ publicId: id });

    if (!currentUser || !friendUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentUser.social.friends.includes(friendUser._id)) {
      return res.status(400).json({ result: false, error: "You are already friend with this user." });
    }

    currentUser.social.friends.push(friendUser._id);
    friendUser.social.friends.push(currentUser._id);

    await currentUser.save();
    await friendUser.save();

    res.status(200).json({ result: true, message: "Friend added successfully" });
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).json({ result: false, error: "Internal server error" });
  }
});

module.exports = router;
