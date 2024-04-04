const express = require('express');
const app = express();

 
//Login and signup
const authentication = require("./authentication");
//Cheks validity of JWT
const tokenChecker = require("./tokenChecker");


const old_users = require('./api/v1/users.js');
const users = require('./api/v2/users.js');

const old_expenses = require("./api/v1/expenses.js");
const expenses = require("./api/v2/expenses.js");

const old_budgets = require("./api/v1/budgets.js")
const budgets = require('./api/v2/budgets.js');

const old_categories = require("./api/v1/categories")
const categories = require("./api/v2/categories");

const groups = require("./api/v2/groups")

const invitations = require("./api/v2/invitations");

const user = require('./models/user');

//middleware for accessing request body
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

//basic user interface 
app.use('/', express.static('static'));

/**
* Authentication routing and middleware
*/
app.use('/api/v2/authentications', authentication);

app.use(tokenChecker);

app.use('/api/v1/users', old_users);
app.use('/api/v2/users', users);


app.use('/api/v1/users/:id/categories', old_categories);
app.use('/api/v2/users/:id/categories', categories);

app.use('/api/v1/users/:id/expenses/', old_expenses);
app.use('/api/v2/users/:id/expenses/', expenses);

app.use('/api/v1/users/:id/budget', old_budgets);
app.use('/api/v2/users/:id/budget', budgets);

app.use('/api/v2/groups', groups);

app.use('/api/v2/groups/:id/invitations', invitations);

/*If no routs applyies, 404 error*/
app.use((req, res) =>{
    res.status(404).json({error: 'Page not found'});
});


module.exports = app;