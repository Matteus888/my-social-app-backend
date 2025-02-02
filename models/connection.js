const mongoose = require("mongoose");

const connectionString = process.env.DATABASE_CONNECTION_STRING;

mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => {
    console.log("✅ my-social-app database connected");
  })
  .catch((error) => {
    console.error("❌ Error to connect database", error);
  });

mongoose.set("debug", true);
