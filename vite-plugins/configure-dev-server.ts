import { cwd } from 'node:process'
import { loadEnv, type UserConfig, type PluginOption, type ConfigEnv } from 'vite'

/**
 * The default route to open in the browser when starting the development server
 * if the env variable `VITE_DEV_AUTO_OPEN_IN_BROWSER` is set to true.
 */
const DEFAULT_ROUTE_TO_OPEN = '/about'

/**
 * Get the route to open automatically the browser with in development:
 * - If the env variable `VITE_DEV_AUTO_OPEN_IN_BROWSER` is not set or is set to `false`, return `false`.
 * - If the env variable `VITE_DEV_AUTO_OPEN_IN_BROWSER` starts with `/`, return it as is.
 * - Otherwise, return the default route. ({@link DevServerConfigPluginOptions.defaultRouteToOpen | More infos...})
 *
 * @example
 * getParsedRouteForOpenWithEnv({ VITE_DEV_AUTO_OPEN_IN_BROWSER: '/my-route' }) // '/my-route'
 * getParsedRouteForOpenWithEnv({ VITE_DEV_AUTO_OPEN_IN_BROWSER: 'my-route' }) // '/demo'
 * getParsedRouteForOpenWithEnv({ VITE_DEV_AUTO_OPEN_IN_BROWSER: false }) // false
 * getParsedRouteForOpenWithEnv({}) // false
 * getParsedRouteForOpenWithEnv({ VITE_DEV_AUTO_OPEN_IN_BROWSER: true }, '/my-route') // '/my-route'
 */
const getParsedRouteForOpenWithEnv = (
  currentEnv: Record<string, string>,
  defaultRouteToOpen: `/${string}`,
) => {
  // get the current value of the env variable
  const autoOpenInBrowserValue = currentEnv['VITE_DEV_AUTO_OPEN_IN_BROWSER']

  // if the env variable is not set or is set to false, do not automatically open the browser
  if (!autoOpenInBrowserValue || autoOpenInBrowserValue === 'false') return false

  // if the env variable is set to a route, open the browser with this route
  // otherwise, open the browser with the default route‡
  return autoOpenInBrowserValue.startsWith('/') ? autoOpenInBrowserValue : defaultRouteToOpen
}

/**
 * Configure the server for development:
 * - If the command is not `serve`, return an empty object.
 * - Otherwise, load the env variables and return the new server configuration.
 *
 * @example
 * // with `VITE_DEV_AUTO_OPEN_IN_BROWSER` set to `true`
 * configureServerForDev(...) // { open: '/demo' }
 * // with `VITE_DEV_AUTO_OPEN_IN_BROWSER` set to `/my-route`
 * configureServerForDev(...) // { open: '/my-route' }
 * // with `VITE_DEV_AUTO_OPEN_IN_BROWSER` set to `false`
 * configureServerForDev(...) // { open: false }
 */
const configureServerForDev = (
  root: UserConfig['root'] = cwd(),
  { mode, command }: ConfigEnv,
  options: Required<DevServerConfigPluginOptions>,
) => {
  if (command !== 'serve') return {}

  const env = loadEnv(mode, root)

  return {
    // auto open the browser in development with the route defined in the env
    open: getParsedRouteForOpenWithEnv(env, options.defaultRouteToOpen),
  }
}

type DevServerConfigPluginOptions = {
  /**
   * The default route to open in the browser when starting the development server.
   *
   * The default value is set in the {@link DEFAULT_ROUTE_TO_OPEN} constant.
   */
  defaultRouteToOpen?: `/${string}`
}

/**
 * A Vite plugin to configure the server for development.
 *
 * This plugin will automatically open the browser with the route defined in the env variable `VITE_DEV_AUTO_OPEN_IN_BROWSER` if it has been set with a specific route, or with the default route if set to `true`.
 */
export const devServerConfigPlugin = (
  options = {
    defaultRouteToOpen: DEFAULT_ROUTE_TO_OPEN,
  } satisfies DevServerConfigPluginOptions,
): PluginOption => ({
  name: 'dev-server-partial-config',
  config: (config, viteEnv) => ({
    server: {
      ...configureServerForDev(config.root, viteEnv, options),
    },
  }),
})
