import express from 'express';
import { authorization } from '../Utils/Athorization.js';
import { createStamp } from '../Controller/FileUploadController.js';
import { Protected } from '../Utils/Protected.js';
import { allStamps } from '../Controller/AdminController.js';

export const adminRoute = express.Router();


adminRoute.post('/admin/addStamp',authorization,Protected,createStamp);
adminRoute.get('/admin/getallstamp',authorization,allStamps);