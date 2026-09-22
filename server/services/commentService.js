const Comment = require("../models/Comment");
const Post = require("../models/Post");
const notificationService = require("./notificationService");
const auditService = require("./auditService");

class CommentService {
  async create(postId, userId, text) {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error(
        "Публікацію, яку ви хочете прокоментувати, не знайдено",
      );
      error.statusCode = 404;
      throw error;
    }

    const newComment = new Comment({
      postId,
      userId,
      text: text.trim(),
    });

    await newComment.save();

    const savedComment = await Comment.findById(newComment._id).populate(
      "userId",
      "name role image",
    );

    if (post.authorId && post.authorId.toString() !== userId.toString()) {
      try {
        await notificationService.createNotification({
          recipientId: post.authorId,
          title: "Новий коментар",
          message: `Користувач ${savedComment.userId.name} прокоментував вашу публікацію "${post.title}".`,
          type: "post_comment",
          link: `/posts/${post._id}`,
        });
      } catch (err) {
        console.error(
          "Помилка надсилання сповіщення про коментар до поста:",
          err,
        );
      }
    }

    return savedComment;
  }

  async getByPostId(postId) {
    return await Comment.find({ postId })
      .populate("userId", "name role image")
      .sort({ createdAt: 1 });
  }

  async getById(id) {
    const comment = await Comment.findById(id).populate("userId", "name role");
    if (!comment) {
      const error = new Error("Коментар не знайдено");
      error.statusCode = 404;
      throw error;
    }
    return comment;
  }

  async delete(id, req = null) {
    const comment = await Comment.findById(id);
    if (!comment) {
      const error = new Error("Коментар не знайдено");
      error.statusCode = 404;
      throw error;
    }

    await Comment.findByIdAndDelete(id);

    await auditService.log({
      req,
      action: "COMMENT_DELETED",
      category: "SYSTEM",
      severity: "warning",
      targetEntity: {
        entityType: comment.projectId ? "Project" : "Post",
        entityId: comment.projectId || comment.postId,
        entityName: `Коментар ID: ${comment._id}`,
      },
      payload: {
        previousState: {
          text: comment.text,
          authorUserId: comment.userId,
        },
      },
    });
  }

  async deleteByPostId(postId, req = null) {
    const count = await Comment.countDocuments({ postId });
    await Comment.deleteMany({ postId });

    if (count > 0) {
      await auditService.log({
        req,
        action: "POST_COMMENTS_CLEARED",
        category: "SYSTEM",
        severity: "info",
        targetEntity: {
          entityType: "Post",
          entityId: postId,
          entityName: `Усі коментарі поста ${postId}`,
        },
        payload: {
          metadata: { deletedCount: count },
        },
      });
    }
  }

  async createProjectComment(projectId, userId, text) {
    const Project = require("../models/Project");
    const project = await Project.findById(projectId);
    if (!project) {
      const error = new Error("Проєкт не знайдено");
      error.statusCode = 404;
      throw error;
    }

    const newComment = new Comment({
      projectId,
      userId,
      text: text.trim(),
    });

    await newComment.save();

    const savedComment = await Comment.findById(newComment._id).populate(
      "userId",
      "name role",
    );

    const recipients = new Set();

    if (project.authorId && project.authorId.toString() !== userId.toString()) {
      recipients.add(project.authorId.toString());
    }

    if (
      project.reviewerId &&
      project.reviewerId.toString() !== userId.toString()
    ) {
      recipients.add(project.reviewerId.toString());
    }

    for (const recipientId of recipients) {
      try {
        await notificationService.createNotification({
          recipientId,
          title: "Нове повідомлення в проєкті",
          message: `${savedComment.userId?.name || "Користувач"} залишив коментар до проєкту "${project.title}".`,
          type: "PROJECT_COMMENT",
          link: `/projects/${project._id}`,
          sendEmail: true,
        });
      } catch (err) {
        console.error(
          "Помилка надсилання сповіщення про коментар до проєкту:",
          err,
        );
      }
    }

    return savedComment;
  }

  async getByProjectId(projectId) {
    return await Comment.find({ projectId })
      .populate("userId", "name role image")
      .sort({ createdAt: 1 });
  }
}

module.exports = new CommentService();
