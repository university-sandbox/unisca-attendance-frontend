const sourceMapExclusions = [
  /node_modules[\\/]face-api\.js[\\/]/,
  /node_modules[\\/]html5-qrcode[\\/]/,
];

function useModernSassApi(rules) {
  for (const rule of rules) {
    if (rule.oneOf) useModernSassApi(rule.oneOf);

    const loaders = Array.isArray(rule.use)
      ? rule.use
      : rule.use
        ? [rule.use]
        : [];

    for (const loader of loaders) {
      if (
        typeof loader === "object" &&
        typeof loader.loader === "string" &&
        loader.loader.includes("sass-loader")
      ) {
        loader.options = { ...loader.options, api: "modern" };
      }
    }
  }
}

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

      useModernSassApi(webpackConfig.module.rules);

      return webpackConfig;
    },
  },
};
