const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app = require('../../app');
const mongoose = require('mongoose');

const testUser = {
    email: 'test@unitn.it',
    password: 1234,
    budget: 0
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

/*
 *  ______________________________Test POST route on budget___________________________________
 */
describe('POST api/v2/users/:id/budget', () => {
  
    let connection;
    let user, id;
    const User = require("../../models/user");


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
        mongoose.connection.close(true); //close connection
        console.log("Database connection closed");
    });

    test(`POST /api/v2/users/<unvalid_id>/budget create the budget with an invalid user`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/1234sfsf/budget/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            budget: 200,
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "Errore, l'id specificato non è valido"});
    });

    test(`POST /api/v2/users/${id}/budget create the budget without setting a value`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/budget/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            budget: "",
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "input non valido"});
    });

    test(`POST /api/v2/users/${id}/budget create the budget with a non-numeric value`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/budget/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            budget: "a",
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "input non valido"});
    });

    test(`POST /api/v2/users/${id}/budget create a negative budget`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/budget/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            budget: -1,
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "input non valido"});
    });

    test(`POST /api/v2/users/${id}/budget create a zero budget`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/budget/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            budget: 0,
        });
        expect (response.statusCode).toBe(400);
        response = response.body;
        expect (response).toEqual({success: false, message: "input non valido"});
    });

    test(`POST /api/v2/users/${id}/budget create valid budget`, async () => {
        let response = await request(app)
        .post(`/api/v2/users/${id}/budget/?token=${token}`)
        .set('Accept', 'application/json')
        .send({
            budget: 200,
        });

        expect (response.statusCode).toBe(201); //creation successful
        let user = await User.findById(id);
        expect (user.budget).toBe(200); //budget correctly updated
    });

});
