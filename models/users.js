const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Invalid email address"],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    profile: {
      firstname: {
        type: String,
        required: true,
        trim: true,
      },
      lastname: {
        type: String,
        required: true,
        trim: true,
      },
      avatar: {
        type: String,
        default: "",
      },
      bio: {
        type: String,
        default: "",
        maxlength: 200,
      },
      job: {
        type: String,
        default: "",
      },
      location: {
        type: String,
        default: "",
      },
      birthdate: {
        type: Date,
        required: true,
      },
      gender: {
        type: String,
        enum: ["male", "female", "custom", "irrelevant"],
        default: "irrelevant",
      },
      website: {
        type: String,
        default: "",
        match: [/^https?:\/\/.+/, "Invalid URL"], // Validation des URL
      },
      backgroundImage: {
        type: String,
        default: "",
      },
    },
    social: {
      friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    settings: {
      privacy: {
        type: String,
        enum: ["public", "friendsOnly", "private"],
        default: "public",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Middleware Mongoose pour mettre à jour 'updatedAt' automatiquement
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
