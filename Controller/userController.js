import bcrypt from 'bcryptjs';
import { UserModel } from '../Model/userModel.js';
import jwt from "jsonwebtoken";
import { synchFunc } from '../Utils/SynchFunc.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js';
import stampModel from '../Model/stampModel.js';
import PhotoModel from '../Model/WaveModel.js';
import { mail } from '../Helper/Mail.js';
import subscriberModel from '../Model/subcriberModel.js';
import orderModel from '../Model/orderModel.js';

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

    res.status(201).json({ success:true, message: 'register successful'});
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
    }).status(201).json({ success:true, message: 'Login successful', user: existingUser });
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
    }).status(201).json({ success:true, message: 'Logout successful',user:null });
})

export const userProduct = synchFunc(async (_, res) => {
    const today = new Date();
    const stamps = await stampModel.find({
    active: true,
    beginDate: { $lte: today },
    });
    res.status(201).json({ success:true, stamps });
})

export const getWaveImg = synchFunc(async (_, res) => {
    const wave = await PhotoModel.find();
    res.status(201).json({ success:true, wave });
})

export const subscribeMailService = synchFunc(async (req, res) => {
    const {email} = req.body;
    const {user} = req;
    const emailSendRes = await mail([email],"Welcome email","Hello");
    if(emailSendRes.messageId){
        const newSubscriber = new subscriberModel({
            user:user._id,
            subscribedEmail:email,
        });
        
        // Save user to database
        await newSubscriber.save();
        res.status(200).json({ success:true, message:"Thank you for subscribing" });
    }else{
        throw new ErrorHandler(400,'something Went Wrong While Sending The Mail!');
    }
});

export const getAllUserOrder = synchFunc(async (req, res) => {
    const orders = await orderModel.find({userId:req.user._id}).sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      orders 
    });
}) 
  