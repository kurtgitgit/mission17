/**
 * Retired legacy live test.
 *
 * It relied on removed password-login endpoints and embedded a credential.
 * Use authenticated integration tests against isolated staging data instead.
 */

console.error('This legacy script is retired. Do not run it against a live environment.');
process.exitCode = 1;
