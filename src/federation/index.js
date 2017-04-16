const { Keypair } = require('stellar-sdk');
const request = require('../helpers/request');
const { sign } = require('../stellar/DataManager');

let federationUrl = "https://stellar-wilson.herokuapp.com/federation";

function setUrl(url) {
  federationUrl = url;
}

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
  setUrl,
  federationResolve,
  federationReverse,
  federationKeypair,
  federationCreate,
  federationRegister,
  federationDelete,
};