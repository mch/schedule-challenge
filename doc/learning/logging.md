# use cases

- I want to see all of the logs for the module I'm working on
- I want to see all the logs for a specific request for jobs within single node or across nodes
- I want to see all logs for a specific user
- I want to see all logs for specific web server because the specific web server is behaving
- I want to see specific version of the software in the logs (like git hash)
- I want to see the configurations for the software and server
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
  - metrics around response time
  - do we need to scale up, scale down

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
