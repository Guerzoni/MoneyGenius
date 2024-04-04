async function addGroup(){
    let url = new URL('api/v2/groups/', base);

    var name = document.getElementById("createGroupName").value;

    console.log(name);

    var resp = await fetch(url, {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            id: loggedUser.id,
            token: loggedUser.token, 
            name: name,
        })
    });
    try{
        resp = await resp.json();
        assert(resp.success, resp.message);
        loggedUser.group_token = resp.group_token;
        loggedUser.group_id = resp.group_id;
        sessionStorage.setItem("loggedUser", JSON.stringify(loggedUser));
        window.alert("Gruppo creato con successo!")
        document.getElementById("btnCloseCreateGroupModal").click();
        displayGroupPage();

    }catch(message){
        window.alert(message);
    }
}

function loadGroupInfo(){

    let url = new URL('api/v2/groups/' + loggedUser.group_id, base);
    let params = {token:loggedUser.token, group_token:loggedUser.group_token};
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    fetch(url)
    .then((resp) => resp.json())
    .then(function(data){
        if(!data.success){
            console.log(data);
            throw data.message;
        }else{
            let group = data.group;
            let participants = group.partecipants;
            console.log(participants);

            document.getElementById("gi_name").innerHTML = group.name;
            let ulParticipants = document.getElementById("ulParticipants");
            participants.forEach(participant => {
                let li = document.createElement("li");
                li.classList.add("list-group-item");
                li.innerHTML = participant.name + ' - ' + participant.email;
                ulParticipants.appendChild(li);
            });
        }
    })
    .catch(function(error){
        window.alert(error);
    });
}

async function inviteParticipant(){
    let url = new URL('/api/v2/groups/' + loggedUser.group_id + '/invitations/', base);

    var mail = document.getElementById("inviteMail").value;

    var resp = await fetch(url, {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            id: loggedUser.id,
            mail: mail,
            token: loggedUser.token,
            group_token: loggedUser.group_token
        })
    });
    try{
        resp = await resp.json();
        assert(resp.success, resp.message);
        window.alert("Richiesta inviata");
        document.getElementById("btnCloseInviteModal").click();
    }catch(message){
        window.alert(message);
    }
}

//send an asynchronous request to the api to retrieve the list of epenses
//if there arent any expenses do not show the table...
function loadPendingRequest(){

    let url = new URL('api/v2/users/' + loggedUser.id + "/invitations", base);
    let params = {token:loggedUser.token};
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    fetch(url)
    .then((resp) => resp.json()) // Transform the data into json
    .then(function(data){
            let requestsList = document.getElementById("requestsList"); 
            let table = document.getElementById("requestsTable");
            let pending_invites = data.pending_invites;
            
            //clear the table
            if(table)
                table.remove();
            
            //if i have any requests
            if(pending_invites.length>0){
                table = createRequestsTable();
                table = fillRequestsTable(pending_invites, table);  
                requestsList.appendChild(table);
            }
    });
}

//create the table
function createRequestsTable(){
    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var trHeaders = document.createElement("tr");

    table.id = 'requestsTable';
    /*table.classList.add("table");
    table.classList.add("text-center");*/
    table.classList.add("card-table");
    table.classList.add("table");
    table.classList.add("table-hover");
                
    //setup the th row
    let thatt = ['Nome', 'Accetta', 'Rifiuta'];
    
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
function fillRequestsTable(pending_invites, table){

    var tbody = document.createElement("tbody");

    pending_invites.forEach(invite => {

        let trInvite = document.createElement("tr");
        trInvite.id = invite['_id'];
        
        let td = document.createElement("td");
        td.innerHTML = invite['name'];
        trInvite.appendChild(td);

        let tdAccept = document.createElement("td");
        let btnAccept = document.createElement("button");
        btnAccept.innerHTML= "Ok";
        btnAccept.classList.add("btn", "btn-success");
        btnAccept.onclick = () => {
            acceptInvite(trInvite.id);
        }
        tdAccept.appendChild(btnAccept);
        trInvite.appendChild(tdAccept);

        let tdReject = document.createElement("td");
        let btnReject = document.createElement("button");
        btnReject.innerHTML= "X";
        btnReject.classList.add("btn", "btn-danger");
        btnReject.onclick = () => {
            rejectInvite(trInvite.id);
        }
        tdReject.appendChild(btnReject);
        trInvite.appendChild(tdReject);

        tbody.appendChild(trInvite);
        
    });

    table.appendChild(tbody);

    return table;
}

async function acceptInvite(group_id){
    let url = new URL('/api/v2/groups/' + group_id + '/invitations/', base);

    var resp = await fetch(url, {
        method: 'PUT',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({
            id: loggedUser.id,
            token: loggedUser.token,
        })
    });
    try{
        resp = await resp.json();
        assert(resp.success, resp.message);
        window.alert("Richiesta accettata");
        loggedUser.group_id = resp.group_id;
        loggedUser.group_token = resp.group_token;
        displayGroupPage();
    }catch(message){
        window.alert(message);
    }
}

function rejectInvite(group_id){
    window.alert("Rifiuta disponibile in v3 :)");
}