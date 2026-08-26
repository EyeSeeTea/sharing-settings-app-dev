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

### The two severities disagree

Dependency-Track ranks a finding by its CVSS score. The GitHub Advisory Database sets its own
severity. The two values disagree, and they disagree in both directions. Two examples of 2026-08-21:

-   GHSA-2v37-7h3g-55p8 (`nanoid`) is **high** in the GitHub Advisory Database. Its CVSS score is 5.9,
    which is medium.
-   GHSA-848j-6mx2-7j84 (`elliptic`) is **low** in the GitHub Advisory Database. Its CVSS score is 5.6,
    which is medium.

Read both values. A CI gate on critical and high can pass while the GitHub Advisory Database shows a
high finding. Do this command:

```bash
gh api advisories/<GHSA> --jq '[.severity, .cvss.score, .withdrawn_at]'
```

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

**A direct dependency can have the same problem.** On 2026-08-21 the development dependency
`@babel/core` was the exact version `7.15.5`. GHSA-4x5r-pxfx-6jf8 patches at 7.29.6. The exact version
prevented that release. It also held `@babel/helpers` at 7.15.4, which GHSA-968p-4wvh-cqc8 includes.
The dependency is now `^7.29.6`, and both packages resolve to 7.29.7. Examine the `dependencies` and
`devDependencies` blocks with the same method as the `resolutions` block.

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

-   **Why:** Three parents ask for `form-data`: `axios` asks for `^4.0.6`, and `jsdom` and
    `@eyeseetea/d2-api` both ask for `^4.0.0`. The two `^4.0.0` ranges permit a version below the
    patch. One bare entry keeps all three on the patched line.
-   **Fixes:** GHSA-fjxv-7rqg-78g4 (critical, `>= 4.0.0, < 4.0.4`) and GHSA-hmw2-7cc7-3qxx
    (`>= 4.0.0, < 4.0.6`).
-   **Note:** the `@cypress/request` parent left the tree on 2026-08-25 with `cypress`. Before that
    date, this entry also moved that parent from the 2.x line.
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
    ignores both entries. We verified this on 2026-08-06 with `yarn why picomatch`. We also read
    `node_modules/*/node_modules/picomatch/package.json`. The four 4.x entries do have an effect,
    because Yarn puts the Vite tools at the top level.
-   **⚠️ The lockfile, and not the two 2.x entries, kept `picomatch@2.2.2` in the Yarn 1 tree.** The
    entries were correct and unnecessary. `micromatch` asks for `^2.0.5` and `fast-glob` asks for
    `^2.2.1`. Both ranges permit the patched 2.3.2, but the lockfile held an older resolution. On
    2026-08-21 we removed those lockfile blocks and did `yarn install` again. Yarn 1 now gives 2.3.2.
    Keep the two entries as a minimum version.
-   **Result:** on 2026-08-06 we did a Berry install of this `package.json` in a separate folder.
    Berry gave two versions only: 2.3.2 and 4.0.5. After the re-resolution of 2026-08-21, the Yarn 1
    tree gives 2.3.2 and 4.0.5 also. Each version has the patch, and the two scans now agree.
-   **Drop when:** Somebody upgrades `@typescript-eslint` above major version 4. That upgrade removes
    the full 2.x line, together with `globby`, `fast-glob` and `micromatch`. It also removes the
    difference between the two scans. Remove the 4.x entries when the Vite tools ask for
    `picomatch@^4.0.4` or a later version.

---

## Accepted findings with no correction available

We found three findings on 2026-08-21. We compared each resolved version in the lockfile with the
GitHub Advisory Database. No entry can correct them. Each package is a development tool. No package
below is in the application bundle. Two of the three findings were below `cypress`. They left the
tree on 2026-08-25 with that dependency. One finding stays.

⚠️ Keep this section. When you accept a finding, record it here. Give this data for each finding: the
full chain, the reason for no correction, the place where the code runs, the reachability of the
vulnerable code, the difference between the two scans, and the condition to examine it again. Policy
says that you must correct a critical or high finding, or you must record it as an exception with
management approval.

#### `elliptic@6.6.1` — GHSA-848j-6mx2-7j84 (low in the GitHub Advisory Database, CVSS 5.6)

