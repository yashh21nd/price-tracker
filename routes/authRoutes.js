const express = require("express");
const { registerUser, loginUser, phoneLogin } = require("../controllers/authController");

const router = express.Router();

// Email Signup & Login
router.post("/register", registerUser);
router.post("/login", loginUser);

// Phone Number Login
router.post("/phone-login", phoneLogin);

module.exports = router;
