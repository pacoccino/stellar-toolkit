const { Keypair } = require('stellar-sdk');
const request = require('../helpers/request');
const { sign } = require('../stellar/DataManager');

let federationUrl = "https://api.willet.io/federation";

/**
 * @description Set URL of the federation server
 * @param {String} url  - Url of the federation server
 */
function setUrl(url) {
  federationUrl = url;
}

/**
 * Resolve account ID from username
 * @param {String} stellar_address - Federation name
 * @returns {Object} FederationResult
 */
function federationResolve(stellar_address) {
  return request({
    url: federationUrl,
    qs: {
      type: 'name',
      q: stellar_address,
    },
  });
}

/**
 * @description Resolve username from account ID
 * @param {String} account_id - Stellar account ID
 * @returns {Object} FederationResult - Stellar account informations if found on the server
 */
function federationReverse(account_id) {
  return request({
    url: federationUrl,
    qs: {
      type: 'id',
      q: account_id,
    },
  });
}

/**
 * @description Returns the keypair of the account if the seed is stored encrypted with a password in account data
 * @param {Object} data
 * @param {String} data.q - Stellar address
 * @param {String} data.password - Password
 * @returns {Object} keypair - Seed + Account ID
 */
function federationKeypair({ q, password }) {
  return request({
    url: federationUrl,
    qs: {
      type: 'keypair',
      q,
      password,
    },
  });
}

/**
 * @description Create a stellar account and register it on the federation server
 * @param stellar_address - Federation address to register
 * @returns {Keypair} keypair - Newly created account's keypair
 */
function federationCreate(stellar_address) {
  const keypair = Keypair.random();
  const body = {
    stellar_address,
    account_id: keypair.publicKey(),
  };
  const signature = sign(body, keypair.secret());
  return request({
    url: federationUrl,
    method: 'POST',
    body,
    headers: {
      signature,
    },
  }).then(() => keypair);
}

/**
 * @description Register an existing stellar account on the federation server
 * @param stellar_address - Federation name to register
 * @param keypair - Keypair of the existing stellar account to register (to sign the message)
 * @returns {*}
 */
function federationRegister({ stellar_address, keypair }) {
  const body = {
    stellar_address,
    account_id: keypair.publicKey(),
  };
  const signature = sign(body, keypair.secret());

  return request({
    url: federationUrl,
    method: 'PUT',
    headers: {
      signature,
    },
    body,
  });
}

/**
 * @description Removes an existing stellar account on the federation server
 * @param stellar_address - Federation name to register
 * @param keypair - Keypair of the existing stellar account to register (to sign the message)
 * @returns {*}
 */
function federationDelete({ stellar_address, keypair }) {
  const body = {
    stellar_address,
    account_id: keypair.publicKey(),
  };
  const signature = sign(body, keypair.secret());

  return request({
    url: federationUrl,
    method: 'PUT',
    headers: {
      signature,
    },
    body,
  });
}

module.exports = {
  setUrl,
  federationResolve,
  federationReverse,
  federationKeypair,
  federationCreate,
  federationRegister,
  federationDelete,
};