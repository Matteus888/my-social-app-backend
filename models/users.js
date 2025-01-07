const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Supprime les espaces en début et fin
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // Convertit en minuscule
      match: [/.+@.+\..+/, "Invalid email address"], // Validation de l'email
    },
    token: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
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
        // URL de l'image de profil
        type: String,
        default: "",
      },
      bio: {
        type: String,
        maxlength: 200, // Limite à 200 caractères
      },
      location: {
        type: String,
        default: "",
      },
      birthdate: {
        type: Date,
        required: false, // Facultatif, peut être changé selon vos besoins
      },
      gender: {
        type: String,
        enum: ["male", "female", "non-binary", "prefer not to say"], // Genres acceptés
        default: "prefer not to say",
      },
      website: {
        type: String,
        default: "",
        match: [/^https?:\/\/.+/, "Invalid URL"], // Validation des URL
      },
    },
    social: {
      friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Références aux utilisateurs amis
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Références aux utilisateurs qui nous suivent
      following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Références aux utilisateurs que l'on suit
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], // Références aux publications
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
