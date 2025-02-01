# 3. Deliver Value

Date: 2025-02-01

## Status

Accepted

## Context

We want to deliver working software as quickly as possible with minimal defects. Working software provides some value to end user

## Decision

- we have fast automated tests, automated deployment to production.
- we generally want to ensemble, and if we want to take the task individualy, let's talk about it first.
- we want to use trunk based development
  - small commits
  - pull and merge with rebase
  - run tests before push
  - no feature branch, prefered alternative such as feature flag or branch by abstraction 

## Consequences

- The software always works with minimal business interuptions
