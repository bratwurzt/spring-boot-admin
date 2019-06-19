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
      },
      exceptionTraces: {
        type: Array,
        default: () => []
      }
    },
    data: () => ({
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
