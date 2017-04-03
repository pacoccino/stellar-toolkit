const uuid = require("uuid");

const splitBuffer = (buffer, chunkSize, encoding = undefined) => {
  if(!(buffer instanceof Buffer || typeof buffer === 'string')) {
    throw new Error('need string of buffer')
  }
  const bufferCopy = Buffer.from(buffer, encoding);
  const splitted = [];
  const nbChunk =  Math.ceil(bufferCopy.length / chunkSize);
  for(let i=0; i<nbChunk; i++) {
    const slice = bufferCopy.slice(i*chunkSize, (i+1)*chunkSize);
    splitted.push(slice);
  }
  return splitted;
};

const mergeBuffer = (buffers, encoding = undefined) => {
  /*const size = buffers.reduce((acc, b) => acc + b.length, 0);
  const buffer = Buffer.alloc(size);
  let offset = 0;
  for(let i=0; i<buffers.length; i++) {
    buffers[i].copy(buffer, offset);
    offset += buffers[i].length;
  }
  return buffer.toString(encoding);*/
  return Buffer.from(Buffer.concat(buffers), encoding).toString();
};

/**
 * Converts a string into 64 bytes hexadecimal hash
 * @param {string} str
 * @returns {string}
 */
const hexaHash = (str) => {
  const inputBuffer = Buffer.from(str);
  const outputBuffer = Buffer.alloc(32);
  outputBuffer.write(inputBuffer.toString());
  return outputBuffer.toString('hex');
};

/**
 * Generates random 64 bytes hexadecimal hash (32 characters)
 * @returns {string}
 */
const randomHash = () => {
  return hexaHash(uuid());
};

module.exports = {
  splitBuffer,
  mergeBuffer,
  randomHash,
  hexaHash,
};
