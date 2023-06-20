import { NextFunction, Request, Response } from 'express';

import User, { IUser } from '../models/userModel';

const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user: IUser = await User.create(req.body);
    res.status(201).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error });
  }
}

const userController = {
  createUser,
}

export default userController;