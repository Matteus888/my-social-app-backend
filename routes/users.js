const express = require("express");
const router = express.Router();

const { authenticate } = require("../modules/authenticate");
const User = require("../models/users");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => ({
    folder: `my-social-app/user_profile/${req.user.publicId}`, // Répertoire dynamique basé sur publicId
    allowed_formats: ["jpg", "png", "jpeg"],
  }),
});

const upload = multer({ storage });

// Route pour mettre à jour les images de profils
router.put("/profile/image", authenticate, upload.single("image"), async (req, res) => {
  const { field } = req.body;
  const publicId = req.user.publicId;

  if (!["avatar", "backgroundImage"].includes(field)) {
    return res.status(400).json({ result: false, error: "Invalid input" });
  }

  try {
    const user = await User.findOne({ publicId: publicId });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found." });
    }

    const oldImageUrl = user.profile[field];

    if (oldImageUrl) {
      const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
      const match = oldImageUrl.match(regex);

      if (match && match[1]) {
        const oldImagePublicId = match[1];
        await cloudinary.uploader.destroy(oldImagePublicId);
      }
    }

    const newImageUrl = req.file.path;

    const updatedUser = await User.findOneAndUpdate({ publicId: publicId }, { [`profile.${field}`]: newImageUrl }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ result: false, error: "User not found." });
    }

    res.status(200).json({ result: true, message: "Picture successfully updated.", imageUrl: newImageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false, error: "Server error during updating image." });
  }
});

// Route pour rechercher parmis les utilisateurs
router.get("/search", authenticate, async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ result: false, error: "Query parameter is required" });
  }

  try {
    const matchedUsers = await User.find({
      $or: [{ "profile.firstname": { $regex: query, $options: "i" } }, { "profile.lastname": { $regex: query, $options: "i" } }],
    })
      .sort({ "profile.firstname": 1 })
      .limit(10)
      .exec();

    const formattedUsers = matchedUsers.map((user) => ({
      publicId: user.publicId,
      fullName: `${user.profile.firstname} ${user.profile.lastname}`,
      avatar: user.profile.avatar,
    }));

    res.status(200).json({ result: true, users: formattedUsers });
  } catch (err) {
    console.error("Error during user search:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route pour récupérer la liste d'amis
router.get("/friends", authenticate, async (req, res) => {
  const currentUserId = req.user.publicId;

  try {
    const currentUser = await User.findOne({ publicId: currentUserId }).populate({
      path: "social.friends",
      select: "publicId profile.firstname profile.lastname profile.avatar",
    });

    if (!currentUser) {
      return res.status(404).json({ result: false, error: "User not found." });
    }

    res.status(200).json({ result: true, friends: currentUser.social.friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ result: false, error: "Internal server error." });
  }
});

// Route pour récupérer la liste des personnes suivies
router.get("/following", authenticate, async (req, res) => {
  const currentUserId = req.user.publicId;

  try {
    const currentUser = await User.findOne({ publicId: currentUserId }).populate({
      path: "social.following",
      select: "publicId profile.firstname profile.lastname profile.avatar",
    });

    if (!currentUser) {
      return res.status(404).json({ result: false, error: "User not found." });
    }

    res.status(200).json({ result: true, following: currentUser.social.following });
  } catch (error) {
    console.error("Error fetching people you follow:", error);
    res.status(500).json({ result: false, error: "Internal server error." });
  }
});

// Route pour récupérer les demandes d'amis
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

// Route pour mettre à jour les infos texte du profils utilisateur
router.put("/profile", authenticate, async (req, res) => {
  const { publicId } = req.user;
  const { bio, job, location, website } = req.body;

  try {
    const user = await User.findOne({ publicId });
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found." });
    }

    if (bio !== undefined) user.profile.bio = bio;
    if (job !== undefined) user.profile.job = job;
    if (location !== undefined) user.profile.location = location;
    if (website !== undefined) user.profile.website = website;

    await user.save();

    res.status(200).json({ result: true, message: "Profile updated successfully." });
  } catch (err) {
    console.error("Error uploading profile:", err);
    return res.status(500).json({ result: false, error: "An error occured while uploading the profile." });
  }
});

// Route pour récupérer les infos d'un utilisateur
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findOne({ publicId: id }).populate({
      path: "social.friends",
      select: "publicId profile.firstname profile.lastname profile.avatar",
    });

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
      return res.status(409).json({ result: false, error: "Friend request already sent." });
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

// Route pour gérer une demande d'ami
router.post("/:id/friend-request/:action", authenticate, async (req, res) => {
  const { id, action } = req.params;
  const currentUserId = req.user.publicId;

  try {
    const currentUser = await User.findOne({ publicId: currentUserId });
    const friendUser = await User.findOne({ publicId: id });

    if (!currentUser || !friendUser) {
      return res.status(404).json({ result: false, error: "User not found." });
    }

    const requestIndex = currentUser.social.friendRequests.indexOf(friendUser._id);
    if (requestIndex === -1) {
      return res.status(400).json({ result: false, error: "No friend request found from this user." });
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
      return res.status(400).json({ result: false, error: "Invalid action." });
    }
  } catch (error) {
    console.error("Error handling friend request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Route pour supprimer un ami
router.delete("/:id/unfriend", authenticate, async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.publicId;

  try {
    const currentUser = await User.findOne({ publicId: currentUserId });
    const friendUser = await User.findOne({ publicId: id });

    if (!currentUser || !friendUser) {
      return res.status(404).json({ result: false, error: "User not found." });
    }

    const isFriendInCurrentUser = currentUser.social.friends.includes(friendUser._id);
    const isFriendInFriendUser = friendUser.social.friends.includes(currentUser._id);

    if (!isFriendInCurrentUser || !isFriendInFriendUser) {
      return res.status(400).json({ result: false, error: "You are not friends with this user." });
    }

    currentUser.social.friends = currentUser.social.friends.filter((friendId) => !friendId.equals(friendUser._id));
    friendUser.social.friends = friendUser.social.friends.filter((friendId) => !friendId.equals(currentUser._id));

    await currentUser.save();
    await friendUser.save();

    res.status(200).json({ result: true, message: "Friend removed successfully." });
  } catch (err) {
    console.error("Error removing friend:", err);
    res.status(500).json({ result: false, error: "Internal server error." });
  }
});

module.exports = router;
