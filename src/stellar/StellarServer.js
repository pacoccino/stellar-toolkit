const Stellar = require('stellar-sdk');
const fetch = require('isomorphic-fetch');

const { augmentAccount } = require('./StellarTools');

let Server;

const getServerInstance = () => Server;

const getAccount = accountId =>
  getServerInstance()
    .loadAccount(accountId)
    .then(augmentAccount);

const switchNetwork = (network) => {
  switch (network) {
    case 'public':
      Server = new Stellar.Server('https://horizon.stellar.org');
      Stellar.Network.usePublicNetwork();
      break;
    default:
    case 'test':
      Server = new Stellar.Server('https://horizon-testnet.stellar.org');
      Stellar.Network.useTestNetwork();
      break;
  }
};

function setServer({ url, type = 'test', options = {} }) {
  Server = new Stellar.Server(url, options);
  if(type === 'public') {
    Stellar.Network.usePublicNetwork();
  } else {
    Stellar.Network.useTestNetwork();
  }
}

async function generateTestPair(seed) {
  let pair = null;
  if(seed) {
    pair = Stellar.Keypair.fromSecret(seed);
  } else {
    pair = Stellar.Keypair.random();
  }

  try {
    await fetch(`https://horizon-testnet.stellar.org/friendbot?addr=${pair.publicKey()}`);
    return pair;
  } catch (e) {
    throw e;
  }
}

switchNetwork();

module.exports = {
  switchNetwork,
  setServer,
  getServerInstance,
  getAccount,
  generateTestPair,
};