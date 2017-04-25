const fetch = require('isomorphic-fetch');
const qs = require('qs');

/**
 * @description Custom HTTP request handler. Throw on http errors.
 * @param {Object} o - Request informations
 * @param {String} o.url - URL
 * @param {String} [o.method] - HTTP Method
 * @param {String} [o.endpoint] - Optional endpoint to concat with URL
 * @param {Object} [o.qs] - Query String object
 * @param {Object} [o.headers] - Headers object
 * @param {Object|String} [o.body] - POST body, transform to JSON
 * @returns {Object|String} Result
 * @throws {Error} Http Error
 */
function request(o) {
  let uri = o.url;
  if(o.endpoint) {
    uri += o.endpoint;
  }
  if(o.qs) {
    uri += '?' + qs.stringify(o.qs);
  }

  const options = {
    method: o.method || 'GET',
    headers: Object.assign({}, o.headers),
  };

  if(o.body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(o.body);
  }

  return fetch(uri, options)
    .then(response => {
      if(!response.ok) {
        throw response;
      }
      if(response.headers.get('Content-Type').includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    });
}

module.exports = request;