const request = require('../helpers/request');
const { sign } = require('../stellar/DataManager');

const federationUrl = "https://stellar-wilson.herokuapp.com/federation";

function federationResolve(stellar_address) {
  return request({
    url: federationUrl,
    qs: {
      type: 'name',
      q: stellar_address,
    },
  });
}

function federationReverse(account_id) {
  return request({
    url: federationUrl,
    qs: {
      type: 'id',
      q: account_id,
    },
  });
}

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

function federationCreate({ stellar_address, password }) {
  return request({
    url: federationUrl,
    method: 'POST',
    body: {
      stellar_address,
      password,
    },
  });
}

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
  federationResolve,
  federationReverse,
  federationKeypair,
  federationCreate,
  federationRegister,
  federationDelete,
};