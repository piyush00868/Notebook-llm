import multer from "multer";

const storage = multer.memoryStorage();

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});