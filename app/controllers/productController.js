
const Category = require('../models/categoryModel');
const SubCategory = require('../models/subCategoryModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const userModel = require('../models/userModel');

const path = require('path');

const multer = require('multer');

const sharp = require('sharp');


const mongoose = require('mongoose');

exports.products = async (req, res) => {   
  try {
    const pageTitle = "PRODUCTS";
    const products = await Product.find({})
      .populate({
        path: 'subCategoryId',
        populate: {
          path: 'categoryId',
          model: 'Category'
        }
      })
      .lean();

    console.log(products); // Logging products for debugging

    res.render('admin/products', {
      products,
      userName: req.session.adusername,
      layout: 'adminLayout',
      pageTitle,
      productSuccess:req.flash('productSuccess'),
      general:req.flash('general')
    });
  } catch (error) {
    console.error("Error in index route:", error);
    res.status(500).send("Internal server error");
  }
};

  exports.addProducts = async (req, res) => {
    try {
        let  pageTitle = "Add Product"
        var categories = await Category.find({  }).lean();
        var subcategories = await SubCategory.find({  }).lean();
        res.render("admin/addProducts",{categories,
          userName: req.session.adusername,
          subcategories,layout: 'adminLayout',pageTitle});
        // Renders the login page if no session email is found
    } catch (error) {
        console.error("Error in index route:", error);
        res.status(500).send("Internal server error");
    }
  };


  exports.saveProducts = async (req, res) => {
    try {
        const files = req.files; // Access the uploaded files
       console.log(files)
        const { productName, categoryId,subCategoryId, description, price, quantity } = req.body;

        // Validate required fields
        let errors = {};
        if (!productName) errors.productName = 'Product name is required.';
        if (!categoryId) errors.categoryId = 'Category is required.';
        if (!subCategoryId) errors.subCategoryId = 'Sub-category is required.';
        if (!price) errors.price = 'Price is required.';
        if (!quantity) errors.quantity = 'Quantity is required.';

        if (Object.keys(errors).length > 0) {
            req.flash('error', errors);
            console.log("error ocured in validation of controller")
            return res.redirect('/admin/addProducts');
        }

        // Convert price to Decimal128
        let formattedPrice;
        try {
            formattedPrice = mongoose.Types.Decimal128.fromString(price);
        } catch (e) {
            errors.price = 'Invalid price format.';
            req.flash('error', errors);
            return res.redirect('/admin/addProducts');
        }

        const specifications = {};
        for (let key in req.body) {
            if (key.startsWith('specification')) {
              console.log(`Specification key: ${key}, value: ${req.body[key]}`);

              specifications[key] = req.body[key];

            }
        }
        console.log('Specifications Map:', specifications);
        // Prepare an array to store image paths
        const imagePaths = [];
      const thumbnailPaths = [];

      if (files && files.length > 0) {
        for (const file of files) {
          const originalPath = file.path;
          const resizedImagePath = path.join('uploads', `resized_${file.filename}`);
          const thumbnailImagePath = path.join('uploads/thumb', `thumb_${file.filename}`);

          // Resize image
          await sharp(originalPath)
            .resize(800) // Adjust the width as needed
            .toFile(resizedImagePath);

          // Create thumbnail
          await sharp(originalPath)
            .resize(200) // Adjust the thumbnail width as needed
            .toFile(thumbnailImagePath);

          // Normalize paths to use forward slashes
          const normalizedResizedImagePath = resizedImagePath.replace(/\\/g, '/');
          const normalizedThumbnailImagePath = thumbnailImagePath.replace(/\\/g, '/');

          imagePaths.push(normalizedResizedImagePath);
          thumbnailPaths.push(normalizedThumbnailImagePath);
        }
      }

        // Create a new product with the provided data and image paths
        const newProduct = new Product({
            productName,
            categoryId,
            subCategoryId,
            specifications,
            description,
            price: formattedPrice,
            quantity,
            images: imagePaths,
            thumbnailPaths: thumbnailPaths
        });

        await newProduct.save();

        req.flash('productSuccess', 'Product added successfully');
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("Internal server error");
    }
};



exports.selectSubcategories = async (req, res) => {
  try {
    const categoryId = new mongoose.Types.ObjectId(req.query.categoryId);
    
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
       console.log("error occured")
        return res.status(400).json({ success: false, message: 'Invalid User ID' });
      }  
    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }
    
    // Find subcategories by category ID
    const subcategories = await SubCategory.find({ categoryId: categoryId });
    console.log(subcategories)
    res.json({ subcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).send('Server error');
  }
};

