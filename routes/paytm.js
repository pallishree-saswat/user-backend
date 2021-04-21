const orderSchema = require("../models/orders/orders");
const userSchema = require("../models/customers/users");
const paymentSchema = require("../models/payment/payment");
require("dotenv").config();

const formidable = require("formidable");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const https = require("https");

const PaytmChecksum = require("../paytm/checksum");
const { authorize } = require("../middleware/auth");

router.get("/payment-details/:id", async (req, res) => {
  const paymentDetails = await paymentSchema.findById(req.params.id);

  if (paymentDetails) {
    res.json(paymentDetails);
  } else {
    res.status(404);
    console.log("Order not found");
  }
});

router.post("/callback", async (req, res) => {
  try {
    /*  console.log(req); */

    let result = req.body;

    console.log(result);
    let userId = result.ORDERID.substr(0, result.ORDERID.indexOf("_"));

    const payment = new paymentSchema({
      paymentResult: result,
      userId: userId,
    });
    const createdPayment = await payment.save();

    res.redirect(`http://localhost:4200/order-status/${createdPayment._id}`);

    return res.json({
      code: 201,
      data: createdPayment,
      message: "Payment history ",
      error: null,
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/payment", (req, res) => {
  /* const costuomerId = req.decoded._id.toString(); */
  const { amount, email, phone, userId } = req.body;

  /* import checksum generation utility */
  const totalAmount = JSON.stringify(amount);
  var params = {};

  /* initialize an array */
  (params["MID"] = "SMnxGN10988548912165"),
    (params["WEBSITE"] = "WEBSTAGING"),
    (params["CHANNEL_ID"] = "WEB"),
    (params["INDUSTRY_TYPE_ID"] = "Retail"),
    (params["ORDER_ID"] = userId + "_" + uuidv4()),
    (params["CUST_ID"] = "CUST_001"),
    (params["TXN_AMOUNT"] = amount),
    (params["CALLBACK_URL"] = "http://localhost:3001/paytm/callback"),
    (params["EMAIL"] = email),
    (params["MOBILE_NO"] = phone);

  /**
   * Generate checksum by parameters we have
   * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
   */
  var paytmChecksum = PaytmChecksum.generateSignature(
    params,
    "wW8vbm%whiJDn4p@"
  );
  paytmChecksum
    .then(function (checksum) {
      let paytmParams = {
        ...params,
        CHECKSUMHASH: checksum,
      };
      res.json(paytmParams);
    })
    .catch(function (error) {
      console.log(error);
    });
});

module.exports = router;
