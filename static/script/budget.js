function setBudget(){
    var budget = document.getElementById("budget").value;
    fetch('../api/v2/users/'+loggedUser.id+'/budget', {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            email: loggedUser.email, 
            token: loggedUser.token, 
            budget: budget} )
    })
    .then((resp) => resp.json())
    .then(function(data){ 
        //console.log(data);
        if(data.success){
            //window.alert("budget impostato con successo");
            afterSetBudget();
            //viewBudget();
        }
        else {
            throw data.message;
        }
    })
    .catch(function(error){
        window.alert(error);
    })
}

function viewBudget(){
    
    var url = new URL("api/v1/users/" + loggedUser.id + "/budget", base),
        params = {token:loggedUser.token}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    
    fetch(url)
    .then((resp) => resp.json())
    .then(function(data){ 
        if(data.success){
            document.getElementById("budgetSpentView").innerHTML = ((!data.total_spent) ? 0 : data.total_spent) + "€";
            document.getElementById("budget2View").innerHTML = ((!data.budget) ? 0 : data.budget) + "€";
        }
        else {
            throw data.message;
        }
    })
    .catch(function(error){
        window.alert(error.message);
    })
}


function afterSetBudget(){
    viewBudget();
    document.getElementById("budgetRimanente").hidden = false;
    document.getElementById("labelBudRim").hidden = false;
    document.getElementById("budget").value = "";
    //git restordocument.getElementById("budgetform").hidden = true;
       //set user's default category
    
    fetch('../api/v2/users/'+loggedUser.id+'/categories/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( { id: loggedUser.id, token: loggedUser.token, email:loggedUser.email } ),
    })
    .then((resp) => resp.json())
    .then(function(data){
        assert(data.success, data.message);
        loadCategoriesOptions();
        showRecapCategories();
    })
    .catch(function(error){
        window.alert(error);
    });
}
