/*instrumentation.ts*/
import {NodeSDK} from '@opentelemetry/sdk-node';
import {ConsoleSpanExporter} from '@opentelemetry/sdk-trace-node';
//import { Resource } from '@opentelemetry/resources';
//import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-grpc';
import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
import {
    PeriodicExportingMetricReader,
    ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';

// let resource = new Resource({
// 	[ATTR_SERVICE_NAME]: 'tony-local-server',
// });

const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({

        exporter: new ConsoleMetricExporter(),
    }),
    instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

