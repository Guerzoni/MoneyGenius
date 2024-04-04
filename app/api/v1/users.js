const express = require('express');
const router = express.Router();
const User = require('../../models/user.js'); //get our user model


router.get('', async (req, res) => {
    let users;

    if (req.query.email)
        // https://mongoosejs.com/docs/api.html#model_Model.find
        users = await user.find({email: req.query.email}).exec();
    else
        users = await user.find().exec();

    users = users.map( (entry) => {
        return {
            self: '/api/v1/users/' + entry.id,
            email: entry.email
        }
    });

    res.status(200).json(users);
});


router.post('', async (req, res) => {

    
    if (!req.body.email || typeof req.body.email != 'string' || !checkIfEmailInString(req.body.email)) {
        console.log(req.body.email);
        res.status(400).json({ error: 'The field "email" must be a non-empty string, in email format' });
        return;
    }
    
    let user = new User({
        email: req.body.email,
        password: req.body.password
    });

	user = await user.save();
    
    console.log("pane");

    let userId = user.id;

    /**
     * Link to the newly created resource is returned in the Location header
     * https://www.restapitutorial.com/lessons/httpmethods.html
     */
    res.location("/api/v1/users/" + userId).status(201).send();
});

// https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function checkIfEmailInString(text) {
    // eslint-disable-next-line
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(text);
}


module.exports = router;