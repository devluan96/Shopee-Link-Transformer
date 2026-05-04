import { Router } from "express";
import linksRouter from "./links.js";
import usersRouter from "./users.js";
import analyticsRouter from "./analytics.js";
import paymentRouter from "./payment.js";
import uploadRouter from "./upload.js";
import workspacesRouter from "./workspaces.js";
import securityRouter from "./security.js";
import settingsRouter from "./settings.js";

const router = Router();

// Mount all routes under /api/v1
router.use("/api/v1", linksRouter);
router.use("/api/v1", usersRouter);
router.use("/api/v1", analyticsRouter);
router.use("/api/v1", paymentRouter);
router.use("/api/v1", uploadRouter);
router.use("/api/v1", workspacesRouter);
router.use("/api/v1", securityRouter);
router.use("/api/v1", settingsRouter);

export default router;
