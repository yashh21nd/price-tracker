// controllers/authController.js
const admin = require("firebase-admin");

// User Signup (Email/Password)
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    res.json({ message: "✅ User registered successfully", user: userRecord });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User Login (Email/Password via Firebase)
const loginUser = async (req, res) => {
  try {
    const { email } = req.body;
    res.json({ message: "✅ Login handled on frontend via Firebase SDK", email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Phone Number Login (OTP)
const phoneLogin = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number required" });
    }

    // Actual OTP flow handled by Firebase Client SDK (frontend).
    // Backend can be used to verify ID tokens after OTP success.

    res.json({
      message: "📱 OTP login handled via Firebase client SDK. Send ID token here after verification.",
      phoneNumber,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, phoneLogin };
