/**
 * require allows you to import a package from a path.
 * require can also work on directory by using dot backslash(./) to path.
 * importing a folder that has index.js can be imported without adding the index.js to it.
 */
import express from "express";
const app = express();
import routes from "./routes";
import cookieParser from "cookie-parser";
import { Logger } from './libs/logger';
import { ENV, PORT } from "./config";
const port = PORT;
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(routes);
app.listen(port, () => {
    return Logger.info(`${new Date()} + ${ENV} Vas Server is listening on port ${port}`);
});