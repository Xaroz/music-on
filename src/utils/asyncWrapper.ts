import { Request, Response, NextFunction } from 'express';
import {IRequestWithUser} from '../types/request';

const asyncWrapper =
  (fn: (req: IRequestWithUser | Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: IRequestWithUser | Request, res: Response, next: NextFunction): Promise<void> => {
    return fn(req, res, next).catch(next);
  };

export default asyncWrapper;
