// const stripe = require("../Config/stripe")
// const Order = require("../Model/orderModel") // Assuming you have an Order model
// const User = require("../Model/") // Assuming you have a User model

// // Create a checkout session
// exports.createCheckoutSession = async (req, res) => {
//   try {
//     const { items, customerEmail, customerName, shippingAddress, metadata = {} } = req.body

//     // Validate required fields
//     if (!items || !items.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No items provided for checkout",
//       })
//     }

//     // Format line items for Stripe
//     const lineItems = items.map((item) => ({
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: item.name,
//           description: item.description || "",
//           images: item.images || [],
//         },
//         unit_amount: Math.round(item.price * 100), // Stripe requires amount in cents
//       },
//       quantity: item.quantity,
//     }))

//     // Create the checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: lineItems,
//       customer_email: customerEmail,
//       client_reference_id: req.user ? req.user.id : null, // If user is authenticated
//       success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${req.headers.origin}/checkout/cancel`,
//       shipping_address_collection: {
//         allowed_countries: ["US", "CA"], // Add more countries as needed
//       },
//       shipping_options: [
//         {
//           shipping_rate_data: {
//             type: "fixed_amount",
//             fixed_amount: {
//               amount: 0, // Free shipping
//               currency: "usd",
//             },
//             display_name: "Standard Shipping",
//             delivery_estimate: {
//               minimum: {
//                 unit: "business_day",
//                 value: 3,
//               },
//               maximum: {
//                 unit: "business_day",
//                 value: 5,
//               },
//             },
//           },
//         },
//       ],
//       metadata: {
//         ...metadata,
//         customerName,
//       },
//     })

//     // Return the session ID and URL
//     res.status(200).json({
//       success: true,
//       sessionId: session.id,
//       url: session.url,
//     })
//   } catch (error) {
//     console.error("Error creating checkout session:", error)
//     res.status(500).json({
//       success: false,
//       message: "Failed to create checkout session",
//       error: error.message,
//     })
//   }
// }

// // Verify a checkout session
// exports.verifyCheckoutSession = async (req, res) => {
//   try {
//     const { sessionId } = req.params

//     if (!sessionId) {
//       return res.status(400).json({
//         success: false,
//         message: "Session ID is required",
//       })
//     }

//     const session = await stripe.checkout.sessions.retrieve(sessionId, {
//       expand: ["line_items", "customer"],
//     })

//     res.status(200).json({
//       success: true,
//       session,
//     })
//   } catch (error) {
//     console.error("Error verifying checkout session:", error)
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify checkout session",
//       error: error.message,
//     })
//   }
// }

// // Handle Stripe webhook events
// exports.handleWebhook = async (req, res) => {
//   const signature = req.headers["stripe-signature"]
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

//   let event

//   try {
//     // Verify the webhook signature
//     event = stripe.webhooks.constructEvent(
//       req.rawBody, // You need to configure Express to provide raw body for webhook verification
//       signature,
//       endpointSecret,
//     )
//   } catch (error) {
//     console.error("Webhook signature verification failed:", error.message)
//     return res.status(400).send(`Webhook Error: ${error.message}`)
//   }

//   // Handle specific events
//   switch (event.type) {
//     case "checkout.session.completed":
//       const session = event.data.object

//       // Create order in database
//       await handleCheckoutSessionCompleted(session)
//       break

//     case "payment_intent.succeeded":
//       const paymentIntent = event.data.object
//       // Update payment status in your database
//       await handlePaymentIntentSucceeded(paymentIntent)
//       break

//     // Add more event handlers as needed

//     default:
//       console.log(`Unhandled event type: ${event.type}`)
//   }

//   res.status(200).json({ received: true })
// }

// // Helper function to handle checkout.session.completed event
// async function handleCheckoutSessionCompleted(session) {
//   try {
//     // Retrieve the session with line items
//     const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
//       expand: ["line_items"],
//     })

