# 2. Use Mise For Consistent Tooling

Date: 2025-02-01

## Status

Accepted

## Context

- We want consistent tooling for all developer so that it's easy to setup a dev machine, everyone is using the same version of tool.
  - We want to avoid problem from developers using different tooling in building/developing the software.
- We want to avoid docker or devcontainer as there's lots of complexity go into them.

## Decision

We will use [mise](https://mise.jdx.dev/)

## Consequences

- developer will only need to install mise and it takes care of install everything else (such as adr, node, python, gradle, etc...)
- there's risk that mise doesn't cover our specific use case.
- IDE integration is a little bit more difficult with mise, we would need to setup IDE in a way to find the path for the tools.
