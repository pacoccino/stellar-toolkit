const expect = require('chai').expect;

const { splitBuffer, mergeBuffer } = require('./bufferTool');

describe('Buffer tools', () => {
  const testSM = (input, chunkSize) => {
    const str = input;
    const splitted = splitBuffer(str, chunkSize);
    const merged = mergeBuffer(splitted);
    expect(merged.toString()).to.equal(str.toString())
  };

  it('splits and merge', () => {
    testSM('czejcozeijfzeiojf', 1);
    testSM('czejcozeijfzeiojf', 2);
    testSM('czejcozeijfzeiojf', 3);
    testSM('fsdfsd', 1);
    testSM('fsdfsd', 2);
    testSM('fsdfsd', 3);
    testSM('fsdfs', 1);
    testSM('fsdfs', 2);
    testSM('fsdfs', 3);
    testSM('q', 1);
    testSM('q', 2);
    testSM('q', 3);
    testSM(Buffer.from('czejcozeijfzeiojf'), 3);
  });
});
