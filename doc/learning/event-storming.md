# event storming

- layout events on a timeline
- event should be interesting in the domain
- event should be written in the past tense
- **different type of actions**
  - users interacting with product
    - i.e: user signed up to attend sessions in the conference
  - actions in users life (not interacting with product but still interesting)
    - i.e: users thought about attending the sessions in the conference.
  - actions within the organizations
    - i.e: the company running batch jobs to migrate the users.
  - actions managed by software
    - i.e: software running reports for the users.
- conventional event storming
  - orange stickies represents events
  - small yellow stickies represent roles or personas
  - large light pink stickies to represent systems
  - rotated dark pink stickies to represents hotspot
- help us sees why things were done a certain way
  - see broader context from different perspective from the domains/users instead of technical implementation
  - consider more perspective (organizers, attendee, admin, speakers, etc...) with different goals and requirements.
- it's simple techniques to flush out the insights/knowledge about the product, company, process, etc ....
  - is that because we frame things as the "events in the domain"?
- with domain event storm, we can see the depth of the system, get more perspective from different point of view
  - and that could be different from how the organizers see the system.
- we can see the flow of the system through the events of time
- we can see the frustration of the users
  - user would like to see the overlap session (session that user interested it in)
  - and that's different from the user signed up for the session. This is the design most of the conference system has.


# resources
- https://tonytvo.github.io/introducing-event-storming/
- https://www.manning.com/books/architecture-modernization
- https://www.eventstormingjournal.com/about/
