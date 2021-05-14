const HD = require('../lib/wallet/hd');

const mnemonic = 'grid bag express ten plate bronze canvas trigger crew olive arrive luggage';

describe('HD Wallet', () => {
  it('should generate a bip39 Mnemonic', () => {
    const randombytes = (size) => Buffer.from(
      'fb1Cozb9HoD3SD2B/GuKO2wQAlU3BGbNLpUy101jVww='.slice(0, size),
      'utf8',
    );
    const localMnemonic = HD.generateMnemonic('', randombytes);
    expect(localMnemonic).toBe(
      'grid bag express ten plate bronze canvas trigger crew olive arrive luggage',
    );
  }, 1e4);

  it('mnemonic is a string', () => {
    expect(typeof HD.generateMnemonic()).toBe('string');
  });

  it('mnemonic length is 12', () => {
    const words = HD.generateMnemonic().split(' ');
    expect(words.length).toEqual(12);
  });

  it('master seed is a buffer', () => {
    const seed = HD.generateSeed(mnemonic);
    expect(Buffer.isBuffer(seed)).toBe(true);
  });

  it('master root is the expected object', () => {
    const seed = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seed);
    expect(masterRoot.toJSON()).toEqual({
      xpriv:
        'xprv9s21ZrQH143K4PVnZnLeU4NeFWtrhtsZhY3zixMZp3sH3aB5hYGP8c6gjjAyNVVEiPrWYiSZGJQ52Ka5FnpxDQec4FfKNHvTQHM63fRxcxM',
      xpub:
        'xpub661MyMwAqRbcGsaFfoseqCKNoYjM7MbR4kybXLmBNPQFvNWEF5adgQRAayma7tEwsaJLC1ZXDyLCtfYZCjkdtQ4GB7FCPn8UmBJfEg7ZDN3',
    });
  });

  it('should derive single dimension ID from master seed', () => {
    const coinType = 1;
    const derivationPath = `m/44'/${coinType}'/0'/0`;
    const seed = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seed);
    const singleDimensionID = HD.derive(masterRoot, derivationPath);
    expect(singleDimensionID.publicKey.toString('hex')).toBe(
      '03bdef81ac1b6e45edbd8a8821e89d71ee60ef1e5338d9c52ce5a1ea8d6ee1f5d0',
    );
    expect(singleDimensionID.privateKey.toString('hex')).toBe(
      '5f700265bb7efd32def3e01951497ac2919e7b38c5803c4287d7a3d254dfee87',
    );
    expect(singleDimensionID.toJSON()).toEqual({
      xpriv:
        'xprv9zuGLnjwNyLATg42EktX1dKu98t25qWSe3us3u6KpXizecDgbaKzyjFzHbnytkkkhCL2C8vbjrqxheTN9Lk4cKYxay4fimczZ18Xun1Jjev',
      xpub:
        'xpub6DtckJGqDLtTgA8VLnRXNmGdhAiWVJEJ1GqTrHVwNsFyXQYq97eFXXaU8uV7LWDRePCvX44MU4GEZWSfhwuC8DoHnVaUULU7tAbZmi3AhJG',
    });
  });

  it('should derive a Hardened child', () => {
    const coinType = 1;
    const derivationPath = `m/44'/${coinType}'/0'/0`;
    const seed = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seed);
    const singleDimID = HD.derive(masterRoot, derivationPath).toJSON();
    const hardenedChild = HD.getChildByIndex(singleDimID.xpriv, 0);
    expect(hardenedChild.toJSON()).toEqual({
      xpriv:
        'xprvA3yhCgzvP6fUvqajFsdbP2THz5f8p56msxSjfTvx2StZHXve45i21ruQDTPC5z2YU4pC37Z83hLYcwSv8mvneSBzELUsJdYgAoBbfLkrVA1',
      xpub:
        'xpub6Gy3cCXpDUDn9KfCMuAbkAQ2Y7VdDXpdFBNLTrLZanRYALFnbd2GZfDt4j1Jwwa3xvDh8T3v22rGEuog5U8g6yU1vDTT1k5FG7mhaLiAniX',
    });
    expect(hardenedChild.publicKey.toString('hex')).toBe(
      '026273ce8a5b5a5a92c1030586beda4aca49fffcceb29c7f51d8a816d381a58a8b',
    );
    expect(hardenedChild.privateKey.toString('hex')).toBe(
      '1473aaacfd99ca663a8e101034d0cabf6fa2014d45fcb50cfe9f553466fa6e67',
    );
  });

  it('should derive a non Hardened child', () => {
    const coinType = 1;
    const derivationPath = `m/44'/${coinType}'/0/0`;
    const seed = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seed);
    const singleDimID = HD.derive(masterRoot, derivationPath).toJSON();
    const nonHardenedChild = HD.getChildByIndex(singleDimID.xpub, 0);
    expect(nonHardenedChild.toJSON()).toEqual({
      xpriv: null,
      xpub:
        'xpub6GivkawKaawKQZ8SgQPkYhYFkpERAnhPwcLAVpZrAVAtKfweofs9MMciYEYYTuiqcmbrY6VbZCsoBoTLb25By8yjApMtKJccrM7TRUaY24L',
    });
    expect(nonHardenedChild.publicKey.toString('hex')).toBe(
      '0353e597cc31baf095522aac4f4c7235aae7cc45100880a61277d2022182f9a56b',
    );
    expect(nonHardenedChild.privateKey).toBe(null);
  });
});
