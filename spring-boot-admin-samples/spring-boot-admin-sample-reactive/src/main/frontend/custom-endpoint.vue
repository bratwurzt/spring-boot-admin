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
  <!--<div class="custom">
    Instance: <span v-text="instance.id"/>
    Output: <span v-text="advancedmetrics"/>

  </div>-->


  <div class="section">
    <div class="container">
      <h1 class="title">Statistics </h1>
      <div v-if="error" class="message is-warning">
        <div class="message-body">
          <strong>
            <font-awesome-icon class="has-text-warning" icon="exclamation-triangle"/>
            Server connection failed.
          </strong>
          <p v-text="error.message"/>
        </div>
      </div>
      <table class="table is-fullwidth">
        <thead>
        <tr>
          <th>Path</th>
          <th>Count <a href="#" @click="loadData(ORDER_BY_COUNT, SORT_ORDER_ASC)">&#9650;</a> <a href="#"
                                                                                                 @click="loadData(ORDER_BY_COUNT, SORT_ORDER_DESC)">&#9660;</a>
          </th>
          <th>Total [ms] <a href="#" @click="loadData(ORDER_BY_TOTAL, SORT_ORDER_ASC)">&#9650;</a> <a href="#"
                                                                                                      @click="loadData(ORDER_BY_TOTAL, SORT_ORDER_DESC)">&#9660;</a>
          </th>
          <th>Max [ms] <a href="#" @click="loadData(ORDER_BY_MAX, SORT_ORDER_ASC)">&#9650;</a> <a href="#"
                                                                                                  @click="loadData(ORDER_BY_MAX, SORT_ORDER_DESC)">&#9660;</a>
          </th>
          <th>Average [ms] <a href="#" @click="loadData(ORDER_BY_AVERAGE, SORT_ORDER_ASC)">&#9650;</a> <a href="#"
                                                                                                          @click="loadData(ORDER_BY_AVERAGE, SORT_ORDER_DESC)">&#9660;</a>
          </th>
        </tr>
        </thead>
        <tbody>
        <template v-for="metric in advancedmetrics">
          <tr class="is-selectable" :key="metric.key"
              @click="showPayload[metric.key] ? $delete(showPayload, metric.key) : $set(showPayload, metric.key, true)">
            <td v-text="metric.name"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.count:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.total:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.max:''"/>
            <td v-text="metric.histogramSnapshot?metric.histogramSnapshot.mean:''"/>
          </tr>
          <tr :key="`${metric.key}-detail`" v-if="showPayload[metric.key]">
            <td colspan="4">
              <pre v-text="toJson(metric.histogramSnapshot.percentileValues)"/>
            </td>
          </tr>
        </template>
        </tbody>
      </table>
      <div v-bind:class="{ 'hide-preloader': !requestStatus.type }" class="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  </div>

</template>

<script>
  export default {
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
      REQ_STATUS_TYPE_IDLE: '',
      REQ_STATUS_TYPE_PROGRESS: 'progress',
      REQ_STATUS_TYPE_ERROR: 'error',
      requestStatus: {message: '', type: ''},
      advancedmetrics: [],
      showPayload: {},

    }),
    methods: {
      toJson(obj) {
        return JSON.stringify(obj, null, 4);
      },
      async loadData(sortBy, sortOrder) {
        this.advancedmetrics = [];
        this.requestStatus = {type: this.REQ_STATUS_TYPE_PROGRESS};

        let reqUrl = 'https://thinkehr4.marand.si:8865/actuator/advancedmetrics';
        if (sortBy) {
          reqUrl += '?order=' + sortBy;
        }
        if (sortOrder) {
          reqUrl += '&sort=' + sortOrder;
        }
        console.log('reqURL=', reqUrl);
        var response = await this.instance.axios.get(reqUrl);
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
        this.advancedmetrics = sanitizedResponse;

        this.requestStatus = {type: this.REQ_STATUS_TYPE_IDLE};

        return response;
      },
    },
    async created() {
      this.loadData();
    },

  };
</script>

<style>
  .custom {
    font-size: 20px;
    width: 80%;
  }

  /*PRELOADER*/
  .lds-ellipsis.hide-preloader {
    display: none;
  }

  .lds-ellipsis {
    display: inline-block;
    position: relative;
    width: 64px;
    height: 64px;
  }

  .lds-ellipsis div {
    position: absolute;
    top: 27px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #242424;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
  }

  .lds-ellipsis div:nth-child(1) {
    left: 6px;
    animation: lds-ellipsis1 0.6s infinite;
  }

  .lds-ellipsis div:nth-child(2) {
    left: 6px;
    animation: lds-ellipsis2 0.6s infinite;
  }

  .lds-ellipsis div:nth-child(3) {
    left: 26px;
    animation: lds-ellipsis2 0.6s infinite;
  }

  .lds-ellipsis div:nth-child(4) {
    left: 45px;
    animation: lds-ellipsis3 0.6s infinite;
  }

  @keyframes lds-ellipsis1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes lds-ellipsis3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }

  @keyframes lds-ellipsis2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(19px, 0);
    }
  }

  /*END PRELOADER*/
</style>
