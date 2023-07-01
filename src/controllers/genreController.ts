import {
  createOne,
  deleteOne,
  getAllEntities,
  getOne,
  updateOne,
} from './handlerFactory';

import Genre, { IGenre } from '../models/genreModel';

const createGenre = createOne<IGenre>(Genre);

const getAllGenres = getAllEntities<IGenre>(Genre);

const getGenre = getOne<IGenre>(Genre);

const updateGenre = updateOne<IGenre>(Genre);

const deleteGenre = deleteOne<IGenre>(Genre);

const genreController = {
  createGenre,
  getAllGenres,
  getGenre,
  updateGenre,
  deleteGenre,
};

export default genreController;
