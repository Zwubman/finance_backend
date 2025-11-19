import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../Utils/generate_tokens.js";
import User from "../Models/user.js";
import redisClient from "../Config/redis_config.js";
import { sendOtpEMail } from "../Utils/send_otp.js";
import { generateOtp } from "../Utils/generate_otp.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email, is_deleted: false } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // Compare passwords
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        data: null,
      });
    }

    // Generate OTP for login
    const otp = generateOtp();
    console.log(`Generated OTP for login ${email}: ${otp}`);
    await redisClient.set(`loginOtp:${email}`, otp, { EX: 300 });
    console.log(`Stored OTP for login ${email}: ${otp}`);

    await sendOtpEMail(otp, email);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to email",
      otp: otp,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
        data: null,
      });
    }

    // Get OTP from Redis
    const storedOtp = await redisClient.get(`loginOtp:${email}`);
    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
        data: null,
      });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        data: null,
      });
    }

    // Delete OTP from Redis after successful verification
    await redisClient.del(`loginOtp:${email}`);

    const user = await User.findOne({ where: { email, is_deleted: false } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // Payload for JWT (optional to include JWT now or after OTP verification)
    const payload = {
      id: user.user_id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Login complete.",
      data: {
        user: {
          id: user.user_id,
          first_name: user.first_name,
          middle_name: user.middle_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("Error verifying login OTP:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

export const refresh = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
      data: null,
    });
  }

  try {
    const user = verifyRefreshToken(token);
    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired refresh token",
      data: null,
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("refreshToken");
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
