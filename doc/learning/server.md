# server notes
- use npm install to keep package and package-lock in sync
- use '^' to get minor updates automatically, it would be good to investigate when semVersion rule is appled when packages are updated.
- use npm ci in normal cases where we not explicitly change package, so we don't accidentally update package-lock.json
- use npm start to start production server on npm output
- use npm dev to start express server with ts-node to skip build step on local dev machine
- use vitest rather than mocha and chai independently so it all in one experience including assertions, coverage, and runner, etc...
- use biome for fast all in one linting and formatting
- we chose to .gitignore to update as we go instead of using templates, might want to revisit decision as we have updated it multiple times today
