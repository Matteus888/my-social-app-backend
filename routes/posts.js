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
    const posts = await Post.find()
      .populate("author", "publicId profile.firstname profile.lastname profile.avatar")
      .sort({ createdAt: -1 });
    res.status(200).json({ result: true, posts });
  } catch (error) {
    res.status(500).json({ result: false, message: "Error during getting posts", error });
  }
});

// Route pour publier un post à un autre utilisateur A TESTER MAIS MODELE PAS ADAPTE
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

// Route pour liker un post
router.post("/:postId/likes", authenticate, async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.publicId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ result: false, error: "Post not found" });
    }

    const user = await User.findOne({ publicId: req.user.publicId });
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    if (post.author.toString() === user._id.toString()) {
      return res.status(403).json({ result: false, error: "You cannot like your own post" });
    }

    const hasLiked = post.likes.includes(user._id);
    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== user._id.toString());
    } else {
      post.likes.push(user._id);
    }
    await post.save();
    res.status(200).json({ result: true, message: hasLiked ? "Like removed" : "Post liked" });
  } catch (err) {
    console.error("Error during liking post:", err);
    res.status(500).json({ result: false, error: "Error during liking post" });
  }
});

// Route pour envoyer un commentaire à une publication A TESTER
router.post("/:postId/comments", authenticate, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.publicId;

  if (!checkBody(req.body, ["content"])) {
    return res.status(400).json({ result: false, error: "Comment content cannot be empty." });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ result: false, error: "Post not found" });
    }

    const user = await User.findOne({ publicId: userId });
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }

    const newComment = {
      user: user,
      content,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();
    res.status(201).json({ result: true, message: "Comment added successfully.", comment: newComment });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ result: false, error: "An error occured while adding comment." });
  }
});

// Route pour récupérer les commentaires d'une publication
router.get("/:postId/comments", authenticate, async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).populate("comments.user", "publicId profile.firstname profile.lastname profile.avatar");
    if (!post) {
      return res.status(404).json({ result: false, error: "Post not found" });
    }

    res.status(200).json({ result: true, message: "Comments retrieved successfully", comments: post.comments });
  } catch (err) {
    console.error("Error getting comments:", err);
    res.status(500).json({ result: false, error: "An error occured while getting comments." });
  }
});

module.exports = router;
