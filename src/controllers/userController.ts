import User, { IUser } from '../models/userModel';

import {
  getOne,
  createOne,
  updateOne,
  deleteOne,
  getAllEntities,
} from '../controllers/handlerFactory';

const createUser = createOne<IUser>(User);

const getAllUsers = getAllEntities<IUser>(User);

const getUser = getOne<IUser>(User);

const updateUser = updateOne<IUser>(User);

const deleteUser = deleteOne<IUser>(User);

const userController = {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
};

export default userController;
