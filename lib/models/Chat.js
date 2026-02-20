// lib/models/Chat.js
import mongoose from "mongoose";

const PartSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
  },
  { _id: false },
);

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    parts: {
      type: [PartSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "parts must be a non-empty array",
      },
      required: true,
    },
  },
  { _id: false },
);

const ChatSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true, unique: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true },
);

// Prevent model recompilation in dev (HMR)
export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
