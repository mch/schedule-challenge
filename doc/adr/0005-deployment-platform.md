# 5. Deployment Platform

Date: 2025-02-08

## Status

Accepted

## Context

We need a way to deploy code on production reliably on every commits.
We want it to be free.
We want to run tests and potentially use github actions.

## Decision

We use Render as it meets our basic criterias and we don't want to spend a bunch of time on this.

## Consequences

We can see the effect of the change immediately on production.
It easier to break production if we push a bad change to main branch.
We depend on Render on both production and CI/CD, it means that if Render is down, the production site is down and CI/CD is down.

In a more professional projects, we would need to look more into SLA, incident response, communication, policy in general, but for this project, we're fine with it.
