const User = require("./../models/User");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with this email" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: { username, email },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ status: 401, message: "Invalid email" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 401, message: "Invalid password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, "your_jwt_secret", {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Signin successful",
      token,
      user: { username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Error signing in", error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    // Generate a random password
    const newPassword = crypto.randomBytes(4).toString("hex"); // Generates a random password

    // Update the user's password in the database
    user.password = await bcrypt.hash(newPassword, 10); // Hash the new password
    await user.save();

    // Setup SMTP transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Replace with your SMTP host
      port: 587, // Replace with your SMTP port
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL, // Your SMTP username
        pass: process.env.PASSWORD, // Your SMTP password
      },
    });

    // Send email with the new password
    await transporter.sendMail({
      from: process.env.EMAIL, // Sender address
      to: user.email, // Recipient
      subject: "Your New Password", // Subject line
      text: `Your new password is: ${newPassword}`, // Plain text body
      html: `<b>Your new password is: ${newPassword}</b>`, // HTML body
    });

    res.status(200).json({
      status: 200,
      message: "New password has been sent to your email",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error processing request",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    // Compare the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: 401, message: "Invalid current password" });
    }

    // Hash the new password and update it
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      status: 200,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error updating password",
      error: error.message,
    });
  }
};
