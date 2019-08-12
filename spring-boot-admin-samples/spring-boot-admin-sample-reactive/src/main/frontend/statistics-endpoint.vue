<template>

  <div class="section">
    <div class="container">
      <!--<h1 class="title">{{$t('custom.statistics_endpoint.stats.title')}} </h1>-->
      <div class="charts-w">
        <errors-chart :title="$t('custom.statistics_endpoint.exceptions.chart.title')"
                      :exception-traces="advancedmetrics.errorsChartData"></errors-chart>
        <errors-chart :title="$t('custom.statistics_endpoint.api_logs.chart.title')"
                      :exception-traces="advancedmetrics.apiLogsChartData"></errors-chart>
        <errors-chart :title="$t('custom.statistics_endpoint.total_requests.chart.title')"
                      :exception-traces="advancedmetrics.totalRequestsChartData"></errors-chart>
        <avg-resp class="max-avg-w" :title="$t('custom.statistics_endpoint.max_average_response.chart.title')"
                  :exception-traces="advancedmetrics.totalMaxAvgChartData"></avg-resp>
      </div>

      <table class="table is-fullwidth">
        <thead>
        <tr>
          <th>{{$t('custom.statistics_endpoint.stats.table.path')}}</th>
          <th>{{$t('custom.statistics_endpoint.stats.table.count')}} <a
            @click="sortStatistics(ORDER_BY_COUNT, SORT_ORDER_DESC)">&#9660;</a> <a
            @click="sortStatistics(ORDER_BY_COUNT, SORT_ORDER_ASC)">&#9650;</a>
          </th>
          <th>{{$t('custom.statistics_endpoint.stats.table.total_ms')}} <a
            @click="sortStatistics(ORDER_BY_TOTAL, SORT_ORDER_DESC)">&#9660;</a> <a
            @click="sortStatistics(ORDER_BY_TOTAL, SORT_ORDER_ASC)">&#9650;</a>
          </th>
          <th>{{$t('custom.statistics_endpoint.stats.table.max_ms')}} <a
            @click="sortStatistics(ORDER_BY_MAX, SORT_ORDER_DESC)">&#9660;</a> <a
            @click="sortStatistics(ORDER_BY_MAX, SORT_ORDER_ASC)">&#9650;</a>
          </th>
          <th>{{$t('custom.statistics_endpoint.stats.table.avg_ms')}} <a
            @click="sortStatistics(ORDER_BY_AVERAGE, SORT_ORDER_DESC)">&#9660;</a> <a
            @click="sortStatistics(ORDER_BY_AVERAGE, SORT_ORDER_ASC)">&#9650;</a>
          </th>
          <th>{{$t('custom.statistics_endpoint.stats.table.percentile')}}
            {{advancedmetrics.percentileValuesLabelArr[0]}}
          </th>
          <th>{{$t('custom.statistics_endpoint.stats.table.percentile')}}
            {{advancedmetrics.percentileValuesLabelArr[1]}}
          </th>
          <th>{{$t('custom.statistics_endpoint.stats.table.percentile')}}
            {{advancedmetrics.percentileValuesLabelArr[2]}}
          </th>
        </tr>
        </thead>
        <tbody>
        <template v-for="metric in advancedmetrics.statistics">
          <tr class="" :key="metric.key">
            <td v-text="metric.name"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.count:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.total:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.max:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.mean:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.percentileValues[0].value:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.percentileValues[1].value:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.percentileValues[2].value:''"/>
          </tr>
        </template>
        </tbody>
      </table>
    </div>

    <div class="container exceptions-w">
      <h1 class="title">{{$t('custom.statistics_endpoint.exceptions.title')}}</h1>

      <table class="table">
        <thead>
        <tr>
          <th>{{$t('custom.statistics_endpoint.exceptions.table.exception')}}</th>
          <th>{{$t('custom.statistics_endpoint.exceptions.table.count')}}</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="exception in exceptions">
          <tr class="">
            <td v-text="exception.label"/>
            <td v-text="exception.value"/>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>

  import {timer, BehaviorSubject} from 'rxjs';
  import {switchMap, combineLatest, map} from 'rxjs/operators';
  import errorsChart from './errors-chart';
  import avgResp from './modules-avg-response-chart';
  import moment from 'moment';

  class Trace {
    constructor({timestamp, ...trace}) {
      Object.assign(this, trace);
      this.timestamp = moment(timestamp);
    }

    get key() {
      return `${this.timestamp}-${this.request.method}-${this.request.uri}`;
    }

    get contentLength() {
      const contentLength = this.response.headers['Content-Length'] && this.response.headers['Content-Length'][0];
      if (contentLength && /^\d+$/.test(contentLength)) {
        return parseInt(contentLength);
      }
      return null;
    }

    get contentType() {
      const contentType = this.response.headers['Content-Type'] && this.response.headers['Content-Type'][0];
      if (contentType) {
        const idx = contentType.indexOf(';');
        return idx >= 0 ? contentType.substring(0, idx) : contentType;
      }
      return null;
    }

    compareTo(other) {
      return this.timestamp - other.timestamp;
    }

    isSuccess() {
      return this.response.status <= 399
    }

    isClientError() {
      return this.response.status >= 400 && this.response.status <= 499
    }

    isServerError() {
      return this.response.status >= 500 && this.response.status <= 599
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
      errorsChart,
      avgResp
    },
    props: {
      instance: {
        type: Object,
        default: () => {
        }
      }
    },
    data: () => ({
      SORT_ORDER_ASC: 'asc',
      SORT_ORDER_DESC: 'desc',
      ORDER_BY_COUNT: 'count',
      ORDER_BY_AVERAGE: 'avg',
      ORDER_BY_TOTAL: 'sum',
      ORDER_BY_MAX: 'max',
      advancedmetrics: {
        statistics: [],
        percentileValuesLabelArr: [],
        errorsChartData: [],
        apiLogsChartData: [],
        totalRequestsChartData: [],
        totalMaxAvgChartData: []
      },
      exceptions: [],
      subscriptions: [],
      orderStatsDataSubject: new BehaviorSubject([]),
      currentErrorsChartData: [],
      currentApiLogsChartData: [],
      currentTotalRequestsChartData: [],
      currentMaxAvgChartData: []
    }),
    methods: {

      toJson(obj) {
        return JSON.stringify(obj, null, 4);
      },

      parsePercentileValuesLabelArr(snapshotItem) {
        if (snapshotItem && snapshotItem.histogramSnapshot && snapshotItem.histogramSnapshot.percentileValues && snapshotItem.histogramSnapshot.percentileValues.length) {
          return snapshotItem.histogramSnapshot.percentileValues.map(function (percVal) {
            return percVal.percentile.toString();
          });
        }
        return [];
      },

      sortStatistics(sortBy, sortOrder) {
        this.orderStatsDataSubject.next([sortBy, sortOrder]);
      },

      async fetchStatisticsData(sortBy, sortOrder) {


        let reqUrl = 'https://thinkehr4.marand.si:8865/actuator/advancedmetrics';
        if (sortBy) {
          reqUrl += '?order=' + sortBy;
        }
        if (sortOrder) {
          reqUrl += '&asc=' + (sortOrder === this.SORT_ORDER_ASC).toString();
        }

        var response = await this.instance.axios.get(reqUrl, {
          headers: {'Accept': ['application/json']}
        });
        var responseData = response.data;

        // var responseData = {
        //   "histogramSnapshots": [
        //     {
        //       "name": "/ehr/{ehrId}/work-plan/{mWorkPlanId}/state",
        //       "histogramSnapshot": {
        //         "percentileValues": [
        //           {
        //             "percentile": 0.9,
        //             "value": 43646976
        //           },
        //           {
        //             "percentile": 0.95,
        //             "value": 46268416
        //           },
        //           {
        //             "percentile": 0.99,
        //             "value": 61997056
        //           }
        //         ],
        //         "count": 637,
        //         "total": 24198948616,
        //         "max": 144394701,
        //         "mean": 37988930.323
        //       },
        //       "currentHistogramSnapshot": {
        //         "percentileValues": [],
        //         "count": 2,
        //         "total": 84260001,
        //         "max": 0,
        //         "mean": 42130000.5
        //       },
        //       "errorCount": undefined
        //     },
        //     {
        //       "name": "/plan",
        //       "histogramSnapshot": {
        //         "percentileValues": [
        //           {
        //             "percentile": 0.9,
        //             "value": 32636928
        //           },
        //           {
        //             "percentile": 0.95,
        //             "value": 39452672
        //           },
        //           {
        //             "percentile": 0.99,
        //             "value": 59899904
        //           }
        //         ],
        //         "count": 640,
        //         "total": 17097014696,
        //         "max": 281958900,
        //         "mean": 26714085.462
        //       },
        //       "currentHistogramSnapshot": {
        //         "percentileValues": [],
        //         "count": 2,
        //         "total": 46178398,
        //         "max": 0,
        //         "mean": 23089199
        //       },
        //       "errorCount": 0
        //     },
        //     {
        //       "name": "/ehr/{ehrId}/work-plan/instantiate",
        //       "histogramSnapshot": {
        //         "percentileValues": [
        //           {
        //             "percentile": 0.9,
        //             "value": 49414144
        //           },
        //           {
        //             "percentile": 0.95,
        //             "value": 54394880
        //           },
        //           {
        //             "percentile": 0.99,
        //             "value": 83755008
        //           }
        //         ],
        //         "count": 639,
        //         "total": 27237479011,
        //         "max": 2823588400,
        //         "mean": 42625162.772
        //       },
        //       "currentHistogramSnapshot": {
        //         "percentileValues": [],
        //         "count": 2,
        //         "total": 91601500,
        //         "max": 0,
        //         "mean": 45800750
        //       },
        //       "errorCount": 1
        //     },
        //     {
        //       "name": "/ehr/{ehrId}/work-plan/materialise/{workPlanId}",
        //       "histogramSnapshot": {
        //         "percentileValues": [
        //           {
        //             "percentile": 0.9,
        //             "value": 55836672
        //           },
        //           {
        //             "percentile": 0.95,
        //             "value": 62128128
        //           },
        //           {
        //             "percentile": 0.99,
        //             "value": 75759616
        //           }
        //         ],
        //         "count": 639,
        //         "total": 31068528452,
        //         "max": 1019313500,
        //         "mean": 48620545.308
        //       },
        //       "currentHistogramSnapshot": {
        //         "percentileValues": [],
        //         "count": 2,
        //         "total": 103636299,
        //         "max": 0,
        //         "mean": 51818149.5
        //       },
        //       "errorCount": 4
        //     },
        //     {
        //       "name": "/ehr/{ehrId}/work-plan/{mWorkPlanId}",
        //       "histogramSnapshot": {
        //         "percentileValues": [
        //           {
        //             "percentile": 0.9,
        //             "value": 165150720
        //           },
        //           {
        //             "percentile": 0.95,
        //             "value": 175636480
        //           },
        //           {
        //             "percentile": 0.99,
        //             "value": 210239488
        //           }
        //         ],
        //         "count": 639,
        //         "total": 94390013898,
        //         "max": 831860800,
        //         "mean": 147715201.718
        //       },
        //       "currentHistogramSnapshot": {
        //         "percentileValues": [],
        //         "count": 4,
        //         "total": 629111298,
        //         "max": 0,
        //         "mean": 157277824.5
        //       },
        //       "errorCount": 1
        //     },
        //     {
        //       "name": "/ehr/{ehrId}/work-plan/{mWorkPlanId}/performer",
        //       "histogramSnapshot": {
        //         "percentileValues": [
        //           {
        //             "percentile": 0.9,
        //             "value": 321912832
        //           },
        //           {
        //             "percentile": 0.95,
        //             "value": 332398592
        //           },
        //           {
        //             "percentile": 0.99,
        //             "value": 384827392
        //           }
        //         ],
        //         "count": 637,
        //         "total": 178577522998,
        //         "max": 558596399,
        //         "mean": 280341480.374
        //       },
        //       "currentHistogramSnapshot": {
        //         "percentileValues": [],
        //         "count": 2,
        //         "total": 641360299,
        //         "max": 0,
        //         "mean": 320680149.5
        //       },
        //       "errorCount": 3
        //     }
        //   ]
        // }

        let addKeyIdent = v => {
          v.key = Math.random();
          return v;
        };

        let toMilliseconds = (val) => {
          ['total', 'max', 'mean'].forEach((propName) => {
            val.histogramSnapshot[propName] = Utils.nanoToMillis(val.histogramSnapshot[propName], 'nanoseconds');
          });

          val.histogramSnapshot.percentileValues = val.histogramSnapshot.percentileValues.map((perc) => {
            perc.value = Utils.nanoToMillis(perc.value, 'nanoseconds');
            return perc;
          });
          return val;
        };

        let sanitizedResponse = responseData.histogramSnapshots.map(addKeyIdent).map(toMilliseconds);

        return sanitizedResponse;
      },

      async fetchExceptionsData() {

        let reqUrl = 'https://thinkehr4.marand.si:8865/actuator/advancedmetrics/exceptions';

        var response = await this.instance.axios.get(reqUrl, {
          headers: {'Accept': ['application/json']}
        });

        return Object.keys(response.data).map(key => {
          return {label: key, value: response.data[key]};
        });
      },

      sortExceptions(excLabelValArr) {
        return excLabelValArr.sort((v1, v2) => {
          return v2.value - v1.value;
        });
      },

      createStatsSubscription() {
        const vm = this;
        return this.orderStatsDataSubject.asObservable()
          .pipe(
            combineLatest(timer(0, 5000), (vArr) => {
              return vArr && vArr.length ? vArr : [];
            }),
            //concatMap(vm.fetchStatisticsData)
            switchMap((tmrSort) => {
              return vm.fetchStatisticsData(tmrSort[0], tmrSort[1]);
            })
          )
          .subscribe({
            next: sanitizedResponse => {
              this.advancedmetrics.statistics = sanitizedResponse;
              this.advancedmetrics.percentileValuesLabelArr = this.parsePercentileValuesLabelArr(sanitizedResponse[0]);

              this.advancedmetrics.errorsChartData = ErrorGraphDataParser.parseErrors(sanitizedResponse, this.currentErrorsChartData);
              this.currentErrorsChartData = this.advancedmetrics.errorsChartData;
              this.advancedmetrics.apiLogsChartData = ApiLogsGraphDataParser.parse(sanitizedResponse, this.currentApiLogsChartData);
              this.currentApiLogsChartData = this.advancedmetrics.apiLogsChartData;
              this.advancedmetrics.totalRequestsChartData = TotalRequestsGraphDataParser.parse(sanitizedResponse, this.currentTotalRequestsChartData);
              this.currentTotalRequestsChartData = this.advancedmetrics.totalRequestsChartData;
              this.advancedmetrics.totalMaxAvgChartData = TotalAvgResponseTimeGraphDataParser.parse(sanitizedResponse, this.currentMaxAvgChartData);
              this.currentMaxAvgChartData = this.advancedmetrics.totalMaxAvgChartData;
            },
            error: error => {
              console.warn('Fetching data failed:', error);
              alert('Fetching data failed. ' + (error.message ? error.message : ''));
            }
          });
      },

      createExceptionsSubscription() {
        const vm = this;
        return timer(0, 5000).pipe(
          switchMap(() => {
            return vm.fetchExceptionsData();
          }),
          map(vm.sortExceptions)
        )
          .subscribe({
            next: exceptions => {
              this.exceptions = exceptions;
            },
            error: error => {
              console.warn('Fetching exceptions data failed:', error);
              alert('Fetching exceptions data failed. ' + (error.message ? error.message : ''));
            }
          });
      },


      async subscribe() {
        if (!this.subscriptions.length) {
          this.subscriptions.push(await this.createStatsSubscription());
          this.subscriptions.push(await this.createExceptionsSubscription());
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

  class ErrorGraphDataParser {

    static parseErrors(histogramSnapshotsArr, currentErrors) {
      const now = new Date();
      var totalLabelIdent = 'total';
      var totalErrorsNr = 0;
      var errorsGraphArray;

      histogramSnapshotsArr.forEach((snapshot) => {
        if (snapshot.currentErrorCount) {
          Object.keys(snapshot.currentErrorCount).forEach((errorName)=>{
            var errC = parseInt(snapshot.currentErrorCount[errorName]);
            if (!isNaN(errC)) {
              totalErrorsNr += errC;
            }
          })
        }
      });

      var errorsGraphArray = [
        new Trace({
          timestamp: (new Date(now.getTime())).toISOString()
          ,
          'values': [{'label': totalLabelIdent, 'value': totalErrorsNr, index: 0}]
        })
      ];

      return errorsGraphArray.concat ? errorsGraphArray.concat(currentErrors) : errorsGraphArray;
    }
  }

  class ApiLogsGraphDataParser {

    static parse(histogramSnapshotsArr, currentGraphValues) {
      const now = new Date();
      var overlayLabelIdent = 'total';
      var totalValueNr = 0;
      var errorsGraphArray;

      histogramSnapshotsArr.forEach((snapshot) => {
        if (snapshot.currentHistogramSnapshot && snapshot.currentHistogramSnapshot.count) {
          var currVal = parseInt(snapshot.currentHistogramSnapshot.count);
          if (!isNaN(currVal)) {
            totalValueNr += currVal;
          }
        }
      });

      var newValuesGraphArray = [
        new Trace({
          timestamp: (new Date(now.getTime())).toISOString()
          ,
          'values': [{'label': overlayLabelIdent, 'value': totalValueNr, index: 0}]
        })
      ];

      return newValuesGraphArray.concat ? newValuesGraphArray.concat(currentGraphValues) : newValuesGraphArray;
    }
  }

  class TotalRequestsGraphDataParser {

    static parse(histogramSnapshotsArr, currentGraphValues) {
      const now = new Date();
      var overlayLabelIdent = 'total';
      var totalValueNr = 0;
      var errorsGraphArray;

      histogramSnapshotsArr.forEach((snapshot) => {
        if (snapshot.currentHistogramSnapshot && snapshot.currentHistogramSnapshot.total) {
          var currVal = parseInt(snapshot.currentHistogramSnapshot.total);
          if (!isNaN(currVal)) {
            totalValueNr += currVal = Utils.nanoToMillis(currVal);
          }
        }
      });

      var newValuesGraphArray = [
        new Trace({
          timestamp: (new Date(now.getTime())).toISOString()
          ,
          'values': [{'label': overlayLabelIdent, 'value': totalValueNr, index: 0}]
        })
      ];

      return newValuesGraphArray.concat ? newValuesGraphArray.concat(currentGraphValues) : newValuesGraphArray;
    }
  }

  class TotalAvgResponseTimeGraphDataParser {

    static parse(histogramSnapshotsArr, currentGraphValues) {
      const now = new Date();
      var currAvgGraphValues = [];

      histogramSnapshotsArr.forEach((snapshot, indx) => {
        if (snapshot.currentHistogramSnapshot && snapshot.currentHistogramSnapshot.mean) {
          var currVal = parseFloat(snapshot.currentHistogramSnapshot.mean);
          if (isNaN(currVal)) {
            currVal = 0;
          }else{
            currVal = Utils.nanoToMillis(currVal);
          }
          currAvgGraphValues.push({"label": snapshot.name, "value": currVal, index: indx});
        }
      });

      let reqData = [new Trace({
        "values": currAvgGraphValues,
        "timestamp": (new Date(now.getTime())).toISOString()
      })];
      return currentGraphValues && reqData.concat ? reqData.concat(currentGraphValues) : reqData;
    }
  }

  class Utils{
    static nanoToMillis (v) {
      return parseInt((v / 1000000).toString(10), 10);
    };
  }
</script>

<style>
  .exceptions-w {
    margin-top: 30px;
  }

  .trace-chart__svg {
    overflow: visible;
  }

  .charts-w {
    margin-left: 40px;
  }

  .max-avg-w .trace-chart__tooltip {
    width: 400px;
  }

  .charts-w .title{
    margin-bottom: 0px;
    margin-top: 40px;
  }
</style>
