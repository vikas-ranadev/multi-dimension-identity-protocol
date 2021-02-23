const mongoose = require('mongoose');

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
};

exports.connectDB = async (connection, mongodbUser, mongodbPass) => {
  if (mongodbUser) {
    options.user = mongodbUser;
  }
  if (mongodbPass) {
    options.pass = mongodbPass;
  }
  return mongoose.connect(`${connection}`, options);
};
