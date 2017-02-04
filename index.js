// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var plaid = require('plaid');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || '',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:3000/parse' || "https://thawing-woodland-86198.herokuapp.com/parse",  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },
  publicServerURL: process.env.SERVER_URLs
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

var plaidClient = new plaid.Client(process.env.client_id, process.env.secret, plaid.environments.tartan);

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

app.get('/authenticate', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/authenticate.html'));
});

// app.post("/bank/authenticate", function(req, res) {
//
// var public_token = req.body.public_token;
//
// plaidClient.exchangeToken(public_token, function(err,
// exchangeTokenRes){
//   if (err != null) {
//
//   } else {
//     var access_token = exchangeTokenRes.access_token;
//
//     plaidClient.getAuthUser(access_token, function(err, authRes) {
//       if (err != null) {
//
//       } else {
//         var accounts = authRes.accounts;
//         res.json({accounts: accounts});
//       }
//     });
//   }
// });
// });




var port = process.env.PORT || 3000;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});





// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
