import express from 'express';
import { authorization } from '../Utils/Athorization.js';
import { createStamp, deleteStamp, updateStampImages } from '../Controller/FileUploadController.js';
import { Protected } from '../Utils/Protected.js';
import { allStamps, singleStamp } from '../Controller/AdminController.js';

export const adminRoute = express.Router();


adminRoute.post('/admin/addStamp',authorization,Protected,createStamp);
adminRoute.get('/admin/getallstamp',authorization,allStamps);
adminRoute.delete('/admin/deleteStamp/:id',authorization,Protected,deleteStamp);
adminRoute.get('/admin/getstamp/:id',authorization,Protected,singleStamp);
adminRoute.put('/admin/updateStamp/:id',authorization,Protected,updateStampImages);