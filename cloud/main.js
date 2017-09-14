
require('isomorphic-fetch');
var Plaid = require('plaid');
var envvar = require('envvar');
require('dotenv').config();


var PLAID_CLIENT_ID  = process.env.PLAID_CLIENT_ID
var PLAID_SECRET     = process.env.PLAID_SECRET
var PLAID_PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY
var PLAID_ENV        = envvar.string('PLAID_ENV', 'sandbox');
var ACCESS_TOKEN     = null;

// We store the access_token in memory - in production, store it in a secure
// persistent data store
// var ACCESS_TOKEN = null;
// var PUBLIC_TOKEN = null;

var plaidClient = new Plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  PLAID_PUBLIC_KEY,
  Plaid.environments.sandbox
);

var stripe = require('stripe');
// ("sk_test_BQokikJOvBiI2HlWgH4olfQ2");

Parse.serverURL = process.env.SERVER_URL

// CHARITY FUNCTIONS
Parse.Cloud.define('addCharity', function(request, response){
  const charityId = request.params.charityId;
  const user = request.user;

  if(charityId == null){
    response.error('No charityId');
  }
  if(user == null){
    response.error('Either no session token or session token has expired');
  }
  const Charity = Parse.Object.extend('Charity');
  const charityQuery = new Parse.Query(Charity);
  charityQuery.get(charityId).then(function(charity){
    const relation = user.relation('charities');
    relation.add(charity);
    return user.save(null, {sessionToken: user.getSessionToken()});
  }).then(function(user){
    response.success('Save successful');
  }, function(error){
    console.error(error);
    response.error(error);
  })
});


Parse.Cloud.define('removeCharity', function(request, response){
  const charityId = request.params.charityId;
  const user = request.user;

  if(charityId == null){
    response.error('No charityId');
  }
  if(user == null){
    response.error('Either no session token or session token has expired');
  }

  const Charity = Parse.Object.extend('Charity');
  const charityQuery = new Parse.Query(Charity);
  charityQuery.get(charityId).then(function(charity){
    const relation = user.relation('charities');
    relation.remove(charity);

    return user.save(null, {sessionToken: user.getSessionToken()});
  }).then(function(user){
    response.success('Save successful');
  }, function(error){
    console.error(error);
    response.error(error);
  })
});


Parse.Cloud.define('getUserCharityList', function(request, response){

  const user = request.user;
  const User = Parse.Object.extend('User');
  const userQuery = new Parse.Query(User);
  userQuery.get(user.id, {sessionToken: user.getSessionToken()}).then(function(user){
    var relation = user.relation('charities');
    var query = relation.query();
    return query.find({sessionToken: user.getSessionToken()}).then(function (charities){
      return charities;
    });
  }).then(function(charities){
    response.success({error: false, charities: charities});
  }, function(error){
    console.error(error);
    response.success({error: true, message: error});
  });

});


Parse.Cloud.define('getUserBalance', function(request, response){
  const user = request.user;
  const User = Parse.Object.extend('User');
  const userQuery = new Parse.Query(User);
  userQuery.get(user.id).then(function(user){
    return user.get('balance');
  }).then(function(balance){
    response.success({error: false, balance: balance});
  }, function(error){
    console.error(error);
    response.success({error: true, message: error});
  });

});

Parse.Cloud.define('updateUserBalance', function(request, response){
  const user = request.user;
  const balance = request.params.balance;
  const User = Parse.Object.extend('User');
  const userQuery = new Parse.Query(User);
  userQuery.get(user.id, {useMasterKey: true}).then(function(user){
    var currentBalance = user.has('balance') ? user.get('balance') : 0;
    var updatedBalance = parseFloat(currentBalance) + parseFloat(balance);
    user.set('balance', updatedBalance);
    return user.save(null, {useMasterKey: true}).then(function(user){
      return user.get('balance');
    });
  }).then(function(balance){
    response.success({error: false, balance: balance});
  }, function(error){
    console.error(error);
    response.success({error: true, message: error});
  });
});

//  url/parse/functions/userAccessToken

// Add a BofA auth user going through question-based MFA

