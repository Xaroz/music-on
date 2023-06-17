import { NextFunction, Request, Response } from 'express';
import Track, { ITrack } from '../models/trackModel';

const createTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const track: ITrack = await Track.create(req.body);
    res.status(201).json({
      status: 'success',
      data: track,
    });
  } catch (error) {
    console.error('Error creating track:', error);
    res.status(500).json({ error: error });
  }
};

const getAllTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tracks: ITrack[] = await Track.find();
    res.status(200).json({
      status: 'success',
      results: tracks.length,
      data: tracks,
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
};

const getTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const track: ITrack[] | null = await Track.findById(req.params.id);

    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: track,
    });
  } catch (error) {
    console.error('Error fetching track', error);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
};

const updateTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedTrack: ITrack[] | null = await Track.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTrack) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }

    res.status(201).json({
      status: 'success',
      data: updatedTrack,
    });
  } catch (error) {
    console.error('Error updating track', error);
    res.status(500).json({ error: 'Failed to updating track' });
  }
};

const deleteTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const removedTrack: ITrack[] | null = await Track.findByIdAndDelete(
      req.params.id
    );

    if (!removedTrack) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    console.error('Error deleting track', error);
    res.status(500).json({ error: 'Failed to delete track' });
  }
};

const trackController = {
  createTrack,
  getAllTracks,
  getTrack,
  updateTrack,
  deleteTrack,
};

export default trackController;
