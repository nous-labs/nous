// @ts-ignore any
import ModuleFactory from './libFourQ_K12.js';

export interface QubicCrypto {
  generatePublicKey(secretKey: Uint8Array): Uint8Array;
  k12(input: Uint8Array, outputLength: number, outputOffset?: number): Uint8Array;
  sign(secretKey: Uint8Array, publicKey: Uint8Array, message: Uint8Array): Uint8Array;
}

type ModuleInstance = Awaited<ReturnType<typeof loadModuleInstance>>;

let cryptoPromise: Promise<QubicCrypto> | null = null;
let moduleInstancePromise: Promise<ModuleInstance> | null = null;

async function loadModuleInstance(): Promise<any> {
  if (!moduleInstancePromise) {
    moduleInstancePromise = (async () => {
      const moduleLike: any = ModuleFactory;
      const resolved =
        typeof moduleLike === 'function'
          ? moduleLike()
          : moduleLike && typeof moduleLike.then === 'function'
            ? moduleLike
            : moduleLike;
      const instance = await resolved;

      if (instance && instance.calledRun) {
        return instance;
      }

      return new Promise<any>((resolve) => {
        const target = instance ?? {};
        const previous = target.onRuntimeInitialized;
        target.onRuntimeInitialized = () => {
          if (typeof previous === 'function') {
            previous();
          }
          resolve(target);
        };
      });
    })();
  }
  return moduleInstancePromise;
}

function createPromise(): Promise<QubicCrypto> {
  return (async () => {
    const moduleRef = await loadModuleInstance();

    const allocU8 = (length: number, value?: Uint8Array) => {
      const ptr = moduleRef._malloc(length);
      const chunk = moduleRef.HEAPU8.subarray(ptr, ptr + length);
      if (value) {
        chunk.set(value);
      }
      return chunk;
    };

    const generatePublicKey = (secretKey: Uint8Array): Uint8Array => {
      const sk = allocU8(secretKey.length, secretKey);
      const pk = allocU8(32);
      moduleRef._SchnorrQ_KeyGeneration(sk.byteOffset, pk.byteOffset);
      const result = pk.slice();
      moduleRef._free(sk.byteOffset);
      moduleRef._free(pk.byteOffset);
      return result;
    };

    const k12 = (
      input: Uint8Array,
      outputLength: number,
      outputOffset = 0,
    ): Uint8Array => {
      const i = allocU8(input.length, input);
      const o = allocU8(outputLength + outputOffset);
      moduleRef._KangarooTwelve(
        i.byteOffset,
        input.length,
        o.byteOffset + outputOffset,
        outputLength,
        0,
        0,
      );
      const result = o.slice(outputOffset, outputOffset + outputLength);
      moduleRef._free(i.byteOffset);
      moduleRef._free(o.byteOffset);
      return result;
    };

    const sign = (
      secretKey: Uint8Array,
      publicKey: Uint8Array,
      message: Uint8Array,
    ): Uint8Array => {
      const sk = allocU8(secretKey.length, secretKey);
      const pk = allocU8(publicKey.length, publicKey);
      const msg = allocU8(message.length, message);
      const sig = allocU8(64);
      moduleRef._SchnorrQ_Sign(
        sk.byteOffset,
        pk.byteOffset,
        msg.byteOffset,
        message.length,
        sig.byteOffset,
      );
      const result = sig.slice();
      moduleRef._free(sk.byteOffset);
      moduleRef._free(pk.byteOffset);
      moduleRef._free(msg.byteOffset);
      moduleRef._free(sig.byteOffset);
      return result;
    };

    return { generatePublicKey, k12, sign };
  })();
}

export function getCrypto(): Promise<QubicCrypto> {
  if (!cryptoPromise) {
    cryptoPromise = createPromise();
  }
  return cryptoPromise;
}
