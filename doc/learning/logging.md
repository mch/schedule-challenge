# use cases

- I want to see all of the logs for the module I'm working on
  - set the logger name to the module name (the module name typically could be java class name or javascript file name)
- I want to see all the logs for a specific request for jobs within single node or across nodes
  - use open telemetry and tag your logs with with traceId and spanId
    - traceId generally represents a http request
    - spanId generally represents unique identifer for a single unit of work within a trace such as
      - database query
      - call to another service
      - long running compute process
- I want to see all logs for a specific user
  - tag specific user to all of the logs
  - tag specific host to all of the logs
- I want to see all logs for specific web server because the specific web server is behaving
- I want to see specific version of the software in the logs (like git hash)
- I want to see the important configurations for the software and server at start up
- I want to see the information to correlate the logs such as host, pid
- I want to see the information to help me with the software development process including deployment, debuging, health of system, security.
- I want to see logs for specific service I'm working on
  - filter out all of the noise until I can find relevant logs the issue I'm debugging
  - narrow the logs to specific time frame, process, machine
  - prefer to have better correlate logs
- "Be conservative in what you do, be liberal in what you accept"
- The large source of problem coming from the boundaries of the service/system.
  - parse, don't validate [parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
  - logging requests/response could create lots of logs and security/risks concerns regarding to PII, PHI
    - we could save the data in S3, database on demand, and retrieving those data for debugging purposes.
      - we can put more stringent constraints on s3, databases for auditing, access control and security purposes.
    - as a note, we could use dynamic logging to turn on the logs for requests/response at runtime on development environment
  - metrics around response time
  - metrics could indicate some signals where the system is underload or overload and the system can be scaled dynamically
 

- log levels
  - error: we should setup pager for the error?

# non use-cases

- it's not including the business metrics.


# logging level

- error level
  - usually means the service is down and it requires intervene, or it affect multiple users
- warn level
  - it affect may be only 1 user and it transient error and it go away on its own and it might go away and it probably not worth setup a pager for.

# what to log

- use structured logging (like json object) with at least the following fields:
  - timestamp
  - message
  - level
  - 

- example usage:
```
const logger = Logger.Factory.getLogger(__filename);

// this optional additional log attributes to provide extra context information such as who's making the requests, etc...
const optionalAdditionalLogAttributes = {};
logger.info('log message', optionalAdditionalLogAttributes);

// this will output something like
{message: '', timestamps: '', level: '', }
```

# questions
- how do we document the common understanding?
- do we log the duration of the method?
- what benebits we get from logging traceId and spandId (relationship between logs)?
