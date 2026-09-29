import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";
import workspaceRoutes from "./routes/workspace.routes";
import notebookRoutes from "./routes/notebook.routes";
import documentRoutes from "./routes/document.routes";
import { clerkMiddleware } from '@clerk/express'


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use("/users", userRoutes);
app.use("/workspaces", workspaceRoutes);
app.use("/notebooks", notebookRoutes);
app.use("/documents", documentRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});