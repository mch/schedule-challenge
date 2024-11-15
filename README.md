# Schedule Challenge
Build a scheduling website that allows users to add sessions they are interested
in to a personal calendar.


## User Needs
- See a list of sessions, with each day on a separate page
- Filter the list by criteria such as tags, complexity (beginner, intermediate, expert), and room
- Click into sessions to see details
- Add sessions of interest to a personal schedule
  - From the main list
  - From the session details page
  - Overlapping sessions are allowed
  - If the session is already on the personal schedule, the button instead removes the session from the user's personal schedule
- View personal schedule, including overlapping sessions


## Constraints
- Preserve browser norms and user expectations such as:
  - Browser forward and back buttons work, including for cases like
    - adding a filter, then clicking back to remove it
  - Scroll position is preserved on naviagtion or refresh
- Error handling
  - API request failures

Possible additional constraints:
- Accessibility (e.g. ARIA)


## Ideas
What does the code look like if it's a fully backend driven traditional web app that serves complete HTML pages?

How does it change if we use an approach like [HTMX](https://htmx.org/)?

What about using Elm or some other frontend framework like React?

What if we use a service worker?

What if we store the user's session locally in the browser?

How can we test that all of the high level expectations are met, especially things like scroll position working across refresh and navigation? Is there a general way to test for conventional user expectations in a browser?