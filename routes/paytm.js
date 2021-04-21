const orderSchema = require('../models/orders/orders');
const userSchema = require('../models/customers/users');
require('dotenv').config()

const formidable=require('formidable')
const express=require('express')
const router=express.Router()
const {v4:uuidv4}=require('uuid')
const https=require('https')

const PaytmChecksum=require('../paytm/checksum')
const { authorize } = require('../middleware/auth');




router.post('/callback',(req,res)=>
{

const form=new formidable.IncomingForm();

form.parse(req,(err,fields,file)=>
{
    

paytmChecksum = fields.CHECKSUMHASH;
delete fields.CHECKSUMHASH;

var isVerifySignature = PaytmChecksum.verifySignature(fields, 'wW8vbm%whiJDn4p@', paytmChecksum);
if (isVerifySignature) {



    var paytmParams = {};
    paytmParams["MID"]     = fields.MID;
    paytmParams["ORDERID"] = fields.ORDERID;
    
    /*
    * Generate checksum by parameters we have
    * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
    */
    PaytmChecksum.generateSignature(paytmParams, 'wW8vbm%whiJDn4p@').then(function(checksum){
    
        paytmParams["CHECKSUMHASH"] = checksum;
    
        var post_data = JSON.stringify(paytmParams);
    
        var options = {
    
            /* for Staging */
            hostname: 'securegw-stage.paytm.in',
    
            /* for Production */
            // hostname: 'securegw.paytm.in',
    
            port: 443,
            path: '/order/status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            }
        };
    
        var response = "";
        var post_req = https.request(options, function(post_res) {
            post_res.on('data', function (chunk) {
                response += chunk;
            });
    
            post_res.on('end',  async function(){
                  //store in db
                try{
                    let result=JSON.parse(response)
                    if(result.STATUS==='TXN_SUCCESS')
                    {

                        let userId = req.decoded._id;
                        let orders = await orderSchema.findByIdAndUpdate(userId, {orderStatus : result}, {new: true})
                        orders.save()

                        res.json({
                            code: 200,
                            data: orders,
                            message: "Orders status",
                            error: null
                        })



                        res.redirect(`http://localhost:3000/status/${result.ORDERID}`)
                       
                       
                         console.log(result)
                       
                    }


                }catch (err) {
                    console.log(err);
                }
                       

            });
        });
    
        post_req.write(post_data);
        post_req.end();
    });        
        

} else {
	console.log("Checksum Mismatched");
}
})

})

router.post('/payment' , (req,res)=>{

/* const costuomerId = req.decoded._id.toString(); */
const{amount,email,phone}=req.body;

/* import checksum generation utility */
const totalAmount=JSON.stringify(amount);
var params = {};

/* initialize an array */
params['MID'] = 'SMnxGN10988548912165',
params['WEBSITE'] = 'WEBSTAGING',
params['CHANNEL_ID'] = 'WEB',
params['INDUSTRY_TYPE_ID'] = 'Retail',
params['ORDER_ID'] = uuidv4(),
params['CUST_ID'] = 'CUST_001',
params['TXN_AMOUNT'] = amount,
params['CALLBACK_URL'] = 'http://localhost:3002/api/callback',
params['EMAIL'] =email,
params['MOBILE_NO'] = phone

/**
* Generate checksum by parameters we have
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/
var paytmChecksum = PaytmChecksum.generateSignature(params,'wW8vbm%whiJDn4p@');
paytmChecksum.then(function(checksum){
    let paytmParams={
        ...params,
        "CHECKSUMHASH":checksum
    }
    res.json(paytmParams)
}).catch(function(error){
	console.log(error);
});

})

module.exports=router