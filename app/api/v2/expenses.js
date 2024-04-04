const assert = require('assert');
const express = require('express');
const { isValidObjectId } = require('mongoose');
const router = express.Router({ mergeParams: true }); //{ mergeParams: true } to access params in the route of app.js

const User = require('../../models/user'); // get our mongoose model


//API for recording an expense
//API endpoint: api/v1/users/:id/expenses
router.post('', async function(req, res){

    //get the value of the form submitted
    let name = req.body.name;
    let amount = + req.body.amount; //cast to number
    let categoryId = req.body.categoryId;
    let date = new Date(req.body.date);
    console.log(req.body.date);
    try{
        //check the inputs
        assert(validateInputs(name, amount, categoryId, date), "Creazione fallita, input non validi.");
        
        //get the id from the request url
        let user_id = req.params.id;
        assert(isValidObjectId(user_id), "Errore, l'id specificato non è valido");
        //retrieve the user instance
        let user = await User.findById(user_id);
        assert(user, "Creazione fallita, utente non riconosciuto.");

        //retrieve the category
        let category = user.categories.find(cat => cat.id == categoryId);
        assert(category, 'Creazione fallita, categoria non esistente.');

        //create the expense
        let expense={
            name: name,
            categoryId: categoryId,
            amount: amount,
            date: date
        };

        //push on the expenses array
        let index = user.expenses.push(expense);

        //update budget left
        //user.allocated_budget += expense.amount;

        //update budget spent
        user.budget_spent += expense.amount;
        
        //update budget spent x catgory
        category.cat_spent += expense.amount;

        user = await user.save();

        //get the istance of the new expense
        expense = user.expenses[--index];
        console.log(expense);

        //modify expense to send the category name
        //expense.categoryId = category.name;
    
        /**
         * Link to the newly created resource is returned in the Location header
         * https://www.restapitutorial.com/lessons/httpmethods.html
         */
        res.location("/api/v2/users/" + user_id + "/expenses/" + expense._id).status(201).send();

    }catch(error){ //if one of the above assertions fails, we return the respective error message
        console.log(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

//API for retrieving all the expenses of a user
//API endpoint: api/v1/users/:id/expenses
router.get('', async function(req, res) {
    
    //get the user id from the request url
    let id = req.params.id;

    try{
        assert(isValidObjectId(id), "Errore, l'id specificato non è valido");
        //retrieve the user instance
        var user = await User.findById(id)/*.exec()*/;

        assert(user, 'Utente non riconosciuto');

        //shallow copy to avoid updates on db
        var expenses = [...user.expenses];
        var categories = user.categories;

        //sort categories descending order
        expenses.sort((a, b) => b.date - a.date);

        //retrieve the name of the category and stores it for the response
        expenses.forEach(expense => {
            let cat = categories.find(cat => cat.id == expense.categoryId);
            assert(cat, 'Categoria non esistente.');
            expense.categoryId = cat.name;
        });
    
        //send back the response
        res.status(200).json({
            success: true,
            message: 'Ecco le tue spese.',
            expenses: expenses
        });

    }
    catch(error){
        res.status(400).json({ success: false, message: error.message });
        console.log(error);
    }
});

//API for retrieving a specific expense of a user
//API endpoint: api/v1/users/:id/expenses/:idExpense
router.get('/:idExpense', async function(req, res) {
    
    //get the user id from the request url
    var user_id = req.params.id;
    var expense_id = req.params.idExpense;

    try{
        assert(isValidObjectId(user_id), "Errore, l'id specificato non è valido");
        //retrieve the user instance
        var user = await User.findById(user_id)/*.exec()*/;

        assert(user, 'Utente non riconosciuto');

        var expense = user.expenses.find(exp => exp._id == expense_id);
        expense.categoryId = user.categories.find(cat => cat.id == expense.categoryId).name;

        //send back the response
        res.status(200).json({
            success: true,
            message: 'Ecco la spesa.',
            expense: expense
        });

    }
    catch(error){
        res.status(400).json({ success: false, message: error.message });
        console.log(error);
    }
});

//API for retrieving a specific expense of a user
//API endpoint: api/v1/users/:id/expenses/:idExpense
router.delete('/:idExpense', async function(req, res) {
    
    //get the user id from the request url
    var user_id = req.params.id;
    var expense_id = req.params.idExpense;

    try{
        assert(isValidObjectId(user_id), "Errore, l'id specificato non è valido");
        let user = await User.findById(user_id);
        
        assert(user, "Utente non esistente"); //should not throw since user token is checked beforehand
        assert(expense_id, "Cancellazione fallita, inserire id della spesa da eliminare");
        assert(user.expenses, "Cancellazione fallita, spesa non esistente."); //check that the expenses array is not empty
                
        /*let index = user.expenses.findIndex((exp) => {
            let a = JSON.stringify(exp._id);
            let b = JSON.stringify(expense_id);
            return a==b;
        }); //return -1 if no expense match
        */
        let index = user.expenses.findIndex(exp => exp._id.equals(expense_id)); //return -1 if no expense match
        
        assert(index !== -1, "Cancellazione fallita, spesa non esistente.");
        let expense = user.expenses[index];

        let category = user.categories.find(cat => cat.id == expense.categoryId); //retrieve the category of the expense to delete

        assert(category, "Cancellazione fallita, categoria della spesa da eliminare non esistente.");

        //update budget spent
        user.budget_spent -= expense.amount;

        //update budget spent x catgory
        category.cat_spent -= expense.amount;

        //remove the expense from the expenses array
        user.expenses.splice(index,1);

        user = await user.save();
        
        res.status(204).send(); //204 returns no content
        /*res.status(204).json({
            success: true,
            message: "Cancellazione avvenuta con successo"
        });*/

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

function validateInputs(name, amount, categoryId, date){
    if(! (date instanceof Date && !isNaN(date.valueOf()))) console.log(date);
    return +
    (
        name && name!="" &&
        (amount && !isNaN(amount) && amount >= 0) &&
        categoryId !="" &&
        date instanceof Date && !isNaN(date.valueOf())
    );
}

module.exports = router;