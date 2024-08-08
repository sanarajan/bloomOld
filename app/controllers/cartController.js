const Category = require("../models/categoryModel");
const SubCategory = require("../models/subCategoryModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const userModel = require("../models/userModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");

const mongoose = require("mongoose");

// Controller function to render cart page with cart items
exports.yourCart = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.session.useremail });
    const cart = await Cart.findOne({ user: user._id, isActive: true })
      .populate("products.product")
      .exec();

    if (!cart) {
      return res.render("user/yourCart", {
        showSidebar: false,
        cartItems: [],
        totalItems: 0,
        totalPrice: 0,
        totalDiscount: 0,
        deliveryCharges: 0,
        packagingFee: 0,
        totalAmount: 0,
        totalSavings: 0,
      });
    }

    // Calculate delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 10);
    const deliveryDateString = deliveryDate.toDateString();

    // Calculate summary values
    const totalItems = cart.products.length;
    const totalPrice = cart.products.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    //   const totalDiscount = cart.products.reduce((sum, item) => sum + item.product.discount * item.quantity, 0); // Example calculation
    const totalDiscount = 0;
    const deliveryCharges = 75; // Example value
    const packagingFee = 50; // Example value
    const totalAmount =
      totalPrice - totalDiscount + deliveryCharges + packagingFee;
    const totalSavings = totalDiscount; // Example value
    //   let productQuantity = item.product.quantity
    //   let chek =

    res.render("user/yourCart", {
      showSidebar: false,
      cartItems: cart.products.map((item) => ({
        product: {
          _id: item.product._id,
          name: item.product.productName,
          specification: item.product.specification,
          // seller: item.product.seller,
          price: item.product.price,
          offerPrice: item.product.offerPrice,
          offerPercentage: item.product.offerPercentage,
          image: item.product.thumbnailPaths[0],
          productQuantity: item.product.quantity,
        },
        quantity: item.quantity,
        deliveryDate: deliveryDateString,
      })),
      totalItems,
      totalPrice,
      totalDiscount,
      deliveryCharges,
      packagingFee,
      totalAmount,
      totalSavings,
    });
  } catch (error) {
    console.error("Error in yourCart route:", error);
    res.status(500).send("Internal server error");
  }
};

const MAX_QUANTITY = 10; // Set your maximum quantity limit here

