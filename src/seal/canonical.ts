/**
 * Canonical serialisation for a seal — rule 829 of
 * `physics/validation/impactSealRules.ts`.
 *
 * A seal compares digests, so the text a digest is taken over must be a
 * lossless writing of the value: two runs that differ by one bit must produce
 * two different texts, and two runs that agree must produce the same text on
 * any machine. JSON does neither. It writes `NaN`, `Infinity` and `-Infinity`
 * as `null`, so three values a physics result can legitimately carry collapse
 * onto the same character; it writes negative zero as `0`; it drops keys whose
 * value is `undefined`, so a field that disappears reads the same as a field
 * that was never there; and it writes object keys in insertion order, which is
 * a property of the code that built the object, not of the value.
 *
 * This module writes a tagged text instead: keys sorted, `undefined` kept and
 * distinguishable from `null`, every number written through `Number#toString`,
 * which is the shortest text that reads back to the same double, with the
 * three non-finite values and negative zero given names of their own. A typed
 * array — a ground field's samples run to megabytes — is written as its
 * constructor, its length and the digest of its bytes, so the comparison stays
 * at the bit while the seal's file stays small.
 *
 * Anything it does not know how to write — a function, a Map, a Set, a class
 * instance — throws with the path to it. A seal that silently skipped a value
 * would be a seal on something other than what it claims.
 */

import { createHash } from 'node:crypto';

const TYPED_ARRAYS = [
  Float32Array,
  Float64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  BigInt64Array,
  BigUint64Array,
] as const;

type TypedArray = InstanceType<(typeof TYPED_ARRAYS)[number]>;

function isTypedArray(value: object): value is TypedArray {
  return TYPED_ARRAYS.some((ctor) => value instanceof ctor);
}

/** SHA-256, hex, of a text or of raw bytes. */
export function digest(text: string | Uint8Array): string {
  return createHash('sha256').update(text).digest('hex');
}

function writeNumber(value: number): string {
  if (Number.isNaN(value)) return '#NaN';
  if (value === Number.POSITIVE_INFINITY) return '#+Inf';
  if (value === Number.NEGATIVE_INFINITY) return '#-Inf';
  if (Object.is(value, -0)) return '#-0';
  return `#${value.toString()}`;
}

function write(value: unknown, path: string, out: string[]): void {
  if (value === null) {
    out.push('null');
    return;
  }
  if (value === undefined) {
    out.push('undef');
    return;
  }
  switch (typeof value) {
    case 'boolean':
      out.push(value ? 'true' : 'false');
      return;
    case 'number':
      out.push(writeNumber(value));
      return;
    case 'bigint':
      out.push(`big:${value.toString()}`);
      return;
    case 'string':
      out.push(JSON.stringify(value));
      return;
    case 'object':
      break;
    default:
      throw new Error(`Cannot seal a ${typeof value} at ${path}`);
  }
  const object: object = value;
  if (Array.isArray(object)) {
    out.push('[');
    object.forEach((item, i) => {
      if (i > 0) out.push(',');
      write(item, `${path}[${i.toString()}]`, out);
    });
    out.push(']');
    return;
  }
  if (isTypedArray(object)) {
    const bytes = new Uint8Array(object.buffer, object.byteOffset, object.byteLength);
    out.push(`${object.constructor.name}(${object.length.toString()}):${digest(bytes)}`);
    return;
  }
  if (object instanceof Date) {
    out.push(`date:${object.getTime().toString()}`);
    return;
  }
  const prototype: unknown = Object.getPrototypeOf(object);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`Cannot seal a ${object.constructor.name} at ${path}`);
  }
  const keys = Object.keys(object).sort();
  out.push('{');
  keys.forEach((key, i) => {
    if (i > 0) out.push(',');
    out.push(JSON.stringify(key), ':');
    write((object as Record<string, unknown>)[key], `${path}.${key}`, out);
  });
  out.push('}');
}

/** The canonical text of a value. */
export function canonical(value: unknown, path = '$'): string {
  const out: string[] = [];
  write(value, path, out);
  return out.join('');
}

/** The digest of the canonical text of a value. */
export function canonicalDigest(value: unknown, path = '$'): string {
  return digest(canonical(value, path));
}
