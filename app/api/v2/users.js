const express = require('express');
const router = express.Router();
const User = require('../../models/user.js'); //get our user model

const Group = require('../../models/group.js'); //get our user model
const assert = require('assert');
const { isValidObjectId } = require('mongoose');
const user = require('../../models/user.js');

router.get('', async (req, res) => {
    let users;

    if (req.query.email)
        // https://mongoosejs.com/docs/api.html#model_Model.find
        users = await User.find({email: req.query.email}).exec();
    else
        users = await User.find().exec();

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

router.get('/:id/invitations', async (req, res) => {
 
    //get the user id from the request url
    let id = req.params.id;

    try{
        assert(isValidObjectId(id), "Errore, l'id specificato non è valido");
        //retrieve the user instance
        //var user = await User.findById(id)/*.exec()*/;

        var user = await User.
        findById(id).
        populate({ path: 'pending_invites', select: 'name' })
        .exec();

        assert(user, 'Utente non riconosciuto');

        //get the invitations
        var pending_invites = user.pending_invites;
    
        //send back the response
        res.status(200).json({
            success: true,
            message: 'Ecco i tuoi inviti.',
            pending_invites: pending_invites
        });

    }
    catch(error){
        res.status(400).json({ success: false, message: error.message });
        console.log(error);
    }
});

router.all("", (req, res) => {
    res.status(405).json({
        success: false,
        message: "Method not allowed"
    });
})

// https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function checkIfEmailInString(text) {
    // eslint-disable-next-line
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(text);
}


module.exports = router;