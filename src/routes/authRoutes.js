const express = require("express");
const {
  signup,
  signin,
  forgotPassword,
  changePassword,
} = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/forgot-password", forgotPassword);
router.post("/change-password", changePassword);

module.exports = router;
