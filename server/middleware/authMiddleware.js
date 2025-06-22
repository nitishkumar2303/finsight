import jwt from "jsonwebtoken";
import User from "../config/models/user.model.js";

export const verifyLogin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded._id).select("-password"); // attach user to req
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};