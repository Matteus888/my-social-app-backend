var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");
const { authenticate } = require("../modules/authenticate");
const Post = require("../models/posts");
const User = require("../models/users");

// Route pour publier un post
router.post("/", authenticate, async (req, res) => {
  if (!checkBody(req.body, ["content", "author"])) {
    return res.status(400).json({ result: false, error: "Please complete all fields." });
  }
  if (req.user.publicId !== req.body.author) {
    return res.status(403).json({ error: "You are not authorized to create this post." });
  }

  try {
    const user = await User.findOne({ publicId: req.body.author });
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    const newMessage = new Post({
      content: req.body.content,
      author: user._id,
    });
    await newMessage.save();

    user.posts.push(newMessage._id);
    await user.save();

    res.status(201).json({ result: true, newMessage });
  } catch (error) {
    console.error("Error during post recording:", error);
    res.status(500).json({ result: false, error: "Error during post recording" });
  }
});

// Route pour récupérer tous les messages
router.get("/", authenticate, async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "publicId profile.firstname profile.lastname profile.avatar");
    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: "Error during getting posts", error });
  }
});

module.exports = router;
