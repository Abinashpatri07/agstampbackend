// const express = require("express")
// const router = express.Router()
// const stripeController = require("../Controller/stripeController")
// const { isAuthenticated } = require("../middleware/auth") // Assuming you have auth middleware
// const { rawBodyParser } = require("../Middleware/rawBodyParser") // We'll create this middleware
// const Order = require("../Model/orderModel") // Import the Order model

// // Create checkout session
// router.post("/create-checkout-session", stripeController.createCheckoutSession)

// // Verify checkout session
// router.get("/verify-session/:sessionId", stripeController.verifyCheckoutSession)

// // Webhook endpoint (needs raw body for signature verification)
// router.post("/webhook", rawBodyParser, stripeController.handleWebhook)

// // Get user's orders (protected route)
// router.get("/orders", isAuthenticated, async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 })
//     res.status(200).json({ success: true, orders })
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message })
//   }
// })

// module.exports = router


// import express from "express";
// import * as stripeController from "../Controller/stripeController.js";
// // import { isAuthenticated } from "../middleware/auth.js"; // Ensure this path is correct
// import Order from "../Model/orderModel.js"; // Import the Order model

// const router = express.Router();

// // Create checkout session
// router.post("/create-checkout-session", stripeController.createCheckoutSession);

// // Verify checkout session
// router.get("/verify-session/:sessionId", stripeController.verifyCheckoutSession);

// // Webhook endpoint (raw body is now processed in app.js)
// router.post("/webhook", stripeController.handleWebhook);

// // Get user's orders (protected route)
// router.get("/orders", async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
//     res.status(200).json({ success: true, orders });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// export default router; // Changed to ES module export



import express from "express";
import * as stripeController from "../Controller/stripeController.js";
// import { isAuthenticated } from "../middleware/auth.js"; // Middleware to check if user is authenticated

const router = express.Router();

// Create checkout session
router.post("/create-checkout-session", stripeController.createCheckoutSession);

// Verify checkout session - public route
router.get("/verify-session/:sessionId", stripeController.verifyCheckoutSession);

// Webhook endpoint (raw body is now processed in app.js)
router.post("/webhook", stripeController.handleWebhook);

// Get user's orders (protected route)
router.get("/orders", async (req, res) => {
  try {
    // Ensure req.user exists (should be set by isAuthenticated middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }
    
    const Order = await import("../Model/orderModel.js").then(module => module.default);
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      orders 
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch orders" 
    });
  }
});

export default router;