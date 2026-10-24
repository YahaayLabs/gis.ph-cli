# ADR 0001: Rust rewrite

- Status: Proposed
- Date: 2026-10-24
- Deciders: CTO

## Context

`gis.ph-cli` is a TypeScript/Node CLI (commander, axios, conf).

- **Commands:** `regions`, `provinces`, `municities`, `barangays`, `politicians`, `config`, `update`. These cover only core reference data and politicians.
- **Version drift:** npm publishes 1.0.2 while `package.json` says 1.0.3.
- **Auth:** `Authorization: Bearer`. The key comes from a plaintext `conf` JSON file or `API_KEY`.
- **Install:** `update` and `install.sh` install from `main`, unpinned and unchecksummed.
- **Quality:** no tests or CI; dependencies are several majors behind.

yGIS (Tauri/Rust) and spatialVault (Rust, formerly geovault) each need an api.gis.ph client.

## Decision

- **Workspace:** Cargo workspace with two crates:
  - `gisph`: reusable API client library, intended for yGIS and spatialVault.
  - `gisph-cli`: binary `gis.ph`, a thin layer over `gisph`.
- **Client:**
  - Generated from api.gis.ph's OpenAPI (e.g. progenitor) or hand-written over `reqwest` with rustls.
  - `serde` types.
  - Typed errors (`thiserror`) mapping 401/403/404/429.
- **CLI:**
  - `clap` derive.
  - Key in the OS keychain (`keyring`), falling back to `GISPH_API_KEY`; `API_KEY` remains as a deprecated alias.
  - Config in the platform config dir (`directories`), with no secret stored there. Never print the key.
- **Parity first:** identical command names, flags and `--format table|json` output, checked by golden tests captured from the TS CLI before the rewrite.
- **Then new features:** `extent`/`scope` (api.gis.ph ADR 0001); collections, tiles and datasets (api.gis.ph ADR 0002, proposed).
- **Distribution:**
  - `cargo-dist` builds macOS/Linux/Windows binaries with checksums, plus Homebrew and Scoop.
  - Self-update only from tagged, signed releases (consider minisign, as in spatialVault).
  - npm `gis.ph-cli` becomes a thin binary-download wrapper; the TS version is deprecated after parity.
- **Quality:** CI runs `fmt`, `clippy -D warnings` and `test`. HTTP is mocked with `wiremock`. MSRV is pinned.

## Consequences

- One shared, typed client across the CLI, yGIS and spatialVault.
- The secret leaves plaintext config; installs become pinned and verifiable.
- Breaking-change risk to user scripts is mitigated by golden tests.
- The build is done by an AI dev bot. Gerald reviews it and learns Rust from it (portfolio).
- Two distribution channels (binaries plus the npm wrapper) to maintain.

## Rejected

- **Patch the TS CLI:** fixes the issues but gives no shared client.
- **CLI-only Rust rewrite without a library crate:** no reuse.
- **Node wrapper around a Rust core (napi):** keeps the Node runtime and adds build complexity.

## Open questions

- Is the OpenAPI spec complete enough for codegen?
- Do the politicians endpoints stay in scope?
- How does the Windows keychain behave in CI?
