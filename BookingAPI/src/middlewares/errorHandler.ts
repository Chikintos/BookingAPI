import { logger } from "../configs/logger_config";
import { Constants } from "../constants";
import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode ? res.statusCode : Constants.SERVER_ERROR;
    logger.log({level:"error",message:`${err.message} |status code: ${statusCode}| Error stack: ${err.stack}`})
    switch (statusCode) {
        case Constants.NOT_FOUND:
            res.json({ title: "NOT_FOUND", message: err.message,});
            break;
        case Constants.UNAUTHORIZED:
            res.json({ title: "UNAUTHORIZED", message: err.message});
            break;
        case Constants.FORBIDDEN:
            res.json({ title: "FORBIDDEN", message: err.message});
            break;
        case Constants.CONFLICT:
            res.json({ title: "CONFLICT", message: err.message});
            break;
        case Constants.VALIDATION_ERROR:
            res.json({ title: "VALIDATION_ERROR", message: err.message});
            break;
        case Constants.SERVER_ERROR:
            res.json({ title: "SERVER_ERROR", message: err.message});
            break;
        default:
            res.json(err);
            break;
    }
};

export default errorHandler;
