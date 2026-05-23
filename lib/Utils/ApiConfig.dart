const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8080',
);

const String apiPrefix = String.fromEnvironment(
  'API_PREFIX',
  defaultValue: '/api/v1',
);

String buildApiBasePath() {
  final base = apiBaseUrl.endsWith('/')
      ? apiBaseUrl.substring(0, apiBaseUrl.length - 1)
      : apiBaseUrl;
  if (apiPrefix.isEmpty) return base;
  final prefix = apiPrefix.startsWith('/') ? apiPrefix : '/$apiPrefix';
  return '$base$prefix';
}