exports.editProduct = async (req, res) => {
  try {
    let pageTitle = "Edit Product";
    var categories = await Category.find({}).lean();
    var subcategories = await SubCategory.find({}).lean();
    var product = await Product.findById(req.params.id) .populate({
      path: 'subCategoryId',
      populate: {
        path: 'categoryId'
  }}).lean(); // Fetch the product by ID
    res.render("admin/editProducts", {
      userName: req.session.adusername,
      categories,
      subcategories,
      product,
      layout: 'adminLayout',
      pageTitle
    });
  } catch (error) {
    console.error("Error in index route:", error);
    res.status(500).send("Internal server error");
  }
};


exports.updateProduct = async (req, res) => {
  try {
      const { productName,categoryId, subCategoryId, description, price, quantity, _id } = req.body;
      const files = req.files; // Access the uploaded files

      // Validate required fields
      let errors = {};
      if (!productName) errors.productName = 'Product name is required.';
      if (!subCategoryId) errors.subCategoryId = 'Sub-category is required.';
      if (!categoryId) errors.categoryId = 'Category is required.';
      if (!price) errors.price = 'Price is required.';
      if (!quantity) errors.quantity = 'Quantity is required.';

      if (Object.keys(errors).length > 0) {
          req.flash('error', errors);
          console.log("error in validation")
          return res.redirect(`/admin/editProduct/${_id}`);
      }

      // Convert price to Decimal128
      let formattedPrice;
      try {
          formattedPrice = mongoose.Types.Decimal128.fromString(price);
      } catch (e) {
        console.log("error in decimal validation")
          errors.price = 'Invalid price format.';
          req.flash('error', errors);
          return res.redirect(`/admin/editProduct/${req.body._id}`);
      }

      // Find the existing product
      const product = await Product.findById(req.body._id);
      if (!product) {
        console.log("error in product exist")

          req.flash('error', { general: 'Product not found.' });
          return res.redirect('/admin/products');
          
      }
      // Update product details
      product.productName = productName;
      product.subCategoryId = subCategoryId;
      product.categoryId = categoryId;
      product.description = description;
      product.price = formattedPrice;
      product.quantity = quantity;

      // Process specifications
      const specifications = {};
      for (let key in req.body) {
          if (key.startsWith('specification')) {
              specifications[key] = req.body[key];
          }
      }
      product.specifications = specifications;

      // Handle image updates
      const imagePaths = [...product.images]; // Keep existing images
      const thumbnailPaths = [...product.thumbnailPaths]; // Keep existing thumbnails

      if (files && files.length > 0) {
          for (const file of files) {
              const originalPath = file.path;
              const resizedImagePath = path.join('uploads', `resized_${file.filename}`);
              const thumbnailImagePath = path.join('uploads/thumb', `thumb_${file.filename}`);

              // Resize image
              await sharp(originalPath)
                  .resize(800) // Adjust the width as needed
                  .toFile(resizedImagePath);

              // Create thumbnail
              await sharp(originalPath)
                  .resize(200) // Adjust the thumbnail width as needed
                  .toFile(thumbnailImagePath);

              // Normalize paths to use forward slashes
              const normalizedResizedImagePath = resizedImagePath.replace(/\\/g, '/');
              const normalizedThumbnailImagePath = thumbnailImagePath.replace(/\\/g, '/');

              imagePaths.push(normalizedResizedImagePath);
              thumbnailPaths.push(normalizedThumbnailImagePath);
          }
      }

      product.images = imagePaths;
      product.thumbnailPaths = thumbnailPaths;

      // Save the updated product
     try{
      var result = await product.save();
     }catch(error){
      console.error("error while saving", error);
      res.status(500).send("Internal server error");
     }
      console.log(result)

    //  req.flash('productSuccess', 'Product updated successfully');
      return res.status(200).json({ success: true, message: 'Sub Category updated successfully'});

  } catch (error) {
    console.log("is there error")
      console.error("Error updating product:", error);
      res.status(500).send("Internal server error");
  }
};



exports.toggleProductStatus = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid Product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();
    
    res.status(200).json({ success: true, isActive: product.isActive });
  } catch (error) {
    console.error("Error in toggleProductStatus route:", error);
    res.status(500).send("Internal server error");
  }
};


