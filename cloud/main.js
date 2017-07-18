
require('isomorphic-fetch')
var plaid = require('plaid');
var envvar = require('envvar');

var PLAID_CLIENT_ID  = process.env.PLAID_CLIENT_ID
var PLAID_SECRET     = process.env.PLAID_SECRET
var PLAID_PUBLIC_KEY = process.env.PLAID_PUBLIC_KEY
var PLAID_ENV        = envvar.string('PLAID_ENV', 'tartan');


// We store the access_token in memory - in production, store it in a secure
// persistent data store
//var ACCESS_TOKEN = null;
//var PUBLIC_TOKEN = null;

var plaidClient = new plaid.Client(
  PLAID_CLIENT_ID,
  PLAID_SECRET,
  //PLAID_PUBLIC_KEY,
  plaid.environments.tartan
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

//// Not sure if Works
Parse.Cloud.define('getPlaidToken', function(request, response) {
    var user = request.user;
    var username = request.params.bankUser;
    var password = request.params.bankPassword;
    
    plaidClient.addAuthUser('wells', {
        username: username,
        password: password,
    }, function(err, mfaResponse, resp) {
    if (err != null) {
        console.error(err);
        response.error(error)
    } 
    else if (mfaResponse != null) {
        plaidClient.stepAuthUser(mfaResponse.access_token, 'tomato', {},
        function(err, mfaRes, resp) {
            console.log("hello");
//            console.log(mfaRes);
//            console.log(resp.access_token);
//            user.set('backAccessToken', resp.access_token);
//           user.save(null, {sessionToken: user.getSessionToken()}).then(function(user){
//            response.success();
//        })
    });
    }
    else {
        console.log(resp);
        response.success(resp);
    }
    });
});

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


//real user auth for plaid
// Plaid function to store public_token to User upon successful bank authentication
// via Plaid Link. Sets bank_auth to true.
Parse.Cloud.define('storePlaidPublicToken', function(request, response){
  const public_token = request.params.public_token;
  const user = request.user;
  if(user == null){
    response.error('Either no session token or session token has expired');
  }
  user.set('public_token', public_token)
  user.set('hasBankAuthenticated', true)
  return user.save(null, {sessionToken: user.getSessionToken()}).then(function(user){
    response.success("Success");
  });
  response.console.error(error);
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
  const user = request.user;
  const User = Parse.Object.extend('User');
  const query = new Parse.Query(User);
  query.get(user.id).then(function(user){
    var public_token = user.get('public_token');
    if (public_token != null) {
    plaidClient.exchangeToken(public_token, function(err,res){
      var access_token = res.access_token;
      return plaidClient.getConnectUser(access_token, function(err, res) {
        response.success(res);
      });
    });
    } else {
      return response.error("Oh heck nah! Get outta here boyo!");
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
// Parse.Cloud.define('roundLastTransaction'){
//   // run getTransactions.... get last transaction set transaction value.. and use this to get charge
//   const transactionValue = request.transactionValue;
//   const charge = Math.ceil(transactionValue) - transactionValue
// }

// function to check rounded balance is at 10 needed

// function to round up the money

// function to get justin 10pc chicken mcnugget

/*-----------------------------------------------*/
/*-----------------------------------------------*/
/*-----------------HELPER-METHODS----------------*/
/*-----------------------------------------------*/