//     // Extract order details
//     const { client_reference_id, customer_email, metadata, amount_total, line_items, payment_status, shipping } =
//       expandedSession

//     // Create a new order in your database
//     const order = new Order({
//       user: client_reference_id, // User ID if available
//       email: customer_email,
//       customerName: metadata?.customerName,
//       items: line_items.data.map((item) => ({
//         name: item.description,
//         price: item.amount_total / 100, // Convert from cents to dollars
//         quantity: item.quantity,
//       })),
//       total: amount_total / 100, // Convert from cents to dollars
//       paymentStatus: payment_status,
//       shippingAddress: shipping
//         ? {
//             name: shipping.name,
//             address: {
//               line1: shipping.address.line1,
//               line2: shipping.address.line2,
//               city: shipping.address.city,
//               state: shipping.address.state,
//               postalCode: shipping.address.postal_code,
//               country: shipping.address.country,
//             },
//           }
//         : null,
//       stripeSessionId: session.id,
//     })

//     await order.save()

//     // If user is authenticated, add order to user's orders
//     if (client_reference_id) {
//       await User.findByIdAndUpdate(client_reference_id, { $push: { orders: order._id } })
//     }

//     console.log(`Order created: ${order._id}`)
//   } catch (error) {
//     console.error("Error handling checkout session completed:", error)
//   }
// }

// // Helper function to handle payment_intent.succeeded event
// async function handlePaymentIntentSucceeded(paymentIntent) {
//   try {
//     // Update order payment status
//     await Order.findOneAndUpdate(
//       { paymentIntentId: paymentIntent.id },
//       {
//         $set: {
//           paymentStatus: "paid",
//           paymentDetails: {
//             paymentMethod: paymentIntent.payment_method_types[0],
//             paymentId: paymentIntent.id,
//             amount: paymentIntent.amount / 100, // Convert from cents to dollars
//             currency: paymentIntent.currency,
//             paidAt: new Date(paymentIntent.created * 1000), // Convert from Unix timestamp
//           },
//         },
//       },
//     )

//     console.log(`Payment succeeded for intent: ${paymentIntent.id}`)
//   } catch (error) {
//     console.error("Error handling payment intent succeeded:", error)
//   }
// }


// import stripe from "../Config/stripe.js"; // Make sure this path is correct
// import Order from "../Model/orderModel.js"; // Ensure this path is correct
// import { UserModel } from '../Model/userModel.js';// Update with your actual user model name

// // Create a checkout session
// export const createCheckoutSession = async (req, res) => {
//   try {
//     const { items, customerEmail, customerName, shippingAddress, metadata = {} } = req.body;

//     // Validate required fields
//     if (!items || !items.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No items provided for checkout",
//       });
//     }

//     // Format line items for Stripe
//     const lineItems = items.map((item) => ({
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: item.name,
//           description: item.description || "",
//           images: item.images || [],
//         },
//         unit_amount: Math.round(item.price * 100), // Stripe requires amount in cents
//       },
//       quantity: item.quantity,
//     }));

//     // Create the checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: lineItems,
//       customer_email: customerEmail,
//       client_reference_id: req.user ? req.user.id : null, // If user is authenticated
//       success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${req.headers.origin}/checkout/cancel`,
//       shipping_address_collection: {
//         allowed_countries: ["US", "CA"], // Add more countries as needed
//       },
//       shipping_options: [
//         {
//           shipping_rate_data: {
//             type: "fixed_amount",
//             fixed_amount: {
//               amount: 0, // Free shipping
//               currency: "usd",
//             },
//             display_name: "Standard Shipping",
//             delivery_estimate: {
//               minimum: {
//                 unit: "business_day",
//                 value: 3,
//               },
//               maximum: {
//                 unit: "business_day",
//                 value: 5,
//               },
//             },
//           },
//         },
//       ],
//       metadata: {
//         ...metadata,
//         customerName,
//       },
//     });

