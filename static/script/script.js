/**
 * This variable stores the logged user
 */
var loggedUser = sessionStorage.getItem("loggedUser");

if(!loggedUser){ //user not authenticated
    loggedUser = {};
}

else{ //user already authenticated
    loggedUser = JSON.parse(loggedUser);
    afterAuth();
}

//base URL of the server
var base="https://moneygenius.herokuapp.com";


function assert(condition, message){
    if (!condition) throw message || "assertion failed";
}

/*
//code for the modal, code taken from w3schools.com
function loadModals(){
    // Get the modals
    var mdlExpense = document.getElementById("mdlExpense");
    var mdlCategory = document.getElementById("mdlCategory");

    // Get the button that opens the modal
    var btnOpenExpenseForm = document.getElementById("btnOpenExpenseForm");
    var btnOpenFormCategory = document.getElementById("btnOpenFormCategory");

    // Get the <span> element that closes the modal
    var spanExpense = document.getElementById("spanCloseExpenseForm");
    var spanCategory = document.getElementById("spanCategory");
    // When the user clicks on the button, open the modal
    btnOpenExpenseForm.onclick = function() {
        console.log(mdlExpense);
        mdlExpense.style.display = "block";
    }

    btnOpenFormCategory.onclick = function() {
        mdlCategory.style.display="block";}

    // When the user clicks on <span> (x), close the modal
    spanExpense.onclick = function() {
        mdlExpense.style.display = "none";
    }

    spanCategory.onclick = () => mdlCategory.style.display = 'none' ;


    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == mdlExpense) mdlExpense.style.display = "none";
        if (event.target == mdlCategory) mdlCategory.style.display = "none";
    }
}
*/

//displays login form after login selection
function displayLogin(){
    document.getElementById("navAuthentication").hidden=true;
    document.getElementById("divAuthentication").hidden=false;
    document.getElementById("Login").hidden=false;
}

function closeNav(){
    document.getElementById("btnCloseNav").click();
}

//displays signup form after signup selection
function displaySignup(){
    document.getElementById("navAuthentication").hidden=true;
    document.getElementById("divAuthentication").hidden=false;
    document.getElementById("divAuthName").hidden=false;
    document.getElementById("Signup").hidden=false;
}

function displayUserPage(){
    document.getElementById("authenticationPage").hidden = true;
    document.getElementById("navApplication").hidden = false;
    document.getElementById("userPage").hidden = false;
    document.getElementById("groupPage").hidden = true;
    document.getElementsByClassName("nav-link")[0].classList.add("active");
    document.getElementsByClassName("nav-link")[1].classList.remove("active");
}

async function displayGroupPage(){
    document.getElementById("authenticationPage").hidden = true;
    document.getElementById("navApplication").hidden = false;
    document.getElementById("userPage").hidden = true;
    document.getElementById("groupPage").hidden = false;
    document.getElementsByClassName("nav-link")[0].classList.remove("active");
    document.getElementsByClassName("nav-link")[1].classList.add("active");

    let groupPage;

    if(loggedUser.group_id && loggedUser.group_token){//if the user already has a group
        groupPage = await fetch('./group.html');
        groupPage = await groupPage.text();

        loadGroupInfo();
        //loadGroupExpensesList(); tabella per spese di gruppo
    }else{
        groupPage = await fetch('./joinGroup.html');
        groupPage = await groupPage.text();
        loadPendingRequest();
    }

    document.getElementById("groupPage").innerHTML = groupPage;
}

//resets page and form
function resetForm(){
    document.getElementById("navAuthentication").hidden=false;
    document.getElementById("divAuthentication").hidden=true;
    document.getElementById("divAuthName").hidden=true;
    document.getElementById("Login").hidden=true;
    document.getElementById("Signup").hidden=true;
    document.getElementById("authform").reset();
}

//hide the authentication section and show the user homepage
async function afterAuth(){

    displayUserPage();
    
    let budget = await fetch('./budget.html');
    budget = await budget.text();
    let divBudget = document.getElementById("divBudget");
    divBudget.innerHTML = budget;
    //document.getElementById("budgetRimanente").hidden = false;
    
    let category = await fetch('./category.html');
    category = await category.text();
    let divCategory = document.getElementById("divCategory");
    divCategory.innerHTML = category;

    let expense = await fetch('./expense.html');
    expense = await expense.text();
    let divExpense = document.getElementById("divExpense");
    divExpense.innerHTML = expense;

    /*
    let groupForm = await fetch('./groupForm.html');
    groupForm = await groupForm.text();
    let divGroup = document.getElementById("divGroup");
    divGroup.innerHTML = groupForm;

    let group = await fetch('./group.html');
    group = await group.text();
    let groupPage = document.getElementById("groupPage");
    groupPage.innerHTML = group;*/

    //load the expenses
    loadExpensesList();
    
    //load the expense modal
    //loadModals();
    
    //load the category drop down list 
    loadCategoriesOptions();

    showRecapCategories();

    //view the budget
    viewBudget();
    document.getElementById("budgetRimanente").hidden = false;
    document.getElementById("labelBudRim").hidden = false;
    document.getElementById("budget").value = "";

    /*if(user.budget){
        document.getElementById("budgetform").hidden = true;
        document.getElementById("modifybudgetform").hidden = false;
    }*/
}


 /** 
 * Based on source: https://github.com/unitn-software-engineering/EasyLib/blob/master/static/script.js 
 * This function is called when login button is pressed.
 * Note that this does not perform an actual authentication of the user.
 * A user is loaded given the specified email,
 * if it exists, the userId is used in future calls.
 */
function login()
{
    //get the form object
    var email = document.getElementById("authEmail").value;
    var password = document.getElementById("authPassword").value;
    // console.log(email);

    fetch('../api/v2/authentications/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( { email: email, password: password } ),
    })
    .then((resp) => resp.json()) // Transform the data into json
    .then(function(data){
        if(!data.success) throw data.message;
        else{
            loggedUser.token = data.token;
            loggedUser.email = data.email;
            loggedUser.name = data.name;
            loggedUser.id = data.id;
            loggedUser.group_id = data.group_id;
            loggedUser.group_token = data.group_token;
            loggedUser.self = data.self;
            sessionStorage.setItem("loggedUser", JSON.stringify(loggedUser)); //set local user variable inside session storage
            // loggedUser.id = loggedUser.self.substring(loggedUser.self.lastIndexOf('/') + 1);
            resetForm();
            afterAuth();
            //console.log(data.id);
            //loadLendings();
            return;
        }
    })
    .catch( 
        (error) => {
            window.alert(error);
            console.error(error);
        }
    ); // If there is any error you will catch them here

}

/**
 * This function is called when the signup button is pressed.
 * A new user will be inserted in the DB using same username and password provided in the authentication form. 
 */
function signup(){
    var email = document.getElementById("authEmail").value;
    var password = document.getElementById("authPassword").value;
    var name = document.getElementById("authName").value;
    fetch('../api/v2/authentications/signup',{
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({email: email, password: password, name: name} )
    })
    .then(resp => resp.json())
    .then(function(data){
        if(!data.success) throw data.message;
        loggedUser.token = data.token;
        loggedUser.email = data.email;
        loggedUser.name = data.name;
        loggedUser.id = data.id;
        loggedUser.self = data.self;
        sessionStorage.setItem("loggedUser", JSON.stringify(loggedUser)); //set local user variable inside session storage        
        resetForm();
        afterAuth();
        return;
    })
    .catch((error) => {
        window.alert(error);
        console.error(error);
    });
}