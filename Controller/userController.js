import bcrypt from 'bcryptjs';
import { UserModel } from '../Model/userModel.js';
import jwt from "jsonwebtoken";
import { synchFunc } from '../Utils/SynchFunc.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js';

export const userRegister = synchFunc(async (req, res) => {
    const { firstname, lastname, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        throw new ErrorHandler(400,'Email already in use')
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new UserModel({
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword
    });

    // Save user to database
    await newUser.save();

    res.status(201).json({ success:true, message: 'User registered successfully'});
})

export const userLogin = synchFunc(async (req, res) => {

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (!existingUser) {
        throw new ErrorHandler(400,'Invalid email or password!')
    }

    const isCorrectPassword = bcrypt.compareSync(password,existingUser.password)

    if(!isCorrectPassword){
        throw new ErrorHandler(400,'Invalid email or password!')
    }


    // creating user token
    const token = jwt.sign({id:existingUser._id},process.env.JWTSECRET,{
        expiresIn : process.env.JWTEXPIRY
    })

    res.cookie("agstampToken", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true, 
        secure: true,
        sameSite: "none",
        path: "/",
    }).status(201).json({ success:true, message: 'User Loggedin successfully', user: existingUser });
})

export const getUserInfo = synchFunc(async (req, res) => {
    res.status(201).json({ success:true, user: req.user });
})

export const userLogout = synchFunc(async (_, res) => {
    res.cookie("agstampToken", null, {
        maxAge: 0,
        httpOnly: true, 
        secure: true,
        sameSite: "none",
        path: "/",
    }).status(201).json({ success:true, message: 'User Logged out successfully',user:null });
})






