/**
 * https://www.npmjs.com/package/supertest
 */
const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app = require('../../app');
const mongoose = require('mongoose');

const testUser = {
  '_id' : '6298912c93341476153a2ca9',
  'email': 'test@unitn.it',
  'password': 1234,
  'categories': [{"id": "629891b893341476153a2caa", "name": "altro", "color": "#919191", "budget": 125, "cat_spent": 26}],
  'expenses': [{"id": "629508bf579df6ec946b96bc", "name": "spesa", "categoryId":"629891b893341476153a2caa", "amount": 6}]
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
 *  ______________________________Test GET route on expenses___________________________________
 */
describe('GET /api/v2/users/:id/expenses', () => {

  // Moking User.findById method
  let userSpyFindById;

  beforeAll( () => {
    const User = require('../../models/user');
    userSpyFindById = jest.spyOn(User, 'findById').mockImplementation((id) => {
      if (id==testUser._id)
        return testUser;
      else
        return {};
    });

  });

  afterAll(async () => {
    userSpyFindById.mockRestore();
  });
  /*
  test('GET /api/v2/users/:id/expenses/:id should respond with an array of expenses', async () => {
    return request(app)
      .get('/api/v2/expenses')
      .expect('Content-Type', /json/)
      .expect(200)
      .then( (res) => {
        if(res.body && res.body[0]) {
          expect(res.body[0]).toEqual({
            success: 'true'
          });
        }
      });
  });
*/
  
  test('GET /api/v2/users/<testUser.id>/expenses/ with no token, should return 401', async () => {  
    const response = await request(app).get('/api/v2/users/629725a5c1345475f676cfef/expenses/');
    expect (response.statusCode).toBe(401);
  });

  test('GET /api/v2/users/<testUser.id>/expenses/ with invalid, token should return 403', async () => {  
    const response = await request(app).get('/api/v2/users/6298912c93341476153a2ca9/expenses?token=invalid');
    expect (response.statusCode).toBe(403);
  });
        
  test('GET /api/v2/users/<testUser.id>/expenses/ with a valid token, should return a vector containing the list of all expenses', async () => {  
    
    const response = await request(app).get('/api/v2/users/6298912c93341476153a2ca9/expenses/?token='+token);
    const expenses = response.body.expenses;
    expect(expenses).toBeDefined();
    expect(expenses).toContainEqual({"id": "629508bf579df6ec946b96bc", "name": "spesa", "categoryId":"altro", "amount": 6});

  });

});


/*
 *  ______________________________Test POST route on expenses___________________________________
 */
describe('POST api/v2/users/:id/expenses', () => {
  
  let connection;
  let user, _id, cat_id;
  const User = require("../../models/user");

  beforeAll( async () => {
    await jest.setTimeout(8000);
    await jest.unmock('mongoose');
    connection = mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});
    
    user = new User({
      email: 'test@unitn.it',
      password: 1234,
      budget: 125,
      allocated_budget: 0,
      budget_spent: 0,
      categories: [{"name": "altro", "color": "#919191", "budget": 125, "cat_spent": 0}],
    });
    
    _id = user.id;
    cat_id = user.categories[0]._id;
    await user.save();
    console.log('Database connected!');
    
  });

  afterAll(async () => {
    await user.remove(); //clear the user from DB
  });

  test('POST /api/v2/users/<testUser.id>/expenses/ without setting the expense name, should return an errror message', async () => {  
    
     return request(app)
     .post(`/api/v2/users/${_id}/expenses/?token=${token}`)
     .set('Accept', 'application/json')
     .send({
      name: "",
      amount: 12,
      categoryId: cat_id,
      date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"
    })
    .expect(400, {success: false, message: "Creazione fallita, input non validi."});

  });



  test('POST /api/v2/users/<testUser.id>/expenses/ setting a negative amount, should return an errror message', async () => {  
    
    return request(app)
    .post(`/api/v2/users/${_id}/expenses/?token=${token}`)
    .set('Accept', 'application/json')
    .send({
     name: "pizza",
     amount: -2,
     categoryId: cat_id,
     date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"
   })
   .expect(400, {success: false, message: "Creazione fallita, input non validi."});

 });

test('POST /api/v2/users/<testUser.id>/expenses/ without setting a required field, should return an errror message', async () => {  
    
  let response = await request(app)
  .post(`/api/v2/users/${_id}/expenses/?token=${token}`)
  .set('Accept', 'application/json')
  .send({
   name: "pizza",
   amount: 0,
   categoryId: cat_id,
   //date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"
 });
 expect (response.statusCode).toBe(400);
 response = response.body;
 expect (response).toEqual({"success": false, "message": "Creazione fallita, input non validi."});

 response = await request(app)
  .post(`/api/v2/users/${_id}/expenses/?token=${token}`)
  .set('Accept', 'application/json')
  .send({
   name: "pizza",
   amount: 0,
   //categoryId: testUser.categories[0].id,
   date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"
 });
 expect (response.statusCode).toBe(400);
 response = response.body;
 expect (response).toEqual({"success": false, "message": "Creazione fallita, input non validi."});

 response = await request(app)
  .post(`/api/v2/users/${_id}/expenses/?token=${token}`)
  .set('Accept', 'application/json')
  .send({
   name: "pizza",
   //amount: 0,
   categoryId: cat_id,
   date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"
 })
 expect (response.statusCode).toBe(400);
 response = response.body;
 expect (response).toEqual({"success": false, "message": "Creazione fallita, input non validi."});

  response = await request(app)
    .post(`/api/v2/users/${_id}/expenses/?token=${token}`)
    .set('Accept', 'application/json')
    .send({
    //name: "pizza",
    amount: 0,
    categoryId: cat_id,
    date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"
  })
  expect (response.statusCode).toBe(400);
  response = response.body;
  expect (response).toEqual({"success": false, "message": "Creazione fallita, input non validi."});

});


test('POST /api/v2/users/<testUser.id>/expenses/ setting a non existing category, should return an errror message', async () => {  
    
  return request(app)
  .post(`/api/v2/users/${_id}/expenses/?token=${token}`)
  .set('Accept', 'application/json')
  .send({
   name: "pizza",
   amount: 12,
   categoryId: "pesci",
   date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"
 })
 .expect(400, {success: false, message: "Creazione fallita, categoria non esistente."});

});

test('POST /api/v2/users/<testUser.id>/expenses/ setting an invalid date, should return an errror message', async () => {  
    
return request(app)
  .post(`/api/v2/users/${_id}/expenses/?token=${token}`)
  .set('Accept', 'application/json')
  .send({
   name: "pizza",
   amount: 12,
   categoryId: cat_id,
   date: "a"
 })
 .expect(400, {success: false, message: "Creazione fallita, input non validi."});

});

test('POST /api/v2/users/<testUser.id>/expenses/ set a valid expense', async () => {  
    
  let response = await request(app)
    .post(`/api/v2/users/${_id}/expenses/?token=${token}`)
    .set('Accept', 'application/json')
    .send({
     name: "pizza",
     amount: 12,
     categoryId: cat_id,
     date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"
   });
  
  user = await User.findById(_id);
  expect (response.statusCode).toBe(201);
  expect (user.budget).toBe(125); // total budget is still 125
  expect (user.budget_spent).toBe(12); //budget spent has been incremented
  expect (user.allocated_budget).toBe(0); //since we have only the default category should remain 0
  expect (user.categories[0].cat_spent).toBe(12); // default cat_spent has been incremented
  });
  
});



 /*
  *  ______________________________Test DELETE route on expenses___________________________________
  */

 describe('DELETE api/v2/users/:id/expenses', () => {
  
  let user, id, exp_id;
  const User = require("../../models/user");

  beforeAll( async () => {
    await jest.unmock('mongoose');
    
    user = new User({
      email: 'test@unitn.it',
      password: 1234,
      budget: 125,
      allocated_budget: 0,
      budget_spent: 12,
      expenses: [{amount: 12,
        categoryId: "",
        date: "Thu Jun 02 2022 11:31:55 GMT+0200 (CEST)"
      }],
      categories: [{name: "altro", color: "#919191", budget: 125, cat_spent: 12}],
    });
    
    id = user.id;
    user.expenses[0].categoryId = user.categories[0]._id;
    exp_id = user.expenses[0].id;
    await user.save();
    
  });

  afterAll(async () => {
    await user.remove(); //clear the user from DB
    mongoose.connection.close(true); //close connection
    console.log("Database connection closed");
  });

  test(`DELETE /api/v2/users/${id}/expenses/foo delete a non existing expense`, async () => {  
  
    let response = await request(app)
      .delete(`/api/v2/users/${id}/expenses/foo?token=${token}`)
      .set('Accept', 'application/json');

    expect (response.statusCode).toBe(400);
    });

    test(`DELETE /api/v2/users/null/expenses/${exp_id} delete with a non existing user`, async () => {  
  
      let response = await request(app)
        .delete(`/api/v2/users/null/expenses/${exp_id}?token=${token}`)
        .set('Accept', 'application/json')
  
      expect (response.statusCode).toBe(400);
      });

      test(`DELETE /api/v2/users/${id}/expenses/${exp_id} correctly delete an expense`, async () => {  
  
        let response = await request(app)
          .delete(`/api/v2/users/${id}/expenses/${exp_id}?token=${token}`)
          .set('Accept', 'application/json')
        user = await User.findById(id);
        expect (response.statusCode).toBe(204); //success
        expect (user.expenses.length).toBe(0); //delete the only expense 
        expect (user.budget_spent).toBe(0); //decrease the budget spent (=12) by the expense amount (=12)
        expect (user.categories[0].cat_spent).toBe(0); //decrease the budget spent (=12) in the category by the expense amount (=12)
      
      });

});