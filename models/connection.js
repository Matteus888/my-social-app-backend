const mongoose = require("mongoose");

const connectionString = process.env.DATABASE_CONNECTION_STRING;

mongoose
  .connect(connectionString, {
    useNewUrlParser: true, // ✅ Évite les erreurs de parsing
    useUnifiedTopology: true, // ✅ Utilise le nouveau moteur de monitoring
    serverSelectionTimeoutMS: 5000, // ✅ Attente max avant échec
  })
  .then(() => console.log("✅ my-social-app database connected"))
  .catch((error) => console.error("❌ Error to connect database", error));
