const Post = require("../models/Post");
const Comment = require("../models/Comment");
const cloudinary = require("cloudinary").v2;
const notificationService = require("./notificationService");
const auditService = require("./auditService");

class PostService {
  async #deleteImageFromCloudinary(publicId) {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error(`Помилка видалення ресурсу ${publicId} з Cloudinary:`, err);
    }
  }

  #buildFilterQuery(filters = {}) {
    const query = {};

    if (filters.status && filters.status !== "Всі") {
      query.status = filters.status;
    }

    if (filters.category && filters.category !== "Всі") {
      query.category = filters.category;
    }

    if (filters.domain && filters.domain !== "Всі") {
      query.domain = filters.domain;
    }

    if (filters.search && filters.search.trim()) {
      const searchRegex = { $regex: filters.search.trim(), $options: "i" };
      query.$or = [{ title: searchRegex }, { content: searchRegex }];
    }

    if (filters.organizationId) {
      query.organizationId = filters.organizationId;
    }

    if (filters.authorId) {
      query.authorId = filters.authorId;
    }

    return query;
  }

  async getAll(filters = {}, page = 1, limit = 8) {
    const query = this.#buildFilterQuery({
      ...filters,
      status: filters.status || "published",
    });

    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .populate("authorId", "name role image")
      .populate("organizationId", "name logo isSystem")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return { posts, totalPages, currentPage: Number(page), totalItems: total };
  }

  async getById(id) {
    const post = await Post.findById(id)
      .populate("authorId", "name role image")
      .populate("organizationId", "name logo");

    if (!post) {
      const error = new Error("Публікацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (!post.reactions) {
      post.reactions = { fire: [], heart: [], clap: [], idea: [] };
    } else {
      ["fire", "heart", "clap", "idea"].forEach((type) => {
        if (!Array.isArray(post.reactions[type])) {
          post.reactions[type] = [];
        }
      });
    }

    const totalComments = await Comment.countDocuments({ postId: id });

    const postWithCount = post.toObject();
    postWithCount.commentsCount = totalComments;

    return postWithCount;
  }

  async toggleReaction(id, userId, type) {
    const post = await Post.findById(id);
    if (!post) {
      const error = new Error("Публікацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (!post.reactions) post.reactions = {};
    if (!post.reactions[type]) post.reactions[type] = [];

    const hasReacted = post.reactions[type].includes(userId);
    const update = hasReacted
      ? { $pull: { [`reactions.${type}`]: userId } }
      : { $addToSet: { [`reactions.${type}`]: userId } };

    const updatedPost = await Post.findByIdAndUpdate(id, update, { new: true });
    return updatedPost.reactions;
  }

  async getOrganizationDashboardPosts(
    orgId,
    filters = {},
    page = 1,
    limit = 8,
  ) {
    if (!orgId) {
      const error = new Error("Не вказано ідентифікатор організації");
      error.statusCode = 400;
      throw error;
    }

    const query = this.#buildFilterQuery({
      ...filters,
      organizationId: orgId,
      status: filters.status || undefined,
    });

    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .populate("authorId", "name image role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      posts,
      totalPages,
      currentPage: Number(page),
      totalItems: total,
    };
  }

  async getSuperAdminDashboardPosts(filters = {}, page = 1, limit = 8) {
    const query = this.#buildFilterQuery({
      ...filters,
      status: filters.status || undefined,
    });

    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .populate("authorId", "name image role")
      .populate("organizationId", "name logo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      posts,
      totalPages,
      currentPage: Number(page),
      totalItems: total,
    };
  }

  async create(authorId, postData, uploadedImages = [], req = null) {
    const finalStatus = postData.status || "published";
    let isFeatured = postData.isFeatured || false;

    if (postData.organizationId) {
      const Organization = require("../models/Organization");
      const org = await Organization.findById(postData.organizationId).select(
        "isSystem",
      );
      if (org?.isSystem) {
        isFeatured = true;
      }
    }

    const newPost = new Post({
      title: postData.title.trim(),
      content: postData.content,
      category: postData.category,
      domain: postData.domain || null,
      status: finalStatus,
      authorId,
      organizationId: postData.organizationId || null,
      images: uploadedImages,
      isFeatured,
    });

    const savedPost = await newPost.save();

    await auditService.log({
      req,
      action: "POST_CREATED",
      category: "SYSTEM",
      severity: "info",
      targetEntity: {
        entityType: "Post",
        entityId: savedPost._id,
        entityName: savedPost.title,
      },
      payload: {
        newState: {
          category: savedPost.category,
          status: savedPost.status,
          domain: savedPost.domain,
          isFeatured: savedPost.isFeatured,
        },
      },
      organizationId: savedPost.organizationId || null,
    });

    return savedPost;
  }

  async update(id, postData, newUploadedImages = [], req = null) {
    const currentPost = await Post.findById(id);
    if (!currentPost) {
      const error = new Error("Публікацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    const oldStatus = currentPost.status;

    let updateData = {
      title: postData.title.trim(),
      content: postData.content,
      category: postData.category,
      domain: postData.domain || currentPost.domain,
      status: postData.status || currentPost.status,
      organizationId: postData.organizationId || currentPost.organizationId,
    };

    if (newUploadedImages && newUploadedImages.length > 0) {
      if (currentPost.images && currentPost.images.length > 0) {
        for (const img of currentPost.images) {
          if (img.publicId) {
            await this.#deleteImageFromCloudinary(img.publicId);
          }
        }
      }
      updateData.images = newUploadedImages;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    )
      .populate("authorId", "name role")
      .populate("organizationId", "name logo");

    await auditService.log({
      req,
      action: "POST_UPDATED",
      category: "SYSTEM",
      severity: oldStatus !== updatedPost.status ? "warning" : "info",
      targetEntity: {
        entityType: "Post",
        entityId: updatedPost._id,
        entityName: updatedPost.title,
      },
      payload: {
        previousState: { status: oldStatus, title: currentPost.title },
        newState: { status: updatedPost.status, title: updatedPost.title },
      },
      organizationId: updatedPost.organizationId || null,
    });

    if (
      updateData.status &&
      updateData.status !== oldStatus &&
      currentPost.authorId
    ) {
      try {
        await notificationService.createNotification({
          recipientId: currentPost.authorId,
          title: "Зміна статусу публікації",
          message: `Статус вашої публікації "${updatedPost.title}" змінено на: "${updatedPost.status}".`,
          type: "SYSTEM_INFO",
          link: `/posts/${updatedPost._id}`,
          sendEmail: true,
        });
      } catch (error) {
        console.error(
          "Помилка надсилання сповіщення про зміну статусу:",
          error,
        );
      }
    }

    return updatedPost;
  }

  async delete(id, req = null) {
    const post = await Post.findById(id).select("images title organizationId");
    if (!post) {
      const error = new Error("Публікацію не знайдено");
      error.statusCode = 404;
      throw error;
    }

    if (post.images && post.images.length > 0) {
      for (const img of post.images) {
        if (img.publicId) {
          await this.#deleteImageFromCloudinary(img.publicId);
        }
      }
    }

    await Comment.deleteMany({ postId: id });
    await Post.findByIdAndDelete(id);

    await auditService.log({
      req,
      action: "POST_DELETED",
      category: "SYSTEM",
      severity: "warning",
      targetEntity: {
        entityType: "Post",
        entityId: id,
        entityName: post.title,
      },
      organizationId: post.organizationId || null,
    });
  }
}

module.exports = new PostService();
