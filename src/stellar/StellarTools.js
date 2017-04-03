const { Asset, FederationServer, StrKey, Keypair } = require('stellar-sdk');
const Decimal = require('decimal.js');

const STROOP = 0.0000001;

const validPk = pk => StrKey.isValidEd25519PublicKey(pk);
const validSeed = seed => StrKey.isValidEd25519SecretSeed(seed);

const resolveAddress = (address) => {
  if(validPk(address)) return Promise.resolve({
    account_id: address,
  });

  return FederationServer.resolve(address);
};

const validDestination = address =>
  resolveAddress(address).then(() => true).catch(() => false);

const AssetInstance = asset => {
  if(!asset) return null;
  if(asset instanceof Asset) {
    return asset;
  }
  if(asset.asset_type === 'native') {
    return Asset.native();
  }
  return new Asset(asset.asset_code, asset.asset_issuer);
};

const AssetUid = (rawAsset) => {
  const asset = AssetInstance(rawAsset);

  if (asset.isNative()) {
    return 'native';
  }
  let str = 'custom:';
  str += asset.getCode();
  str += ':';
  str += asset.getIssuer();
  return str;
};

const KeypairInstance = keypair => {
  if(keypair instanceof Keypair) {
    return keypair;
  }
  if(!!keypair.secretSeed) {
    return Keypair.fromSecret(keypair.secretSeed);
  }
  return Keypair.fromPublicKey(keypair.publicKey);
};

const AmountInstance = number => {
  const decimal = new Decimal(number);
  return decimal.toString();
};

const areSameAssets = (a1, a2) => {
  try {
    const as1 = AssetInstance(a1);
    const as2 = AssetInstance(a2);

    if(as1 === as2 === null) {
      return true;
    } else if (!as1 || !as2) {
      return false;
    }
    return as1.equals(as2);
  } catch (e) {
    return false;
  }
};

const augmentAccount = account => Object.assign({},
  account,
  {
    balances: account.balances.map(b => Object.assign({}, b, {
      asset: AssetInstance(b),
    })),
  });

module.exports = {
  STROOP,
  validPk,
  validSeed,
  resolveAddress,
  validDestination,
  AssetInstance,
  AssetUid,
  KeypairInstance,
  AmountInstance,
  areSameAssets,
  augmentAccount,
};