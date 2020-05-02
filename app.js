var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require('body-parser');
var ejs = require('ejs');
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var stock = require("./models/stock.js");
var bill = require("./models/bill.js");

var vendordebit = require("./models/vendor_paying.js");
var customerCredit = require("./models/customer_paying.js");
var daily_paying = require("./models/daily_paying.js");
var vendorPayingHistory = require('./models/vendor_paying_history.js');
var customerPayingHistory = require('./models/customer_paying_history.js');
var dayBookHistory = require('./models/dayBookHistory.js');


global.myglobalBillno =1;
global.mycheck =1;
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));

app.set('view engin', 'ejs');

// Connecting to database
mongoose.connect("mongodb://localhost/tigerdb" ,{ useNewUrlParser: true, useUnifiedTopology: true });

// Body parser is used to get data from forms (sign up and login forms)
app.use(bodyParser.urlencoded({extended:true}));
app.use(require("express-session")({
    secret:"Rusty sucks",
    resave: false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

// passport.use(new LocalStrategy(User.authenticate()));
// // Reading the session/ Taking the data and encoding/decoding
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("login.ejs");

});
app.get("/home",function(req,res){
    res.render("index.ejs");
});

app.post("/login",function(req,res){
    password = req.body.password;
    if(password == "12345"){
        res.render("index.ejs");
    }

});
app.post("/login",passport.authenticate("local",{
    successRedirect:"/home",
    failureRedirect:"/"
}), function(req,res){

});
 
 
app.get("/stockPage", function(req, res){
    stock.find({} , function(err,stockData){
        if(!err){
            var showNothing = -1;
            res.render("stock.ejs",{stockANDbills : showNothing, fillCombo :stockData });
        }
    });
});

app.get("/vendorPage", function(req, res){
    vendordebit.find({} , function(err,vendornames){
        if(!err){
            var showNothing = -1;
            res.render("vendor.ejs",{stockANDbills : showNothing, fillCombo :vendornames });
        }
    });
});

app.get("/customerPage", function(req, res){
    customerCredit.find({} , function(err,customernames){
        if(!err){
            var showNothing = -1;
            res.render("customer.ejs",{stockANDbills : showNothing, fillCombo :customernames });
        }
    });
});

app.post("/storeDatainDbStock" ,function(req,res){
    var vendorDoesntExist = false;
    vendordebit.findOne().where({vendor_name:req.body.vendor_name}).exec(function(err, vendorNameinDoc){
        if(err){
            console.log(err);
        }else{
            
            if(vendorNameinDoc == [] || vendorNameinDoc == null || vendorNameinDoc == undefined || vendorNameinDoc == {} || vendorNameinDoc == '[]')
            {
                console.log("coming at first");
                vendorDoesntExist = true;
                new vendordebit({
        
                    date: new Date(),
                    vendor_name: req.body.vendor_name,
                    total_debit_amount : (req.body.quantity* req.body.price_per_item)
                }).save(function (err , doc){
                    if(err){
                        console.log("first time data insertion in vendors debit method error." + err);
                    }else{
                        console.log("Successfully stored first time in vendor data");
                    }
                });
            
                
            }
            else 
            {
                console.log("Vendor name already existed! ");
            }
        }
    });

    if(vendorDoesntExist === false){
        let debitvalueForVendor= 0;
        var flag= 0; let temp= -1;
        stock.findOne().where({vendor_name:req.body.vendor_name}).sort({$natural: -1}).limit(1).exec(function(err, stock){
            if(err){
                console.log(err);
            }else{
                if(stock == [] || stock == null || stock == undefined || stock == {} || stock == '[]')
                {
                    
                    debitvalueForVendor=0;
                    console.log("Old debit value =  0 ");                
                }
                else 
                {
                    console.log("Old debit value =  :"  +stock.incoming_total);
                    temp = stock.incoming_total;
                    debitvalueForVendor = (req.body.quantity* req.body.price_per_item);
                    console.log("new value : " + debitvalueForVendor);
                    vendordebit.findOneAndUpdate().where({vendor_name: req.body.vendor_name}).exec( function(err, vendorData){            
                        
                        vendorData.total_debit_amount = vendorData.total_debit_amount + debitvalueForVendor;
                        console.log("Value before update: (JB) "+ vendorData.total_debit_amount)
                        vendorData.save(function(err) {
                            if (err) {
                                console.log("vendor debit updating error")
                            }else{
                                console.log("done")
                            }
                        });
            
                    });
            

                }
        
            }
        });


        }


    new stock({
        
        date: new Date(),
        product_name: req.body.selectedValue,
        vendor_name: req.body.vendor_name,
        incoming_q: req.body.quantity,
        incoming_per_item: req.body.price_per_item,
        retail: req.body.retail,
        incoming_total : (req.body.quantity* req.body.price_per_item),
        remaining_quantity:req.body.quantity
    }).save(function (err , doc){
        if(err){
            console.log("Upload db(new stock from stock page) method error." + err);
        }else{
            console.log("Successfully stored");
            res.redirect("/stockPage");
        }
    });


});

app.post("/storeDatainDbStockVendor" ,function(req,res){
    var vendorDoesntExist = false;
    vendordebit.findOne().where({vendor_name:req.body.vendor_name}).exec(function(err, vendorNameinDoc){
        if(err){
            console.log(err);
        }else{
            
            if(vendorNameinDoc == [] || vendorNameinDoc == null || vendorNameinDoc == undefined || vendorNameinDoc == {} || vendorNameinDoc == '[]')
            {
                console.log("coming at first");
                vendorDoesntExist = true;
                new vendordebit({
        
                    date: new Date(),
                    vendor_name: req.body.vendor_name,
                    total_debit_amount : (req.body.quantity* req.body.price_per_item)
                }).save(function (err , doc){
                    if(err){
                        console.log("first time data insertion in vendors debit method error." + err);
                    }else{
                        console.log("Successfully stored first time in vendor data");
                    }
                });
            
                
            }
            else 
            {
                console.log("Vendor name already existed! ");
            }
        }
    });

    if(vendorDoesntExist === false){
        let debitvalueForVendor= 0;
        var flag= 0; let temp= -1;
        stock.findOne().where({vendor_name:req.body.vendor_name}).sort({$natural: -1}).limit(1).exec(function(err, stock){
            if(err){
                console.log(err);
            }else{
                if(stock == [] || stock == null || stock == undefined || stock == {} || stock == '[]')
                {
                    
                    debitvalueForVendor=0;
                    console.log("Old debit value =  0 ");                
                }
                else 
                {
                    console.log("Old debit value =  :"  +stock.incoming_total);
                    temp = stock.incoming_total;
                    debitvalueForVendor = (req.body.quantity* req.body.price_per_item);
                    console.log("new value : " + debitvalueForVendor);
                    vendordebit.findOneAndUpdate().where({vendor_name: req.body.vendor_name}).exec( function(err, vendorData){            
                        
                        vendorData.total_debit_amount = vendorData.total_debit_amount + debitvalueForVendor;
                        console.log("Value before update: (JB) "+ vendorData.total_debit_amount)
                        vendorData.save(function(err) {
                            if (err) {
                                console.log("vendor debit updating error")
                            }else{
                                console.log("done")
                            }
                        });
            
                    });
            

                }
        
            }
        });


        }


    new stock({
        
        date: new Date(),
        product_name: req.body.selectedValue,
        vendor_name: req.body.vendor_name,
        incoming_q: req.body.quantity,
        incoming_per_item: req.body.price_per_item,
        retail: req.body.retail,
        incoming_total : (req.body.quantity* req.body.price_per_item),
        remaining_quantity:req.body.quantity
    }).save(function (err , doc){
        if(err){
            console.log("Upload db(new stock from stock page) method error." + err);
        }else{
            console.log("Successfully stored");
            res.redirect("/vendorPage");
        }
    });


});

dataFromStockandPayments = {};
dataFromBill ={}; 
stockANDPayments = {};
global.p_name_g = "";
app.post("/sortVendorData" ,async function(req,res){    	                                                                                                                                                                                                                                         

    var p_name = req.body.vendorName;
    p_name_g = p_name;
    var indexForArray = 0;
    const stockData = await stock.find({}).where({vendor_name: p_name}); 
    stockData.forEach(function(stock){
        if(stock != null){
            dataFromStockandPayments[indexForArray] = {

                date: stock.date,
                product_name: stock.product_name,
                quantity: stock.incoming_q,
                rate: stock.incoming_per_item,
                total: stock.incoming_total         
            }
            indexForArray++;
        }
    });
     
    const vendorDatafromPayments = await vendorPayingHistory.find({}).where({vendor_name: p_name}); 
    
    vendorDatafromPayments.forEach(function(v_data_payments){
        if(v_data_payments != null){
            dataFromStockandPayments[indexForArray] = {

                date: v_data_payments.date,
                payment: v_data_payments.paying         
            }
            indexForArray++;
        }
    });


    for(var j=0;j< Object.keys(dataFromStockandPayments).length;j++)
    {
    
        stockANDPayments[j] = {
            date: dataFromStockandPayments[j].date,
            product_name : dataFromStockandPayments[j].product_name,
            i_quantity: dataFromStockandPayments[j].quantity,
            i_rate: dataFromStockandPayments[j].rate,
            i_total: (dataFromStockandPayments[j].quantity * dataFromStockandPayments[j].rate) , 
            payments :dataFromStockandPayments[j].payment
        }
    }
    const stockANDPaymentsArray = Object.values(stockANDPayments)

    stockANDPaymentsArray.sort(function(a,b){
        return new Date(a.date) - new Date(b.date);
    });
    stockANDPayments = stockANDPaymentsArray;

    vendordebit.find({} , function(err,vendorList){
        if(!err){
            var showNothing = -1;
            res.render("vendor.ejs",{stockANDPayments : stockANDPayments, fillCombo :vendorList });

        }
    });
    
});

dataFromStock = {};
dataFromBill ={}; 
global.p_name_g = "";
app.post("/sortStockData" ,async function(req,res){

    var p_name = req.body.productName;

    productName = p_name.split(' - ')[0];
    vendorName = p_name.split(' - ')[1]; 
    v_name = vendorName.replace(/\s+/g, '');
    p_name =productName;
    p_name_g = productName;

    var i = 0;

    const stockData = await stock.find({}).where({product_name: productName , vendor_name:vendorName});
    console.log("productName   :" + productName);
    console.log("vendorName    :" + vendorName);
    stockData.forEach(function(stock){
        console.log("hi jwaq")
        if(stock != null){

            dataFromStock[i] = {

                date: stock.date,
                vendor_name: stock.vendor_name,
                product_name: stock.product_name,
                quantity: stock.incoming_q,
                rate: stock.incoming_per_item,
                total: stock.incoming_total         
            }
            i++;
        }
    });

    const billData =await bill.find({}); 
    
    var i =0;var p_name_temp=0;var p_name_temp_s;
    billData.forEach(function(bill){
        var convertObjectTOString = [];
        convertObjectTOString= JSON.stringify(bill);
        var csu = JSON.parse(convertObjectTOString);
        
        var sizeofABill = Object.keys(csu).length - 1;

        
        for(var j=0;j < sizeofABill;j++)
        {
            var index =j.toString();
            dataFromBill[i] = {

                date: csu[index].date,
                vendor_name: csu[index].vendor_name,
                product_name : csu[index].details,
                quantity: csu[index].quantity,
                rate: csu[index].rate,
                total: csu[index].amount        
            }
            i++;
            p_name_temp++;
        
    }
    });

    stockANDbills = {};
    var lengthTotal = Object.keys(dataFromStock).length + Object.keys(dataFromBill).length;
    let myIndex = 0;
    for(var i=0;i< Object.keys(dataFromStock).length;i++)
    {
        stockANDbills[i] = {
            date: dataFromStock[i].date,
            vendor_name: dataFromStock[i].vendor_name,
            product_name : dataFromStock[i].details,
            i_quantity: dataFromStock[i].quantity,
            i_rate: dataFromStock[i].rate,
            i_total: dataFromStock[i].amount, 
            o_quantity: ' ',
            o_rate: ' ',
            o_total: ' '
        }
        myIndex++;
    }

    for(var i=0, temp=p_name_g;i< Object.keys(dataFromBill).length;i++)
    {

        selectedValue =  dataFromBill[i].product_name;
        productName = selectedValue.split('/')[0];
        vendorName = selectedValue.split('/')[1]; 
        productName = productName.replace(/\s+/g, '');
        vendorName = vendorName.replace(/\s+/g, '');
        temp =temp.replace(/\s+/g, '');

        if(productName == temp && vendorName == v_name){
            let dateObject =  new Date(dataFromBill[i].date);
            stockANDbills[myIndex] = {
                date: dateObject,
                vendor_name: dataFromBill[i].vendor_name,
                product_name : productName,
                i_quantity: ' ',
                i_rate: ' ',
                i_total: ' ',
                o_quantity: dataFromBill[i].quantity,
                o_rate: dataFromBill[i].rate,
                o_total: dataFromBill[i].amount    
            }
            myIndex++;
        }

    }

    const stockANDbillsArray = Object.values(stockANDbills)

    stockANDbillsArray.sort(function(a,b){
        return new Date(a.date) - new Date(b.date);
    });

    stock.find({} , function(err,stockData){
        if(!err){
            var showNothing = -1;
            res.render("stock.ejs",{stockANDbills : stockANDbillsArray, fillCombo :stockData });
        }
    });
    

    dataFromStock = {};
    dataFromBill ={}; 

    
});

app.get("/bill", function(req, res){

    var flag= 0;
    bill.findOne().sort({$natural: -1}).limit(1).exec(function(err, bill){
        if(err){
            console.log(err);
        }
        else{

            if(bill == [] || bill == null || bill == undefined || bill == {} || bill == '[]')
            {

                console.log("DB empty bill page billNo");
                var value = 0;  myglobalBillno=0;
                stock.find({} , function(err,stockData){
                    if(!err){
                        customerCredit.find({}, function(err, customerNamesList){

                            var showNothing = -1;
                            res.render("billing.ejs",{customerNamesList:customerNamesList , bill : value, stockData :stockData });
                            flag=1;
                            return;
    

                        });
                    
                    }
                });
                return;
            }
            if(flag==0)

                var convertObjectTOString = [];
                convertObjectTOString= JSON.stringify(bill);
                var csu = JSON.parse(convertObjectTOString);
                var index = '0';

                myglobalBillno = csu[index].billNo
                stock.find({} , function(err,stockData){
                    if(!err){
                        customerCredit.find({}, function(err, customerNamesList){
                            var showNothing = -1;
                            res.render("billing.ejs",{customerNamesList:customerNamesList,bill:csu[index].billNo, stockData :stockData });
                            flag=1;
                            return;
    
                        });
                    
                    }
                });
            }
    });

});

app.post("/storeBill", function(req,res){
    var billid = myglobalBillno;
    var customerName = req.body.customerNameForm;
    var todaysdate = new Date();
 
    var quantities = req.body.qty;
    var quantitiesArray = [];
    var i=0;
    quantities.forEach(function(quantity){
        quantitiesArray[i] = (quantity);
        i++;
    });
    var details = req.body.product;
    var vendorNames = req.body.vendor;
    var detailsArray = [];
    var productArray = [];
    var vendorsNameArray = [];
    i=0;
    details.forEach(function(detail){
        detailsArray[i] = (detail);
        productArray[i] = detail;
        productArray[i] = productArray[i].replace(/\s+/g, '');


        i++;
    });
    i=0;
    vendorNames.forEach(function(v_names){

        vendorsNameArray[i] = v_names;
        vendorsNameArray[i] = vendorsNameArray[i].replace(/\s+/g, '');

        i++;
    });
    var prices = req.body.price;
    var pricesArray = [];
    i=0;
    prices.forEach(function(price){
        pricesArray[i] = (price);
        i++;
    });
    var totals = req.body.total;
    var totalsArray = [];
    i=0;
    totals.forEach(function(total){
        totalsArray[i] = (total);
        i++;
    });

  
    var data={};
    for(var j=0;j  < totals.length;j++){
    
        data[j] = {
            billNo: myglobalBillno+1,
            date: new Date(),
            name: customerName,
    
            quantity: quantitiesArray[j],
            product: detailsArray[j],
            vendor:vendorsNameArray[j],
            rate: pricesArray[j],
            amount: totalsArray[j]
     
        };    
    }
    
    bill.collection.insert(data, function (err, docs) {
        if (err){ 
            console.log("Error at the time of saving documents in a multiple bill");
            
        } else {
            console.log("Multiple documents inserted to bill Collection");
            for(let k=0;k <  productArray.length;k++){
                console.log(" vendorsNameArray[k] :" +  vendorsNameArray[k]);
                console.log(" productArray[k] :" + productArray[k]);
                stock.findOneAndUpdate().where({vendor_name: vendorsNameArray[k] , product_name :productArray[k] }).exec( function(err, updateVendorRemainingQuantity)
                {            
                    console.log("updateVendorRemainingQuantity      " +updateVendorRemainingQuantity);
                    console.log(" remaining_quantity 1  :"+ (updateVendorRemainingQuantity.remaining_quantity));
                    console.log(" remaining_quantity 2  :"+ quantitiesArray[k]);

                    updateVendorRemainingQuantity.remaining_quantity = updateVendorRemainingQuantity.remaining_quantity -quantitiesArray[k] ;                                   
                    updateVendorRemainingQuantity.save(function(err) {
                        if (err) {
                            console.log("Subtracting stock of vendor ERROR")
                        }else{
                            console.log("Successfully stock subtracted")
                        }
                    });
                });


            }

        }

    });


    /////////////////////////////////////
    customerDoesntExist = false;
    customerCredit.findOne().where({vendor_name:req.body.customerNameForm}).exec(function(err, customerNameinDoc){
        if(err){
            console.log(err);
        }else
        {
            
            if(customerNameinDoc == [] || customerNameinDoc == null || customerNameinDoc == undefined || customerNameinDoc == {} || customerNameinDoc == '[]')
            {
                console.log("coming at first");
                customerDoesntExist = true;
                new customerCredit({
                    date: new Date(),
                    vendor_name: req.body.customerNameForm,
                    total_credit_amount : req.body.sub_total
                }).save(function (err , doc){
                    if(err){
                        console.log("first time data insertion in customer credit method error." + err);
                    }else{
                        console.log("Successfully stored first time in  customer credit data");
                    }
                });
            }
            else 
            {
                customerCredit.findOneAndUpdate().where({vendor_name: req.body.customerNameForm}).exec( function(err, creditData){            
                    var newBillValue=parseInt(req.body.sub_total);    
                    creditData.total_credit_amount = creditData.total_credit_amount + newBillValue;
                    creditData.save(function(err) {
                        if (err) {
                            console.log("credit debit updating error")
                        }else{
                            console.log("done credit data")
                        }
                    });
                });
            }
        }
        
    });




    res.render("billScript.ejs" , { billNo: myglobalBillno,customerName:customerName,todaysdate:todaysdate, data : data, length :totals.length });

});

app.get("/dayBook", async function(req ,res) { 
    var if_new_day = false;
//     // if ever data was inserted (Will run when no entry was ever made, so basically first time)
    const checkIfAnyDataExists = await daily_paying.findOne().sort({$natural: -1}).limit(1);
    const checkIfAnyDataVendorExists = await vendorPayingHistory.findOne().sort({$natural: -1}).limit(1);
    const checkIfAnyDataCustomerExists = await customerPayingHistory.findOne().sort({$natural: -1}).limit(1);
 
    if((checkIfAnyDataExists == [] || checkIfAnyDataExists == null || checkIfAnyDataExists == undefined || checkIfAnyDataExists == {} || checkIfAnyDataExists == '[]' ||  checkIfAnyDataExists == false || checkIfAnyDataExists == "") && 
    (checkIfAnyDataVendorExists == [] || checkIfAnyDataVendorExists == null || checkIfAnyDataVendorExists == undefined || checkIfAnyDataVendorExists == {} || checkIfAnyDataVendorExists == '[]' ||  checkIfAnyDataVendorExists == false || checkIfAnyDataVendorExists == "") &&
    (checkIfAnyDataCustomerExists == [] || checkIfAnyDataCustomerExists == null || checkIfAnyDataCustomerExists == undefined || checkIfAnyDataCustomerExists == {} || checkIfAnyDataCustomerExists == '[]' ||  checkIfAnyDataCustomerExists == false || checkIfAnyDataCustomerExists == ""))
    {
        console.log("No data to display (datbook empty -- No entry yet -- pretty virgin)");
        // true means never any data was inserted in daybook
        // ifEmpty =true; 
        vendordebit.find({} , function(err,vendorsList){
            if(!err){
                customerCredit.find({}, function(errs , customerList){
                    if(!errs){
                        console.log('empty box butt');
                        firstRow = [];
                        res.render("dayBook.ejs",{dataFordayBookArray:firstRow,fillCombo:vendorsList, fillComboCustomer:customerList});
                    }
                });
    
            }
        });
    }else {
 
        // there is data (NOT A VERY FIRST DAY FOR THE SOFTWARE)
        var todaysDate = new Date();
        todaysDateVariable = todaysDate.getDate()  ;
        todaysMonthVariable = todaysDate.getUTCMonth() +1;
        console.log("checkIfAnyDataExists.day :"+checkIfAnyDataExists.day + "\n");
        console.log("todaysDateVariable :" + todaysDateVariable + "\n");
        console.log("checkIfAnyDataExists.month :"+checkIfAnyDataExists.month +"\n" );
        console.log("todaysMonthVariable :" +todaysMonthVariable + "\n")
        // New day
        if((checkIfAnyDataExists.day != todaysDateVariable || checkIfAnyDataExists.month != todaysMonthVariable || checkIfAnyDataExists.year != todaysDate.getFullYear()) )
        {
            console.log('New day');
            const resultOfDailyPaying =await  daily_paying.aggregate([{
                $match: {$and  : [{ day : (todaysDateVariable -1 ) , 
                    month : (todaysMonthVariable) , 
                    year: (todaysDate.getFullYear()) } ]},},
                    {
                            $group:{
                                _id: null,
                                total :{
                                    $sum : "$paying"
                                } 
    
                            }
                    }
            ]);
            daily=[];
            if(resultOfDailyPaying == [] || resultOfDailyPaying == null || resultOfDailyPaying == undefined || resultOfDailyPaying == {} || resultOfDailyPaying == '[]' ||  resultOfDailyPaying == false || resultOfDailyPaying == ""){
                daily[0]=0;
                daily[1]=0;
            }
            else{
                daily =(Object.values(resultOfDailyPaying['0']));                            
            }

            const resultOfVendorPaying= await vendorPayingHistory.aggregate([{
                $match: {$and  : [{ day : (todaysDateVariable -1 ) , 
                    month : todaysMonthVariable, 
                    year: todaysDate.getFullYear() } ]},},
                    {
                            $group:{
                                _id: null,
                                total :{
                                    $sum : "$paying"
                                } 
    
                            }
                    }
                    
            ]);   
            vendor= [];
            if(resultOfVendorPaying == [] || resultOfVendorPaying == null || resultOfVendorPaying == undefined || resultOfVendorPaying == {} || resultOfVendorPaying == '[]' ||  resultOfVendorPaying == false || resultOfVendorPaying == ""){
                vendor[0]=0;
                vendor[1]=0;

            }
            else{

                vendor =(Object.values(resultOfVendorPaying['0']));
            }
            const resultOfCustomerPaying= await customerPayingHistory.aggregate([{
            $match: {$and  : [{ day : (todaysDateVariable -1)  , 
                month : (todaysMonthVariable), 
                year: (todaysDate.getFullYear())} ]},},
                {
                        $group:{
                            _id: null,
                            total :{
                                $sum : "$paying"
                            } 
    
                        }
                }
              ]);
            
                customer = [];
                if(resultOfCustomerPaying == [] || resultOfCustomerPaying == null || resultOfCustomerPaying == undefined || resultOfCustomerPaying == {} || resultOfCustomerPaying == '[]' ||  resultOfCustomerPaying == false || resultOfCustomerPaying == ""){
                    customer[0]=0;
                    customer[1]=0;
                }
                else{
                    customer =(Object.values(resultOfCustomerPaying['0']));
                }

                yesterdayData = customer[1]- (vendor[1] + daily[1]);
                console.log("yesterdayyyyyy  : "+ yesterdayData);
//                 // jamal check here
                console.log("vendor[1]  :" + vendor[1] + "\n");

                console.log("customer  :" +resultOfCustomerPaying  + "\n");
                console.log("customer[0]  :" + customer[0] + "\n");

                console.log("customer[1]  :" + customer[1] + "\n");
                console.log("daily[1]: " + daily[1] +"\n");
//                 console.log("previosu yesterday data :" +yesterdayData);
                // debOrCred= 0;
                // if(yesterdayData < 0){
                //     yesterdayData= yesterdayData* -1;
                // }
                new dayBookHistory({
                    date :  new Date(),
                    day : todaysDateVariable,
                    month: todaysMonthVariable,
                    year :  todaysDate.getFullYear(),
                    total : yesterdayData
                }).save(function( err , doc){
                    if(err){
                        console.log("here is dayBookHistory error ");
                    }else{
                        console.log("successful day book history saved")
                    }
                });
    
                // here insertion at daily_paying
                new daily_paying({
                    date :  new Date(),
                    day : todaysDateVariable,
                    month: todaysMonthVariable,
                    expenditure_name: "Yesterday",
                    year :  todaysDate.getFullYear(),
                    paying : yesterdayData
                }).save(function( err , doc){
                    if(err){
                        console.log("here is dailyPaying error ");
                    }else{
                        console.log("successful dailyPaying saved")
                    }
                });
        }
        // Not new day
        console.log('Just loading data for a daybook');
        var dataFordayBook = {};
        let index = 0;

        var dateObj = new Date();
        todaysDateVariable = dateObj.getDate()  ;
        todaysMonthVariable = dateObj.getUTCMonth() +1;

        const vendorPayingHistorySingle = await vendorPayingHistory.find({}).where({day: todaysDateVariable , month:todaysMonthVariable  , year: dateObj.getUTCFullYear()}); 
    
        vendorPayingHistorySingle.forEach(function(vphs){
    
            dataFordayBook[index] = {
                
                date: vphs.date,
                expenditure_name: vphs.vendor_name,
                o_paying: vphs.paying      
            }
            index++;
        }); 
    
        const dailyPayingSingle = await daily_paying.find({}).where({day: todaysDateVariable , month:todaysMonthVariable , year: dateObj.getUTCFullYear()}); 
        dailyPayingSingle.forEach(function(dps){ 


            dataFordayBook[index] = {
    
                date: dps.date,
                expenditure_name: dps.expenditure_name,
                o_paying: dps.paying      
            }
            index++;
        }); 
    
        const customerPayingHistorySingle = await customerPayingHistory.find({}).where({day: todaysDateVariable, month:todaysMonthVariable , year: dateObj.getUTCFullYear()}); 
        customerPayingHistorySingle.forEach(function(cphs){ 
     
            dataFordayBook[index] = {
    
                date: cphs.date,
                expenditure_name: cphs.customer_name,
                paying: cphs.paying      
            }
            index++;
        }); 
    
        
        const dataFordayBookArray = Object.values(dataFordayBook);
    
        dataFordayBookArray.sort(function(a,b){
            return new Date(a.date) - new Date(b.date);
        });
    
    
    
        vendordebit.find({} , function(err,vendorsList){
            if(!err){
                customerCredit.find({}, function(errs , customerList){
                    if(!errs){
                        res.render("dayBook.ejs",{fillCombo:vendorsList,dataFordayBookArray:dataFordayBookArray, fillComboCustomer:customerList});
                    }
                });
            }
        });




    }
});

app.post("/storeDayBookCustomerData" , function(req,res){
    var dateObj = new Date();
    new customerPayingHistory({
        date: new Date(),
        day: dateObj.getUTCDate(),
        month: dateObj.getUTCMonth() + 1,
        year: dateObj.getUTCFullYear(),
        customer_name : req.body.selectedCustomerName,
        paying : req.body.paying
    }).save(function (err , doc){
        if(err){
            console.log("Upload db(new everyday credit) method error." + err);
        }else{
            console.log("Successfully stored credit");
            customerCredit.findOneAndUpdate().where({vendor_name: req.body.selectedCustomerName}).exec( function(err, customerData){            
                if(req.body.paying >  customerData.total_credit_amount){
                    customerData.total_credit_amount = customerData.total_credit_amount - req.body.paying;
        
                }else if(req.body.paying <  customerData.total_credit_amount){
                    customerData.total_credit_amount = customerData.total_credit_amount - req.body.paying;
                }                        
        
                customerData.save(function(err) {
                    if (err) {
                        console.log("customer credit updating error")
                    }else{
                        console.log("customer credit done");
                        res.redirect("/dayBook");
                    }
                });
            });
        }
    });



});

app.post("/storeDayBookData" , function(req,res){
    var dateObj = new Date();
    new vendorPayingHistory({
        date: new Date(),
        day: dateObj.getUTCDate(),
        month: dateObj.getUTCMonth() + 1,
        year: dateObj.getUTCFullYear(),
        vendor_name : req.body.selectedVendorName,
        paying : req.body.paying
    }).save(function (err , doc){
        if(err){
            console.log("Upload db(new everyday expenditure) method error." + err);
        }else{
            console.log("Successfully stored expenditure");
            vendordebit.findOneAndUpdate().where({vendor_name: req.body.selectedVendorName}).exec( function(err, vendorData){            
                if(req.body.paying >  vendorData.total_debit_amount){
                    vendorData.total_debit_amount = vendorData.total_debit_amount - req.body.paying;
        
                }else if(req.body.paying <  vendorData.total_debit_amount){
                    vendorData.total_debit_amount = vendorData.total_debit_amount - req.body.paying;
                }                        
        
                vendorData.save(function(err) {
                    if (err) {
                        console.log("vendor debit updating error")
                    }else{
                        console.log("done");
                        res.redirect("/dayBook");
                    }
                });
            });
        }
    });



});

app.post("/addExpenditureDayBook" , function(req, res){
    var dateObj = new Date();
    new daily_paying({
        date: new Date(),
        expenditure_name : req.body.nameOfExpenditure,
        day: dateObj.getUTCDate(),
        month: dateObj.getUTCMonth() + 1,
        year: dateObj.getUTCFullYear(),
        paying : req.body.paying
    }).save(function (err , doc){
        if(err){
            console.log("Upload db(new everyday expenditure) method error." + err);
        }else{
            console.log("Successfully stored expenditure");
            res.redirect("/dayBook");
        }
    });

});


global.dataFromBillandPayments = {};
global.dataFromBill ={}; 
global.billANDPayments = {};
global.billANDPaymentsArray = [];
app.post("/sortCustomerData" ,async function(req,res){ 
    var myIndex=0; 
    p_name = req.body.customerName;
    myIndex =0; myBillsANDpayments = {}; indexSaved=  0; 
    billData = await bill.find({}); 
    billData.forEach(function(bill){
        var convertObjectTOString = [];
        convertObjectTOString= JSON.stringify(bill);
        var csu = JSON.parse(convertObjectTOString);
        
        var sizeofABill = Object.keys(csu).length - 1;


        for(var j=0;j < sizeofABill;j++)
        {
            var index =j.toString();
            customer_name_db =  csu[index].name;
            customer_name_db = customer_name_db.replace(/\s+/g, '');
            p_name =p_name.replace(/\s+/g, '');

            if(customer_name_db == p_name){
                console.log("hi")
                dataFromBill[myIndex] = {

                    date: csu[index].date,
                    billNo : csu[index].billNo,
                    customer_name: csu[index].name,
                    details : csu[index].details,
                    quantity: csu[index].quantity,
                    rate: csu[index].rate,
                    total: csu[index].amount        
                }
                myIndex++;
            }
        }    
        
    });
    for(i =0 ;i<myIndex;i++){
        console.log("before : "+dataFromBill[i].details)

    }
    console.log(Object.keys(dataFromBill).length);
    for(var i=0;i< Object.keys(dataFromBill).length;i++,indexSaved++)
    {
        selectedValue =  dataFromBill[i].details;
        productName = selectedValue.split('/')[0];
        customerName = selectedValue.split('/')[1]; 
        productName = productName.replace(/\s+/g, '');
        customerName = customerName.replace(/\s+/g, '');
        p_name_g =p_name_g.replace(/\s+/g, '');
        customer_name_db =  dataFromBill[i].customer_name;
        customer_name_db = customer_name_db.replace(/\s+/g, '');

        myBillsANDpayments[indexSaved] = {
            date: dataFromBill[i].date,
            billNo : dataFromBill[i].billNo,
            customer_name: dataFromBill[i].customer_name,
            product_name : productName,
            quantity: dataFromBill[i].quantity,
            rate: dataFromBill[i].rate,
            total: dataFromBill[i].total 
        }   

    }
    for(i =0 ;i<myIndex;i++){
        console.log("after : "+myBillsANDpayments[i].product_name)

    }
    const customerDatafromPayments = await customerPayingHistory.find({}).where({customer_name: p_name}); 
    
    customerDatafromPayments.forEach(function(c_data_payments){
        if(c_data_payments != null){
            myBillsANDpayments[indexSaved] = {

                date: c_data_payments.date,
                payment: c_data_payments.paying         
            }
            indexSaved++;
        }
    });
    for(i =0 ;i<myIndex;i++){
        console.log("after adding payments: "+myBillsANDpayments[i].product_name)

    }

    for(var j=0;j< Object.keys(myBillsANDpayments).length;j++)
    {
        billANDPayments[j] = {
            date: new Date(myBillsANDpayments[j].date),
            billNo: myBillsANDpayments[j].billNo,
            product_name : myBillsANDpayments[j].product_name,
            i_quantity: myBillsANDpayments[j].quantity,
            i_rate: myBillsANDpayments[j].rate,
            i_total: myBillsANDpayments[j].total , 
            payments :myBillsANDpayments[j].payment
        }
    }
    billANDPaymentsArray = Object.values(billANDPayments)

    billANDPaymentsArray.sort(function(a,b){
        return new Date(a.date) - new Date(b.date);
    });
    const customerList = await customerCredit.find({});    
    res.render("customer.ejs",{billANDPayments : billANDPaymentsArray, fillCombo :customerList });
            

});


function isLoggedIn(req,res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}
// Logout
app.get("/logout",function(req,res){
    req.logOut();
    res.redirect("/");
});

app.listen(3000 , function(){
    console.log("Server started");

});