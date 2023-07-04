import {
  createOne,
  deleteOne,
  getAllEntities,
  getOne,
  updateOne,
} from './handlerFactory';

import Playlist, { IPlaylist } from '../models/playlistModel';

const createPlaylist = createOne<IPlaylist>(Playlist);

const getAllPlaylists = getAllEntities<IPlaylist>(Playlist, true);

const getPlaylist = getOne<IPlaylist>(Playlist, true);

const updatePlaylist = updateOne<IPlaylist>(Playlist, true);

const deletePlaylist = deleteOne<IPlaylist>(Playlist, true);

const PlaylistController = {
  createPlaylist,
  getAllPlaylists,
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
};

export default PlaylistController;
