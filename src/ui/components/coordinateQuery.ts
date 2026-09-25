/**
 * Rule 1215 (validation/nasaAuditCorrectionsRules.ts): a point typed as
 * coordinates, so that any place on the globe — open sea, a coast between
 * towns — is reachable from the keyboard, not only a city.
 *
 * Reads a latitude and a longitude in decimal degrees: signed, or with N/S
 * and E/W (O for "ovest"), separated by a comma, a semicolon or a space; a
 * decimal comma is read where the separator leaves no doubt ("40,85; 14,27"
 * or "40,85 14,27"). Returns null for anything else, and says when the
 * figures are there but out of range.
 */

export type CoordinateQuery =
  | { kind: 'point'; latitude: number; longitude: number }
  | { kind: 'outOfRange' };

const NUMBER = String.raw`([+-]?\d+(?:[.,]\d+)?)\s*°?\s*`;
const PATTERN = new RegExp(String.raw`^\s*${NUMBER}([NS])?\s*[,;\s]\s*${NUMBER}([EWO])?\s*$`, 'i');

const toNumber = (s: string): number => Number(s.replace(',', '.'));

export function parseCoordinates(text: string): CoordinateQuery | null {
  const match = PATTERN.exec(text);
  if (match === null) return null;
  const [, latText, ns, lonText, ew] = match;
  if (latText === undefined || lonText === undefined) return null;
  let latitude = toNumber(latText);
  let longitude = toNumber(lonText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  // A hemisphere letter gives the sign; a sign and a letter together must
  // agree, or the text is not read as coordinates.
  if (ns !== undefined) {
    if (latText.startsWith('-') || latText.startsWith('+')) return null;
    if (ns.toUpperCase() === 'S') latitude = -latitude;
  }
  if (ew !== undefined) {
    if (lonText.startsWith('-') || lonText.startsWith('+')) return null;
    if (ew.toUpperCase() !== 'E') longitude = -longitude;
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return { kind: 'outOfRange' };
  return { kind: 'point', latitude, longitude };
}
