# INTERACTING WITH THE DIME SERVER READ ME

### USER FUNCTIONS
Function: Sign Up New User <br>
Type: POST <br>
Path: "parse/user" <br>
headers: ["X-Parse-Application-Id": APP_ID] <br>
body: ["username": String, "password": String] <br>

Function: Log In User <br>
Type: GET <br>
Path: "parse/login" <br>
headers: ["X-Parse-Application-Id" : APP_ID] <br>
params: ["username": String, "password": String] <br>


### BANKING FUNCTIONS
Function: Store User Access Token <br>
Type: POST <br>
Path: "parse/functions/userAccessToken" <br>
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token] <br>
body: ["username": String, "password:" String] <br>

Function: View User Transaction History <br>
Type: POST <br>
Path: "parse/functions/getTransactions" <br>
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token] <br>


### CHARITY FUNCTIONS
Function: Add New Charity for User <br>
Type: POST <br>
Path: "parse/functions/addCharity" <br>
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token] <br>
body: ["charityId": String] <br>

Function: Delete Charity for User <br>
Type: POST <br>
Path: "parse/functions/removeCharity" <br>
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token] <br>
body: ["charityId": String] <br>

Function: Get Charities for User <br>
Type: POST <br>
Path: "parse/functions/getUserCharityList" <br>
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token] <br>

Function: Get all Charities <br>
Type: POST <br>
Path: "parse/classes/Charity" <br>
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token] <br>


### BALANCE FUNCTIONS
Function: Get User Balance <br>
Type: POST <br>
Path: "parse/functions/getUserBalance" <br>
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token] <br>
