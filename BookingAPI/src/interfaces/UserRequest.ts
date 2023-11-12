import { Request } from 'express';

export interface UserRequest extends Request {
    user: {
        id:number,
        firstname: string,
        lastName: string,
        email:string,
        role:string
    };
    file:any
  }




