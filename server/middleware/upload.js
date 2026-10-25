const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-7z-compressed",
];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");

    const fileExt = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, fileExt)
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    const uniqueHash = crypto.randomBytes(4).toString("hex");

    let targetFolder = "science_hub/general";
    const currentRoute = req.baseUrl + req.path;

    if (currentRoute.includes("/users") || currentRoute.includes("/profile")) {
      targetFolder = "science_hub/avatars";
    } else if (
      currentRoute.includes("/blogs") ||
      currentRoute.includes("/posts")
    ) {
      targetFolder = "science_hub/blog_images";
    } else if (
      currentRoute.includes("/programs") ||
      currentRoute.includes("/applications") ||
      currentRoute.includes("/projects")
    ) {
      targetFolder = isImage
        ? "science_hub/program_attachments/images"
        : "science_hub/program_attachments/docs";
    } else if (currentRoute.includes("/organizations")) {
      targetFolder = "science_hub/organization_logos";
    }

    return {
      folder: targetFolder,
      resource_type: isImage ? "image" : "raw",
      public_id: `${Date.now()}_${uniqueHash}_${baseName}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isAllowedDoc = ALLOWED_DOC_TYPES.includes(file.mimetype);

    const isArchiveExt = /\.(zip|rar|7z|pdf|docx|xlsx)$/i.test(
      file.originalname,
    );

    if (isImage || isAllowedDoc || isArchiveExt) {
      cb(null, true);
    } else {
      const error = new Error(
        "Непідтримуваний формат файлу! Дозволено зображення (PNG/JPG), PDF, Word, Excel та ZIP/RAR архіви.",
      );
      error.statusCode = 400;
      cb(error, false);
    }
  },
});

module.exports = upload;
