const express = require('express');
const user = require('../../models/user.js');
const router = express.Router({ mergeParams: true });
const assert =  require('assert');
const User = require('../../models/user.js');
const defaultCategory = "altro";

//const expenses = require('./models/addExpense');

/*router.get('/me', async (req, res)=>{
    if(!req.loggedUser) return;
});*/

router.get('', async(req, res) => {
    
    let id = req.params.id;

    var user = await User.findById(id);
    
    assert(user, "Utente non identificato.");

    let total_spent = user.budget_spent;
    let budget = user.budget - total_spent;

    await user.save();
    res.status(200).json({success: true, total_spent: total_spent, budget: budget});

});

router.post('', async (req,res) => {
    
    let budget = req.body.budget; 
    /* 
     * take from the form the value of budget
     * check if the budget has a correct value
     * check if the user exists in the DB
     * then it set the value in the DB as budget
     */

    if (!isNaN(budget) && budget > 0) {
        let email = req.body.email;
        let user = await User.findOne({email: email});
        user.budget = budget;
        await user.save();
        res.status(201).json({success: true});
    }

    else {
        res.status(400).json({success: false, message: "input non valido"});
    }
} );

//MODIFICA BUDGET
router.put('', async (req,res) => {
    
    let budget = req.body.budget;
    /* 
     * take from the form the value of budget
     * check if the budget has a correct value
     * check if the user exists in the DB
     * then it set the value in the DB as budget
    */

    if (!isNaN(budget) && budget > 0) {
        let email = req.body.email;
        let user = await User.findOne({email: email});
        let allocatedB = user.alloc_budget;
        //console.log(allocatedB);
        if (budget < allocatedB) {
            res.status(400).json({success: false, message: "PUT1: input non valido"});
        }
        else {
            user.budget = budget;
            
            await user.save();
            res.status(201).json({success: true});
        }
    }

    else {
        res.status(400).json({success: false, message: "PUT2: input non valido"});
    }
} );

module.exports = router;