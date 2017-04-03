const { getServerInstance }  = require('./StellarServer');
const { AssetInstance }  = require('./StellarTools');

const REFRESH_INTERVAL = 2000;
const traceError = () => 0;

const paymentListener = ({
  accountId,
  onPayment = () => 0,
  onError = () => 0,
  cursor = 0,
}) => {
  getServerInstance().payments()
    .forAccount(accountId)
    .order('asc')
    .cursor(cursor)
    .stream({
      onmessage: data => (
        data.transaction()
          .then(transaction => Object.assign({}, data, transaction))
          .then(onPayment)
      ),
      onerror: onError,
    });
};

const Orderbook = ({ selling, buying }) =>
  getServerInstance()
    .orderbook(AssetInstance(selling), AssetInstance(buying))
    .call();

const OrderbookStream = ({ selling, buying }, onmessage) =>
  getServerInstance()
    .orderbook(AssetInstance(selling), AssetInstance(buying))
    .stream({ onmessage });

const OrderbookDetail = ({ selling, buying }) =>
  getServerInstance()
    .orderbook(AssetInstance(selling), AssetInstance(buying))
    .trades()
    .call();

const AccountStream = (accountId, callback) =>
  getServerInstance()
    .accounts()
    .accountId(accountId)
    .stream({
      onmessage: (streamAccount) => {
        callback(augmentAccount(streamAccount));
      },
      onerror: traceError,
    });

const OffersStream = (accountId, callback) => {
  const timerId = setInterval(() => {
    getServerInstance()
      .offers('accounts', accountId)
      .order('desc')
      .call()
      .then(result => callback(result.records));
  }, REFRESH_INTERVAL);

  return () => clearInterval(timerId);
};

const EffectsStream = (accountId, onmessage) =>
  getServerInstance()
    .effects()
    .forAccount(accountId)
    .order('asc')
    .stream({ onmessage });

const PaymentStream = (accountId, onmessage) =>
  getServerInstance()
    .payments()
    .forAccount(accountId)
    .order('asc')
    .stream({
      onmessage: (payment) => {
        payment.transaction().then((transaction) => {
          onmessage(Object.assign({}, payment, {
            transaction,
          }));
        });
      },
      onerror: traceError,
    });

module.exports = {
  paymentListener,
  Orderbook,
  OrderbookStream,
  OrderbookDetail,
  AccountStream,
  OffersStream,
  EffectsStream,
  PaymentStream,
};