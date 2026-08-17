const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: null,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", CommentSchema);
