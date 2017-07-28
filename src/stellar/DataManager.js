const { Keypair } = require('stellar-sdk');
const { ERRORS } = require('../helpers/errors');

const { splitBuffer } = require('../helpers/bufferTool');

const ENCODING = 'base64';
const CHUNK_SIZE = 64;

/**
 * Sign a data with a keypair
 * @param dataToSign
 * @param secret
 * @return {string}
 */
const sign = (dataToSign, secret) => {
  const json = JSON.stringify(dataToSign);
  const dataBuffer = Buffer.from(json);

  const keypair = Keypair.fromSecret(secret);
  const signatureBuffer = keypair.sign(dataBuffer);

  return signatureBuffer.toString(ENCODING);
};

/**
 * Verify a data with a keypair
 * @param data
 * @param accountId
 * @param signature
 * @return {boolean}
 */
const verify = (data, accountId, signature) => {
  if(!data || !signature) {
    throw ERRORS.BAD_PARAMETERS('need data and signature');
  }

  const strData = JSON.stringify(data);

  const dataBuffer = Buffer.from(strData);
  const signatureBuffer = Buffer.from(signature, ENCODING);
  const keypair = Keypair.fromPublicKey(accountId);

  const verified = keypair.verify(dataBuffer, signatureBuffer);
  if(!verified) {
    throw ERRORS.UNAUTHORIZED(`Invalid signature for ${accountId}`);
  }
  return true;
};

/**
 * Split a string/buffer in an object of size-boxed encoded strings
 * @param prefix - Prefix of the object keys
 * @param {String} data
 * @param chunkSize - Size of the chunks (bytes)
 * @return {Object} splittedData
 */
const chunkData = (prefix, data, chunkSize = CHUNK_SIZE) => {
  const buffer = Buffer.from(data);
  return splitBuffer(buffer, chunkSize).reduce((acc, chunk) =>
    Object.assign(acc, {
      [prefix + Object.keys(acc).length]: chunk,
    }), {});
};

/**
 *
 * @param prefix
 * @param {Object} data - Object of string encoded data
 * @return {String} gluedData
 */
const glueData = (prefix, data) => {
  const chunkedData = Object.keys(data)
    .filter(key => (key.indexOf(prefix) === 0))
    .map(key => data[key]);

  if(chunkedData.length === 0) {
    throw new Error('No chunked data for ' + prefix);
  }
  return Buffer.concat(
    chunkedData.map(d => Buffer.from(d, ENCODING))
  ).toString();
};

module.exports = {
  sign, verify, glueData, chunkData,
};