exports.updateCartQuantity = async (req, res) => {
  const { productId, quantity } = req.body;

  // Validate the productId and quantity
  if (!productId || !quantity) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Product ID and quantity are required",
      });
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product ID" });
  }

  try {
    // Find the cart for the logged-in user
    const user = await userModel.findOne({ email: req.session.useremail });

    const cart = await Cart.findOne({ user: user._id, isActive: true });
    console.log(cart);
    if (!cart) {
      console.log("yes");
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    console.log(quantity + "> " + product.quantity + " first");
    if (quantity > product.quantity) {
      console.log("quentity less");
      return res
        .status(400)
        .json({
          success: false,
          message: `Only ${product.quantity} items available`,
        });
    }
    // Check if quantity exceeds maximum limit
    if (quantity > MAX_QUANTITY) {
      console.log(quantity + "> " + MAX_QUANTITY);
      return res
        .status(400)
        .json({
          success: false,
          message: `Maximum quantity of ${MAX_QUANTITY} reached for this product.`,
        });
    }

    // Find the item in the cart and update its quantity
    const cartItem = cart.products.find(
      (item) => item.product.toString() === productId
    );

    if (cartItem) {
      cartItem.quantity = quantity;
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart" });
    }

    // Save the updated cart
    await cart.save();
    const updatedCart = await Cart.findOne({ user: user._id, isActive: true })
      .populate("products.product")
      .exec();
    const totalItems = updatedCart.products.length;
    const totalPrice = updatedCart.products.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const totalDiscount = 0;
    const deliveryCharges = 75; // Example value
    const packagingFee = 50; // Example value
    const totalAmount =
      totalPrice - totalDiscount + deliveryCharges + packagingFee;
    const totalSavings = totalDiscount; // Example value

    // Prepare response data

    console.log("pk");
    res.json({
      success: true,
      totalItems,
      totalPrice,
      totalDiscount,
      deliveryCharges,
      packagingFee,
      totalAmount,
      totalSavings,
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//user side
// Assuming you have required necessary models like Cart, Product, and userModel

exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const user = await userModel.findOne({ email: req.session.useremail });

  try {
    let product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock available" });
    }

    if (product.quantity === 0) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ user: user._id, isActive: true });

    if (!cart) {
      cart = new Cart({
        user: user._id,
        products: [{ product: productId, quantity }],
      });
    } else {
      const productIndex = cart.products.findIndex((item) =>
        item.product.equals(productId)
      );

      if (productIndex >= 0) {
        if (
          cart.products[productIndex].quantity + quantity >
          product.quantity
        ) {
          return res
            .status(400)
            .json({ message: "Quantity exceeds available stock" });
        }
        cart.products[productIndex].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
    }

    // Update the product quantity in the database
    // product.quantity -= quantity;
    // await product.save();

    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
exports.removeCartItem = async (req, res) => {
  const { productId } = req.params;

  // Validate the productId
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product ID" });
  }

  try {
    // Find the cart for the logged-in user
    const user = await userModel.findOne({ email: req.session.useremail });
    const cart = await Cart.findOne({ user: user._id, isActive: true });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Find the index of the item to remove
    const itemIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart" });
    }

    // Remove the item from the cart
    cart.products.splice(itemIndex, 1);

    // Save the updated cart
    await cart.save();
    const updatedCart = await Cart.findOne({ user: user._id, isActive: true })
      .populate("products.product")
      .exec();
    const totalItems = updatedCart.products.length;
    const totalPrice = updatedCart.products.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const totalDiscount = 0;
    const deliveryCharges = 75; // Example value
    const packagingFee = 50; // Example value
    const totalAmount =
      totalPrice - totalDiscount + deliveryCharges + packagingFee;
    const totalSavings = totalDiscount; // Example value

    // Prepare response data

    res.json({
      success: true,
      totalItems,
      totalPrice,
      totalDiscount,
      deliveryCharges,
      packagingFee,
      totalAmount,
      totalSavings,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.checkout = async (req, res) => {
  try {
    const fetchUserId = await userModel.findOne({
      email: req.session.useremail,
    });
    const userId = fetchUserId._id; // Assuming you store the user ID in the session
    if (!userId) {
      return res.redirect("/login"); // Redirect to login if not authenticated
    }

    // Fetch user addresses
    const user = await userModel
      .findById(userId)
      .populate("address_ids")
      .exec();
    const addresses = user.address_ids;

    // Fetch cart items
    const cart = await Cart.find({ user: userId, isActive: true })
      .populate({
        path: "products.product", // Reference to the Product schema
        select: "productName price thumbnailPaths", // Fields you need from the Product schema
      })
      .exec();

    // console.log('Populated Cart:', JSON.stringify(cart, null, 2));

    // Calculate cart summary details
    if (cart.length) {
      let totalItems = 0;
      let totalPrice = 0;
      let totalDiscount = 0;
      let deliveryCharges = 75;
      let packagingFee = 50;
      let totalAmount = 0;
      let totalSavings = 0;
      cart.forEach((cart) => {
        cart.products.forEach((item) => {
          const product = item.product; // Access the populated product
          if (product) {
            // Ensure the product is populated
            console.log(product.thumbnailPaths[0]); // Debugging: Check product details
            console.log(product.productName);
            totalItems += item.quantity;
            totalPrice += product.price * item.quantity;

            // Ensure offerPrice exists in product schema
            const offerPrice = product.offerPrice || product.price;
            totalDiscount += (product.price - offerPrice) * item.quantity;
            totalAmount += offerPrice * item.quantity;
          }
        });
      });

      totalAmount += deliveryCharges + packagingFee;
      totalSavings = totalDiscount;

      // Pass data to the checkout template
      res.render("user/checkout", {
        showSidebar: false,
        addresses: addresses,
        cartItems: cart,
        cartProduct: cart.products,
        totalItems: totalItems,
        totalPrice: totalPrice,
        totalDiscount: totalDiscount,
        deliveryCharges: deliveryCharges,
        packagingFee: packagingFee,
        totalAmount: totalAmount,
        totalSavings: totalSavings,
        userId: userId,
      });
    } //if cart exist
    else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error in checkout route:", error);
    res.status(500).send("Internal server error");
  }
};
exports.payment = async (req, res) => {
  try {
    const {
      addressId,
      Price,
      discount,
      deliveryCharges,
      packagingFee,
      totalSavings,
      totalAmount,
    } = req.body;
    const fetchUserId = await userModel.findOne({
      email: req.session.useremail,
    });
    const userId = fetchUserId._id; // Replace with your method to get the logged-in user's ID

    const cart = await Cart.findOne({ user: userId, isActive: true }).populate(
      "products.product"
    );
    let cartId = cart._id;
    if (!cart) {
      res.redirect("/");
    }
    const address = await Address.findOne({ _id: addressId });

    itemCount = cart.products.length;
    // Extract cart items
    const cartItems = cart.products.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      cartId: item._id,
      price: item.price,
    }));
    res.render("user/payment", {
      orderDetails: {
        address,
        totalPrice: Price,
        discount,
        deliveryCharges,
        packagingFee,
        totalSavings: 0,
        totalAmount,
        cartItems,
        itemCount,
        userId,
        cartId,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const {
      addressId,
      userId,
      cartId,
      totalPrice,
      discount,
      deliveryCharges,
      packingCharge,
      totalSavings,
      totalAmount,
      productIds,
    } = req.body;

    //orderid unique value create
    const now = new Date();
    const datePart = now.toISOString().replace(/[-T:.Z]/g, "");
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    let orderId = `ORD${datePart}${randomPart}`;
    //end orderid creation
    const address = await Address.findOne({ _id: addressId }).select("-_id");
    // const productIdArray = productIds.split(',').map(id => id.trim());

    const cart = await Cart.findOne({ _id: cartId }).populate({
      path: "products.product", // Populate the product field in cart
      populate: [
        { path: "categoryId", model: "Category" }, // Populate category in product
        { path: "subCategoryId", model: "SubCategory" }, // Populate subcategory in product
      ],
    });
    const cartItemsWithDetails = cart.products.map((item) => ({
      productId: item.product._id,
      productName: item.product.productName,
      category: item.product.categoryId ? item.product.categoryId._id : null,
      subcategory: item.product.subCategoryId
        ? item.product.subCategoryId._id
        : null,
      quantity: item.quantity,
      image: item.product.thumbnailPaths[0],
      price: item.product.price,
      paymentStatus: "Pending",
    }));
    const newOrder = new Order({
      orderId,
      paymentMethod: "COD",
      orderStatus: "Order Placed",
      address: address,
      deliveryCharge: deliveryCharges,
      userId,
      packingCharge: packingCharge,
      totalAmount: totalAmount,

      orderedProducts: cartItemsWithDetails,
    });

    // Log the newOrder for debugging purposes

    // Save the new order to the database
    let result = await newOrder.save();
    if (result) {
      await Cart.findByIdAndUpdate(cartId, { isActive: false }, { new: true });
      for (const item of cartItemsWithDetails) {
        const product = await Product.findById(item.productId);

        if (!product) {
          console.error(`Product with ID ${item.productId} not found.`);
          continue;
        }

        // Check if there is enough stock in the product
        if (product.quantity < item.quantity) {
          console.error(`Not enough stock for product ID ${item.productId}.`);
          continue;
        }

        // Decrease the product quantity
        product.quantity -= item.quantity;

        // Save the updated product
        await product.save();
      }
      res.render("user/paymenySuccess", { orderId });
    }
    // Respond with success message and the saved order
  } catch (error) {
    // Respond with error message
    res.status(500).json({ message: "Error placing order", error });
  }
};
exports.myOrders = async (req, res) => {
  try {
    res.render("user/myOrders", { showSidebar: true });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
};

exports.fetchOrders = async (req, res) => {
  try {
    // Fetch user ID from session
    const fetchUserId = await userModel.findOne({
      email: req.session.useremail,
    });
    if (!fetchUserId) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = fetchUserId._id;

    // Fetch orders and populate necessary fields
    const orders = await Order.find({ userId: userId })
      .populate("userId", "_id")
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

        console.log(
          "Updated Product: ",
          JSON.stringify(updatedProduct, null, 2)
        );

        return updatedProduct;
      });

      // Attach the updated products to the order
      return {
        ...order.toObject(),
        orderedProducts: updatedProducts,
      };
    });

    // Log updated orders for debugging
    // console.log("Updated Orders: ", JSON.stringify(updatedOrders, null, 2));

    res.json(updatedOrders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;
    console.log(productId + " " + reason);
    if (!orderId || !productId || !reason) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Order ID, Product ID, and reason are required.",
        });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const product = order.orderedProducts.find(
      (p) => p.productId.toString() === productId
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in the order." });
    }
  
    product.orderStatus = "Pending Cancellation";
    product.cancellation = { reason, cancelDate: new Date() };
    product.cancelledBy =  req.session.userType ;

    await order.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Product cancellation requested successfully.",
      });
  } catch (error) {
    console.error("Error cancelling product:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};
