const mongoose = require("mongoose");

const postSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxlength: 5000, // Limite du contenu à 5000 caractères
    },
    media: [
      {
        type: String, // URL des médias associés
        match: [/^https?:\/\/.+/, "Invalid media URL"], // Validation des URL
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Référence à l'utilisateur qui a créé la publication
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Références des utilisateurs ayant liké la publication
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          // Contenu du commentaire
          type: String,
          required: true,
          maxlength: 1000,
        },
        createdAt: {
          // Date de création du commentaire
          type: Date,
          default: Date.now,
        },
      },
    ],
    shares: [
      {
        user: {
          // Utilisateur qui a partagé
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        sharedAt: {
          // Date du partage
          type: Date,
          default: Date.now,
        },
      },
    ],
    privacy: {
      // Niveau de confidentialité de la publication
      type: String,
      enum: ["public", "friendsOnly", "private"],
      default: "public",
    },
    tags: [
      // Tags associés à la publication
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    createdAt: {
      // Date de création de la publication
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      // Date de la dernière mise à jour
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement 'createdAt' et 'updatedAt'
  }
);

// Middleware Mongoose pour mettre à jour automatiquement 'updatedAt'
postSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