//     // Return the session ID and URL
//     res.status(200).json({
//       success: true,
//       sessionId: session.id,
//       url: session.url,
//     });
//   } catch (error) {
//     console.error("Error creating checkout session:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create checkout session",
//       error: error.message,
//     });
//   }
// };

// // Verify a checkout session
// export const verifyCheckoutSession = async (req, res) => {
//   try {
//     const { sessionId } = req.params;

//     if (!sessionId) {
//       return res.status(400).json({
//         success: false,
//         message: "Session ID is required",
//       });
//     }

//     const session = await stripe.checkout.sessions.retrieve(sessionId, {
//       expand: ["line_items", "customer"],
//     });

//     res.status(200).json({
//       success: true,
//       session,
//     });
//   } catch (error) {
//     console.error("Error verifying checkout session:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify checkout session",
//       error: error.message,
//     });
//   }
// };

// // Handle Stripe webhook events
// export const handleWebhook = async (req, res) => {
//   const signature = req.headers["stripe-signature"];
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

//   let event;

//   try {
//     // Verify the webhook signature
//     event = stripe.webhooks.constructEvent(
//       req.rawBody, // You need to configure Express to provide raw body for webhook verification
//       signature,
//       endpointSecret,
//     );
//   } catch (error) {
//     console.error("Webhook signature verification failed:", error.message);
//     return res.status(400).send(`Webhook Error: ${error.message}`);
//   }

//   // Handle specific events
//   switch (event.type) {
//     case "checkout.session.completed":
//       const session = event.data.object;

//       // Create order in database
//       await handleCheckoutSessionCompleted(session);
//       break;

//     case "payment_intent.succeeded":
//       const paymentIntent = event.data.object;
//       // Update payment status in your database
//       await handlePaymentIntentSucceeded(paymentIntent);
//       break;

//     // Add more event handlers as needed

//     default:
//       console.log(`Unhandled event type: ${event.type}`);
//   }

//   res.status(200).json({ received: true });
// };

// // Helper function to handle checkout.session.completed event
// async function handleCheckoutSessionCompleted(session) {
//   try {
//     // Retrieve the session with line items
//     const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
//       expand: ["line_items"],
//     });

//     // Extract order details
//     const { client_reference_id, customer_email, metadata, amount_total, line_items, payment_status, shipping } =
//       expandedSession;

//     // Create a new order in your database
//     const order = new Order({
//       user: client_reference_id, // User ID if available
//       email: customer_email,
//       customerName: metadata?.customerName,
//       items: line_items.data.map((item) => ({
//         name: item.description,
//         price: item.amount_total / 100, // Convert from cents to dollars
//         quantity: item.quantity,
//       })),
//       total: amount_total / 100, // Convert from cents to dollars
//       paymentStatus: payment_status,
//       shippingAddress: shipping
//         ? {
//             name: shipping.name,
//             address: {
//               line1: shipping.address.line1,
//               line2: shipping.address.line2,
//               city: shipping.address.city,
//               state: shipping.address.state,
//               postalCode: shipping.address.postal_code,
//               country: shipping.address.country,
//             },
//           }
//         : null,
//       stripeSessionId: session.id,
//     });

//     await order.save();

//     // If user is authenticated, add order to user's orders
//     if (client_reference_id) {
//       await User.findByIdAndUpdate(client_reference_id, { $push: { orders: order._id } });
//     }

//     console.log(`Order created: ${order._id}`);
//   } catch (error) {
//     console.error("Error handling checkout session completed:", error);
//   }
// }

// // Helper function to handle payment_intent.succeeded event
// async function handlePaymentIntentSucceeded(paymentIntent) {
//   try {
//     // Update order payment status
//     await Order.findOneAndUpdate(
//       { paymentIntentId: paymentIntent.id },
//       {
//         $set: {
//           paymentStatus: "paid",
//           paymentDetails: {
//             paymentMethod: paymentIntent.payment_method_types[0],
//             paymentId: paymentIntent.id,
//             amount: paymentIntent.amount / 100, // Convert from cents to dollars
//             currency: paymentIntent.currency,
//             paidAt: new Date(paymentIntent.created * 1000), // Convert from Unix timestamp
//           },
//         },
//       },
//     );

