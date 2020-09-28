//Required modules
const express = require('express');
const app = express();
var ipfsRouter = require('./route/router');



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// config ipfs router
app.use('/ipfs/', ipfsRouter);

app.listen(3000, () => console.log('Waiting for requests on port 3000'))