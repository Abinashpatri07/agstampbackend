import express from 'express';

import { getUserInfo, getWaveImg, userLogin, userLogout, userProduct, userRegister } from '../Controller/userController.js';
import { authorization } from '../Utils/Athorization.js';
import { addToCart, getCart, removeCartItem, updateCartItemQuantity } from '../Controller/CartController.js';

export const customersRoute = express.Router();

// User registration route
customersRoute.post('/user/register', userRegister);
customersRoute.post('/user/login', userLogin);
customersRoute.get('/user/allproducts', userProduct);
customersRoute.get('/user/waveimg', getWaveImg);



//login required
customersRoute.get('/user/info',authorization, getUserInfo);
customersRoute.get('/user/logout', authorization, userLogout);
customersRoute.get('/user/getcartitem', authorization, getCart);
customersRoute.post('/user/cartmanagment',authorization, addToCart);
customersRoute.post('/user/updatecart',authorization, updateCartItemQuantity);
customersRoute.get('/user/removeitem/:stampId',authorization, removeCartItem);
