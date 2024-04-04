const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app = require('../../app');
const mongoose = require('mongoose');





/*
 *  ______________________________Test POST route on budget___________________________________
 */
describe('POST api/v2/users/<user_id>/categories', () => {
  
    let connection;
    let user, id;
    const User = require("../../models/user");

    const testUser = {
        email: 'test@unitn.it',
        password: 1234,
        budget: 400,
        categories: [{name: "altro", color: "#919191", budget: 400, cat_spent: 0}]
    }

    // create a valid token
    var payload = {
        email: testUser.email,
        password: testUser.password,
    }

    var options = {
        expiresIn: 86400 // expires in 24 hours
    }

var token = jwt.sign(payload, process.env.SUPER_SECRET, options);

    beforeAll( async () => {
        await jest.setTimeout(8000);
        await jest.unmock('mongoose');
        connection = mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});
        user = new User(testUser);
        id = user.id;
        await user.save();
        console.log('Database connected!');
    });

    afterAll(async () => {
        await user.remove(); //clear test user from DB
    });

    test(`POST /api/v2/users/<unvalid_id>/categories create the category with an invalid user`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/1234sfsf/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Spesa",
            color: "#b90404",
            budget: 200
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Errore, l'id specificato non è valido"});
    });

    test(`POST /api/v2/users/<user_id>/categories create the category without a required parameter`, async () => {
        
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            //name: "Spesa",
            color: "#b90404",
            budget: 200
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Creazione fallita, parametri mancanti."});
    
        response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Spesa",
            //color: "#b90404",
            budget: 200
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Creazione fallita, parametri mancanti."});

        response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Spesa",
            color: "#b90404",
            //budget: 200
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Creazione fallita, parametri mancanti."});
    });

    test(`POST /api/v2/users/<user_id>/categories create the category with an empty name field`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "",
            color: "#b90404",
            budget: 200
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Creazione fallita, parametri mancanti."});
    });

    test(`POST /api/v2/users/<user_id>/categories create the category with an empty color field`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Spesa",
            color: "",
            budget: 200
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Creazione fallita, parametri mancanti."});
    });

    test(`POST /api/v2/users/<user_id>/categories create the category with an non numeric budget`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Spesa",
            color: "#b90404",
            budget: "aaa"
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Il budget assegnato alla categoria non è vaildo"});
    });

    test(`POST /api/v2/users/<user_id>/categories create the category with an non positive budget`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Spesa",
            color: "#b90404",
            budget: -100
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Il budget assegnato alla categoria non è vaildo"});
    });

    test(`POST /api/v2/users/<user_id>/categories create the category with a bigger budget that the total budget`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Spesa",
            color: "#b90404",
            budget: 600
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Creazione fallita, il budget allocato per le categorie supera il budget totale."});
    });

    test(`POST /api/v2/users/<user_id>/categories create a valid category`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Spesa",
            color: "#b90404",
            budget: 200
        });
        console.log(response.body);
        expect (response.statusCode).toBe(201);
    });

    test(`POST /api/v2/users/<user_id>/categories create a category with bigger budget than the residual allocable budget (200)`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Cinema",
            color: "#00000",
            budget: 220
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Creazione fallita, il budget allocato per le categorie supera il budget totale."});
    });

    test(`POST /api/v2/users/<user_id>/categories create a category with the same name of an already existsing category`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Spesa",
            color: "#00000",
            budget: 180
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Creazione fallita, categoria già esistente."});
    });

    test(`POST /api/v2/users/<user_id>/categories create a category with the same color of an already existsing category`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/categories/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            name: "Cinema",
            color: "#b90404",
            budget: 180
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Creazione fallita, colore categoria già assegnato."});
    });
});
    describe('DELETE api/v2/users/<user_id>/categories', () => {
        
        let connection;
        let user, id;
        const User = require("../../models/user");
        const testUser = {
            email: 'test@unitn.it',
            password: 1234,
            budget: 400,
            allocated_budget: 200,
            expenses: [{
                name: "Pizza",  
                categoryId: "",
                amount: 20,
                date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"}],
            categories: [{name: "altro", color: "#919191", budget: 200, cat_spent: 0}, {name: "Spesa", color: "#b90404", budget: 200, cat_spent: 20}]
        }
        // create a valid token
    var payload = {
        email: testUser.email,
        password: testUser.password,
    }

    var options = {
        expiresIn: 86400 // expires in 24 hours
    }

    var token = jwt.sign(payload, process.env.SUPER_SECRET, options);
    
        beforeAll( async () => {
            await jest.unmock('mongoose');
            user = new User(testUser);
            id = user.id;
            user.expenses[0].categoryId = user.categories[1]._id;
            await user.save();
        });
    
        afterAll(async () => {
            user = User.findById(id);
            await user.remove(); //clear test user from DB
            mongoose.connection.close(); //close connection
            console.log("Database connection closed");
        });

        test(`DELETE /api/v2/users/<user_id>/categories delete a non existinig category`, async () => {
            let response = await request(app)
            .delete(`/api/v2/users/${id}/categories/?token=${token}`)
            .set('Accept', 'application/json')
            .send({
                name: "Cinema",
            });
            expect (response.statusCode).toBe(400);
            response = response.body;
            expect (response).toEqual({success: false, message: "Cancellazione fallita, categoria non esistente."});
        });

        test(`DELETE /api/v2/users/<user_id>/categories delete the default category`, async () => {
            let response = await request(app)
            .delete(`/api/v2/users/${id}/categories/?token=${token}`)
            .set('Accept', 'application/json')
            .send({
                name: "altro",
            });
            expect (response.statusCode).toBe(400);
            response = response.body;
            expect (response).toEqual({success: false, message: "Impossibile eliminare la categoria di default"});
        });

        test(`DELETE /api/v2/users/<user_id>/categories delete an existinig category`, async () => {
            let response = await request(app)
            .delete(`/api/v2/users/${id}/categories/?token=${token}`)
            .set('Accept', 'application/json')
            .send({
                name: "Spesa",
            });
            expect (response.statusCode).toBe(204);
            user = await User.findById(id);
            expect (user.allocated_budget).toBe(0); //after deleting the only category, the allocated budget should be set to 0
            expect (user.expenses[0].categoryId).toBe(user.categories[0].id); //the categoryId of the expense should be set to the default category id
            expect (user.categories[0].cat_spent).toBe(20); //the budget spent on the default category should be equal to the old category's budget spent (20)
        });

});