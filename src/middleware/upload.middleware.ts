import multer from "multer";

const storage = multer.memoryStorage();

export const uploadPdf = multer({
  storage,
  limits: {
    /*
     * 10 MB.
     *
     * A ceiling, not a memory budget: PDF parsing cost scales with document
     * complexity rather than file size — a 212 KB file measured ~243 MB of
     * parse memory. Extraction now runs in a disposable child process so that
     * cost is returned on exit, which is what actually protects the API. This
     * limit only bounds work and upload time. The client enforces the same cap
     * so users are told before uploading rather than after.
     */
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});