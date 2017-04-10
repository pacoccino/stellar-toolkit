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
    case 'perso':
      Server = new Stellar.Server('http://192.168.1.67:8000', { allowHttp: true });
      Stellar.Network.useTestNetwork();
      break;
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

async function generateTestPair() {
  const pair = Stellar.Keypair.random();

  try {
    await fetch(`https://horizon-testnet.stellar.org/friendbot?addr=${pair.publicKey()}`);
    return pair;
  } catch (e) {
    throw e;
  }
}

switchNetwork();

module.exports = {
  getServerInstance,
  getAccount,
  generateTestPair,
};