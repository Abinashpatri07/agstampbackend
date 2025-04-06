import stampModel from "../Model/stampModel.js"
import { synchFunc } from "../Utils/SynchFunc.js";


export const allStamps = synchFunc(async (_, res) => {
    const stamps = await stampModel.find();
    res.status(201).json({ success:true, stamps });
});