/**
 * require allows you to import a package from a path.
 * require can also work on directory by using dot backslash(./) to path.
 * importing a folder that has index.js can be imported without adding the index.js to it.
 */
import express,{Request,Response} from "express";
const app = express();
import routes from "./routes";
import cookieParser from "cookie-parser";
import { Logger } from './libs/logger';
import { ENV, PORT } from "./config";
const port = PORT;
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(async (req,res,next)=>{
    Logger.info(`url: ${req.url} method: ${req.method}`);
    try{
      await next();
    }catch(err){
        res.status(err.status?err.status:500).json({message:err.message});
    }
   
})
app.use(routes);
app.use((req,res)=>{
    res.status(404).json({message:`${req.url} NOT FOUND`})
})
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
app.use( (err:any, req:Request, res:Response, next: express.NextFunction) =>{
    Logger.error(err.message,err);
    res.status(err.status?err.status:500).json({message:'Something broke!',info:{reason:err.message}})
})
app.listen(port, () => {
    return Logger.info(`${new Date()} + ${ENV} Vas Server is listening on port ${port}`);
});