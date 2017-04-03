const { Keypair } = require('stellar-sdk');
const expect = require('chai').expect;

const { sign, verify, chunkData, glueData } = require('./DataManager');

describe('DataManager', () => {
  const prefix = 'aazzbb_';
  const eleven = 'azertyuiopq';
  const sixtysix = eleven+eleven+eleven+eleven+eleven+eleven;
  const seventyseven = sixtysix+eleven;

  it('signs and verifies', () => {
    const keypair = Keypair.fromSecret('SDDKHJYC6VRWQVGN5H6DTRCQ7OINE6MASBDQVRBLX6IX2CV5U5MVBSJQ');
    // const keypair = Keypair.random();

    const data = {
      account_id: keypair.publicKey(),
      stellar_address: 'roberto*ngfar.io',
    };

    const signature = sign(data, keypair.secret());
    expect(signature).to.equal("8A5nLhJ4P5S4tgwgOhUlShbD5R8KjIVrQYmtLZM0JA+S4qTBkHyKjQnrxoeWoWpGW/cQMAwR+6J0Xn8jdTArCQ==");
    const verified = verify(data, data. account_id, signature);
    expect(verified).to.be.true;
  });

  it('chunkData even', () => {
    const chunked = chunkData(prefix, sixtysix);
    const keys = Object.keys(chunked);

    expect(keys.length).to.equal(2);
    expect(prefix+'0').to.equal(keys[0]);
    expect(prefix+'1').to.equal(keys[1]);
    expect(chunked[keys[0]].toString()).to.equal(sixtysix.slice(0, 64));
    expect(chunked[keys[1]].toString()).to.equal(sixtysix.slice(64));
  });

  it('chunkData odd', () => {
    const chunked = chunkData(prefix, seventyseven);
    const keys = Object.keys(chunked);

    expect(keys.length).to.equal(2);
    expect(prefix+'0').to.equal(keys[0]);
    expect(prefix+'1').to.equal(keys[1]);
    expect(chunked[keys[0]].toString()).to.equal(seventyseven.slice(0, 64));
    expect(chunked[keys[1]].toString()).to.equal(seventyseven.slice(64));
  });

  it('chunkData custom chunk size', () => {
    const s = 5;
    const chunked = chunkData(prefix, eleven, s);
    const keys = Object.keys(chunked);

    expect(keys.length).to.equal(3);
    expect(prefix+'0').to.equal(keys[0]);
    expect(prefix+'1').to.equal(keys[1]);
    expect(prefix+'2').to.equal(keys[2]);
    expect(chunked[keys[0]].toString()).to.equal(eleven.slice(0, s));
    expect(chunked[keys[1]].toString()).to.equal(eleven.slice(s, 2*s));
    expect(chunked[keys[2]].toString()).to.equal(eleven.slice(2*s));
  });

  it('glueData', () => {
    const chunked = {
      [prefix+'0']: Buffer.from('azer').toString('base64'),
      [prefix+'1']: Buffer.from('tyui').toString('base64'),
    };
    const data = glueData(prefix, chunked);
    expect(data).to.equal('azertyui');
  });

  it('glueData throws if no chunked', () => {
    expect(glueData.bind(null, prefix, {})).to.throw;
  });
});
