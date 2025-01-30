const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware pour vérifier le token JWT dans l'entête Authorization
function authenticate(req, res, next) {
  const token = req.cookies.token;
  console.log("Cookies reçus:", req.cookies);
  if (!token) {
    console.error("No token provided.");
    return res.status(401).json({ error: "No token provided, access denied." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authenticate };
