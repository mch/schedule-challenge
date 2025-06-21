/*instrumentation.ts*/
import {NodeSDK} from '@opentelemetry/sdk-node';
import {AlwaysOnSampler, Sampler, SamplingDecision, SamplingResult} from '@opentelemetry/sdk-trace-node';
//import { Resource } from '@opentelemetry/resources';
//import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-grpc';
import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
import {ConsoleMetricExporter, PeriodicExportingMetricReader,} from '@opentelemetry/sdk-metrics';
import {Attributes, Context, Link, SpanKind} from '@opentelemetry/api';

// let resource = new Resource({
// 	[ATTR_SERVICE_NAME]: 'tony-local-server',
// });

class ConfigurableSampler implements Sampler {
    public enabled: boolean = true;

    shouldSample(context: Context, traceId: string, spanName: string, spanKind: SpanKind, attributes: Attributes, links: Link[]): SamplingResult {
        if (!this.enabled) {
            return { decision: SamplingDecision.NOT_RECORD }
        }
        return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    }
    toString(): string {
        return "ConfigurableSampler";
    }

}

export const configurableSampler = new ConfigurableSampler();

const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
    }),
    instrumentations: [getNodeAutoInstrumentations()],
    sampler: configurableSampler
});

sdk.start();

