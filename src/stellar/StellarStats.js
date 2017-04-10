const { Paths, Orderbook }  = require('./StellarStreamers');
const { AssetInstance }  = require('./StellarTools');
const { uniqBy, sortBy } = require('lodash');

const RESULTS = {
  NO_OFFERS: -1,
  NOT_ENOUGH_BIDS: -2,
};

const getExchangeRateFromOffers = ({
  sourceAsset, destinationAsset, destinationAmount, sendMax
}) =>
  (destinationAmount && sendMax) ?
    Promise.reject(new Error('Cannot set both destinationAmount and sendMax')) :
    Orderbook({ buying: destinationAsset, selling: sourceAsset }).then(o => {
      const offers = o.bids;
      if(offers.length === 0) {
        return RESULTS.NO_OFFERS;
      }
      let remainingAmount = sendMax ? sendMax : destinationAmount;
      let i = 0;
      let currentAmount = 0;
      while(remainingAmount > 0 && i < offers.length) {
        if(destinationAmount) {
          currentAmount += Math.min(remainingAmount, offers[i].amount) / offers[i].price;
        } else {
          currentAmount += Math.min(remainingAmount, offers[i].amount) * offers[i].price;
        }
        remainingAmount -= offers[i].amount;
        i++;
      }
      if (remainingAmount > 0) {
        return RESULTS.NOT_ENOUGH_BIDS;
      }
      const newSendMax = sendMax ? sendMax : currentAmount;
      const newDestinationAmount = destinationAmount ? destinationAmount : currentAmount;
      const averagePrice = newDestinationAmount / newSendMax;
      const result = {
        sourceAsset: AssetInstance(sourceAsset),
        destinationAsset: AssetInstance(destinationAsset),
        sendMax: newSendMax,
        destinationAmount: newDestinationAmount,
        rate: averagePrice,
      };
      return result;
    });
/*
const getExchangeRateFrom = ({ sourceAsset, destinationAsset, sendMax }) =>
  Orderbook({ buying: destinationAsset, selling: sourceAsset }).then(o => {
    const offers = o.bids;
    if(offers.length === 0) {
      return RESULTS.NO_OFFERS;
    }
    let remaining = sendMax;
    let i = 0;
    let destinationAmount = 0;
    while(remaining > 0 && i < offers.length) {
      destinationAmount += Math.min(remaining, offers[i].amount) * offers[i].price;
      remaining -= offers[i].amount;
      i++;
    }
    if (remaining > 0) {
      return RESULTS.NOT_ENOUGH_BIDS;
    }
    const averagePrice = destinationAmount / sendMax;
    const result = {
      sourceAsset: AssetInstance(sourceAsset),
      destinationAsset: AssetInstance(destinationAsset),
      sendMax,
      destinationAmount,
      rate: averagePrice,
    };
    return result;
  });
const getExchangeRateTo = ({ sourceAsset, destinationAsset, destinationAmount }) =>
  Orderbook({ buying: destinationAsset, selling: sourceAsset }).then(o => {
    const offers = o.bids;
    if(offers.length === 0) {
      return RESULTS.NO_OFFERS;
    }
    let remaining = destinationAmount;
    let i = 0;
    let sendMax = 0;
    while(remaining > 0 && i < offers.length) {
      sendMax += Math.min(remaining, offers[i].amount) / offers[i].price;
      remaining -= offers[i].amount;
      i++;
    }
    if (remaining > 0) {
      return RESULTS.NOT_ENOUGH_BIDS;
    }
    const averagePrice = destinationAmount / sendMax;
    const result = {
      sourceAsset: AssetInstance(sourceAsset),
      destinationAsset: AssetInstance(destinationAsset),
      sendMax,
      destinationAmount,
      rate: averagePrice,
    };
    return result;
  });
*/
const getPathSource = ({
  source, destination, destinationAsset, destinationAmount,
}) =>
  Paths({
    source, destination, destinationAsset, destinationAmount,
  }).then(results => results.records.map(p => Object.assign({}, p, {
    source_asset: AssetInstance({
      asset_code: p.source_asset_code,
      asset_issuer: p.source_asset_issuer,
      asset_type: p.source_asset_type,
    }),
    destination_asset: AssetInstance({
      asset_code: p.destination_asset_code,
      asset_issuer: p.destination_asset_issuer,
      asset_type: p.destination_asset_type,
    }),
  })))
    .then(paths => paths.map(p => ({
      sourceAsset: p.source_asset,
      destinationAsset: p.destination_asset,
      sendMax: p.source_amount,
      destinationAmount,
      rate: p.destination_amount / p.source_amount,
    })))
    .then(paths => paths.filter(p => p.sourceAsset.uuid !== p.destinationAsset.uuid))
    .then(paths => sortBy(paths, 'sendMax'))
    .then(paths => uniqBy(paths, 'sourceAsset.uuid'));

