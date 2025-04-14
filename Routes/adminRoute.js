import express from 'express';
import { authorization } from '../Utils/Athorization.js';
import { createStamp, deleteStamp } from '../Controller/FileUploadController.js';
import { Protected } from '../Utils/Protected.js';
import { allStamps, singleStamp, updateStamp } from '../Controller/AdminController.js';

export const adminRoute = express.Router();


adminRoute.post('/admin/addStamp',authorization,Protected,createStamp);
adminRoute.get('/admin/getallstamp',authorization,Protected,allStamps);
adminRoute.delete('/admin/deleteStamp/:id',authorization,Protected,deleteStamp);
adminRoute.get('/admin/getstamp/:id',singleStamp);
adminRoute.put('/admin/updateStamp/:id',authorization,Protected,updateStamp);