const { Keypair } = require('stellar-sdk');
const CryptoJS = require("crypto-js");

const { createAccount, manageData } = require('./StellarOperations');
const { generateTestPair, getAccount } = require('./StellarServer');
const { resolveAddress } = require('./StellarTools');
const { ERRORS } = require('../helpers/errors');
const { chunkData, glueData } = require('./DataManager');

const PASSWORD_PREFIX = 'password_';

const encrypt = (d, p) => CryptoJS.AES.encrypt(d, p).toString();
const decrypt = (d, p) => CryptoJS.AES.decrypt(d, p).toString(CryptoJS.enc.Utf8);

/**
 * Decrypt the seed stored on account data
 * @param {Object} account - Stellar account
 * @param {String} password - User password
 * @return {String} seed - Account seed
 */
const extractSeed = (account, password) => {
  let seedData;
  try {
    seedData = glueData(PASSWORD_PREFIX, account.data_attr);
  }
  catch(e) {
    throw ERRORS.ACCOUNT_NO_SEEDDATA(account.account_id);
  }

  try {
    const decrypted = decrypt(seedData, password);
    if(!decrypted) {
      throw new Error();
    }
    return decrypted;
  } catch(e) {
    throw ERRORS.INVALID_PASSWORD(account.account_id);
  }
};

/**
 * Store the seed encrypted in the account data
 * @param keypair - account keypair
 * @param password - password to set
 * @return {Promise.<*>}
 */
const setAccountSeed = async (keypair, password) => {
  const encryptedSeed = encrypt(keypair.secret(), password);
  const seedData = chunkData(PASSWORD_PREFIX, encryptedSeed);

  return manageData(seedData)(keypair);
};

/**
 * Create account with stored encrypted seed on testnet with friendbot
 * @param password - Password to set on the account
 * @return {Promise.<Keypair>} keypair - Keypair of the newly created account
 */
const createAccountEncrypted_test = async (password) => {
  const keypair = await generateTestPair();

  await setAccountSeed(keypair, password);

  return keypair;
};

/**
 * Create a new account from a funding account
 * @param fundingSeed - Seed of the funding account
 * @param fundingInitial - Initial amount of XLM for the new account
 * @param password - password for the new account
 * @return {Promise.<Keypair>} keypair - Keypair of the newly created account
 */
function createAccountEncrypted({
  fundingSeed,
  fundingInitial,
  password,
}) {
  const keypair = Keypair.random();
  const fundingKeypair = Keypair.fromSecret(fundingSeed);

  return createAccount({
    destination: keypair.publicKey(),
    amount: fundingInitial,
  })(fundingKeypair)
    .then(() => setAccountSeed(keypair, password))
    .then(() => keypair);
}

// Resolve address (federation or account ID) and decrypt the seed in it
/**
 * Retrieve the keypair from a federation address and a password
 * @param address - Stellar federation address
 * @param password - Password for the account
 * @return {Promise.<Keypair>} keypair - Keypair of the account
 */
const getKeypairFromLogin = async (address, password) => {
  try {
    const resolved = await resolveAddress(address);
    const account = await getAccount(resolved.account_id);
    const seed = extractSeed(account, password);

    return Keypair.fromSecret(seed);
  } catch(e) {
    if(e.message && e.message.status === 404) {
      throw ERRORS.ACCOUNT_NOT_EXIST({ address });
    }
    throw e;
  }
};

module.exports = {
  extractSeed,
  setAccountSeed,
  createAccountEncrypted,
  createAccountEncrypted_test,
  getKeypairFromLogin,
  PASSWORD_PREFIX,
};
