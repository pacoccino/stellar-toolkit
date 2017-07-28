const async = require('async');
const { isString, isNumber, isFunction } = require('lodash');
const { Account, Memo, Operation, TransactionBuilder } = require('stellar-sdk');

const Stellar = require('./StellarServer');
const { getAccount } = require('./StellarServer');
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

const queues = {};

/**
 * Build and send a transacton
 *
 * @param operations {Operation[]}
 * @param operation {Operation}
 * @param memo {Object}
 * @param {Keypair} rawKeypair keypair to sign the transaction with
 * @returns {Promise}
 */
const sendTransaction = ({ operations, operation, memo }, rawKeypair) => {
  const keypair = KeypairInstance(rawKeypair);
  const sourceAddress = keypair.publicKey();

  if(!queues.sourceAddress) {
    queues.sourceAddress = async.queue(async (task, callback) => {
      try {
        const result = await task.fn();
        task.onEnd(null, result);
        callback();
      } catch(e) {
        task.onEnd(e);
        callback(e);
      }
    }, 1);
  }

  return new Promise((resolve, reject) => {
    queues.sourceAddress.push({
      fn: () => getAccount(sourceAddress)
        .then(sourceAccount => {
          const sequenceNumber = sourceAccount.sequence;
          const transAccount = new Account(sourceAddress, sequenceNumber);

          const transactionBuilder = new TransactionBuilder(transAccount);

          addOperations(transactionBuilder, { operations, operation });
          addMemo(transactionBuilder, memo);

          const transaction = transactionBuilder.build();
          transaction.sign(keypair);

          return Stellar.getServerInstance().submitTransaction(transaction);
        }),
      onEnd: (e, result) => {
        if(e) {
          reject(e);
        } else {
          resolve(result);
        }
      }
    });
  });
};

const transactionLauncher = transactionInfo => keypair => sendTransaction(transactionInfo, keypair);

const sendPayment = ({ asset, destination, amount, memo }) => {
  const operation = Operation.payment({
    destination,
    asset: AssetInstance(asset),
    amount: AmountInstance(amount),
  });
  return transactionLauncher({ operation, memo });
};

const sendPathPayment = ({
                           asset_source,
                           asset_destination,
                           amount_destination,
                           destination,
                           max_amount,
                           memo,
                         }) => {
  const operation = Operation.pathPayment({
    sendAsset: AssetInstance(asset_source),
    sendMax: AmountInstance(max_amount),
    destination,
    destAsset: AssetInstance(asset_destination),
    destAmount: AmountInstance(amount_destination),
  });
  return transactionLauncher({ operation, memo });
};

const changeTrust = ({ asset, limit }) => {
  const trustLimit = (isNumber(limit) || isString(limit)) ? AmountInstance(limit) : undefined;
  const operation = Operation.changeTrust({
    asset: AssetInstance(asset),
    limit: trustLimit,
  });

  return transactionLauncher({ operation });
};

const manageOffer = ({ selling, buying, amount, price, passive, id }) => {
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
};

const createAccount = ({ destination, amount }) => {
  const operation = Operation.createAccount({
    destination,
    startingBalance: AmountInstance(amount),
  });

  return transactionLauncher({ operation });
};

const accountMerge = ({ destination }) => {
  const operation = Operation.accountMerge({
    destination,
  });

  return transactionLauncher({ operation });
};

const manageData = (data) => {
  const operations = Object.keys(data)
    .map(prop => Operation.manageData({
      name: prop,
      value: data[prop],
    }));

  return transactionLauncher({ operations });
};

const allowTrust = ({ trustor, assetCode, authorize }) => {
  const operation = Operation.allowTrust({
    trustor,
    assetCode,
    authorize
  });

  return transactionLauncher({ operation });
};

module.exports = {
  sendTransaction,
  sendPayment,
  sendPathPayment,
  changeTrust,
  manageOffer,
  createAccount,
  accountMerge,
  allowTrust,
  manageData,
};
