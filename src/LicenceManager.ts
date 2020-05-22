const alg = {
  name: 'ECDSA',
  namedCurve: 'P-384',
};

const publicKey = {
  crv: 'P-384',
  ext: true,
  key_ops: ['verify'],
  kty: 'EC',
  x: 'gGO_dlhZ4ui3Jpfa56d1ZP-VZDZvRyUohgzkUIr5-h-GknNQVyu56OYIhqkdfR6f',
  y: '2sZ14rwPail6C2wQ3ALtxy45C1ndTlsZq7uO8xoZ0wmbHsKA9WDVZp_o_BWpjKwL',
};

export default class LicenceManager {
  private readonly key: PromiseLike<CryptoKey>;

  constructor() {
    this.key = self.crypto.subtle.importKey('jwk', publicKey, alg, false, ['verify']);
  }

  verify(text: string, signature: string) {
    const encoder = new TextEncoder();
    return this.key.then((key) =>
      self.crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: 'SHA-384',
        },
        key,
        encoder.encode(signature),
        encoder.encode(text)
      )
    );
  }
}
