### USER FUNCTIONS
Function: Sign Up New User
Type: POST
Path: "parse/user"
headers: ["X-Parse-Application-Id": APP_ID]
body: ["username": String, "password": String]

Function: Log In User
Type: GET
Path: "parse/login"
headers: ["X-Parse-Application-Id" : APP_ID]
params: ["username": String, "password": String]


### BANKING FUNCTIONS
Function: Store User Access Token
Type: POST
Path: "parse/functions/userAccessToken"
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token]
body: ["username": String, "password:" String]

Function: View User Transaction History
Type: POST
Path: "parse/functions/getTransactions"
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token]


### CHARITY FUNCTIONS
Function: Create New Charity
Type: POST
Path: "parse/classes/Charity"
headers: ["X-Parse-Application-Id": APP_ID]
body: ["name": String, "city": String, "state": String, "type": String]

Function: Add New Charity for User
Type: POST
Path: "parse/functions/addCharity"
headers: ["X-Parse-Application-Id": APP_ID, "X-Parse-Session-Token:" session_token]
body: ["charityId": String]

Function: Delete Charity for User