Parse.Cloud.define('userAccessToken', function(request, response){
  var user = request.user;

    plaidClient.addAuthUser('wells', {
        username: 'plaid_test',
        password: 'plaid_good',
    }, function(err, mfaResponse, resp) {
    if (err != null) {
        // Bad request - invalid credentials, account locked, etc.
        console.error(err);
        response.error(error)
    } else if (mfaResponse != null) {
        plaidClient.stepAuthUser(mfaResponse.access_token, 'tomato', {},
        function(err, mfaRes, resp) {
            console.log(mfaRes);
            console.log(resp);
            user.set('backAccessToken', resp.access_token);
            user.save(null, {sessionToken: user.getSessionToken()}).then(function(user){
            response.success();
        })
    });
    } else {
        // No MFA required - response body has accounts
        console.log(resp);
        response.success(resp);
    }
    });
});

//// Takes in user login info for their bank, generates and saves access_token to db
Parse.Cloud.define('getPlaidToken', function(request, response) {
    var user = request.user;
    var institution = request.params.bankId
    var username = request.params.bankUser;
    var password = request.params.bankPassword;

    plaidClient.addAuthUser(institution, {
        username: username,
        password: password,
    }, function(err, mfaResponse, resp) {
    if (err != null) {
        console.error(err);
        response.error(error)
    }
    else if (mfaResponse != null) {
        plaidClient.stepAuthUser(mfaResponse.access_token, 'tomato', {},
        function(err, mfaRes, respo) {
           console.log(respo.access_token);
           user.set('backAccessToken', respo.access_token);
           user.save(null, {sessionToken: user.getSessionToken()}).then(function(user){
        })
        response.success(respo);
        response.success('mfa success');
    });
    }
    else {
        console.log(resp.access_token);
        user.set('backAccessToken', resp.access_token);
        user.save(null, {sessionToken: user.getSessionToken()}).then(function(user){
        })
        response.success('no mfa success');
    }
    });
});




// gets user access_token
Parse.Cloud.define('returnAccessToken', function(request, response) {
    var user = request.user;
    var access_token = user.get('backAccessToken');
    response.success(access_token);
});

Parse.Cloud.define('getAccounts', function(request, response) {
    var user = request.user;
    var access_token = user.get('backAccessToken');
    plaidClient.getAuthUser(access_token, function(err, res) {
        console.log(res.accounts);
        response.success(res.accounts);
    });
});


//Parse.Cloud.define('getPublicToken', function(request, response) {
//    plaidClient.exchangeToken(public_token, function(err, res) {
//        var access_token = res.access_token;
//
//    plaidClient.getAuthUser(access_token, function(err, res) {
//        console.log(res.accounts);
//        });
//    });
//});


Parse.Cloud.define('addUserInfo', function(request, response) {
    const user = request.user;
    const email = request.params.email;

    if (email == null) {
        response.error('Enter an e-mail');
    }
    user.set('email', email)

    return user.save(null, {sessionToken: user.getSessionToken()}).then(function(user){
        response.success("Success");
    });
    response.console.error(error);
});

// recieves plaid public_token from clientside, exchanges public_token for access_token
// which is stored in the database for future plaid api calls
Parse.Cloud.define('storePlaidAccessToken', function(request, response){
  if (!request.params.public_token){
    response.error('no public_token supplied')
  }
  const { public_token } = request.params;
  const user = request.user;
  if(user == null){
    response.error('Either no session token or session token has expired');
  }
  plaidClient.exchangePublicToken(public_token,
  function(err, exchangeTokenRes) {
    if (err != null) {
      response.error(err)
    } else {
      var access_token = exchangeTokenRes.access_token;
      var item_id = exchangeTokenRes.item_id;
      user.set('bankAccessToken', access_token)
      user.set('plaid_item_id', item_id)
      return user.save(null, {sessionToken: user.getSessionToken()}).then(function(user){
          response.success("Success");
      });
    }
  });
});


