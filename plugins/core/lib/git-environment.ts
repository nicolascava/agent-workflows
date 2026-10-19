const GIT_DISCOVERY_ENVIRONMENT_KEYS = [
  "GIT_CEILING_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_DIR",
  "GIT_DISCOVERY_ACROSS_FILESYSTEM",
  "GIT_WORK_TREE",
] as const;

export function withoutGitDiscoveryEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const sanitized = { ...environment };
  for (const key of GIT_DISCOVERY_ENVIRONMENT_KEYS) delete sanitized[key];
  return sanitized;
}
