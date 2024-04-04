//called when 'Aggiungi' button of the expense form is clicked
async function addExpense(){

    let url = new URL('api/v2/users/' + loggedUser.id + '/expenses', base);

    var name = document.getElementById("name").value;
    var amount = document.getElementById("amount").value;
    var categoryId = document.getElementById("categoryId").value;
    var date = document.getElementById("date").value;

    const resp = await fetch(url, {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            token: loggedUser.token, 
            name: name,
            amount: amount,
            categoryId: categoryId,
            date: date
        })
    });
    
    try{
        assert(resp.ok);
        //load the table
        loadExpensesList();

        //close the modal
        document.getElementById("btnCloseExpenseFormModal").click();

        //reset expense form
        document.getElementById('expenseForm').reset();

        //update budget
        viewBudget();

        //update categories
        showRecapCategories();
    }
    catch{
        resp_json = await resp.json();
        window.alert(resp_json.message);
    };
// If there is any error you will catch them here
    /*
    //.then((resp) => resp.json())// non riceve un body quindi da errore
    .then(function(data){ 
        //if(data.success){      
            //window.alert("Nuova spesa registrata");
                        
            let table = document.getElementById('expensesTable');
            let expense = data.expense;
            //let budget = data.budget;
            //let budget_spent = data.budget_spent;
            
            //create table if its the first expense
            if(!table){
                let expensesList = document.getElementById("expensesList");
               
                //get the span and remove it
                let span = expensesList.firstElementChild;
                expensesList.removeChild(span);

                //create the table and append it
                table = createExpensesTable();
                table = fillExpensesTable(new Array(expense), table);
                expensesList.appendChild(table);
            }else{
                //else just update it 
                updateExpensesTable(expense, table);
            }

            //reload the expenses list
            loadExpensesList();

            //get close modal icon
            //let span = document.getElementById("spanCloseExpenseForm");
            //close the modal
            document.getElementById("btnCloseExpenseFormModal").click();

            //reset form
            document.getElementById('expenseForm').reset();

            //update budget
            viewBudget();

            //update categories
            showRecapCategories();

            //update budget and budget_spent
            document.getElementById("budgetSpentView").innerHTML = budget_spent;
            
            if(!isNaN(budget))
                document.getElementById("budget2View").innerHTML = budget;

        //}
        else {
                throw data.message;
            }
    })
    .catch(function(error){
        window.alert(error);
    });
    });
    */
}

function viewExpense(expenseId){
    let url = new URL('api/v2/users/' + loggedUser.id + '/expenses/' + expenseId, base);
    let params = {token:loggedUser.token};
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    fetch(url)
    .then((resp) => resp.json())
    .then(function(data){
        if(!data.success){
            console.log(data);
            throw data.message;
        }else{
            let expense = data.expense;
            //console.log(expense);
            document.getElementById('veName').innerHTML = expense.name;
            document.getElementById('veAmount').innerHTML = expense.amount + "€";
            document.getElementById('veCategory').innerHTML = expense.categoryId;
            document.getElementById('veDate').innerHTML = clearDateBis(new Date(expense.date).toLocaleString());
            document.getElementById('btnDeleteExpense').onclick = () => {
                deleteExpense(expense._id);
            }
        }
    })
    .catch(function(error){
        window.alert(error);
    });

    //open the modal
    document.getElementById("btnOpenExpense").click();
}

async function deleteExpense(expenseId){
    let url = new URL('api/v2/users/' + loggedUser.id + '/expenses/' + expenseId, base);

    const resp = await fetch(url, {
        method: 'DELETE',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            token: loggedUser.token
        })
    });
    try{
        assert(resp.ok);
        //close the modal
        document.getElementById("btnCloseExpenseModal").click();

        //update budget
        viewBudget();

        //update categories
        showRecapCategories();
        
        //update table
        loadExpensesList();
    }
    catch{
        resp_json = await resp.json();
        window.alert(resp_json.message);
    };
}

