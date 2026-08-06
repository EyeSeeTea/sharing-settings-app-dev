# Yarn Resolutions

This file records each entry in the `resolutions` block of `package.json`. Each entry shows three
things: the version that the entry sets, the reason for the entry, and the condition to remove it.

`package.json` does not accept comments. Thus this file is the only record of these decisions. When
you add an entry, change this file in the same commit. When you remove an entry, do the same.

## Words used in this file

| Word                 | Meaning in this file                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| **entry**            | One line in the `resolutions` block of `package.json`.                 |
| **minimum version**  | A range, for example `^1.2.3`. It prevents all versions below `1.2.3`. |
| **exact version**    | One version, for example `1.2.3`. It permits that version only.        |
| **parent**           | A package that asks for a different package.                           |
| **tree**             | The full set of packages that Yarn installs.                           |
| **resolved version** | The version that Yarn installs after it applies all entries.           |

## Conventions

-   This project uses Yarn 1. The lockfile is version 1.
-   Yarn 1 accepts a bare package name, for example `"lodash": "^4.18.0"`. A bare name replaces the
    version for all requests in the tree.
-   Yarn 1 also accepts a per-parent path, for example `"micromatch/picomatch": "^2.3.2"`. A
    per-parent path changes the version for one parent only.
-   Use a per-parent path when a package is in more than one major line. A bare name can force one
    major version on a parent that cannot use that major version.
-   ⚠️ Yarn 1 applies a per-parent path only when the parent is a direct dependency. For a transitive
    parent, Yarn 1 ignores the entry. Yarn 1 then installs the initial version in a nested
    `node_modules` folder.
-   ⚠️ Do not use the Yarn 1 glob form (`**/parent/child`). Yarn Berry does not accept globs, and the
    CI workflow uses Berry.

### The CI workflow does two scans

The two scans give different results. Read this before you add a per-parent entry.

-   The first scan uses Yarn Berry. It does the command `yarn set version berry`. Berry applies
    per-parent paths at all depths.
-   The second scan uses Syft. It does a usual Yarn 1 install and reads `node_modules`. Thus it sees
    the versions that Yarn 1 installed.

