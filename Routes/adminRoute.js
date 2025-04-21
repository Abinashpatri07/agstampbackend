import express from 'express';
import { authorization } from '../Utils/Athorization.js';
import { createCarousel, createStamp, deleteCarousel, deleteStamp, updateCarousel, uploadPhoto } from '../Controller/FileUploadController.js';
import { Protected } from '../Utils/Protected.js';
import { allCarousel, allStamps, singleCarousel, singleStamp, updateStamp } from '../Controller/AdminController.js';

export const adminRoute = express.Router();


adminRoute.post('/admin/addStamp',authorization,Protected,createStamp);
adminRoute.get('/admin/getallstamp',authorization,Protected,allStamps);
adminRoute.post('/admin/waveimg',authorization,Protected,uploadPhoto);
adminRoute.delete('/admin/deleteStamp/:id',authorization,Protected,deleteStamp);
adminRoute.get('/admin/getstamp/:id',singleStamp);
adminRoute.put('/admin/updateStamp/:id',authorization,Protected,updateStamp);

// CarouselModel
adminRoute.post('/admin/addcarousel',authorization,Protected,createCarousel);
adminRoute.get('/admin/getallcarousel',allCarousel);
adminRoute.delete('/admin/deletecarousel/:id',authorization,Protected,deleteCarousel);
adminRoute.get('/admin/carousel/:id',authorization,Protected,singleCarousel);
adminRoute.put('/admin/updatecarousel/:id',authorization,Protected,updateCarousel);