-   **Chain:** the browser polyfill chain below `vite-plugin-node-stdlib-browser`.
-   **Why no correction:** the advisory includes each published version. Version 6.6.1 is `latest`.
-   **Examine again when:** an elliptic release above 6.6.1 occurs.

---

## Entries that you can possibly remove

For each entry in the list below, the declared range of each parent already permits the minimum
version. Thus you can possibly remove the entry.

⚠️ **"You can possibly remove it" and "it has no effect" are different statements.** Test one entry at
a time. Remove the entry, do `yarn install`, then compare the resolved versions. Do not test more than
one entry at the same time.

`braces`, `brace-expansion`, `cross-spawn`, `diff`, `flatted`, `handlebars`, `js-yaml`, `json5`,
`minimatch`, `minimist`, `moment`, `path-parse`, `postcss`, `ua-parser-js`, `uglify-js`, `word-wrap`,
`ws`, `@babel/runtime`, `@babel/traverse`.

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
| `GHSA-qmq6-f8pr-cx5x` | `uuid`    | 2026-05-05 | A duplicate advisory with low severity. It caused a `uuid: 14.0.1` entry on 2026-07-30. That entry forced a major ES module on a CommonJS parent. On 2026-08-06 we replaced it with `^11.1.1`. The entry left the file on 2026-08-25 with `cypress`. |
| `GHSA-p5wg-g6qr-c7cg` | `eslint`  | 2026-02-03 | To correct it, you must upgrade eslint by one major version. That upgrade corrects nothing.                                                                                                                             |
| `GHSA-7gc6-qh9x-w6h8` | `cross-fetch` | 2025-10-08 | Found on 2026-08-21 against `cross-fetch@3.1.4`. The declared range permits the patched 3.1.5, but the advisory is withdrawn. Do not add an entry.                                                              |

---

## A finding can be in the lockfile only

**Not each finding needs an entry.** An advisory can move after you write this file. The GitHub
Advisory Database changes the patched version of an advisory, or it adds a new advisory to a version
that was satisfactory. In many of these cases the range that the parent declares already permits the
patch. Then the lockfile, and not `package.json`, is the reason for the finding.

On 2026-08-21 we compared each resolved version in `yarn.lock` with the GitHub Advisory Database. 20
package findings occurred. 14 of them needed no entry:

| Package                  | Before        | After   | Advisory                                   |
| ------------------------ | ------------- | ------- | ------------------------------------------ |
| `nanoid`                 | 3.3.17        | 3.3.18  | GHSA-2v37-7h3g-55p8 (high)                 |
| `picomatch`              | 2.2.2         | 2.3.2   | GHSA-c2c7-rcm5-vvqj (high), GHSA-3v7f-55p6-f55p |
| `micromatch`             | 4.0.2         | 4.0.8   | GHSA-952p-6rrq-rcjv                        |
| `ajv`                    | 6.12.2, 6.12.4| 6.15.0  | GHSA-2g4f-4pwh-qvx6, GHSA-v88g-cgmw-v5xw   |
| `ajv`                    | 8.6.0         | 8.20.0  | GHSA-2g4f-4pwh-qvx6                        |
| `joi`                    | 17.4.2        | 17.13.6 | GHSA-q7cg-457f-vx79                        |
| `yaml`                   | 1.10.0        | 1.10.3  | GHSA-48c2-rrv3-qjmp                        |
| `hosted-git-info`        | 2.8.8         | 2.8.9   | GHSA-43f8-2h32-f4cj                        |
| `@sideway/formula`       | 3.0.0         | 3.0.1   | GHSA-c2jc-4fpr-4vhg                        |
| `@babel/helpers`         | 7.15.4        | 7.29.7  | GHSA-968p-4wvh-cqc8                        |
| `@babel/runtime-corejs3` | 7.10.4        | 7.29.7  | GHSA-968p-4wvh-cqc8                        |
| `@babel/core`            | 7.15.5, 7.29.0| 7.29.7  | GHSA-4x5r-pxfx-6jf8                        |

