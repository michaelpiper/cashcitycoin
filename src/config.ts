import { config as loadOverrides } from "dotenv";
import path from "path";
import fs from "fs";
const OVERRIDE_PATH = path.join(__dirname, `/../.env`);
export const ROOT_DIR = path.join(__dirname, `/../`);
// console.log(`OVERRIDE_PATH = ${OVERRIDE_PATH}`);
if (fs.existsSync(OVERRIDE_PATH)) {
	loadOverrides({
		path: OVERRIDE_PATH,
        debug: true,
	});
}
export const ENV = (process.env.NODE_ENV || "development").toUpperCase();
export const PROD = ENV === "PRODUCTION" || ENV === "PROD";
export const X_POWERED_BY = process.env["X_POWERED_BY"] || "Mp Creative Studio Ltd";
export const X_AUTHOR = process.env["X_AUTHOR"] || "Michael Piper";
export const PORT = process.env.PORT || 3000;

export const MONGO_DB_URI = process.env['MONGO_DB_URI']||"mongodb://localhost:27017/WALLET?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

export const Redis ={
    PORT: undefined,
    HOST: undefined,
    AUTH: undefined
}