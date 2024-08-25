const User = require("../models/userModel"); // Make sure to require the correct User model
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

exports.index = async (req, res) => {
  //   const salt = bcrypt.genSaltSync(10);
  //  let password = bcrypt.hashSync("admin", salt);
  try {
    if (!req.session.adusername) {
      res.render("admin/adminLogin", { layout: false });
    } else {
      if (req.session.passwordWrong) {
        res.render("admin/adminLogin", { msg: "Invalid Login" });
      } else {
        res.redirect("/admin/adminHome"); // Redirects to home if login is successful
      }
    }
  } catch (error) {
    console.error("Error in index route:", error);
    res.status(500).send("Internal server error");
  }
};

exports.adminlogin = async (req, res) => {
  try {
    if (!req.session.adusername) {
      const user = await User.findOne({
        username: req.body.username,

        userType: 1,
      });
      if (user && bcrypt.compareSync(req.body.password, user.password)) {
        // Store user details in session
        req.session.aduserType = user.userType;
        req.session.adusername = user.username;
        req.session.aduseremail = user.email;
        req.session.adpasswordWrong = false;
        console.log("User logged in:", user.username);

        res.redirect("/admin/adminHome");
      } else {
        req.session.adpasswordWrong = true;
        res.render("admin/adminLogin", {
          // Corrected the path to render adminLogin
          pwIncorrect: "User not found or invalid credentials",
        });
        console.log("User not found or invalid credentials");
      }
    } else {
      res.redirect("/admin/adminHome");
    }
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).send("Internal server error");
  }
};

exports.adminHome = async (req, res) => {
  try {
    if (req.session.adusername) {
      var pageTitle = "Dashboard";
      const message = req.flash("success");
      const update = req.flash("update");
      const deleted = req.flash("deleted");
      var data = await User.find({ userType: 2 }).lean();
      res.render("admin/dashboard", {
        data,
        userName: req.session.adusername,
        message,
        update,
        deleted,
        layout: "adminLayout",
        pageTitle,
      });
    } else {
      console.log("admin else case");

      if (req.session.adpasswordWrong) {
        console.log(req.session.adpasswordWrong);
        res.redirect("/admin/adminlogin", {
          msg: "Incorrect username or password ",
        });
      } else {
        res.redirect("/admin");
      }
    }
  } catch (error) {
    console.error("Error in dashboard route:", error);
    res.status(500).send("Internal server error");
  }
};

// user parts
exports.blockUser = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.body.id);
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("error occured");
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID" });
    }
    if (!userId) {
      console.log("Not received userId:", req.body.userId);
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }
    let noval = "";
    let pass = "";
    if (req.body.task === "block") {
      pass = "unblock";

      noval = false;
    } else {
      pass = "block";
      noval = true;
    }
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { isActive: noval } },
      { new: true } // To return the updated document
    );

    if (!updatedUser) {
      console.log("User not found or already inactive");
      return res.status(404).json({
        success: false,
        message: "User not found or already inactive",
      });
    }

    console.log("User updated successfully:", updatedUser);
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      block: pass,
    });
  } catch (error) {
    console.error("Error in blockUser route:", error);
    res.status(500).send("Internal server error");
  }
};

exports.adminLogout = (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
};

exports.sendmail = async (req, res) => {
  console.log("ethunnund");
  await sendOTPEmail("sanamol87@gmail.com", "1234");
};
