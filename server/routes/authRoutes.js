import express from "express";
import passport from "passport";
import axios from "axios";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Handle callback from Google after authentication
router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.CLIENT_URL,
    failureRedirect: `${process.env.CLIENT_URL}/login/failed`,
  })
);

// Initiate Google authentication
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Register or login user
router.get("/login/success", async (req, res) => {
  if (!req.user) {
    return res.status(403).json({ message: "Not Authorized" });
  }

  try {
    let user = await User.findOne({ email: req.user._json.email });

    if (!user) {
      const newUser = new User({
        name: req.user._json.name,
        email: req.user._json.email,
        password: Date.now(), // dummy password
      });
      user = await newUser.save();
    }

    generateToken(res, user._id);

    res.status(200).json({
      message: "Successfully logged in",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
});

// Login failed
router.get("/login/failed", (req, res) => {
  res.status(401).json({ error: "Login Failed" });
});

// Logout
router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout Failed" });
    }
    res.redirect(process.env.CLIENT_URL);
  });
});

export default router;
