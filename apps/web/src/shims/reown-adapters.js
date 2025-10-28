// Shim for @reown/appkit/adapters path which is not exported by the package
// This provides minimal fallbacks so that bundlers won't fail during Next.js builds.

// Try to re-export the adapters if available; otherwise provide harmless defaults.
let adapters = {};
try {
  // Attempt to require the packaged index and pull adapters if present
  // Note: using require here intentionally (runtime shim for browser bundling).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const appkit = require('@reown/appkit');
  if (appkit && appkit.adapters) {
    adapters = appkit.adapters;
  }
} catch (e) {
  // ignore - we'll export empty placeholders
}

module.exports = adapters;
module.exports.default = adapters;
