const express = require('express');
const router = express.Router({ mergeParams: true });
const Group = require('../../models/group'); //get our group model
const User = require('../../models/user'); 
const jwt = require('jsonwebtoken');
const { isValidObjectId } = require('mongoose');
const assert = require('assert');
const groupTokenChecker = require('./groupTokenChecker');

/*
* Post an invitation for a certain user to join the group
*/
router.post('', groupTokenChecker, async function(req,res){
    
    let user_id = req.body.id;
    let invitation_mail = req.body.mail; //mail associated with the user we want to invite
    let group_id = req.params.id;
    let token_group_id = req.group_id
    try{
        
        //check that the group id in the user's group token is the same of the group specified in the path
        assert(group_id == token_group_id, "Errore, per invitare un utente devi partecipare al gruppo");

        assert(isValidObjectId(user_id), "Errore, l'id specificato non è valido");
        let user = await User.findById(user_id);
        let invitedUser = await User.findOne({email: invitation_mail});
        let group = await Group.findById(group_id);
        
        //check validity of the input parameters
        assert(user, "Errore, utente non esistente.");
        assert(invitedUser, "Errore, la mail di invito non è associata a nessun utente.");
        assert(group, "Errore, il gruppo specificato è inesistente.");

        /*//check that the user has the permission to invite another user (is a member of the group)
        let isMember = await group.partecipants.find((id) => id.equals(user_id));
        assert(isMember, "Errore, per invitare un utente devi partecipare al gruppo.");*/

        //check that the invited has not alreadyt joined another group
        let alreadyInGroup = invitedUser.group_id;
        assert(!alreadyInGroup, "Errore, l'utente invitato fa già parte di un gruppo.");

        //check that the invite request is not already pending
        let already_pending = await invitedUser.pending_invites.find( (id) => id == group_id);
        assert(!already_pending, "Errore, l'utente è già stato invitato al gruppo.");
        
        //insert invitation (group id) inside the invited user's pending invites
        invitedUser.pending_invites.push(group_id);
        invitedUser.save();
           
        res.status(201).json({
            success: true,
            message: "Utente invitato con successo."
        });

    }catch(err){
        res.status(400).json({
            success: false,
            message: err.message
        });
    };

});

/*
* Accept the invitation to join the group
*/
router.put('', async function(req, res){

    let user_id = req.body.id;
    let group_id = req.params.id;
    try{

        assert(isValidObjectId(user_id), "Errore, l'id specificato non è valido");
        let user = await User.findById(user_id);
        
        //check validity of the input parameters
        assert(user, "Errore, utente non eisistente.");
        assert(group_id, "Errore, necessario specificare il gruppo a cui unirsi.");
        assert(!user.group, "Errore, impossibile partecipare a più di un gruppo.");
        
        //retrieve the position of the group in the pending vector (and check that the user has been effectively invited)
        assert(user.pending_invites, "Errore, impossibile partecipare ad un gruppo senza essere stato invitato.")
        let pos = user.pending_invites.findIndex( (element) => element == group_id);
        assert(pos !== -1, "Errore, impossibile partecipare ad un gruppo senza essere stato invitato.");
        
        //retrieve the group entry (and check existence)
        let group = await Group.findById(group_id);
        assert(group, "Errore, il gruppo a cui sei stato invitato non esiste più.");
        
        //update group by inserting the new user
        group.partecipants.push(user_id);
        await group.save();
        
        //update user by moving the pending group to the joined group
        user.pending_invites.splice(pos, 1);
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
        
        var group_token = jwt.sign(payload, process.env.SUPER_SECRET, options);

        res.status(200).json({
            success: true,
            message: "Ti sei unito al gruppo con successo.",
            group_id: group._id,
            group_token: group_token
        });

    }catch(err){
        res.status(400).json({
            success: false,
            message: err.message
        })
    }

});

router.all("", (req, res) => {
    res.status(405).json({
        success: false,
        message: "Method not allowed"
    });
})

module.exports = router;