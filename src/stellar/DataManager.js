const { Keypair } = require('stellar-sdk');
const { ERRORS } = require('../helpers/errors');

const { splitBuffer } = require('../helpers/bufferTool');

const ENCODING = 'base64';
const CHUNK_SIZE = 64;

const sign = (dataToSign, secret) => {
  const json = JSON.stringify(dataToSign);
  const dataBuffer = Buffer.from(json);

  const keypair = Keypair.fromSecret(secret);
  const signatureBuffer = keypair.sign(dataBuffer);

  return signatureBuffer.toString(ENCODING);
};

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

const chunkData = (prefix, data, chunkSize = CHUNK_SIZE) => {
  const buffer = Buffer.from(data);
  return splitBuffer(buffer, chunkSize).reduce((acc, chunk) =>
    Object.assign(acc, {
      [prefix + Object.keys(acc).length]: chunk,
    }), {});
};

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
