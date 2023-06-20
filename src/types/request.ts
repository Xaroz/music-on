import { Request } from "express"
import { IUser } from '../models/userModel';

// The other option of defining custom Request type that allows us to access something like variables from the Req object is to augment the existing Request type from express, for more information check this StackOverflow link https://stackoverflow.com/questions/44383387/typescript-error-property-user-does-not-exist-on-type-request
export interface IRequestWithUser extends Request {
  user: IUser // or any other type
}