const request = require('../helpers/request');

let wilsonUrl = "https://stellar-wilson.herokuapp.com/wilson";

function setUrl(url) {
  wilsonUrl = url;
}

function anchorList() {
  return request({
    url: wilsonUrl,
    qs: {
      type: 'list'
    },
  });
}

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