The `@babel/core` row also needed a change to `devDependencies`. Read
[Use a minimum version](#use-a-minimum-version-not-an-exact-version). The other rows changed the
lockfile only.

To find these findings, read the resolved versions from `yarn.lock`, then do this command for each
one:

```bash
gh api "advisories?ecosystem=npm&affects=<package>@<version>"
```

To correct one, remove its block from `yarn.lock` and do `yarn install`. Then read the new version
from `yarn.lock`. Do not use the exit code of the command as the result:

```bash
grep -A1 '^nanoid@' yarn.lock   # expect version "3.3.18"
```

⚠️ `yarn upgrade <package>` does not do this. Yarn 1 accepts that command for a direct dependency
only. The command `yarn up -R <package>` is a Yarn Berry command. This project uses Yarn 1.

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
-   The advisory moved. An advisory can change its patched version after you write the entry. Compare
    the entry with the current data from `gh api advisories/<GHSA>`, and not with this file.

## Verification done on 2026-08-25

We removed `cypress` and its four helper packages: `@testing-library/cypress`, `cypress-xpath`,
`eslint-plugin-cypress` and `wait-on`. We also removed the `cypress/` folder, `cypress.json`, the
three `cy:*` scripts, and the cypress parts of `.eslintrc.js`, `.gitignore`, `.env`, `vite.config.ts`
and `README.md`. The lockfile lost 857 lines.

Five entries left the `resolutions` block with that dependency. Each one had a `cypress` parent only:

| Entry                    | Parent that is now gone            |
| ------------------------ | ---------------------------------- |
| `async: ^3.2.6`          | `cypress` → `getos`                |
| `tmp: ^0.2.7`            | `cypress`                          |
| `tough-cookie: ^4.1.4`   | `@cypress/request`                 |
| `json-schema: ^0.4.0`    | `@cypress/request` → `jsprim`      |
| `uuid: ^11.1.1`          | `@cypress/request`                 |

We removed the five entries together and did `yarn install`. We then compared the 1129 resolved
versions with the versions before the removal. **No resolved version changed.** `tough-cookie` stays
at 4.1.4, because `jsdom` asks for `^4.1.4`. The other four packages are no longer in the tree. Yarn 1
kept a dead block for each of the four in `yarn.lock`. We removed those four blocks by hand, then did
`yarn install` again. They did not come back.

The `form-data` entry stays. It lost the `@cypress/request` parent, but `jsdom` and
`@eyeseetea/d2-api` both ask for `^4.0.0`. That range still permits a version below the patch.

These commands all pass: `yarn install --frozen-lockfile`, `tsc --noEmit`, `yarn lint`, `yarn test`
(864 tests), `yarn localize` (no change to the locale files) and `yarn build-folder`.

**Not verified:** the start-up of the application and a manual test of the user functions.

## Verification done on 2026-08-21

These commands all pass after the re-resolution above: `yarn install --frozen-lockfile`,
`tsc --noEmit`, `yarn lint`, `yarn test` (864 tests), `yarn localize` (no change to the locale files)
and `yarn build-folder`.

We then compared each of the 1250 resolved versions in `yarn.lock` with the GitHub Advisory Database.
Six findings stay: the three withdrawn advisories in the table above, and the three findings in
[Accepted findings](#accepted-findings-with-no-correction-available). Each entry in the `resolutions`
block gives a version that no current advisory includes.

**Not verified:** the Cypress end-to-end tests, the start-up of the application, and a manual test of
the user functions. (`cypress` left the project on 2026-08-25. The end-to-end tests no longer exist.)

## Verification done on 2026-08-06

These commands all pass: `yarn install --frozen-lockfile`, `tsc --noEmit`, `yarn lint`, `yarn test`
(864 tests), `yarn localize`, and `yarn build` with the zip step.

We also tested the tools that use the packages in these entries:

-   `yarn localize` for `handlebars` and `node-gettext`.
-   `yarn lint` for the eslint chain.
-   A `require()` of `@cypress/request/lib/multipart.js` and `lib/auth.js` for `uuid`.

**Not verified:** the application start-up, a manual test of the user functions, and the Cypress
end-to-end tests. The `tough-cookie` entry and the `uuid` entry both changed the Cypress request
client. (`cypress` left the project on 2026-08-25, together with both entries. This risk is now
gone.)

**Related note:** `vite-plugin-node-stdlib-browser` declares a peer dependency of
`vite@^2.0.0 || ^3.0.0 || ^4.0.0`. This project now uses vite 6. The build passes. Yarn shows a
warning about this difference at each install.
