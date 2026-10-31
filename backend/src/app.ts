import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import prisma from "./config/db.js";

import courseRoutes from "./modules/courses/course.routes.js";
import lessonRoutes from "./modules/lessons/lesson.routes.js";
import authRoutes from "./modules/auth/routes.js";
import usersRoutes from "./modules/users/routes.js";
import aiRoutes from "./modules/ai/routes.js";
import learningRoutes from "./modules/learning/routes.js";
import analyticsRoutes from "./modules/analytics/routes.js";
import uploadRoutes from "./modules/uploads/routes.js";
import questionRoutes from "./modules/questions/routes.js";
import contentRoutes from "./modules/content/routes.js";
import studyRoutes from "./modules/study/routes.js";
import exploreRoutes from "./modules/explore/routes.js";
import labModelRoutes from "./modules/labs/lab-models.routes.js";
import customLabRoutes from "./modules/labs/custom-labs.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

// Load environment variables
dotenv.config();

const app = express();
const uploadedHtmlContentSecurityPolicy = [
  "sandbox allow-scripts",
  "default-src 'self' https: data: blob:",
  "script-src 'self' https: 'unsafe-inline' blob:",
  "style-src 'self' https: 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' https: data:",
  "media-src 'self' https: data: blob:",
  "connect-src https:",
  "frame-src https:",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join("; ");

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files: serve uploaded avatars ──────────────────────────────────────
// Files in backend/uploads/ are accessible at /uploads/
app.use(
  "/uploads",
  express.static(path.resolve("uploads"), {
    setHeaders(res, filePath) {
      if (/\.html?$/i.test(filePath)) {
        res.setHeader("Content-Security-Policy", uploadedHtmlContentSecurityPolicy);
        res.setHeader("X-Content-Type-Options", "nosniff");
      }
    },
  }),
);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "SmartExplorer API and database are running",
      data: {
        timestamp: new Date().toISOString(),
        database: "connected",
      },
    });
  } catch (error) {
    console.error("Health check database connection failed:", error);
    res.status(503).json({
      success: false,
      message: "API is running, but the database is unavailable",
      data: {
        timestamp: new Date().toISOString(),
        database: "disconnected",
      },
    });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/lab-models", labModelRoutes);
app.use("/api/labs", customLabRoutes);
app.use("/api", questionRoutes);
app.use("/api", contentRoutes);
app.use("/api", learningRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;
