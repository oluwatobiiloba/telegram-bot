const { user } = require('../containers');
const { USER_SPEC, UPDATE_TOKEN_SPEC, UPDATE_TOKENS_SPEC } = require('../schemas/user');
const schemaValidator = require('../schemas/validator');

const TOKENS_BASE_PATH = '/data/tokens';

module.exports = {
  createUser(id, data) {
    const idStr = id.toString();

    let validData = schemaValidator(USER_SPEC, data);

    if (!validData.tokens) {
      validData.tokens = {};
    }

    return user.create(idStr, validData);
  },

  getUser(id) {
    const idStr = id.toString();

    return user.get(idStr);
  },

  async findOrCreateUser(id, data) {
    const idStr = id.toString();

    let user = await this.getUser(idStr);

    if (!user?.resource) user = await this.createUser(idStr, data);

    return user;
  },

  addToken(id, data) {
    const idStr = id.toString();

    const { attribute, tokenName, tokenValue } = schemaValidator(UPDATE_TOKEN_SPEC, data);

    const value = {};
    value[tokenName] = tokenValue;

    const patchOperations = [{ op: 'add', path: `${TOKENS_BASE_PATH}/${attribute}`, value }];

    return user.update(idStr, patchOperations);
  },

  addTokens(id, data) {
    const idStr = id.toString();

    const { attribute, tokens } = schemaValidator(UPDATE_TOKENS_SPEC, data);

    const patchOperations = [
      { op: 'add', path: `${TOKENS_BASE_PATH}/${attribute}`, value: tokens },
    ];

    return user.update(idStr, patchOperations);
  },
  // Still need to have appendToken functions gonna be like the update but with op:'add'
  async getTokens(id) {
    let tokens;
    const idStr = id.toString();

    const { resource } = await user.get(idStr);

    if (resource) tokens = resource.data.tokens;

    return tokens;
  },

  async updateToken(id, data) {
    const idStr = id.toString();

    const { attribute, tokenName, tokenValue } = schemaValidator(UPDATE_TOKEN_SPEC, data);

    const patchOperations = [
      { op: 'replace', path: `${TOKENS_BASE_PATH}/${attribute}/${tokenName}`, value: tokenValue },
    ];

    return user.update(idStr, patchOperations);
  },

  async updateTokens(id, data) {
    const idStr = id.toString();

    const { attribute, tokens } = schemaValidator(UPDATE_TOKENS_SPEC, data);

    const patchOperations = Object.entries(tokens).map(([token, value]) => {
      return { op: 'replace', path: `${TOKENS_BASE_PATH}/${attribute}/${token}`, value };
    });

    return user.update(idStr, patchOperations);
  },

  deleteUser(id) {
    const idStr = id.toString();

    return user.delete(idStr);
  },

  async clearUserToken(id, attribute) {
    const idStr = id.toString();

    const patchOperations = [
      { op: 'replace', path: `${TOKENS_BASE_PATH}/${attribute}`, value: {} },
    ];

    return user.update(idStr, patchOperations);

  }
};
