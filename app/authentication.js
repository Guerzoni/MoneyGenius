const express = require('express');
const router = express.Router();
const User = require('./models/user'); // get our mongoose model
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

// ---------------------------------------------------------
// Based on source: https://github.com/unitn-software-engineering/EasyLib/blob/master/app/authentications
// route to authenticate and get a new token
// ---------------------------------------------------------
router.post('/login', async function(req, res) {
	// find the user
	let user = await User.findOne({
		email: req.body.email
	}).exec();

	// user not found or pwd doesn't match
	if (!user || user.password != req.body.password) {
		res.status(400).json({ success: false, message: 'Autenticazione fallita: email o password non validi.' });
        return;
	}

	// if user is found and password is right create a token
	var payload = {
		email: user.email,
		name: req.body.name,
		id: user._id
		// other data encrypted in the token	
	}
	var options = {
		expiresIn: 86400 // expires in 24 hours
	}
	var token = jwt.sign(payload, process.env.SUPER_SECRET, options);

	//check if a user has a group sends back group_id and group_token
	let group_id = user.group_id;
	let group_token;
	if(group_id){
		let group_payload = {
            user_id: user._id,
            group_id: group_id
		}
		group_token = jwt.sign(group_payload, process.env.SUPER_SECRET, options);
	}


	res.status(200).json({
		success: true,
		message: 'Enjoy your token!',
		token: token,
		email: user.email,
		name: user.name,
		group_id : group_id,
		group_token: group_token,
		id: user._id,
		self: "api/v2/users/" + user._id
	});

});


// ---------------------------------------------------------
//  Route to register a new user and get a new token.
// ---------------------------------------------------------
router.post('/signup', async function(req, res) {
	let email = req.body.email;
	let name = req.body.name; 
	
    if(checkIfEmailInString(email) && name){
       
        let userExists = await User.exists({email: req.body.email}); //check if the email is already associated with an existing user

        if(!userExists){
            
            //console.log("new user");

            // build a new user object
	        let user = new User({
                email: req.body.email,
                password: req.body.password,
				name: req.body.name
            });

            user = await user.save(); //save user in DB

            //create a token
	        var payload = {
		        email: user.email,
				name: req.body.name,
		        id: user._id	
	        }      
	        
            var options = {
		        expiresIn: 86400 // expires in 24 hours
	        }
	        var token = jwt.sign(payload, process.env.SUPER_SECRET, options);

	        res.json({
		        success: true,
		        message: 'Enjoy your token!',
		        token: token,
		        email: user.email,
		        id: user._id,
				name: user.name,
		        self: "api/v2/users/" + user._id
           });
        
        } else res.status(400).json({success: false, message: 'Registrazione fallita: e-mail già assegnata ad un altro utente'});
    
    }else res.status(400).json({ success: false, message: 'Registrazione fallita: e-mail o username non validi'});
});

// source: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function checkIfEmailInString(text) {
    // eslint-disable-next-line
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(text);
}

module.exports = router;