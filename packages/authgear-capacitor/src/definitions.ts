export interface AuthgearPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
