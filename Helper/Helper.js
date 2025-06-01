import stampModel from "../Model/stampModel.js";
import { ErrorHandler } from "../Utils/ErrorHandler.js";

export const calculateTotal = async (items) => {
    let total = 0;
    for (const item of items) {
      const stamp = await stampModel.findById(item.stamp);
      if (stamp) {
        total += stamp.price * item.quantity;
      }
    }
    return total;
  };

export async function updateStampStock(order) {
  try {
    for (const item of order.items) {
      // Find the stamp by name and category
      const stamp = await stampModel.findOneAndUpdate(
        { 
          name: item.name,
          categories: item.category 
        },
        { $inc: { stock: -item.quantity } }, // Decrement stock by ordered quantity
        { new: true } // Return updated document
      );

      if (!stamp) {
        return(`Stamp not found: ${item.name} in category ${item.category}`);
      }
    }
    return await stampModel.find();
  } catch (error) {
     throw new ErrorHandler(400,'Error while updating stamp stock')
  }
}

export async function checkStockAvailability(items) {
  try {
    for (const item of items) {
      // Find the stamp by MongoDB ID
      const stamp = await stampModel.findById(item.mongoID);

      // If stamp not found
      if (!stamp) {
        return "stamp not found";
      }

      // Check stock availability
      if (stamp.stock < item.quantity) {
          return `Insufficient stock for ${stamp.name}. Available: ${stamp.stock}, Ordered: ${item.quantity}`
      }
    }
    return true;
  } catch (error) {
    throw new ErrorHandler(500, "Error while checking stock availability");
  }
}