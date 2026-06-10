import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";

export async function registerUser(req: Request, res: Response) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username and password required" });
    }

    const existing = await UserModel.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new UserModel({
      username,
      passwordHash,
      role: role || "driver",
    });

    await user.save();

    return res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Error in registerUser:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await UserModel.find({}, "-passwordHash"); // إخفاء كلمة السر
    return res.json(users);
  } catch (err) {
    console.error("Error in getAllUsers:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await UserModel.findByIdAndDelete(id);
    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error in deleteUser:", err);
    return res.status(500).json({ message: "Server error" });
  }
}