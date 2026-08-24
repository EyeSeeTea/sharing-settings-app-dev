## Setup

Install dependencies:

```
$ yarn install
```

## Development

Start the development server:

```
$ yarn start
```

Now in your browser, go to `http://localhost:8081`.

Notes:

-   The file `.env` sets the environment variables. `VITE_PORT` sets the port. `VITE_DHIS2_BASE_URL` sets the DHIS2 instance. To use different values for one run, put the variables before the command:

    ```
    $ VITE_PORT=8081 VITE_DHIS2_BASE_URL="http://localhost:8080" yarn start
    ```

-   The development server proxies requests to DHIS2 (see `vite.config.ts`) from `http://localhost:8081/dhis2/path` to `http://localhost:8080/path`. The proxy prevents CORS and cross-domain problems.

-   The optional environment variable `VITE_DHIS2_AUTH=USERNAME:PASSWORD` gives credentials to the proxy. Usually you do not set this variable, and the app uses the user that is logged in at `VITE_DHIS2_BASE_URL`.

-   Create a file `.env.local` (copy it from `.env`) to change the environment variables. Then run `yarn start`.

-   [why-did-you-render](https://github.com/welldone-software/why-did-you-render) is installed. It starts automatically in development mode (`yarn start`). Use it to debug re-renders.

## Tests

### Unit tests

```
$ yarn test
```

### Integration tests (Cypress)

Create the required users for testing (`cypress/support/App.ts`) in your instance and run:

```
$ export CYPRESS_EXTERNAL_API="http://localhost:8080"
$ export CYPRESS_ROOT_URL=http://localhost:8081

# non-interactive
$ yarn cy:e2e:run

# interactive UI
$ yarn cy:e2e:open
```

## Build app ZIP

```
$ yarn build
```

## Some development tips

### Structure

-   `i18n/`: Contains literal translations (gettext format)
-   `public/`: Main app folder with a `index.html`, exposes the APP.
-   `src/pages`: Main React components.
-   `src/domain`: Domain layer of the app (clean architecture)
-   `src/data`: Data of the app (clean architecture)
-   `src/components`: Reusable React components.
-   `src/types`: `.d.ts` file types for modules without TS definitions.
-   `src/utils`: Misc utilities.
-   `src/locales`: Auto-generated, do not update or add to the version control.
-   `cypress/integration/`: Cypress integration tests.

### i18n

```
$ yarn localize
```

### App context

The file `src/contexts/app-context.ts` holds some general context so typical infrastructure objects (`api`, `d2`, ...) are readily available. Add your own global objects if necessary.
