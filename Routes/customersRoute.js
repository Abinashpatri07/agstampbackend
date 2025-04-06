import express from 'express';

import { getUserInfo, userLogin, userLogout, userRegister } from '../Controller/userController.js';
import { authorization } from '../Utils/Athorization.js';
import { createStamp } from '../Controller/FileUploadController.js';
import { Protected } from '../Utils/Protected.js';
import { allStamps } from '../Controller/AdminController.js';

export const customersRoute = express.Router();

// User registration route
customersRoute.post('/user/register', userRegister);
customersRoute.post('/user/login', userLogin);
customersRoute.get('/user/info',authorization, getUserInfo);
customersRoute.get('/user/logout', authorization, userLogout);

customersRoute.post('/admin/addStamp',authorization,Protected,createStamp);
customersRoute.get('/admin/getallstamp',authorization,allStamps);