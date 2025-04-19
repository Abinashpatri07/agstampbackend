import stampModel from "../Model/stampModel.js";

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