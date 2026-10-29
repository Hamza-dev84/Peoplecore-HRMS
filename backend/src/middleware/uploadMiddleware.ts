import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../utilities/ApiError";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profile-images");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${req.user!.id}-${Date.now()}${EXTENSIONS[file.mimetype]}`),
});

const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Only JPG, PNG or WEBP images are allowed"));
    }
  },
}).single("image");

export default uploadProfileImage;