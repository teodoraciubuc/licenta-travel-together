const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  console.log("[AUTH] header:", header);

  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[AUTH] decoded:", payload);

    req.user = { id: payload.userId };
    return next();
  } catch (error) {
    console.log("[AUTH] verify error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = auth;