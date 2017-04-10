const { isString, isNumber, isFunction } = require('lodash');
const { Account, Memo, Operation, TransactionBuilder } = require('stellar-sdk');

const Stellar = require('./StellarServer');
const { AssetInstance, KeypairInstance, AmountInstance } = require('./StellarTools');

/**
 * Add a list of operations to a transaction builder
 *
 * @param transactionBuilder {TransactionBuilder} - from stellar SDK
 * @param operations {Operation[]} List of operations
 * @param operation {Object} One operation
 */
const addOperations = (transactionBuilder, { operations = [], operation = null }) => {
  [operation].concat(operations)
    .filter(o => !!o)
    .forEach(op => transactionBuilder.addOperation(op));
};

/**
 * Add a memo to a transaction
 *
 * @param transactionBuilder {TransactionBuilder} - from stellar SDK
 * @param memo {Object}
 * @param memo.type {String} One of Stellar.Memo static methods
 * @param memo.value {String} Memo value
 */
const addMemo = (transactionBuilder, memo) => {
  if (!transactionBuilder || !memo) return;

  const { type, value } = memo;
  let xdrMemo;

  if (isFunction(Memo[type])) {
    xdrMemo = Memo[type](value);
  }
  if (xdrMemo) {
    transactionBuilder.addMemo(xdrMemo);
  }
};

/**
 * Build and send a transacton
 *
 * @param authData {Object} Source account and signers data
 * @param authData.keypair {Keypair} keypair of sender and signer
 * @param authData.sourceAccount {Account} Account of sender
 * @param operations {Operation[]}
 * @param operation {Operation}
 * @param memo {Object}
 * @returns {Promise}
 */
const sendTransaction = ({ operations, operation, memo }, authData) => {
  if(!authData.sourceAccount || !authData.keypair) {
    throw 'Invalid parameters';
  }
  const keypair = KeypairInstance(authData.keypair);
  const sourceAccount = authData.sourceAccount;
  const sourceAddress = keypair.publicKey();
  const sequenceNumber = sourceAccount.sequence;
  const transAccount = new Account(sourceAddress, sequenceNumber);

  const transactionBuilder = new TransactionBuilder(transAccount);

  addOperations(transactionBuilder, { operations, operation });
  addMemo(transactionBuilder, memo);

  const transaction = transactionBuilder.build();
  transaction.sign(keypair);

  return Stellar.getServerInstance().submitTransaction(transaction);
};

const transactionLauncher = transactionInfo => authData => sendTransaction(transactionInfo, authData);

const sendPayment = ({ asset, destination, amount, memo }) => {
  try {
    const operation = Operation.payment({
      destination,
      asset: AssetInstance(asset),
      amount: AmountInstance(amount),
    });
    return transactionLauncher({ operation, memo });
  } catch (e) {
    return Promise.reject(e);
  }
};

const sendPathPayment = ({
  asset_source,
  asset_destination,
  amount_destination,
  destination,
  max_amount,
  memo,
}) => {
  try {
    const operation = Operation.pathPayment({
      sendAsset: AssetInstance(asset_source),
      sendMax: AmountInstance(max_amount),
      destination,
      destAsset: AssetInstance(asset_destination),
      destAmount: AmountInstance(amount_destination),
    });
    return transactionLauncher({ operation, memo });
  } catch (e) {
    return Promise.reject(e);
  }
};

const changeTrust = ({ asset, limit }) => {
  try {
    const trustLimit = (isNumber(limit) || isString(limit)) ? AmountInstance(limit) : undefined;
    const operation = Operation.changeTrust({
      asset: AssetInstance(asset),
      limit: trustLimit,
    });

    return transactionLauncher({ operation });
  } catch (e) {
    return Promise.reject(e);
  }
};

const manageOffer = ({ selling, buying, amount, price, passive, id }) => {
  try {
    const operations = [];

    const offerId = isNumber(id) ? id : 0;
    const offer = {
      selling: AssetInstance(selling),
      buying: AssetInstance(buying),
      amount: AmountInstance(amount),
      price: AmountInstance(price),
      offerId,
    };
    if (passive) {
      operations.push(Operation.createPassiveOffer(offer));
    } else {
      operations.push(Operation.manageOffer(offer));
    }

    return transactionLauncher({ operations });
  } catch (e) {
    return Promise.reject(e);
  }
};

const createAccount = ({ destination, amount }) => {
  try {
    const operation = Operation.createAccount({
      destination,
      startingBalance: amount,
    });

    return transactionLauncher({ operation });
  } catch (e) {
    return Promise.reject(e);
  }
};

const accountMerge = ({ destination }) => {
  try {
    const operation = Operation.accountMerge({
      destination,
    });

    return transactionLauncher({ operation });
  } catch (e) {
    return Promise.reject(e);
  }
};

const manageData = (data) => {
  const operations = Object.keys(data)
    .map(prop => Operation.manageData({
      name: prop,
      value: data[prop],
    }));

  return transactionLauncher({ operations });
};

module.exports = {
  sendTransaction,
  sendPayment,
  sendPathPayment,
  changeTrust,
  manageOffer,
  createAccount,
  accountMerge,
  manageData,
};