//
//
//Parse.Cloud.define('stripeToken', function(request,response){
//
//  const user = request.user;
//  const User = Parse.Object.extend('User');
//  const query = new Parse.Query(User);
//  query.get(user.id).then(function(user){
//    var public_token = user.get('public_token');
//    // if (public_token != null) {
//    plaidClient.exchangeToken(public_token, function(err,resp){
//      var access_token = resp.access_token;
//      // response.success(access_token);
//      return plaidClient.getConnectUser(access_token, function(err, res) {
//        // response.success(res);
//        var accountDictionary = res;
//        // return accountDictionary;
//
//        // response.success(accountDictionary);
//        return accountDictionary;
//
//      });
//
//      response.success(accountDictionary);
//
//    });
//});



      //  query.get(user.id).then(function(user){
      //    var public_token = user.get('public_token');
      //   //  response.success(public_token);
      //    if (public_token != null) {

          //     plaidClient.exchangePublicToken({public_token}, function(err, resu) {
          //       var accessToken = resu.access_token;
          //       // response.success(accessToken);
          //       // Generate a bank account token
          //       return res;
          //   //     plaidClient.createStripeToken(accessToken, {accountDictionary.result}, function(err, res) {
          //   //   var bankAccountToken = res.stripe_bank_account_token;
          //   //   response.success(bankAccountToken);
          //   // });
          //
          // });
        //  }else {
        //    res.error("Error on stripe, Noah call plaidPublicToken before stripeToken");
        //  };
      //  });


//

//
// Parse.Cloud.define('chargeTheCard', function(request, response){
//
//   // stripe.charges.create({
//   //   amount: 10,
//   //   currency: "usd",
//   //   customer: customerId // Previously stored, then retrieved
//   // });
//
// });

//    parse/login
//    parse/functions/getTransactions

// Plaid function to exchange Users public_token for their access_token, and then
// generate transaction history.

Parse.Cloud.define('getTransactions', function(request, response){
  // prototype for formatting dates for plaid request
  Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [this.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
          ].join('-');
  };

  const user = request.user;
  const User = Parse.Object.extend('User');
  const query = new Parse.Query(User);
  query.get(user.id).then(function(user){
    var access_token = user.get('bankAccessToken');
    // start date is when user created account
    var startDate = user.get('createdAt')
        startDate = startDate.yyyymmdd()
    // end date is current date, formatted for PLaid request
    var endDate = new Date().toISOString().slice(0,10);
    console.log(endDate)
    if (access_token) {
      plaidClient.getTransactions(access_token, startDate, endDate, {
         count: 20,
         offset: 0,
        }, (err, result) => {
         // Handle err
         if(err){
          response.error(err)
           console.log('error')
         }
         const transactions = result.transactions;
         response.success({'transactions': transactions})
        });
    } else {
      return response.error("User has not authorized bank account");
    }
  });
});


// // Right now all this does is return a date
// Parse.Cloud.define('getLastTransaction', function(request, response) {
//   getTransactions(request , function(err,res){
//     var transactions = res.result.transactions;
//     return transactions;
//   });
//
// };


Parse.Cloud.define('checkBankAuth', function(request, response) {
  const user = request.user;
  const User = Parse.Object.extend('User');
  const query = new Parse.Query(User);

  query.get(user.id).then(function(user){
     var hasBankAuthenticated = user.get('hasBankAuthenticated');
     return response.success(hasBankAuthenticated);
   });
});

/*-----------------------------------------------*/
/*-----------------HELPER-METHODS----------------*/
/*-----------------------------------------------*/
/*-----------------------------------------------*/

// https://plaid.com/docs/api/#webhooks VERY HELPFUL
Parse.Cloud.define('roundLastTransaction', function(request, response) {
  // run getTransactions.... get last transaction set transaction value.. and use this to get charge
  const transactionValue = parseFloat(request.params.transaction);

  if(transactionValue==null){

    response.error("error, transaction value for round up is null");
  }
  const charge = Math.ceil(transactionValue) - transactionValue;
  response.success(charge);
});

// function to check rounded balance is at 10 needed

// function to round up the money

// function to get justin 10pc chicken mcnugget

/*-----------------------------------------------*/
/*-----------------------------------------------*/
/*-----------------HELPER-METHODS----------------*/
/*-----------------------------------------------*/
