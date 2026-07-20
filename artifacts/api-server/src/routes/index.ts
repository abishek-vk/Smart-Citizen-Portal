import { Router } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import complaintsRouter from "./complaints";
import taxesRouter from "./taxes";
import certificatesRouter from "./certificates";
import garbageRouter from "./garbage";
import parkingRouter from "./parking";
import servicesRouter from "./services";
import aiRouter from "./ai";

const router = Router();

router.get("/healthz", (_req, res) => {
  res.json(HealthCheckResponse.parse({ status: "ok" }));
});

router.use(authRouter);
router.use(dashboardRouter);
router.use(complaintsRouter);
router.use(taxesRouter);
router.use(certificatesRouter);
router.use(garbageRouter);
router.use(parkingRouter);
router.use(servicesRouter);
router.use(aiRouter);

export default router;
