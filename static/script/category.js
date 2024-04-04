function addCategory(){
    
    var name = document.getElementById("categoryName").value;
    var color = document.getElementById("categoryColor").value;
    var budget = document.getElementById("categoryBudget").value;
    var newCategory = [{name: name,  budget: budget, cat_spent: 0}];
    //console.log(color);

    fetch('api/v2/users/'+loggedUser.id+'/categories/', {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            id: loggedUser.id,
            token: loggedUser.token, 
            name: name,
            color: color,
            budget: budget
        })
    })
    .then((resp) => resp.json())
    .then(function(data){
        assert(data.success, data.message);
        

        document.getElementById("btnCloseCategoryModal").click();
        let tableCat = document.getElementById('tableCat');

        if(!tableCat){ //we have to create table cat
            let categoriesList = document.getElementById('categoriesList');
            let span = categoriesList.firstElementChild;
            categoriesList.removeChild(span);

            showRecapCategories();

            /*//create the table and append it
            tableCat = createCategoriesTable();
            tableCat = fillCategoriesTable(data.categories, tableCat);
            categoriesList.appendChild(tableCat);        */        
        }else{
            tableCat.remove();
            showRecapCategories();
        }   
        loadCategoriesOptions();
        //console.log(newCategory);
        //tableCat = fillCategoriesTable(newCategory, tableCat);
    }).catch(function(error){
        window.alert(error);
    });
}



async function deleteCategory(category_name){
    //console.log("name:"+category_name);
    
    const resp = await fetch('api/v2/users/'+loggedUser.id+'/categories/', {
        method: 'DELETE',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            id: loggedUser.id,
            token: loggedUser.token, 
            name: category_name
        })
    });
    try{
        //console.log(resp.ok);
        assert(resp.ok);
        showRecapCategories();
        loadCategoriesOptions();
        loadExpensesList();
    }
    catch{
        resp_json = await resp.json();
        window.alert(resp_json.message);
    };
}

function createCategoriesTable(){
    var tableCat = document.createElement("table");
    var thead = document.createElement("thead");
    var trHeadersCat = document.createElement("tr");

    tableCat.id = 'tableCat';
    tableCat.classList.add("table");
    tableCat.classList.add("table-hover");
    tableCat.classList.add("text-center");
    //tableCat.classList.add("table-bordered");

    const thNames = ["Nome", "Budget", "di cui Speso", "Elimina"];
                
    //setup the th row
    for (let i = 0; i<thNames.length; i++) {

            let thCat = document.createElement("th");

            thCat.innerHTML = thNames[i];

            trHeadersCat.appendChild(thCat);
    }

    thead.appendChild(trHeadersCat);
    tableCat.appendChild(thead);

    return tableCat;
}

function showRecapCategories(){
    
    var url = new URL("api/v2/users/" + loggedUser.id + "/categories", base);
    let params = {token:loggedUser.token};
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    fetch(url)
    .then((resp) => resp.json())
    .then(function(data){ 
        if(!data.success){
            //console.log(data);
            throw data.message;
        }else{
            let categoriesList = document.getElementById('categoriesList');
            let userCategories = data.categories;
                if(userCategories.length>=0){
                    let tableCat = document.getElementById("tableCat");
                    if(tableCat) tableCat.remove();
                    tableCat = createCategoriesTable();
                    tableCat = fillCategoriesTable(userCategories, tableCat);       
                    categoriesList.appendChild(tableCat);
                }else{
                    let spanCat = document.createElement("span");
                    spanCat.innerHTML="Errore in showRecapCategories"; 
                    categoriesList.appendChild(spanCat);
                }
        }     
       return;
    })
    .catch( 
        (error) => {
            window.alert(error);
            console.error(error);
        }
    ); // If there is any error you will catch them here
}

function fillCategoriesTable(userCategories, tableCat){
    
    var tbody = document.createElement("tbody");
    tableCat.classList.add("table-bordered");

    userCategories.forEach(elementCategory => {

        let trCategory = document.createElement("tr");
        var category_name;
        for (attribute in elementCategory) {
            if(attribute!="_id" && attribute!="color"){
                let td = document.createElement("td");
                td.innerHTML = elementCategory[attribute];
                trCategory.appendChild(td);
                if(attribute === "name") category_name = elementCategory[attribute];
            }
        }
        trCategory.id = category_name+" row";
        let td = document.createElement("td");
        let button = document.createElement("button");
        button.innerHTML = "X";
        button.onclick = ()  => deleteCategory(category_name);
        td.appendChild(button);
        trCategory.appendChild(td);
        trCategory.style.borderColor = elementCategory.color;
        trCategory.style.borderWidth = '4px';
        tbody.appendChild(trCategory);
        
    });

    tableCat.appendChild(tbody);

    return tableCat;
}