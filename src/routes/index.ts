import express from "express";
import expressBasicAuth from "express-basic-auth";
import accountRouter from "./router/account";
import transactionRouter from "./router/transaction";
import miningRouter from "./router/mining";
import ledgerRouter from "./router/ledger";
import cooperatorRouter from "./router/cooperator";
import { basicAuthObject, getApiKeySecret } from "../libs/auth";
import apiKeyAuth from "api-key-auth";
const router = express.Router();
router.use("/account", accountRouter);
router.use("/transaction",expressBasicAuth( basicAuthObject ), transactionRouter);
router.use("/mining",expressBasicAuth( basicAuthObject ), miningRouter);
router.use("/ledger", ledgerRouter);
router.use("/cooperator", apiKeyAuth({ getSecret:getApiKeySecret, requestLifetime:60*60*24 }),  cooperatorRouter);

router.all("", (req,res)=>{res.send("CASHCITY COIN")});
export default router;