var express = require("express");
var router = express.Router();

const { authenticate } = require("../modules/authenticate");
const User = require("../models/users");

// Route pour récupérer la liste d'amis

// Route pour récupérer les demandes d'amis A TESTER HEADER
router.get("/friend-requests", authenticate, async (req, res) => {
  const currentUserId = req.user.publicId;

  try {
    const currentUser = await User.findOne({ publicId: currentUserId }).populate({
      path: "social.friendRequests",
      select: "publicId profile.firstname profile.lastname profile.avatar",
    });

    if (!currentUser) {
      return res.status(404).json({ result: false, error: "User not found." });
    }

    res.status(200).json({ result: true, friendRequests: currentUser.social.friendRequests });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ result: false, error: "Internal server error." });
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

// Route pour suivre/ne plus suivre un utilisateur
router.post("/:id/follow", authenticate, async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.publicId;

  if (currentUserId === id) {
    return res.status(400).json({ result: false, error: "You cannot follow yourself." });
  }

  try {
    const currentUser = await User.findOne({ publicId: currentUserId });
    const followingUser = await User.findOne({ publicId: id });

    if (!currentUser || !followingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentUser.social.following.includes(followingUser._id)) {
      currentUser.social.following = currentUser.social.following.filter((userId) => !userId.equals(followingUser._id));
      followingUser.social.followers = followingUser.social.followers.filter((userId) => !userId.equals(currentUser._id));

      await currentUser.save();
      await followingUser.save();

      return res.status(200).json({ result: true, message: "Unfollowed successfully" });
    } else {
      currentUser.social.following.push(followingUser._id);
      followingUser.social.followers.push(currentUser._id);

      await currentUser.save();
      await followingUser.save();

      return res.status(200).json({ result: true, message: "Followed successfully" });
    }
  } catch (error) {
    console.error("Error toggling follow status:", error);
    res.status(500).json({ result: false, error: "Internal server error" });
  }
});

// Route pour envoyer une demande d'ami
router.post("/:id/friend-request", authenticate, async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.publicId;

  if (currentUserId === id) {
    return res.status(400).json({ result: false, error: "You cannot send a friend request to yourself." });
  }

  try {
    const currentUser = await User.findOne({ publicId: currentUserId });
    const friendUser = await User.findOne({ publicId: id });

    if (!currentUser || !friendUser) {
      return res.status(404).json({ result: false, error: "User not found." });
    }

    if (friendUser.social.friendRequests.includes(currentUser._id)) {
      return res.status(400).json({ result: false, error: "Friend request already sent." });
    }

    if (friendUser.social.friends.includes(currentUser._id)) {
      return res.status(400).json({ result: false, error: "You are already friends with this user." });
    }

    friendUser.social.friendRequests.push(currentUser._id);
    await friendUser.save();

    res.status(200).json({ result: true, message: "Friend request sent successfully." });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ result: false, error: "Internal server error." });
  }
});

// Route pour gérer une demande d'ami A TESTER HEADER
router.post("/:id/friend-request/:action", authenticate, async (req, res) => {
  const { id, action } = req.params;
  const currentUserId = req.user.publicId;

  try {
    const currentUser = await User.findOne({ publicId: currentUserId });
    const friendUser = await User.findOne({ publicId: id });

    if (!currentUser || !friendUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const requestIndex = currentUser.social.friendRequests.indexOf(friendUser._id);
    if (requestIndex === -1) {
      return res.status(400).json({ error: "No friend request found from this user." });
    }

    if (action === "accept") {
      currentUser.social.friends.push(friendUser._id);
      friendUser.social.friends.push(currentUser._id);

      currentUser.social.friendRequests.splice(requestIndex, 1);

      await currentUser.save();
      await friendUser.save();

      return res.status(200).json({ result: true, message: "Friend request accepted." });
    } else if (action === "reject") {
      currentUser.social.friendRequests.splice(requestIndex, 1);

      await currentUser.save();

      return res.status(200).json({ result: true, message: "Friend request rejected." });
    } else {
      return res.status(400).json({ error: "Invalid action." });
    }
  } catch (error) {
    console.error("Error handling friend request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
