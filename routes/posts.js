var express = require("express");
var router = express.Router();

const { checkBody } = require("../modules/checkBody");
const { authenticate } = require("../modules/authenticate");
const Post = require("../models/posts");
const User = require("../models/users");

// Route pour publier un post public
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

// Route pour récupérer tous les messages PUBLIC A RAJOUTER
router.get("/", authenticate, async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "publicId profile.firstname profile.lastname profile.avatar");
    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: "Error during getting posts", error });
  }
});

// Route pour publier un post à un autre utilisateur A TESTER
router.post("/specific", authenticate, async (req, res) => {
  if (!checkBody(req.body, ["content", "author", "specificUser", "privacy"])) {
    return res.status(400).json({ result: false, error: "Please complete all fields." });
  }
  if (req.user.publicId !== req.body.author) {
    return res.status(403).json({ result: false, error: "You are not authorized to create this post." });
  }

  try {
    const author = await User.findOne({ publicId: req.body.author });
    if (!author) {
      return res.status(404).json({ result: false, error: "Author not found" });
    }
    const targetUser = await User.findOne({ publicId: req.body.specificUser });
    if (!targetUser) {
      return res.status(404).json({ result: false, error: "Target user not found" });
    }
    if (!["specificUser", "public"].includes(req.body.privacy)) {
      return res.status(400).json({ result: false, error: "Invalid privacy value." });
    }

    const newPost = new Post({
      content: req.body.content,
      author: author._id,
      privacy: req.body.privacy,
      specificUser: targetUser._id,
    });
    await newPost.save();

    author.posts.push(newPost._id);
    await author.save();

    res.status(201).json({ result: true, message: "Post successfully created.", post: newPost });
  } catch (error) {
    console.error("Error during post recording:", error);
    res.status(500).json({ result: false, error: "An error occurred while creating the post." });
  }
});

router.delete("/:postId", authenticate, async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ result: false, error: "Post not found" });
    }

    const user = await User.findOne({ publicId: req.user.publicId });
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }
    console.log(user._id.toString());
    console.log(post.author);

    if (user._id.toString() !== post.author.toString()) {
      return res.status(403).json({ result: false, error: "You are not authorized to delete this post." });
    }

    await Post.findByIdAndDelete(postId);

    user.posts = user.posts.filter((post) => post.toString() !== postId);
    await user.save();

    res.status(200).json({ result: true, message: "Post deleted successfully." });
  } catch (err) {
    console.error("Error during post deletion:", err);
    res.status(500).json({ result: false, error: "Error during post deletion" });
  }
});

module.exports = router;
