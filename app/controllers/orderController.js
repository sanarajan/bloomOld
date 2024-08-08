const Category = require("../models/categoryModel");
const SubCategory = require("../models/subCategoryModel");
const Product = require("../models/productModel");
const userModel = require("../models/userModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");

const path = require('path');
const mongoose = require('mongoose');

exports.orders = async (req, res) => {
    try {
        let pageTitle ='Orders'
        const fetchUserId = await userModel.findOne({
            email: req.session.useremail,
          });
          if (!fetchUserId) {
            return res.status(404).json({ message: "User not found" });
          }
          const userId = fetchUserId._id;
      
          // Fetch orders and populate necessary fields
          const orders = await Order.find({ userId: userId })
            .populate("userId", "_id username email")
            .populate("orderedProducts.category")
            .populate("orderedProducts.subcategory");
      
          if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "Orders not found" });
          }
      
          // Process orders to add deliveryDate and itemTotalPrice
          const updatedOrders = orders.map((order) => {
            const orderDate = new Date(order.createdAt);
      
            const updatedProducts = order.orderedProducts.map((product) => {
              let deliveryDate;
      
              if (
                product.orderStatus === "Order Placed" ||
                product.orderStatus === "Shipped"
              ) {
                deliveryDate = new Date(orderDate);
                deliveryDate.setDate(orderDate.getDate() + 10); // Delivery date 10 days from order date
              } else if (product.orderStatus === "Delivered") {
                deliveryDate = new Date(order.updatedAt); // Delivery date is the order's updated date
              } else if (product.orderStatus === "Pending Cancellation") {
                deliveryDate = new Date(product.cancellation.cancelDate); // Delivery date is the order's updated date
              }
      
              // Add deliveryDate and itemTotalPrice to product
              const updatedProduct = {
                ...product.toObject(),
                deliveryDate: deliveryDate ? deliveryDate.toLocaleDateString() : null,
                itemTotalPrice: product.price * product.quantity,
              };
      
            
      
              return updatedProduct;
            });
      
            // Attach the updated products to the order
            return {
              ...order.toObject(),
              orderedProducts: updatedProducts,
            };
          });
      
          // Log updated orders for debugging
      res.render("admin/orders", 
        { userName: req.session.adusername,
        layout: 'adminLayout',
        pageTitle, 
        updatedOrders});
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error });
    }
  };
  

  //admin
  exports.orderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const orders = await Order.find({ _id: orderId })
        .populate("userId", "_id username email")
        .populate("orderedProducts.category")
        .populate("orderedProducts.subcategory");
  
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "Orders not found" });
      }
  

        if (!orders) {
            return res.status(404).send('Order not found');
        }
        const updatedOrders = orders.map((order) => {
            const orderDate = new Date(order.createdAt);
      
            const updatedProducts = order.orderedProducts.map((product) => {
              let deliveryDate;
              let btnColr = ""
      
              if (
                product.orderStatus === "Order Placed" ||
                product.orderStatus === "Shipped"
              ) {
                btnColr = product.orderStatus === "Order Placed" ? "blue" : "orange";
              
                deliveryDate = new Date(orderDate);
                deliveryDate.setDate(orderDate.getDate() + 10); // Delivery date 10 days from order date
              } else if (product.orderStatus === "Delivered") {
                btnColr = "green";
                deliveryDate = new Date(order.updatedAt); // Delivery date is the order's updated date
              } else if (product.orderStatus === "Pending Cancellation") {
                btnColr = "yellow;color:black";
                deliveryDate = new Date(product.cancellation.cancelDate); // Delivery date is the order's updated date
              }else if (product.orderStatus === "Cancelled") {
                btnColr = "red";
              }
      
              // Add deliveryDate and itemTotalPrice to product
              const updatedProduct = {
                ...product.toObject(),
                deliveryDate: deliveryDate ? deliveryDate.toLocaleDateString() : null,
                btnColr:btnColr,
                itemTotalPrice: product.price * product.quantity,
              };
      
            
             
              return updatedProduct;
            });
      
            // Attach the updated products to the order
            return {
              ...order.toObject(),
              orderedProducts: updatedProducts,
            };
          });
          console.log("Updated Orders: ", JSON.stringify(updatedOrders, null, 2));
  let pageTitle="Order Details"
        res.render('admin/orderDetails', {
            updatedOrders,
            layout: 'adminLayout',
            pageTitle,
            showSidebar:false
        });
    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).send('Server Error');
    }
};

exports.updateOrderStatus = async (req, res) => {
  const { status, orderId, productId, userId } = req.body;
console.log(orderId+" + "+productId+" + "+status+" + "+userId)
  try {
      // Find the order and update the product's order status
      const updatedOrder = await Order.findOneAndUpdate(
          { _id: orderId, "orderedProducts.productId": productId, userId: userId },
          { $set: { "orderedProducts.$.orderStatus": status } },
          { new: true }
      );

      if (!updatedOrder) {
          return res.status(404).json({ success: false, error: 'Order not found.' });
      }
      // If the status is 'Cancelled', update the product quantity and status
      if (status === 'Cancelled') {
        console.log("Cancellation process triggered");

        // Find the specific product in the order
        const product = updatedOrder.orderedProducts.find(prod => prod.productId.toString() === productId);

        console.log("Product to Cancel:", product);

        if (product) {console.log("und product"+product.productId)
            // Update product quantity and order status in the Product collection
            await Product.findByIdAndUpdate(
                product.productId, 
                { 
                    $inc: { quantity: product.quantity }, 
                    $set: { orderStatus: 'Cancelled' } 
                }
            );

            // Ensure the order's product status is also updated to 'Cancelled'
            await Order.updateOne(
                { _id: orderId, "orderedProducts.productId": productId },
                { $set: { "orderedProducts.$.orderStatus": 'Cancelled' } }
            );

            console.log("Product and Order status updated to 'Cancelled'");
        } else {
            console.log("Product not found in the order");
        }
    }

      res.json({ success: true, updatedOrder });

  } catch (err) {
      console.error('Error updating order status:', err);
      res.status(500).json({ success: false, error: 'Failed to update order status.' });
  }
};


  