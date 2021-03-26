import express from "express";
import CooperatorController from "../../libs/controller/cooperator.controller";
const router = express.Router();
router.post("/mining",  CooperatorController.mining);
router.post("/initialize",  CooperatorController.initialize);
export default router;