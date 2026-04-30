// Pre-install benign values for globals that expo's winter polyfill installs
// lazily. The lazy getters call require() at access time, which jest-runtime
// rejects post-test ("outside the scope of the test code"). Defining these
// up front (writable so expo can still override during setup) avoids the
// late require.
function preinstallGlobal(name, value) {
  if (typeof globalThis[name] === 'undefined') {
    Object.defineProperty(globalThis, name, {
      value,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}

preinstallGlobal('__ExpoImportMetaRegistry', { register: () => {}, get: () => undefined });
preinstallGlobal('structuredClone', (value) => JSON.parse(JSON.stringify(value)));
