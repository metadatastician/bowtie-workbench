# SPDX-License-Identifier: MPL-2.0
set shell := ["bash", "-euo", "pipefail", "-c"]
default:
    @just --list
build:
    bun scripts/build.mjs
test: build
    bun test tests/policy.test.mjs tests/prototype.test.mjs
run:
    bun scripts/serve.mjs
check-root-shape:
    bash scripts/check-root-shape.sh .
validate-rsr: check-root-shape
    bash scripts/check-no-placeholders.sh .
validate: validate-rsr
quality: validate-rsr
    bun test tests/prototype.test.mjs
repo-map:
    bash scripts/gen-repo-map.sh .
