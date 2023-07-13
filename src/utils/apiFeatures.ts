import { ParsedQs } from 'qs';
import { Document, Model, Query } from 'mongoose';
import { Visibility } from '../types/request';

export interface RequestQueryString extends ParsedQs {
  sort: string;
  limit: string;
  page: string;
  fields: string;
}

export default class APIFeatures<ModelInterface extends Document & Visibility> {
  query: Query<any[], any, {}, any, 'find'>;
  queryString: RequestQueryString;

  constructor(model: Model<ModelInterface>, queryString: RequestQueryString) {
    this.query = model.find();
    this.queryString = queryString;
  }

  filter() {
    const queryObject = { ...this.queryString };

    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObject[el]);

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  select() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page ? parseInt(this.queryString.page) : 1;
    const limit = this.queryString.limit
      ? parseInt(this.queryString.limit)
      : 20;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
