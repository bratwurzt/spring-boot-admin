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
      <h1 class="title">Statistics Journal</h1>
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
          <th>Count</th>
          <th>Total</th>
          <th>Max</th>
          <th>Mean</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="metric in advancedmetrics">
          <tr class="is-selectable" :key="metric.key"
              @click="showPayload[metric.key] ? $delete(showPayload, metric.key) : $set(showPayload, metric.key, true)">
            <td v-text="metric.name"/>
            <td v-text="metric.histogramSnapshot.count"/>
            <td v-text="metric.histogramSnapshot.total"/>
            <td v-text="metric.histogramSnapshot.max"/>
            <td v-text="metric.histogramSnapshot.mean"/>
          </tr>
          <tr :key="`${metric.key}-detail`" v-if="showPayload[metric.key]">
            <td colspan="4">
              <pre v-text="toJson(metric.histogramSnapshot.percentileValues)"/>
            </td>
          </tr>
        </template>
        </tbody>
      </table>
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
      advancedmetrics: [],
      showPayload: {},
    }),
    methods: {
      toJson(obj) {
        return JSON.stringify(obj, null, 4);
      },
    },
    //async created() {
    created() {
      /*const response = await this.instance.axios.get('http://thinkehr4.marand.si:8865/actuator/advancedmetrics');
      this.advancedmetrics = response.data;*/
      var responseData = {
        "histogramSnapshots": [
          {
            "name": "/ehr/{ehrId}/work-plan/{mWorkPlanId}/state",
            "histogramSnapshot": {
              "percentileValues": [
                {
                  "percentile": 0.9,
                  "value": 1195376640
                },
                {
                  "percentile": 0.95,
                  "value": 1228931072
                },
                {
                  "percentile": 0.99,
                  "value": 1279262720
                }
              ],
              "count": 50,
              "total": 51810516919,
              "max": 1279516533,
              "mean": 1036210338.38
            },
            "errorCount": null
          },
          {
            "name": "/ehr/{ehrId}/work-plan/{mWorkPlanId}/performer",
            "histogramSnapshot": {
              "percentileValues": [
                {
                  "percentile": 0.9,
                  "value": 956301312
                },
                {
                  "percentile": 0.95,
                  "value": 1010827264
                },
                {
                  "percentile": 0.99,
                  "value": 1296039936
                }
              ],
              "count": 50,
              "total": 42022463051,
              "max": 1299304352,
              "mean": 840449261.02
            },
            "errorCount": null
          },
          {
            "name": "/ehr/{ehrId}/work-plan/{mWorkPlanId}",
            "histogramSnapshot": {
              "percentileValues": [
                {
                  "percentile": 0.9,
                  "value": 1577058304
                },
                {
                  "percentile": 0.95,
                  "value": 1702887424
                },
                {
                  "percentile": 0.99,
                  "value": 2508193792
                }
              ],
              "count": 50,
              "total": 74006638489,
              "max": 2500085333,
              "mean": 1480132769.78
            },
            "errorCount": null
          },
          {
            "name": "/ehr/{ehrId}/work-plan/materialise/{workPlanId}",
            "histogramSnapshot": {
              "percentileValues": [
                {
                  "percentile": 0.9,
                  "value": 266338304
                },
                {
                  "percentile": 0.95,
                  "value": 321912832
                },
                {
                  "percentile": 0.99,
                  "value": 1164967936
                }
              ],
              "count": 50,
              "total": 10396352263,
              "max": 1161339907,
              "mean": 207927045.26
            },
            "errorCount": null
          },
          {
            "name": "/ehr/{ehrId}/work-plan/instantiate",
            "histogramSnapshot": {
              "percentileValues": [
                {
                  "percentile": 0.9,
                  "value": 476053504
                },
                {
                  "percentile": 0.95,
                  "value": 503316480
                },
                {
                  "percentile": 0.99,
                  "value": 1306525696
                }
              ],
              "count": 50,
              "total": 22366417445,
              "max": 1303533086,
              "mean": 447328348.9
            },
            "errorCount": null
          },
          {
            "name": "/plan",
            "histogramSnapshot": {
              "percentileValues": [
                {
                  "percentile": 0.9,
                  "value": 52428800
                },
                {
                  "percentile": 0.95,
                  "value": 86245376
                },
                {
                  "percentile": 0.99,
                  "value": 364642304
                }
              ],
              "count": 50,
              "total": 2789598613,
              "max": 363491323,
              "mean": 55791972.26
            },
            "errorCount": null
          }
        ]
      };
      this.advancedmetrics = responseData.histogramSnapshots.map(v=>{v.key=Math.random();return v});
    },

  };
</script>

<style>
  .custom {
    font-size: 20px;
    width: 80%;
  }
</style>