//user side
exports.shop = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    // Fetch products
    const products = await Product.find({ isActive: true })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalProducts = await Product.countDocuments({ isActive: true });

    // Fetch categories
    const categories = await Category.find({ isActive: true }).lean();
    
    // Fetch subcategories and map them by category
    const subCategories = await SubCategory.find({ isActive: true }).lean();
    const subCategoryMap = subCategories.reduce((acc, subCat) => {
      if (!acc[subCat.categoryId.toString()]) {
        acc[subCat.categoryId.toString()] = [];
      }
      acc[subCat.categoryId.toString()].push(subCat);
      return acc;
    }, {});

    // Map subcategories to their parent categories
    categories.forEach(category => {
      category.subcategories = subCategoryMap[category._id.toString()] || [];
    });

    const totalPages = Math.ceil(totalProducts / limit);

    products.forEach(product => {
      if (product.quantity <= 0) {
        product.status = 'Sold Out';
      } else if (product.quantity < 10) {
        product.status = 'Low Stock';
      } else {
        product.status = 'Available';
      }
    });

    res.render("user/shop", { 
      products, 
      categories, 
      currentPage: page, 
      totalPages, 
      limit 
    });
  } catch (error) {
    console.error("Error in shop controller:", error);
    res.status(500).send("Internal server error");
  }
};


exports.productDetails = async (req, res) => {
  try {
    const id = req.params;
    const prodId = new mongoose.Types.ObjectId(id);
    
    if (!mongoose.Types.ObjectId.isValid(prodId)) {
        console.log("error occured")
      return res.status(400).json({ success: false, message: 'Invalid Product ID' });
    }  

    const product = await Product.findOne({_id:prodId}).lean();
    if (!product) {
      return res.status(404).send("Product not found");
    }  
    const relatedProducts = await Product.find({
                                            subCategoryId: product.subCategoryId,
                                            _id: { $ne: prodId } // Exclude the current product
                                          }).limit(4).lean();
    const specificationsArray = Object.entries(product.specifications).map(([key, value]) => ({ key, value }));
 
    res.render("user/productDetails", { product,specificationsArray,relatedProducts });
  } catch (error) {
    console.error("Error in shop controller:", error);
    res.status(500).send("Internal server error");
  }
};

//search
exports.productsSearch = async (req, res) => {
  const { sortBy, minPrice, maxPrice, category, subCategory, newArrivals, featured ,page = 1, limit = 4} = req.query;
  let sortOption = {};

  switch (sortBy) {
    case 'price-low-high':
      sortOption = { price: 1 };
      break;
    case 'price-high-low':
      sortOption = { price: -1 };
      break;
    case 'featured':
      sortOption = { featured: -1 };
      break;
    case 'new-arrivals':
      sortOption = { createdAt: -1 };
      break;
    case 'a-to-z':
      sortOption = { productName: 1 };
      break;
    case 'z-to-a':
      sortOption = { productName: -1 };
      break;
    default:
      sortOption = {};
  }

  let filter = { isActive: true };

  if (minPrice) {
    filter.price = { $gte: parseFloat(minPrice) };
  }

  if (maxPrice) {
    filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
  }

  if (category) {
    filter.categoryId = { $in: category.split(',') };
  }

  if (subCategory) {
    filter.subCategoryId = { $in: subCategory.split(',') };
  }

  if (newArrivals) {
    filter.createdAt = { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) }; // Last 30 days
  }

  if (featured) {
    filter.featured = true;
  }

  try {
    const products = await Product.find(filter).sort(sortOption).lean();
    const totalProducts = products.length; // Adjust if using pagination
    const currentPage = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 4;
    const totalPages = Math.ceil(totalProducts / limit);

    const paginatedProducts = products.slice((currentPage - 1) * limit, currentPage * limit);

    const formattedProducts = paginatedProducts.map(product => ({
      ...product,
      price: product.price.toString(),
    }));

    formattedProducts.forEach(product => {
      if (product.quantity <= 0) {
        product.status = 'Sold Out';
      } else if (product.quantity < 10) {
        product.status = 'Low Stock';
      } else {
        product.status = 'Available';
      }
    });

    res.json({ products: formattedProducts, pagination: { currentPage, totalPages } });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};