//     console.log(`Payment succeeded for intent: ${paymentIntent.id}`);
//   } catch (error) {
//     console.error("Error handling payment intent succeeded:", error);
//   }
// }


import stripe from "../Config/stripe.js"; // Make sure this path is correct
import Order from "../Model/orderModel.js"; // Ensure this path is correct
import { UserModel } from '../Model/userModel.js';// Update with your actual user model name

// Create a checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const { items, customerEmail, customerName, shippingAddress, metadata = {} } = req.body;

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "No items provided for checkout",
      });
    }

    // Format line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.description || "",
          images: item.images.map(ele=>ele.publicUrl) || [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe requires amount in cents
      },
      quantity: item.quantity,
    }));

    // Create the session data object
    const sessionData = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      customer_email: customerEmail,
      success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout/cancel`,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"], // Add more countries as needed
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0, // Free shipping
              currency: "usd",
            },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 3,
              },
              maximum: {
                unit: "business_day",
                value: 5,
              },
            },
          },
        },
      ],
     
      metadata: {
        ...metadata,
        customerName,
      },
    };

    // Only add client_reference_id if user is authenticated and id exists
    if (req.user && req.user.id) {
      sessionData.client_reference_id = req.user.id;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionData);

    // Return the session ID and URL
    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

// Verify a checkout session
export const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    });

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify checkout session",
      error: error.message,
    });
  }
};

// Handle Stripe webhook events
export const handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      req.rawBody, // You need to configure Express to provide raw body for webhook verification
      signature,
      endpointSecret,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle specific events
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;

      // Create order in database
      await handleCheckoutSessionCompleted(session);
      break;

    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      // Update payment status in your database
      await handlePaymentIntentSucceeded(paymentIntent);
      break;

    // Add more event handlers as needed

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};

// Helper function to handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session) {
  try {
    // Retrieve the session with line items
    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });

    // Extract order details
    const { client_reference_id, customer_email, metadata, amount_total, line_items, payment_status, shipping } =
      expandedSession;

    // Create a new order in your database
    const order = new Order({
      user: client_reference_id || null, // User ID if available, otherwise null
      email: customer_email,
      customerName: metadata?.customerName,
      items: line_items.data.map((item) => ({
        name: item.description,
        price: item.amount_total / 100, // Convert from cents to dollars
        quantity: item.quantity,
      })),
      total: amount_total / 100, // Convert from cents to dollars
      paymentStatus: payment_status,
      shippingAddress: shipping
        ? {
          name: shipping.name,
          address: {
            line1: shipping.address.line1,
            line2: shipping.address.line2,
            city: shipping.address.city,
            state: shipping.address.state,
            postalCode: shipping.address.postal_code,
            country: shipping.address.country,
          },
        }
        : null,
      stripeSessionId: session.id,
    });

    await order.save();

    // If user is authenticated, add order to user's orders
    if (client_reference_id) {
      await UserModel.findByIdAndUpdate(client_reference_id, { $push: { orders: order._id } });
    }

    console.log(`Order created: ${order._id}`);
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
  }
}

// Helper function to handle payment_intent.succeeded event
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // Update order payment status
    await Order.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      {
        $set: {
          paymentStatus: "paid",
          paymentDetails: {
            paymentMethod: paymentIntent.payment_method_types[0],
            paymentId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert from cents to dollars
            currency: paymentIntent.currency,
            paidAt: new Date(paymentIntent.created * 1000), // Convert from Unix timestamp
          },
        },
      },
    );

    console.log(`Payment succeeded for intent: ${paymentIntent.id}`);
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
  }
}