const express = require('express');
const router = express.Router({ mergeParams: true });
const User = require('../../models/user');
const assert = require('assert');
const user = require('../../models/user');
const defaultCategory = "altro";
const defaultColor = "#919191";

/**
 * If not present, create default category
*/
router.post('/default', async function(req, res){
    let id = req.body.id;
    let user = await User.findById(id);
    try{
        console.log();
        assert(user, "Utente non esistente");
        if(user.categories.length === 0){
            user.categories.push({name: defaultCategory, color: defaultColor, budget: user.budget-user.allocated_budget});   
            user = await user.save();
        }
        
        res.status(200).json({
            success: true
        })
    }catch(error){
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


/**
 * Create a new category
*/
router.post('', async function(req, res){
    
    let id = req.body.id; //user's id
    let name = req.body.name; //category's name
    let color = req.body.color; //category's color
    let budget = parseInt(req.body.budget); //category's budget
    
    //console.log(name+" "+color+" "+budget);

    try{

        assert(name && color && budget, "Creazione fallita, parametri mancanti."); //check that no parameters are missing
        
        let user = await User.findById(id);
  
        assert(user, "Utente non esistente"); //should not throw since user token is checked beforehand
        assert(user.budget, "Creazione fallita, per poter creare una categoria devi avere un budget mensile.") 
        assert(!user.categories.find( x => x.name === name), "Creazione fallita, categoria già esistente."); //check that the category does not exists already
        assert(!user.categories.find( x => x.color === color), "Creazione fallita, colore categoria già assegnato."); //check that the color is not already assigned to another categoty
        assert(!isNaN(budget) && budget>0, "Il budget assegnato alla categoria non è vaildo");
        let new_alloc_budget = user.allocated_budget + budget;
        console.log(new_alloc_budget);
        assert(new_alloc_budget <= user.budget, "Creazione fallita, il budget allocato per le categorie supera il budget totale."); //check that the sum of budgets of all categories does not exceed the user's budget

        await user.categories.push({name: name, color: color, budget: budget}); //add new category
        
        user.allocated_budget = new_alloc_budget; //update sum of budget allocated for all categories
        
        let free_budget = user.budget - new_alloc_budget; //budget not yet allocated to any category

        let default_index = user.categories.findIndex((obj) => obj.name === defaultCategory); //find default category index 
        
        user.categories[default_index].budget = free_budget; //decrease default categoty budget
        
        user = await user.save(); 

        res.status(201).json({
            success: true,
            message: "Creazione riuscita.",
        });

    }catch(error){ //if one of the above assertions fails, we return the respective error message
        res.status(400).json({
            success: false,
            message: error.message
        });
    }

});


router.delete('', async function (req, res){
    
    let id = req.body.id; //user's id
    let name = req.body.name; //category's name

    try{
        
        let user = await User.findById(id);
        
        assert(user, "Utente non esistente"); //should not throw since user token is checked beforehand
        assert(name, "Cancellazione fallita, inserire il nome della categoria da eliminare");
        assert(name!=defaultCategory, "Impossibile eliminare la categoria di default");
        assert(user.categories, "Cancellazione fallita, categoria non esistente."); //check that the categories array is not empty
        
        var defaulCategoryId = user.categories[0].id; //get the id of the default categoty "altro"

        let index = user.categories.findIndex((obj) => obj.name === name); //return -1 if no category match the input category name
        
        assert(index !== -1, "Cancellazione fallita, categoria non esistente.");
        
        let cat_budget = user.categories[index].budget; 
        let cat_id = user.categories[index].id;
        let cat_spent = user.categories[index].cat_spent;
        user.allocated_budget -= cat_budget; //subtract category budget to complessive categories budget
        user.categories.splice(index,1);
        
        //console.log(cat_id);

        user.expenses.forEach(element => {
            if (element.categoryId === cat_id) {
                element.categoryId = defaulCategoryId; //set default category id in all expenses belonging to the deleted category
                //console.log("default "+defaulCategoryId);
            }
        });
        
        user.categories.find( (obj) => {
            if(obj.name === defaultCategory){
                obj.budget = user.budget - user.allocated_budget;
                obj.cat_spent += cat_spent;
            }
        });
        

        assert(index !== -1, "Cancellazione fallita, categoria non esistente.");

        await user.save();
    
        res.status(204).json({
            success: true,
            message: "Cancellazione avvenuta con successo"
        });

    }catch(error){
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

router.get('', async(req, res) => {

    try{
        let id = req.params.id;

        var user = await User.findById(id);
        
        assert(user, "utente non identificato");
        
        await user.save();
        res.status(200).json({
            success: true, 
            categories: user.categories
        });
    }
    catch(error){
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;