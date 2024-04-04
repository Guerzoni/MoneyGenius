
const app = require("./app/app.js")
const mongose = require('mongoose');

const port = process.env.PORT || 8080;

app.locals.db = mongose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    
    console.log("Connected to Database");

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });

});
