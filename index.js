// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var plaid = require('plaid');
var bodyParser = require('body-parser');
// var stripe = require('stripe');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
require('dotenv').config();

var databaseUri = process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY, //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL,  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },
  publicServerURL: process.env.PUBLIC_SERVER_URL
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();


// plaid.environments.sandbox
var plaidClient = new plaid.Client(process.env.PLAID_CLIENT_ID , process.env.PLAID_SECRET, process.env.PLAID_PUBLIC_KEY ,plaid.environments.sandbox);

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

app.use(bodyParser.urlencoded({ extended: true }));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/home', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get('/authenticate', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/authenticate.html'));
});


var port = process.env.PORT;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});


// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
