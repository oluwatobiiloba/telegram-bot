const Joi = require('joi');

const VALID_TOKENS_ATTRIB = ['spotify'];
const VALID_TOKEN_TYPE = ['refresh', 'access', 'id'];

// User Schema Example
// const resource = {
//   id: 'hashed-chat-id',
//   partitionKey: 'hashed-chat-id',
//   data: {
//     name: 'user-name',
//     chatId: 'user-chatId',
//     tokens: {
//       spotify: {
//         id: 'spotify-profile-id',
//         access: 'JSON -> {iv, encryptedData, expTimeMillis}',
//         refresh: 'JSON -> {iv, encryptedData}',
//       },
//     },
//   },
// };

const USER_TOKEN_SPEC = Joi.object().keys({
  refresh: Joi.string(),
  access: Joi.string(),
  id: Joi.string(),
});

const USER_SPEC = Joi.object({
  name: Joi.string().trim().required(),
  chatId: Joi.number().required(),
  tokens: Joi.object().keys({
    spotify: USER_TOKEN_SPEC,
  }),
});

const UPDATE_TOKEN_SPEC = Joi.object({
  attribute: Joi.string().valid(...VALID_TOKENS_ATTRIB).required(),
  tokenName: Joi.string().valid(...VALID_TOKEN_TYPE).required(),
  tokenValue: Joi.string().required(),
});

const UPDATE_TOKENS_SPEC = Joi.object({
  attribute: Joi.string().valid(...VALID_TOKENS_ATTRIB).required(),
  tokens: USER_TOKEN_SPEC,
});

module.exports = {
  USER_SPEC,
  UPDATE_TOKEN_SPEC,
  UPDATE_TOKENS_SPEC,
};
