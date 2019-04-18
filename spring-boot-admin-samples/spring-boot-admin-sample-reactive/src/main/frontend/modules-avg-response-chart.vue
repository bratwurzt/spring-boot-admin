<template>
  <div>
    <h5 class="title">{{title}}</h5>
    <traces-chart :traces="exceptionTraces" :groupTracesFn = "groupTracesFn" :chartValueFn="getChartValue"></traces-chart>
  </div>

</template>

<script>

  import {timer, BehaviorSubject} from 'rxjs';
  import {switchMap, combineLatest, map, concatMap} from 'rxjs/operators';
  import tracesChart from './traces-chart';
  import moment from 'moment';

  class Trace {
    constructor({timestamp, ...trace}) {
      Object.assign(this, trace);
      this.timestamp = moment(timestamp);
    }

    get key() {
      return `${this.timestamp}-${Math.random()}-${this.index}`;
    }

    compareTo(other) {
      return this.timestamp - other.timestamp;
    }
  }

  export default {
    created() {
      this.subscribe();
    },
    beforeDestroy() {
      this.unsubscribe();
    },
    components: {
      tracesChart
    },
    props: {
      title: {
        type: String,
        default: () => ''
      }
    },
    data: () => ({
      exceptionTraces: [],
      subscriptions: []
    }),
    methods: {

      getChartValue(tracesInTimePeriodArr) {
        var maxVal = 0;
        var traces = tracesInTimePeriodArr.map(trV => trV.values);

        var allTraceValuesArr = [];
        traces.forEach((lblValArr) => {allTraceValuesArr.push.apply(allTraceValuesArr, lblValArr.map(lblVal=>lblVal.value) ) });
        maxVal = Math.max.apply(null, allTraceValuesArr );
        return maxVal;

      },

      groupTracesFn(timeIntervalBuckets) {
        let timeIntervalTraces = timeIntervalBuckets.map(val => val.traces);
        return timeIntervalTraces.reduce(
          (currentTotalsLabelsValuesArr, currTimeIntervalTracesArr) => {

            currTimeIntervalTracesArr.map(trV => trV.values)
              .map( (traceLabelValuesArr) => {
                traceLabelValuesArr.forEach(labelVal => {
                  let totalObjectForLabel = currentTotalsLabelsValuesArr.find(totLabVal => totLabVal.label === labelVal.label);
                  if(!totalObjectForLabel){
                    totalObjectForLabel = {label: labelVal.label, value: 0};
                    currentTotalsLabelsValuesArr.push(totalObjectForLabel);
                  }
                  totalObjectForLabel.value = Math.max(totalObjectForLabel.value , labelVal.value);
                });
              });
            return currentTotalsLabelsValuesArr;
          }, []);
      },

      createSubscription() {
        const vm = this;
        vm.lastTimestamp = moment(0);
        vm.error = null;
        return timer(0, 5000)
          .pipe(map(() => {
            const now = new Date();
            let reqData = {
              "values": [{"label": "module1", "value": Math.floor(Math.random() * 10)},{"label": "maodule2", "value": Math.floor(Math.random() * 100)}],
              "timestamp": (new Date(now.getTime() - 1000)).toISOString()
            };

            const nr = Math.floor(Math.random() * 10);
            const mockRes = [];
            for (var i = 0; i < nr; i++) {
              let d = JSON.parse(JSON.stringify(reqData));
              d.values[0].value = i + 1;
              d.index = i;
              mockRes.push(new Trace(d))
            }
            return mockRes
          }))
          .subscribe({
            next: traces => {
              vm.hasLoaded = true;
              vm.exceptionTraces = vm.exceptionTraces && traces.concat ? traces.concat(vm.exceptionTraces) : traces;
            },
            error: error => {
              vm.hasLoaded = true;
              console.warn('Fetching traces failed:', error);
              vm.error = error;
            }
          });
      },

      async subscribe() {
        if (!this.subscriptions.length) {
          this.subscriptions.push(await this.createSubscription())
        }
      },

      unsubscribe() {
        if (this.subscriptions.length) {

          try {
            this.subscriptions.forEach((subs) => {
              !subs.closed && subs.unsubscribe();
            });
          } finally {
            this.subscriptions.length = 0;
          }
        }
      }
    }
  };
</script>

<style>
  .exceptions-w {
    margin-top: 30px;
  }
</style>
