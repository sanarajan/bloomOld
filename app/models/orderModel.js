const mongoose = require('mongoose');

// Define the Order schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  
 
  paymentMethod: {
    type: String,
    enum: ['COD', 'Credit Card', 'Debit Card', 'Net Banking'],
    required: true
  },
  address: {
    house: { type: String, required: true },
    place: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: Number, required: true }
  },
  deliveryCharge: { 
    type: Number, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  packingCharge: { 
    type: Number, 
    required: true 
  },
  totalAmount: { 
    type:Number, 
    required: true 
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  orderedProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    // category: { type: String, required: true },
    // subcategory: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
    quantity: { type: Number, required: true },
    image: { type: String, required: true },
    // image: { type: [String], required: true },
    price: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ['Order Placed','Pending','Pending Cancellation','Processing','Shipped','Delivered','Cancelled'],
      default: 'Order Placed'
    },
    cancellation: {
      reason: String,
      cancelDate: { type: Date, default: null}
  },
  cancelledBy:{type:String}
  }],
  
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt

// Create and export the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