A per-parent entry corrects the Berry scan. It does not change the Yarn 1 tree that the Syft scan
reads. Thus the two scans can show different versions of the same package. For an example, read
[picomatch](#picomatch-seven-per-parent-entries).

The two scans also find different packages. The Syft scan reads the installed files. Thus it reports
the Go standard library in the esbuild binary, and the Berry scan does not. Read the `esbuild` entry.

### Use a minimum version, not an exact version

Before you write an entry, decide what the version must do.

-   A **minimum version** prevents all versions below a given version. Almost all security entries are
    minimum versions. For `axios`, version 1.19.0 and version 1.20.0 are both satisfactory. Only
    version 1.13.5 is unsatisfactory. A range lets a later patch enter the tree with no commit.
-   An **exact version** permits one version only. Use this form only when a package needs that
    release. Also write the condition to remove the entry. If you cannot write that condition, use a
    minimum version.

**An exact version can become the vulnerability that it must prevent.** An exact version cannot
receive a patch. It also replaces the compatibility statement of the parent package. Two entries
showed this problem on 2026-08-06:

-   The `brace-expansion` entry was `1.1.16`. This file recorded the finding as impossible to correct.
    But the releases 1.1.17 and 1.1.18 were available. The declared range `^1.1.7` already permits
    them.
-   The `qs` entry was `6.14.2`. A later advisory includes the versions 6.11.1 to 6.15.1. Thus the
    entry kept a vulnerable version in the tree. It also prevented version 6.15.2.

**An entry can also keep a package below the range that its parent declares.** This looks like
protection, but the result is the opposite. On 2026-08-06 we removed the `semver` and `debug`
entries. `semver@^7.3.5` then moved up from 6.3.1. `debug@^4.4.1` then moved up from 4.3.1.

**Removal of an entry is not the same as an upgrade.** When no direct dependency asks for a package,
removal gives the version selection back to the parents. Those parents can be the reason for the old
version. Before you remove an entry, do these steps:

1. Remove the entry.
2. Do `yarn install`.
3. Compare the resolved versions.

Do not compare the bytes of the lockfile. An entry can change a lockfile descriptor and change no
installed version.

## When to examine this file

Examine this file before each release. Also examine it when the dependency scan fails. When a
high-severity finding occurs again for a package that has an entry, the entry is no longer correct.

Each entry has a **Drop when** condition. When that condition becomes true, remove the entry. Then do
`yarn install` again.

To examine one entry, do this command:

```bash
yarn why <package>
```

Compare the resolved version with the version in the advisory. Do not compare it with the previous
version.

---

## Active entries

### Minimum versions examined on 2026-08-06

All the entries in this section are minimum versions. The version after each heading is the resolved
version on 2026-08-06.

#### `axios: ^1.19.0` → 1.19.0

-   **Why:** This entry agrees with the direct dependency `dependencies.axios`. It also moves the
    transitive requests for `0.21.x`, `0.27.x` and `1.6.4` up to the patched version.
-   **Fixes:** GHSA-gcfj-64vw-6mp9 (`>= 1.15.2, < 1.18.0`), GHSA-hfxv-24rg-xrqf, GHSA-777c-7fjr-54vf,
    GHSA-p92q-9vqr-4j8v and GHSA-j5f8-grm9-p9fc (all `< 1.16.0`).
-   **Drop when:** No transitive parent asks for an axios version below 1.18.0. Keep this entry and
    the direct dependency at the same version.

#### `lodash: ^4.18.0` → 4.18.1

-   **Why:** This entry agrees with the direct dependency `dependencies.lodash`. Two `@eyeseetea`
    packages ask for the exact version `4.17.21`.
-   **⚠️ Do not remove this entry to upgrade lodash.** Without the entry, lodash moves **down** to
    `4.17.21`. That version is vulnerable.
-   **Fixes:** GHSA-r5fr-rjxr-66jc (`>= 4.0.0, <= 4.17.23`). The patch is in 4.18.0.
-   **Drop when:** All parents ask for `lodash@^4.18.0` or a later version.

#### `qs: ^6.15.3` → 6.15.3

-   **Why:** The DHIS2 chain and the axios chain ask for `~6.5.2`, `6.9.7` and `^6.12.3`. The previous
    entry held all of them at the exact version `6.14.2`. That version is in the affected range below.
-   **Fixes:** GHSA-q8mj-m7cp-5q26 (`>= 6.11.1, <= 6.15.1`). The patch is in 6.15.2.
-   **Verified:** `@eyeseetea/d2-api` uses `qs` at run time. The test suite and a production build
    both pass with version 6.15.3.
-   **Drop when:** All parents ask for `qs@^6.15.2` or a later version.

#### `brace-expansion: ^1.1.18` → 1.1.18

-   **Why:** The `minimatch@3.x` chain comes from the eslint 7 tool set. It asks for
    `brace-expansion@^1.1.7`. That range already permits the patched release. Thus this entry records
    the requirement. It does not change a version.
-   **Fixes:** GHSA-mh99-v99m-4gvg. The advisory has four ranges. The applicable range is `< 1.1.17`.
    The patch is in 1.1.17.
-   **⚠️ Do not change this entry to version 5.** brace-expansion 5 exports a named binding `expand`.
    `minimatch@3` uses `const expand = require("brace-expansion")`. eslint then stops with the message
    `TypeError: expand is not a function`. We tried this change on 2026-07-30 and removed it.
-   **Drop when:** The eslint 7 tool set no longer uses the `minimatch@3.x` line.

#### `handlebars: ^4.7.9` → 4.7.9

-   **Why:** `@dhis2/d2-i18n-generate` asks for `handlebars@^4.0.11`.
-   **Fixes:** GHSA-xjpj-3mr7-gcpf, GHSA-xhpv-hc6g-r9c6 and GHSA-9cx6-37pm-9jff (all
    `>= 4.0.0, <= 4.7.8`). The patch is in 4.7.9.
-   **Verified:** `yarn localize` writes the locale files.
-   **Drop when:** The project no longer uses the `@dhis2/d2-i18n-*` tools.

#### `form-data: ^4.0.6` → 4.0.6

-   **Why:** One bare entry keeps `axios`, `jsdom`, `@eyeseetea/d2-api` and `@cypress/request` on one
    patched line. `@cypress/request` asks for `~2.3.2`. The 2.x line had no patched release when we
    wrote this entry. Thus the change of major version is intentional.
-   **Fixes:** GHSA-fjxv-7rqg-78g4 (critical, `>= 4.0.0, < 4.0.4`) and GHSA-hmw2-7cc7-3qxx
    (`>= 4.0.0, < 4.0.6`).
-   **⚠️ `@cypress/request` prevents the removal of this entry.** Do not remove this entry while
    `cypress` is a development dependency.
-   **Drop when:** All parents ask for `form-data@^4.0.6` or a later version.

#### `linkify-it: ^5.0.2` → 5.0.2

-   **Why:** `react-linkify` is a transitive package below `@eyeseetea/d2-ui-components`. It asks for
    `linkify-it@^2.0.3`. That range gives the vulnerable version `2.2.0`.
-   **Fixes:** GHSA-v245-v573-v5vm (`<= 5.0.1`). The patch is in 5.0.2.
-   **⚠️ This entry forces a major upgrade on `react-linkify`.** The `linkify-it` interface does not
    change between these major versions. Examine each view that shows links. Make sure that the
    application finds links correctly.
-   **Drop when:** A different package replaces `react-linkify`, or `react-linkify` asks for
    `linkify-it@^5`.

#### `flatted: ^3.4.4` → 3.4.4

-   **Why:** `flat-cache` is the eslint cache. It asks for `flatted@^3.1.0`.
-   **Fixes:** GHSA-rf6f-7fwh-wjgh (`<= 3.4.1`). The patch is in 3.4.2.
-   **Drop when:** `flat-cache` asks for `flatted@^3.4.2` or a later version.

#### `braces: ^3.0.3` → 3.0.3

-   **Why:** `micromatch` and `chokidar` ask for `braces@^3.0.1`.
-   **Fixes:** GHSA-grv7-fg5c-xmjg (`< 3.0.3`). The vulnerability uses too many resources.
-   **Drop when:** All parents ask for `braces@^3.0.3` or a later version.

#### `cross-spawn: ^7.0.6` → 7.0.6

-   **Why:** `eslint` and `execa` ask for `cross-spawn@^7.0.0`.
-   **Fixes:** GHSA-3xgq-45jj-v275 (`>= 7.0.0, < 7.0.5`). The vulnerability is a regular expression
    denial of service.
-   **Drop when:** All parents ask for `cross-spawn@^7.0.5` or a later version.

#### `ansi-regex: ^5.0.1` → 5.0.1

-   **Why:** `strip-ansi` and `pretty-format` ask for `ansi-regex@^5.0.0`. This entry also moves the
    `strip-ansi@3.0.1` branch and the `has-ansi@2.0.0` branch off the 2.x line. The 2.x line has no
    patched release.
-   **Fixes:** GHSA-93q8-gq69-wqmw (`>= 5.0.0, < 5.0.1`). The vulnerability is a regular expression
    denial of service.
-   **⚠️ Known cost:** one copy of `strip-ansi` in the `vite-plugin-checker` chain asks for
    `ansi-regex@^6.2.2`. The bare entry holds that copy at 5.0.1. The 6.x line is not vulnerable. Thus
    this entry gives that parent no protection. We accept this cost for two reasons. First,
    `ansi-regex` exports one function in each major version. Second, the 2.x branches still need the
    change. `yarn lint` and a production build both pass. Examine this entry again if
    `vite-plugin-checker` shows control characters in its output.
-   **Drop when:** The eslint 7 tool set is upgraded, and no parent asks for an `ansi-regex` version
    below 5.0.1. Change this entry to a per-parent entry before you remove it.

#### `word-wrap: ^1.2.5` → 1.2.5

-   **Why:** `optionator` is part of eslint. It asks for `word-wrap@^1.2.3`.
-   **Fixes:** GHSA-j8xg-fqg3-53r7 (**medium**, `< 1.2.4`). The vulnerability is a regular expression
    denial of service. The severity is below the CI threshold. We keep the entry because the change is
    easy.
-   **Drop when:** `optionator` asks for `word-wrap@^1.2.4` or a later version.

#### `async: ^3.2.6` → 3.2.6

-   **Why:** `getos` is below `cypress`. It asks for `async@^3.2.0`. This package is a test tool only.
    It has no run-time path.
-   **Fixes:** GHSA-fwr7-v2mv-hh25 (`>= 3.0.0, < 3.2.2`). The vulnerability is a regular expression
    denial of service in `autoInject`.
-   **Drop when:** `cypress` no longer uses the `getos` chain.

#### `tmp: ^0.2.7` → 0.2.7

-   **Why:** `cypress` asks for `tmp@~0.2.1`. This package is a test tool only.
-   **Fixes:** GHSA-7c78-jf6q-g5cm (`>= 0.2.6, < 0.2.7`) and GHSA-ph9p-34f9-6g65 (`< 0.2.6`). The
    vulnerability writes to an unwanted file through a symbolic link.
-   **Drop when:** `cypress` asks for `tmp@^0.2.7` or a later version.

#### `tough-cookie: ^4.1.4` → 4.1.4

-   **Why:** `@cypress/request` asks for `tough-cookie@~2.5.0`. The 2.x line has no patched release.
    Thus the 4.x line is the only correction. `jsdom` already uses the 4.x line.
-   **Fixes:** CVE-2023-26136 (critical). The vulnerability is prototype pollution.
-   **⚠️ In tough-cookie 4, the function `getCookieString` is asynchronous only.** This can cause a
    failure in the Cypress cookie functions at run time. CI does not do the Cypress end-to-end tests.
    Thus the risk applies to a local `yarn cy:e2e:run` only. **We did not verify this.** Do the
    end-to-end tests before you use this entry.
-   **Drop when:** `cypress` uses a request client that uses tough-cookie 4 or a later version.

#### `ws: ^8.21.1` → 8.21.2

-   **Why:** `jsdom` asks for `ws@^8.18.0`. The lockfile held that request below the patch.
-   **Fixes:** GHSA-96hv-2xvq-fx4p (`>= 8.0.0, < 8.21.0`). The vulnerability is a denial of service
    that uses small fragments.
-   **Drop when:** The lockfile gives `ws@^8.18.0` a version of 8.21.0 or later without this entry.

#### `diff: ^4.0.4` → 4.0.4

-   **Why:** `ts-node` asks for `diff@^4.0.1`. That range already permits the patched release. The
    previous entry forced the 5.x major version, but that change was not necessary. The high-severity
    `diff` advisory includes versions below 3.5.0 only. It does not include the 4.x line.
-   **Fixes:** GHSA-73rr-hh4g-fpgx (**low**, `>= 4.0.0, < 4.0.4`). The patch is in 4.0.4.
-   **Drop when:** `ts-node` asks for `diff@^4.0.4` or a later version.

#### `json-schema: ^0.4.0` → 0.4.0

-   **Why:** `jsprim` is in the `@cypress/request` chain. It asks for the exact version `0.2.3`. This
    package is a test tool only.
-   **Fixes:** GHSA-896r-f27r-55mw (critical, `< 0.4.0`). The vulnerability is prototype pollution.
-   **Drop when:** The `@cypress/request` chain is no longer in the tree.

#### `js-yaml: ^3.15.0` → 3.15.1

-   **Why:** `eslint` and `@eslint/eslintrc` ask for `js-yaml@^3.13.1`.
-   **Fixes:** GHSA-52cp-r559-cp3m (`>= 3.0.0, < 3.15.0`). The patch is in 3.15.0.
-   **Drop when:** The eslint 7 tool set no longer uses the js-yaml 3.x line.

#### `node-gettext: ^3.0.1` → 3.0.1

-   **Why:** `i18next-conv` is in the `yarn localize` chain. It asks for `node-gettext@^2.0.0`, which
    gives version `2.1.0`. The advisory includes all versions to 3.0.0. It **records no patched
    version**. Version 3.0.1 is the only release above the range. Thus 3.0.1 is the correction. This
    package is a build tool only.
-   **Fixes:** GHSA-g974-hxvm-x689. The vulnerability is prototype pollution.
-   **Verified:** `yarn localize` writes the locale files.
-   **Drop when:** `i18next-conv` asks for `node-gettext@^3.0.1` or a later version.

#### `postcss: ^8.5.18` → 8.5.26

-   **Why:** Three parents ask for `postcss@^8.4.x` or `^8.5.x`: `vite`, the `vite` below `vitest`,
    and `rtlcss`. Those ranges gave a version below the patch.
-   **Fixes:** GHSA-r28c-9q8g-f849 (`<= 8.5.17`). The patch is in 8.5.18.
-   **Drop when:** All parents ask for `postcss@^8.5.18` or a later version.

#### `json5: ^2.2.3` → 2.2.3

-   **Why:** `@babel/core` asks for `json5@^2.1.2`.
-   **Fixes:** GHSA-9c47-m6qq-7p4h (`>= 2.0.0, < 2.2.2`). The vulnerability is prototype pollution in
    the function `parse`. The patch is in 2.2.2. This entry is one patch above that version.
-   **Drop when:** All parents ask for `json5@^2.2.2` or a later version.

#### `esbuild: ^0.28.1` → 0.28.1

-   **Why:** This entry gives one esbuild binary to `vite` and to the `vite` below `vitest`. esbuild
    supplies a Go binary. The Syft scan reports the Go standard library in that binary as a separate
    component. Older esbuild releases contain an older Go standard library, which has its own
    findings.
-   **Fixes:** the `stdlib` findings that the Syft scan reports for
    `node_modules/@esbuild/*/bin/esbuild`.
-   **⚠️ GHSA-gv7w-rqvm-qjhr is not the reason for this entry.** Somebody withdrew that advisory on
    2026-06-17. Some scanners continue to report it. Do not do work for it.
-   **Related:** esbuild 0.28 does not build for Safari 14.0. `vite.config.ts` sets `ESBUILD_TARGET`
    to the default Vite "modules" target, but with `safari14.1` in place of `safari14`. Do not remove
    that constant while this entry is in the file.
-   **Drop when:** Both `vite` major versions in the tree ask for esbuild 0.28.1 or a later version.

#### `uuid: ^11.1.1` → 11.1.1

-   **Why:** `@cypress/request` asks for `uuid@^8.3.2`. That range gives the vulnerable version
    `8.3.2`.
-   **Fixes:** GHSA-w5hq-g745-h8pq (**medium**, `< 11.1.1`). The functions `v3()`, `v5()` and `v6()`
    accept an output buffer from the caller. They do not refuse a write that is outside the buffer.
-   **⚠️ uuid 11 is an ES module.** Its `package.json` has `"type": "module"` and no CommonJS build.
    `@cypress/request` is CommonJS. Three facts make this entry safe. All three must stay true:
    1. `@cypress/request` uses `const { v4: uuid } = require("uuid")`. It does **not** use the
       `uuid/v4` path, which uuid 7 removed. We verified this in `lib/multipart.js` and `lib/auth.js`.
    2. This copy belongs to the `cypress` command-line package, which runs on the system Node.
       `.nvmrc` sets Node 22. Node 22 can do `require()` on an ES module. The Cypress binary contains
       a different copy of `@cypress/request`. This entry does not change that copy.
    3. Node below version 22.12 cannot do `require()` on an ES module. **Do not set `.nvmrc` below
       Node 22 while this entry is in the file.**
-   **Verified:** `require("uuid").v4()` gives a version 4 value. `@cypress/request/lib/multipart.js`
    and `lib/auth.js` both load. `npx cypress version` shows the binary version.
-   **Not verified:** the Cypress end-to-end tests. Do `yarn cy:e2e:run` before you use this entry.
-   **Reachability:** the vulnerability needs an output buffer from the caller. The request client
    calls `uuid()` with no arguments. Thus the vulnerable code was not reachable. We made this change
    because it is easy, not because it was necessary.
-   **Drop when:** `cypress` asks for `uuid@^11.1.1` or a later version, or it no longer uses
    `@cypress/request`.

#### `glob-parent: ^5.1.2` → 5.1.2

-   **Why:** The chokidar chain and the fast-glob chain ask for `glob-parent@^3.1.0` and `^5.1.0`. The
    `^3.1.0` request needs the change.
-   **Fixes:** GHSA-ww39-953v-wcq6 (`>= 4.0.0, < 5.1.2`). The vulnerability is a regular expression
    denial of service.
-   **Drop when:** No parent asks for a `glob-parent` version below 5.1.2.

#### `node-fetch: ^2.6.7` → 2.7.0

-   **Why:** One parent asks for `node-fetch@^1.0.1`. The advisory includes that range. This entry
    moves that parent to the 2.x line. The entry stays below version 3, because node-fetch 3 is an ES
    module.
-   **Fixes:** GHSA-r683-j2x4-v87g (`< 2.6.7`). The vulnerability shows private data.
-   **Drop when:** No parent asks for `node-fetch@1.x`.

#### `i18next: 19.8.5` (exact version)

-   **Why:** This is the only exact version in the block. `@dhis2/d2-i18n` needs this release. Other
    parents ask for `*` and `^10.3`, which need a constraint. In comparable applications, a range here
    stops the application at start-up.
-   **Fixes:** compatibility. This entry does not correct a security advisory. `i18next` has no
    current high-severity or critical finding.
-   **⚠️ The supplier no longer supports i18next 19.** To keep this version for a long time is a risk.
-   **Drop when:** Somebody upgrades `@dhis2/d2-i18n`, or the application no longer uses it. Examine
    this entry at the next `@dhis2/d2-i18n` change.

#### Other minimum versions

These entries need no long description. Each one moves an older request up to a patched version, or
records a minimum version that the tree already meets.

| Entry                      | Resolved | Fixes                                                       | Drop when                                                   |
| -------------------------- | -------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `minimatch: ^3.1.4`        | 3.1.5    | GHSA-23c5-xmqv-rm74 (`< 3.1.4`). Regular expression attack. | The eslint 7 tool set no longer uses the 3.x line.          |
| `minimist: ^1.2.6`         | 1.2.8    | GHSA-xvch-5gv4-984h (critical, `< 1.2.6`).                  | All parents ask for `^1.2.6` or later.                      |
| `path-parse: ^1.0.7`       | 1.0.7    | CVE-2021-23343. No current advisory.                        | All parents ask for `^1.0.7` or later.                      |
| `moment: ^2.29.4`          | 2.30.1   | GHSA-wc69-rhjr-hc9g (`>= 2.18.0, < 2.29.4`).                | The application and `@date-io/moment` no longer use moment. |
| `ua-parser-js: ^0.7.33`    | 0.7.41   | GHSA-fhg7-m89q-25r3 (`>= 0.7.30, < 0.7.33`).                | All parents ask for `^0.7.33` or later.                     |
| `uglify-js: ^3.14.3`       | 3.19.3   | GHSA-c9f4-xj24-8jqx (`< 2.6.0`), GHSA-34r7-q49f-h37c.       | The `d2` and `d2-manifest` tools are no longer in the tree. |
| `@babel/runtime: ^7.26.10` | 7.29.7   | CVE-2025-27789. No current advisory.                        | All parents ask for `^7.26.10` or later.                    |
| `@babel/traverse: ^7.23.2` | 7.29.8   | GHSA-67hx-6x53-jw92 (critical, `< 7.23.2`).                 | All parents ask for `^7.23.2` or later.                     |

#### `picomatch`: seven per-parent entries

```jsonc
"fast-glob/picomatch":            "^2.3.2",
"micromatch/picomatch":           "^2.3.2",
"@rollup/pluginutils/picomatch":  "^4.0.4",
"tinyglobby/picomatch":           "^4.0.4",
"vite/picomatch":                 "^4.0.4",
"vite-plugin-checker/picomatch":  "^4.0.4",
"vitest/picomatch":               "^4.0.4"
```

-   **Why:** picomatch is in two major lines. The 2.x line comes from
    `@typescript-eslint/typescript-estree`, then `globby`, then `fast-glob`, then `micromatch`. The
    4.x line comes from the Vite tools and the Rollup tools. A bare entry would force one major
    version on parents that cannot use it. picomatch 4 exports named ES module bindings, and
    `micromatch@4` does not expect them.
-   **Fixes:** GHSA-c2c7-rcm5-vvqj (high). The patched versions are 2.3.2 and 4.0.4.
-   **⚠️ The two 2.x entries have no effect in this repository.** Read the per-parent warning in
    [Conventions](#conventions). `fast-glob` and `micromatch` are transitive parents. Thus Yarn 1
    ignores both entries and keeps a nested `picomatch@2.2.2`. We verified this on 2026-08-06 with
    `yarn why picomatch`. We also read `node_modules/*/node_modules/picomatch/package.json`. The four
    4.x entries do have an effect, because Yarn puts the Vite tools at the top level.
-   **Result:** the Berry scan is the scan that reports picomatch. On 2026-08-06 we did a Berry
    install of this `package.json` in a separate folder. Berry gave two versions only: 2.3.2 and
    4.0.5. Both versions have the patch. Thus these entries correct the scan that reports the finding.
-   **⚠️ The Syft scan does not report picomatch.** The Yarn 1 tree keeps the nested
    `picomatch@2.2.2`, but the last Syft scan reported no picomatch finding. Examine this again if a
    picomatch finding appears in a Syft report.
-   **Drop when:** Somebody upgrades `@typescript-eslint` above major version 4. That upgrade removes
    the full 2.x line, together with `globby`, `fast-glob` and `micromatch`. It also removes the
    difference between the two scans. Remove the 4.x entries when the Vite tools ask for
    `picomatch@^4.0.4` or a later version.

---

## Accepted findings with no correction available

There are none. Each critical finding and each high finding in the last scan has a correction in this
file.

⚠️ Keep this section. When you accept a finding, record it here. Give this data for each finding: the
full chain, the reason for no correction, the place where the code runs, the reachability of the
vulnerable code, the difference between the two scans, and the condition to examine it again. Policy
says that you must correct a critical or high finding, or you must record it as an exception with
management approval.

---

## Entries that you can possibly remove

For each entry in the list below, the declared range of each parent already permits the minimum
version. Thus you can possibly remove the entry.

⚠️ **"You can possibly remove it" and "it has no effect" are different statements.** Test one entry at
a time. Remove the entry, do `yarn install`, then compare the resolved versions. Do not test more than
one entry at the same time.

`async`, `braces`, `brace-expansion`, `cross-spawn`, `diff`, `flatted`, `handlebars`, `js-yaml`,
`json5`, `minimatch`, `minimist`, `moment`, `path-parse`, `postcss`, `tmp`, `ua-parser-js`,
`uglify-js`, `word-wrap`, `ws`, `@babel/runtime`, `@babel/traverse`.

We removed three entries on 2026-08-06 after this test:

-   **`path-to-regexp: 1.9.0`.** This entry had no effect. `react-router` declares
    `path-to-regexp@^1.7.0`. Version 1.9.0 is the newest 1.x release. Thus the range already gave that
    version. The removal changed the lockfile descriptor. It changed no installed version.
-   **`semver: 6.3.1`.** This entry caused a problem. The bare exact version held `semver@^7.2.1` and
    `semver@^7.3.5` at 6.3.1. That version is one major version below the declared ranges. After the
    removal, the three lines give 5.7.2, 6.3.1 and 7.8.5. Each version is above its own advisory
    minimum.
-   **`debug: 4.3.1`.** This entry caused a problem, and it was never a security entry. It held
    `debug@^4.4.1` at 4.3.1. After the removal, the tree gives 2.6.9, 3.2.7, 4.3.1 and 4.4.3. No
    version is vulnerable. The current advisory includes version 4.4.2 only.

---

## Incorrect findings from the scanner

The scanner compares some components by CPE and not by package URL. In these cases, it removes the
npm scope. It then compares the short name with a different product. This repository **cannot correct
these findings**. The packages are not the software in the advisory. Do not add entries for them.

| Reported as                                      | Real package                                                          | Product in the advisory                                      |
| ------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `progress@2.0.3`                                 | `progress` (below `eslint`)                                           | Progress Telerik UI for WinUI                                |
| `logo@6.x`                                       | `@dhis2-ui/logo`                                                      | Siemens LOGO! Soft Comfort                                   |
| `system@4.12.2`, `system@5.18.0`                 | `@material-ui/system`, `@mui/system`                                  | different products with the name "system"                    |
| `core@*`                                         | `@babel/core`, `@material-ui/core`, `@popperjs/core`, `@date-io/core` | different products with the name "core"                      |
| `ui@6.x`, `radio@6.x`, `checkbox@6.x`, `box@6.x` | `@dhis2/ui`, `@dhis2-ui/*`                                            | different products                                           |
| `hash@*`, `serialize@*`, `cache@*`, `utils@*`    | `@emotion/*`, `@material-ui/utils`, `@mui/utils`, `@vitest/utils`     | different products                                           |
| `moment@1.0.2`                                   | `@date-io/moment`                                                     | moment.js, which is a different package and a different line |
| `pinpoint@2.0.0`                                 | `@sideway/pinpoint`                                                   | Pinpoint APM                                                 |
| `json5@0.0.29`                                   | `@types/json5`                                                        | json5. The type stubs have one version only.                 |
| `events@3.3.0`                                   | `events`                                                              | Events Extension for BigTree                                 |
| `clone@2.1.2`                                    | `clone`                                                               | Clone WordPress plugin                                       |
| `process@0.11.10`                                | `process`                                                             | `kill-process-by-name`                                       |
| `asn1@0.2.4`                                     | `asn1`                                                                | Perl `Convert::ASN1`                                         |
| `through@2.3.8`                                  | `through`                                                             | the Rust `through` crate                                     |
| `slash@3.0.0`                                    | `slash`                                                               | Slashdot Slashcode                                           |
| `source-map@0.6.1`                               | `source-map`                                                          | `badjs-sourcemap-server`                                     |
| `encoding@0.1.12`                                | `encoding`                                                            | `detect-character-encoding`                                  |

If the workflow fails only on findings from this table, speak to the scanner administrator. Ask that
person to stop the approximate CPE comparison. As an alternative, ask that person to mark each
finding as incorrect. The export then removes them.

**These findings control the count in the Berry scan.** On 2026-08-06 we compared the last scan of
the tree with the tree that this file now creates. The Berry scan had 299 critical and high
instances. The entries in this file correct 187 of them. All the other 112 instances are in the table
above. The component `progress@2.0.3` gives 98 of those 112. The Syft scan had 63 critical and high
instances, and the entries correct all 63.

The CI threshold counts new instances only. It compares the branch with the base branch. These
incorrect findings are on both sides of that comparison. Thus they do not stop the workflow, but they
do make the total count large.

---

## Withdrawn advisories

Somebody can withdraw an advisory after publication. Scanners receive that change at different times.
Thus a withdrawn advisory can stay in a report and look like necessary work.

Do this command before you start work that costs more than a version change:

```bash
gh api advisories/<GHSA> --jq '.withdrawn_at // "not withdrawn"'
```

| Advisory              | Package   | Withdrawn  | Note                                                                                                                                                                                                                    |
| --------------------- | --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GHSA-gv7w-rqvm-qjhr` | `esbuild` | 2026-06-17 | This advisory is not the reason for the `esbuild` entry. Read that entry.                                                                                                                                               |
| `GHSA-qmq6-f8pr-cx5x` | `uuid`    | 2026-05-05 | A duplicate advisory with low severity. It caused a `uuid: 14.0.1` entry on 2026-07-30. That entry forced a major ES module on a CommonJS parent. On 2026-08-06 we replaced it with `^11.1.1` for the current advisory. |
| `GHSA-p5wg-g6qr-c7cg` | `eslint`  | 2026-02-03 | To correct it, you must upgrade eslint by one major version. That upgrade corrects nothing.                                                                                                                             |

---

## How to find an entry that is no longer correct

Each condition below shows that an entry is no longer correct:

-   A high-severity finding occurs again for a package that has an entry.
-   `yarn why <package>` shows a version below the version in the advisory. Compare the version with
    the advisory, and not with the previous version.
-   An entry keeps a package **below** the range that the package declares. Compare the entry with the
    output of `grep -E '^"?<pkg>@' yarn.lock` before you accept that the entry is correct.
-   An entry has an exact version, but the file gives no reason for an exact version. Change it to a
    minimum version.
-   A per-parent entry names a parent that `yarn why <parent>` no longer shows. That entry now matches
    nothing. Remove it.

## Verification done on 2026-08-06

These commands all pass: `yarn install --frozen-lockfile`, `tsc --noEmit`, `yarn lint`, `yarn test`
(864 tests), `yarn localize`, and `yarn build` with the zip step.

We also tested the tools that use the packages in these entries:

-   `yarn localize` for `handlebars` and `node-gettext`.
-   `yarn lint` for the eslint chain.
-   A `require()` of `@cypress/request/lib/multipart.js` and `lib/auth.js` for `uuid`.

**Not verified:** the application start-up, a manual test of the user functions, and the Cypress
end-to-end tests. The `tough-cookie` entry and the `uuid` entry both change the Cypress request
client. Do `yarn cy:e2e:run` before you use them.

**Related note:** `vite-plugin-node-stdlib-browser` declares a peer dependency of
`vite@^2.0.0 || ^3.0.0 || ^4.0.0`. This project now uses vite 6. The build passes. Yarn shows a
warning about this difference at each install.
