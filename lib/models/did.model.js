const mongoose = require('mongoose');
const { W3C_DID_SCHEMA } = require('../utils/constants');

const { Schema } = mongoose;

const didSchema = new Schema(
  {
    '@context': [{ type: String, default: W3C_DID_SCHEMA }],
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    publicKey: [
      {
        _id: false,
        id: { type: String, required: true },
        controller: { type: String, required: true },
        type: { type: String, required: true },
        publicKey: { type: String },
        publicKeyBase58: { type: String },
      },
    ],
    authentication: [{ type: String }],
    assertionMethod: [{ type: String }],
  },
  { timestamps: {} },
);

module.exports = mongoose.model('did', didSchema);
