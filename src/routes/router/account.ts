import express from "express";
import expressBasicAuth from "express-basic-auth";
import { basicAuthObject } from "../../libs/auth";
import AccountController from "../../libs/controller/account.controller";
const router = express.Router();
router.get("",expressBasicAuth( basicAuthObject ),AccountController.account);
router.get("/generate",AccountController.generate);
router.get("/balance",expressBasicAuth( basicAuthObject ),AccountController.balance);
router.get("/:id",expressBasicAuth( basicAuthObject ),AccountController.findWallet);
export default router;