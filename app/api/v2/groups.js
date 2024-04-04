const express = require('express');
const router = express.Router({ mergeParams: true });
const Group = require('../../models/group'); //get our group model
const User = require('../../models/user'); 
const { isValidObjectId } = require('mongoose');
const jwt = require('jsonwebtoken');
const assert = require('assert');
const groupTokenChecker = require('./groupTokenChecker');
/*
* Create a new group. The group creator auutomatically joins the new group.
*/
router.post('', async function(req, res){
    
    let user_id = req.body.id;
    let group_name = req.body.name;

    try{
        
        assert(user_id && group_name, "Errore, paramatri mancanti");
        assert(isValidObjectId(user_id), "Errore, l'id specificato non è valido");
        //let group_exists = await Group.exists({name: group_name}).exec(); //check that the specified group exists
        let user = await User.findOne({_id: user_id}).exec(); // check that the input user exists
        //assert(!group_exists, "Errore, gruppo già esistente");
        assert(user, "Errore, utente non esistente");
        assert(!user.group_id, "Errore, impossibile partecipare a più di un gruppo"); //check that the user is not already associated with another group
        
        //create the new group
        group = new Group({ 
            name: group_name,
            partecipants: [user_id],
        });
        await group.save();

        //assign the user to the new group
        user.group_id = group._id;
        user.save();

        //create the group's token
        var payload = {
            user_id: user_id,
            group_id: group._id
        }      
        
        var options = {
            expiresIn: 86400 // expires in 24 hours
        }
        
        var token = jwt.sign(payload, process.env.SUPER_SECRET, options);
        res.location("/api/v2/groups/" + group._id ).status(201).json({
            success: true,
            message: "Gruppo creato con successo",
            group_token: token,
            group_id: group._id
        });

    }catch(err){
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
});

/*
* Get the data relative to the group.
*/
router.get('/:id', groupTokenChecker, async function(req, res){
    
    try{
        //check that the group requested (in the params) is the same of the user's group (in the token)
        let token_group_id = req.group_id;
        let request_group_id = req.params.id;    
        assert(token_group_id == request_group_id, "Errore, autorizzazione group token fallita.");
        
        //get the group entry and send it to the user
        let group = await Group.
        findById(request_group_id).
        populate({ path: 'partecipants',  select: ['email','name']}).
        exec();

        res.status(200).json({
            success: true,
            group: group
        });

    }catch(err){
        res.status(403).json({
            success: false,
            message: err.message
        });
    }


});


router.all("", (req, res) => {
    res.status(405).json({
        success: false,
        message: "Method not allowed"
    });
})

/**
 * Parse a jwt token into a json object
 * source: https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
 * @param {*} token 
 * @returns a json object containing all the fields encoded in the input token
 */
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

module.exports = router;