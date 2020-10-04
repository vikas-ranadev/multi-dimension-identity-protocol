//Required modules
const express = require('express');
const app = express();
var ethRouter = require('./router/routes');



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// config ipfs router
app.use('/ethdid/', ethRouter);

app.listen(3001, () => console.log('ETHDID API accepting requests on port 3000'))