var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");
const Post = require("../models/posts");
const User = require("../models/users");

// Route pour publier un post
router.post("/", async (req, res) => {
  if (!checkBody(req.body, ["content", "author"])) {
    return res.status(400).json({ result: false, error: "Please complete all fields." });
  }

  try {
    const user = await User.findOne({ token: req.body.author });
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    const newMessage = new Post({
      content: req.body.content,
      author: user._id,
    });
    await newMessage.save();
    res.status(201).json({ result: true, newMessage });
  } catch (error) {
    res.status(400).json({ result: false, error: "Error during post recording" });
  }
});

// Route pour récupérer tous les messages d'un utilisateur
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "profile.firstname profile.lastname");
    res.status(200).json({ data: posts });
  } catch (error) {
    res.status(500).json({ message: "Error during getting posts", error });
  }
});

module.exports = router;
