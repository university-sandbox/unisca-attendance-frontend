const sourceMapExclusions = [
  /node_modules[\\/]face-api\.js[\\/]/,
  /node_modules[\\/]html5-qrcode[\\/]/,
];

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        // face-api.js uses this only in its Node.js environment.
        fs: false,
      };

      const sourceMapRule = webpackConfig.module.rules.find(
        (rule) =>
          rule.enforce === "pre" &&
          typeof rule.loader === "string" &&
          rule.loader.includes("source-map-loader"),
      );

      if (sourceMapRule) {
        sourceMapRule.exclude = [
          sourceMapRule.exclude,
          ...sourceMapExclusions,
        ].filter(Boolean);
      }

      return webpackConfig;
    },
  },
};