//send an asynchronous request to the api to retrieve the list of epenses
//if there arent any expenses do not show the table...
function loadExpensesList(){

    let url = new URL('api/v2/users/' + loggedUser.id + '/expenses', base);
    let params = {token:loggedUser.token};
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    fetch(url)
    .then((resp) => resp.json()) // Transform the data into json
    .then(function(data){
        if(!data.success){
            console.log(data);
            throw data.message;
        }else{

            let expensesList = document.getElementById("expensesList");
            let table = document.getElementById("expensesTable");
            let alertNoExpense = document.getElementById("alertNoExpense");
            let userExpenses = data.expenses;
            
            //clear the table
            if(table)
                table.remove();
            
            //if i have any expense
            if(userExpenses.length>0){
                //if its the first expense
                if(alertNoExpense)
                    expensesList.removeChild(alertNoExpense);

                table = createExpensesTable();
                table = fillExpensesTable(userExpenses, table);       
                expensesList.appendChild(table);
            }else{
                if(!alertNoExpense){
                    alertNoExpense = document.createElement("div");
                    alertNoExpense.id ="alertNoExpense";
                    alertNoExpense.classList.add("alert", "alert-info");
                    alertNoExpense.innerHTML="  <strong>Info!</strong> Nessuna spesa registrata."; 
                    expensesList.appendChild(alertNoExpense);
                }
            }
        }
    })
    .catch( 
        (error) => {
            window.alert(error);
            console.error(error);
        }
    ); // If there is any error you will catch them here
}

//create the table
function createExpensesTable(){
    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var trHeaders = document.createElement("tr");

    table.id = 'expensesTable';
    table.classList.add("table");
    table.classList.add("table-hover");
    table.classList.add("text-center");
                
    //setup the th row
    let thatt = ['Nome', 'Categoria', 'Totale', 'Data'];
    
    for (i in thatt) {
        let th = document.createElement("th");

        th.innerHTML = thatt[i];

        trHeaders.appendChild(th);
    }
    
    thead.appendChild(trHeaders);
    table.appendChild(thead);

    return table;
}

//fill the table
function fillExpensesTable(userExpenses, table){

    var tbody = document.createElement("tbody");

    userExpenses.forEach(expense => {

        let trExpense = document.createElement("tr");
        
        for (att in expense) {
            if(att!="_id"){

                let td = document.createElement("td");
                
                if(att=="date")
                    expense[att] = clearDateBis(new Date(expense[att]).toLocaleString());//clearDate(expense[name]);

                if(att=="amount")
                    expense[att] = expense[att] + "€";

                td.innerHTML = expense [att];

                trExpense.appendChild(td);
            }else{
                trExpense.id = expense[att];
            }

        }

        trExpense.onclick = () => {
            viewExpense(trExpense.id);
        }

        tbody.appendChild(trExpense);
        
    });

    table.appendChild(tbody);

    return table;
}

//load dynamically the category in the select input of the expense form
function loadCategoriesOptions(){
    let url = new URL('api/v2/users/' + loggedUser.id + '/categories', base);
    let params = {token:loggedUser.token};
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
 

    fetch(url)
    .then((resp) => resp.json()) // Transform the data into json
    .then(function(data){
        if(!data.success){
            console.log(data);
            throw data.message;
        }else{

            let categoriesSel = document.getElementById("categoryId");
            
            var child = categoriesSel.lastElementChild; 
            while (child) { //clear all children
                categoriesSel.removeChild(child);
                child = categoriesSel.lastElementChild;
            }

            let userCategories = data.categories;
            userCategories.forEach(category => {
                categoriesSel.options[categoriesSel.options.length] = new Option( category.name, category._id,);
            })

            return;
        }
    })
    .catch( 
        (error) => {
            window.alert(error);
            console.error(error);
        }
    );

}

/*
//update the table when new expense is added
function updateExpensesTable(expense, table){
    //get the first row
    var trFirst = table.childNodes[1];
    //create the tr
    var trExpense = document.createElement("tr");

    for (att in expense) {
        if(att!="_id"){

            let td = document.createElement("td");
            
            if(att=="date")
                expense[att] = clearDateBis(new Date(expense[att]).toLocaleString());//clearDate(expense[name]);

            td.innerHTML = expense [att];

            trExpense.appendChild(td);
        }else{
            trExpense.id = expense[att];
        }

    }

    trExpense.onclick = () => {
        viewExpense(trExpense.id);
    }

    //put the new tr in the first row
    table.insertBefore(trExpense, trFirst);
}
*/

/*
//return a readable date
function clearDate(date){
    //split in two the string and return the first half
    return date.split('T')[0];
}

*/

//return a readable date
function clearDateBis(date){
    //split in two the string and return the first half
    return date.split(',')[0];
}

/*
//checks the input of the expense form, called when the button is clicked
function validateInputs(){
    return validateAmount();
    //checkDate() date should not be int the future or before 2000 for examples
}

//if the amount is not a number or is less than zero send an alert
function validateAmount(){
    //let v = document.forms["expenseForm"]["amount"].value;
    let v = document.getElementById("amount").value;
    
    //if(isNaN(v) || v<=0){
    if (v <= 0) {
        alert("Errore: inserito Totale negativo");
        return false;
    }
    
    return true;
}
//even this properties can be obatained with the min name on the input tag
*/