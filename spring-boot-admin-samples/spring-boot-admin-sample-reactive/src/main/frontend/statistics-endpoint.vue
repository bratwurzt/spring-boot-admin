<!--
  - Copyright 2014-2018 the original author or authors.
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  -     http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<template>

  <div class="section">
    <div class="container">
      <h1 class="title">Statistics </h1>

      <table class="table is-fullwidth">
        <thead>
        <tr>
          <th>Path</th>
          <th>Count <a href="#"
                       @click="orderData(ORDER_BY_COUNT, SORT_ORDER_DESC)">&#9660;</a> <a href="#"
                                                                                          @click="orderData(ORDER_BY_COUNT, SORT_ORDER_ASC)">&#9650;</a>
          </th>
          <th>Total [ms] <a href="#"
                            @click="orderData(ORDER_BY_TOTAL, SORT_ORDER_DESC)">&#9660;</a> <a href="#"
                                                                                               @click="orderData(ORDER_BY_TOTAL, SORT_ORDER_ASC)">&#9650;</a>
          </th>
          <th>Max [ms] <a href="#"
                          @click="orderData(ORDER_BY_MAX, SORT_ORDER_DESC)">&#9660;</a> <a href="#"
                                                                                           @click="orderData(ORDER_BY_MAX, SORT_ORDER_ASC)">&#9650;</a>
          </th>
          <th>Average [ms] <a href="#"
                              @click="orderData(ORDER_BY_AVERAGE, SORT_ORDER_DESC)">&#9660;</a> <a href="#"
                                                                                                   @click="orderData(ORDER_BY_AVERAGE, SORT_ORDER_ASC)">&#9650;</a>
          </th>
          <th>Percentile {{percentileValuesLabelArr[0]}}</th>
          <th>Percentile {{percentileValuesLabelArr[1]}}</th>
          <th>Percentile {{percentileValuesLabelArr[2]}}</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="metric in advancedmetrics">
          <tr class="" :key="metric.key"><!--<tr class="is-selectable" :key="metric.key"
              @click="showPayload[metric.key] ? $delete(showPayload, metric.key) : $set(showPayload, metric.key, true)">-->
            <td v-text="metric.name"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.count:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.total:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.max:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.mean:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.percentileValues[0].value:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.percentileValues[1].value:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.percentileValues[2].value:''"/>
          </tr>
          <!--<tr :key="`${metric.key}-detail`" v-if="showPayload[metric.key]">
            <td colspan="4">
              <pre v-text="toJson(metric.histogramSnapshot.percentileValues)"/>
            </td>
          </tr>-->
        </template>
        </tbody>
      </table>
    </div>

    <div class="container">
      <h1 class="title">Exceptions </h1>

      <table class="table">
        <thead>
        <tr>
          <th>Exception</th>
          <th>Count</th>
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

  import {timer, BehaviorSubject, } from 'rxjs';
  import { switchMap, combineLatest} from 'rxjs/operators';

  export default {
    created() {
      this.subscribe();
    },
    beforeDestroy() {
      this.unsubscribe();
    },
    props: {
      instance: {
        type: Array,
        default: () => []
      }
    },
    data: () => ({
      SORT_ORDER_ASC: 'asc',
      SORT_ORDER_DESC: 'desc',
      ORDER_BY_COUNT: 'count',
      ORDER_BY_AVERAGE: 'avg',
      ORDER_BY_TOTAL: 'sum',
      ORDER_BY_MAX: 'max',
      advancedmetrics: [],
      exceptions: [],
      showPayload: {},
      percentileValuesLabelArr: [],
      subscriptions:[],
      filterDataSubject:new BehaviorSubject([])
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

      orderData(sortBy, sortOrder){
        this.filterDataSubject.next([sortBy, sortOrder]);
      },

      async fetchStatisticsData(sortBy, sortOrder) {

        let reqUrl = 'https://thinkehr4.marand.si:8865/actuator/advancedmetrics';
        if (sortBy) {
          reqUrl += '?order=' + sortBy;
        }
        if (sortOrder) {
          reqUrl += '&asc=' + (sortOrder === this.SORT_ORDER_ASC).toString();
        }

        console.log('reqURL=', reqUrl);

        var response = await this.instance.axios.get(reqUrl,{
          headers: {'Accept': ['application/json']}
        });
        var responseData = response.data;
        let addKeyIdent = v => {
          v.key = Math.random();
          return v;
        };

        let nanoToMillis = (v) => {
          return parseInt((v / 1000000).toString(10), 10);
        };

        let toMilliseconds = (val) => {
          ['total', 'max', 'mean'].forEach((propName) => {
            val.histogramSnapshot[propName] = nanoToMillis(val.histogramSnapshot[propName], 'nanoseconds');
          });

          val.histogramSnapshot.percentileValues = val.histogramSnapshot.percentileValues.map((perc) => {
            perc.value = nanoToMillis(perc.value, 'nanoseconds');
            return perc;
          });
          return val;
        };

        let sanitizedResponse = responseData.histogramSnapshots.map(addKeyIdent).map(toMilliseconds);

        return sanitizedResponse;
      },

      async fetchExceptionsData() {

        let reqUrl = 'https://thinkehr4.marand.si:8865/actuator/advancedmetrics/exceptions';

        var response = await this.instance.axios.get(reqUrl,{
          headers: {'Accept': ['application/json']}
        });

        return Object.keys(response.data).map(key=>{return {label:key, value:response.data[key]};});
      },

      createStatsSubscription() {
        const vm = this;
        return  this.filterDataSubject.asObservable()
          .pipe(
            combineLatest(timer(0, 5000), (vArr)=>{return vArr&&vArr.length?vArr:[];}),
            //concatMap(vm.fetchStatisticsData)
            switchMap((tmrSort)=>{
              return vm.fetchStatisticsData(tmrSort[0], tmrSort[1]);
            })
          )
          .subscribe({
            next: sanitizedResponse => {
              this.advancedmetrics = sanitizedResponse;

              this.percentileValuesLabelArr = this.parsePercentileValuesLabelArr(sanitizedResponse[0]);

            },
            error: error => {
              console.warn('Fetching data failed:', error);
              alert('Fetching data failed. '+ (error.message?error.message:''));
            }
          });
      },

      createExceptionsSubscription() {
        const vm = this;
        return  timer(0, 5000).pipe(
            switchMap(()=>{
              return vm.fetchExceptionsData();
            })
          )
          .subscribe({
            next: exceptions => {
console.log('EXC =', exceptions)
this.exceptions= exceptions;
            },
            error: error => {
              console.warn('Fetching exceptions data failed:', error);
              alert('Fetching exceptions data failed. '+ (error.message?error.message:''));
            }
          });
      },

      async subscribe() {
        if (!this.subscriptions.length) {
          this.subscriptions.push (await this.createStatsSubscription());
          this.subscriptions.push (await this.createExceptionsSubscription());
        }
      },

      unsubscribe() {
        if (this.subscriptions.length) {

          try {
            this.subscriptions.forEach((subs)=>{
              !subs.closed && subs.unsubscribe();
            });
          } finally {
            this.subscriptions.length=0;
          }
        }
      }
    }
  };
</script>

<style>
  .custom {
    font-size: 20px;
    width: 80%;
  }
</style>
