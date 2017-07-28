const request = require('../helpers/request');

let wilsonUrl = "https://api.willet.io/wilson";

/**
 * @description Set URL of the wilson server
 * @param {String} url  - Url of the federation server
 */
function setUrl(url) {
  wilsonUrl = url;
}

/**
 * @description Get list of supported assets
 * @returns {Array} AssetList - List of supported assets
 * @returns {String} AssetList.code - Asset code
 * @returns {String} AssetList.issuer - Asset issuer
 * @returns {String} AssetList.symbol - Asset symbol
 */
function anchorList() {
  return request({
    url: wilsonUrl,
    qs: {
      type: 'list'
    },
  });
}

/**
 * @description Get information of an asset from code and issuer address
 * @returns {Object} AssetInfo - Information on a specific asset
 * @returns {String} AssetInfo.code - Asset code
 * @returns {String} AssetInfo.issuer - Asset issuer
 * @returns {String} AssetInfo.symbol - Asset symbol
 */
function anchorInfo({ code, issuer }) {
  return request({
    url: wilsonUrl,
    qs: {
      type: 'info',
      code,
      issuer,
    },
  });
}

/**
 * @description Get a deposit address from a specific asset code and issuer address, to a stellar address.
 * @param code - Asset code
 * @param issuer - Asset Issuer
 * @param address - Stellar address to deposit asset
 * @returns {Object} DepositResult - Informations for deposit
 * @returns {string} DepositResult.deposit_address - Address where to send money to be forwarded to the stellar address
 * @returns {string} DepositResult.specific_data - Some extra information depending on the asset
 */
function anchorDeposit({ code, issuer, address }) {
  return request({
    url: wilsonUrl,
    qs: {
      type: 'deposit',
      code,
      issuer,
      address,
    },
  });
}

/**
 * @description Get a stellar withdraw address where to send asset to get real money.
 * @param code - Asset code
 * @param issuer - Asset Issuer
 * @param address - Real-world address where to withdraw
 * @returns {FederationResponse} WithdrawResult - Stellar federation information where to send stellar assets
 */
function anchorWithdraw({ code, issuer, address }) {
  return request({
    url: wilsonUrl,
    qs: {
      type: 'withdraw',
      code,
      issuer,
      address,
    },
  });
}

module.exports = {
  setUrl,
  anchorList,
  anchorInfo,
  anchorDeposit,
  anchorWithdraw,
};