const getExchangeRateFromAutoPath = ({ account_id, sourceAsset, destinationAsset, destinationAmount }) =>
  getPathSource({
    source: account_id,
    destination: account_id,
    destinationAsset: destinationAsset,
    destinationAmount,
  }).then(paths => paths.find(p => p.sourceAsset.uuid === AssetInstance(sourceAsset).uuid))
    .then(path => ({
      sourceAsset: AssetInstance(path.sourceAsset),
      destinationAsset: AssetInstance(destinationAsset),
      sendMax: path.sendMax,
      destinationAmount,
      rate: path.rate,
    }));

function testEx() {
  const sourceAsset = {
    asset_code: "ETH",
    asset_issuer: "GCA4HSR6WZ67T7PLUXWBW57GZUXJ3EFDPRIPJN65RYB2FVV77XMN2MS7",
  };
  const destinationAsset = {
    asset_code: "BTC",
    asset_issuer: "GCA4HSR6WZ67T7PLUXWBW57GZUXJ3EFDPRIPJN65RYB2FVV77XMN2MS7",
  };

  getExchangeRateFromOffers({
    sourceAsset,
    destinationAsset,
    sendMax: 10,
  }).then(console.log.bind(console, 'getExchangeRateFromOffers'));
  getExchangeRateFromOffers({
    sourceAsset,
    destinationAsset,
    destinationAmount: 10,
  }).then(console.log.bind(console, 'getExchangeRateFromOffers'));
}
function testExPath() {
  const sourceAsset = {
    asset_code: "ETH",
    asset_issuer: "GCA4HSR6WZ67T7PLUXWBW57GZUXJ3EFDPRIPJN65RYB2FVV77XMN2MS7",
  };
  const destinationAsset = {
    asset_code: "BTC",
    asset_issuer: "GCA4HSR6WZ67T7PLUXWBW57GZUXJ3EFDPRIPJN65RYB2FVV77XMN2MS7",
  };

  getExchangeRateFromAutoPath({
    account_id: 'GA5D4OFB2P6NG2RDA4324OD2IGHRY5TLQL466DJ76O7HYN2R42PMIPIF',
    sourceAsset,
    destinationAsset,
    destinationAmount: 10,
  }).then(console.log.bind(console, 'getExchangeRateFromAutoPath'));
}
function testpathSource() {
  const source = "GA5D4OFB2P6NG2RDA4324OD2IGHRY5TLQL466DJ76O7HYN2R42PMIPIF";
  const destination = "GCA4HSR6WZ67T7PLUXWBW57GZUXJ3EFDPRIPJN65RYB2FVV77XMN2MS7";
  const destinationAsset = {
    asset_code: "BTC",
    asset_issuer: "GCA4HSR6WZ67T7PLUXWBW57GZUXJ3EFDPRIPJN65RYB2FVV77XMN2MS7",
  };

  getPathSource({
    source,
    destination,
    destinationAsset,
    destinationAmount: 10,
  }).then(console.log.bind(console, 'getPathSource'));
}
// testEx();
// testExPath();
// testpathSource();

module.exports = {
  getExchangeRateFromAutoPath,
  getExchangeRateFromOffers,
  getPathSource,
};