import express from 'express';

import { getUserInfo, getWaveImg, userLogin, userLogout, userProduct, userRegister } from '../Controller/userController.js';
import { authorization } from '../Utils/Athorization.js';

export const customersRoute = express.Router();

// User registration route
customersRoute.post('/user/register', userRegister);
customersRoute.post('/user/login', userLogin);
customersRoute.get('/user/allproducts', userProduct);
customersRoute.get('/user/info',authorization, getUserInfo);
customersRoute.get('/user/logout', authorization, userLogout);
customersRoute.get('/user/waveimg', getWaveImg);
