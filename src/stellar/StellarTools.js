const { Asset, FederationServer, StrKey, Keypair } = require('stellar-sdk');
const Decimal = require('decimal.js/decimal.js');

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

const AssetShortName = (asset) => {
  if(asset.isNative()) {
    return 'XLM';
  }
  return asset.getCode();
};

const AssetUid = (asset) => {
  let str = asset.getAssetType();
  if (asset.isNative()) {
    return str;
  }
  str += ':';
  str += asset.getCode();
  str += ':';
  str += asset.getIssuer();
  return str;
};

const AssetInstance = asset => {
  if(!asset) return null;
  let returnAsset;
  if(asset instanceof Asset || (asset.constructor && asset.constructor.name === 'Asset')) {
    returnAsset = asset;
  }
  else if(asset.asset_type === 'native') {
    returnAsset = Asset.native();
  } else {
    returnAsset = new Asset(asset.asset_code, asset.asset_issuer);
  }

  returnAsset.uuid = AssetUid(returnAsset);
  returnAsset.shortName = AssetShortName(returnAsset);

  return returnAsset;
};

const KeypairInstance = keypair => {
  if(keypair instanceof Keypair || (keypair.constructor && keypair.constructor.name === 'Keypair')) {
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
