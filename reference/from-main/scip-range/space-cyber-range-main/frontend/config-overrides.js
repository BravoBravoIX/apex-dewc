// config-overrides.js
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Ensure config.resolve.fallback exists
  config.resolve.fallback = {
    ...config.resolve.fallback,

    // If you need Node polyfills:
    'buffer': require.resolve('buffer'),       // <-- Add this
    'process': require.resolve('process/browser.js'), 
    'crypto': require.resolve('crypto-browserify'), // If you have crypto issues
    // ... any others you might need
  };

  // Provide plugin so that `Buffer` and `process` are recognized globally
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],        // <-- Provide Buffer
      process: 'process/browser.js',       
      // If you're missing 'crypto', you might need to provide or import it, but
      // usually the fallback above is enough for crypto usage in third-party libs.
    }),
  ]);

  // Some libraries need fullySpecified turned off:
  // config.resolve.fullySpecified = false;

  // Optional: If you still see "Did you mean 'browser.js'?" errors, alias it:
  // config.resolve.alias = {
  //   ...config.resolve.alias,
  //   'process/browser': 'process/browser.js',
  // };

  return config;
};
