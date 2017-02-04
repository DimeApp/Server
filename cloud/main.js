// var plaid = require('plaid');
require('isomorphic-fetch')
//
// var PLAID_CLIENT_ID = process.env.client_id;
// var PLAID_SECRET = process.env.secret;
//
// var plaidClient =
//     new plaid.Client(PLAID_CLIENT_ID, PLAID_SECRET, plaid.environments.tartan);
//
// Parse.Cloud.define('getTransactions', function(request,response){
//       const user = request.user;
//
//     });

Parse.serverURL = process.env.SERVER_URL

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
    relation.remoove(charity);
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
    var relation = user.relation('user');
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
  const balance = request.balance;
  const User = Parse.Object.extend('User');
  const userQuery = new Parse.Query(User);
  userQuery.get(user.id).then(function(user){
    var updatedBalance = parseFloat(user.get('balance')) + parseFloat(balance);
    user.set('balance', updatedBalance);
    return user.save(null, {sessionToken: user.getSessionToken()}).then(function(user){
      return user.get('balance');
    });
  }).then(function(balance){
    response.success({error: false, balance: balance});
  }, function(error){
    console.error(error);
    response.success({error: true, message: error});
  });

});

var plaid = require('plaid');

// Initialize a client
var plaidClient = new plaid.Client('test_id', 'test_secret', plaid.environments.tartan);


//  url/parse/functions/userAccessToken

// Add a BofA auth user going through question-based MFA

Parse.Cloud.define('userAccessToken', function(request, response){
  var user = request.user;

plaidClient.addAuthUser('ins_100046', {
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

//    parse/login
//    parse/functions/getTransactions

Parse.Cloud.define('getTransactions', function(request, response){
  var user = request.user;
  var access_token = user.get('backAccessToken');
  plaidClient.getConnectUser(access_token, function(err,resp) {
    response.success(resp);
  });
});







//Plaid API Calls
//
// Parse.Cloud.define('getTransactions', function(request,response){
//   const user = request.user;
//
//   if(user == null){
//     response.error('Either no session token or session token has expired');
//   }
//   const bankUserName = request.params.username;
//   const password = request.params.password;
//   const bank = request.params.bank;
  // const pin = request.parans.pin;

  // const client_id = process.env.client_id;
  // const secret = process.env.secret;
  // process.env.
//   fetch("https://tartan.plaid.com/connect", {
//     method: 'POST',
//     body: JSON.stringify({
//       "client_id":client_id,
//       "secret":secret,
//       "username":bankUserName,
//       "password":password,
//       "type":bank
//     })
//   }).then(function(resp){
//     response.success(resp);
//   }, function(error){
//     console.error(error);
//     response.error(error);
//   })
// });
