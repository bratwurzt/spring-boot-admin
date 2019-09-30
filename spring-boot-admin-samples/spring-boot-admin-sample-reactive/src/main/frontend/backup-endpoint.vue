<template>

    <section class="section">
        <div class="container">
            <h1 class="title">{{$t('custom.backup_endpoint.title')}}</h1>

            <table class="table">
                <thead>
                <tr>
                    <th>{{$t('custom.backup_endpoint.table.title.backupTimestamp')}}</th>
                    <th>{{$t('custom.backup_endpoint.table.title.status')}}</th>
                    <th>{{$t('custom.backup_endpoint.table.title.errorMsg')}}</th>
                    <th>{{$t('custom.backup_endpoint.table.title.actions')}}</th>
                </tr>
                </thead>
                <tbody>
                <template v-for="bckp in backupData">
                    <tr class="">
                        <td v-text="bckp.formattedTimestamp.format('L HH:mm:ss')"/>
                        <td v-text="$t('custom.backup_endpoint.table.content.status.'+bckp.status)"/>
                        <td v-text="bckp.error"/>
                        <td>

                  <a v-if="bckp.status === 'COMPLETED'" @click="restoreBackup(bckp.id)">{{$t('custom.backup_endpoint.start_restore')}}</a>

                  <a v-if="bckp.status === 'IN_PROGRESS'" @click="deleteBackup(bckp.id)">{{$t('custom.backup_endpoint.delete_backup')}}</a>

                        </td>
                    </tr>
                </template>
                </tbody>
            </table>

        </div>
      <div class="container">
        <input class="line-height-1 margin-right" type="text" v-model="incrementalParentId" placeholder="incremental id"/>
        <a @click="createBackup(incrementalParentId)" class="button is-primary">
          <font-awesome-icon icon="download"/>
          {{$t('custom.backup_endpoint.create_new_backup')}}
        </a>
      </div>
      <h1>{{$t('custom.backup_endpoint.restore.title')}}</h1>
        <div class="container">
          <h6 v-if="!!restoreInProgress._workPlansLeft">{{$t('custom.backup_endpoint.restore_in_progress')}} {{$t('custom.backup_endpoint.restore_started')}} {{restoreInProgress.restoreStartTimestamp}} / {{$t('custom.backup_endpoint.workplans_left')}} {{restoreInProgress._workPlansLeft}}</h6>

        </div>
        <div class="container">
            <input class="margin-top-1 line-height-2  margin-right" type="text" v-model="restoreId"/>
            <a @click="restoreBackup(restoreId)" class="button is-small is-primary margin-top-1">
                <font-awesome-icon icon="redo"/>
                {{$t('custom.backup_endpoint.restore_by_id')}}
            </a>
        </div>
    </section>
</template>

<script>

  import {BehaviorSubject, timer} from 'rxjs';
  import {combineLatest, switchMap} from 'rxjs/operators';
  import moment from 'moment';

  export default {
    created() {
      this.subscribe();
    },
    beforeDestroy() {
      this.unsubscribe();
    },
    components: {},
    props: {
      instance: {
        type: Object,
        default: () => {
        }
      }
    },
    data: () => ({
      subscriptions: [],
      backupData: [],
        restoreInProgress: {},
      refreshData: new BehaviorSubject(null),
      mockData: [
        {
          id: "6096ac34-1543-4dd1-a057-03fde6ebafa6",
          workPlanCount: 147,
          workPlansBackedUp: 47,
          status: "COMPLETED",
          error: null,
          backupTimestamp: "2019-08-21T10:29:41.587Z"
        },
        {
          id: "d006fcbe-61aa-41c3-89e1-1e573e6cd50a",
          workPlanCount: 14,
          workPlansBackedUp: 7,
          status: "IN_PROGRESS",
          error: null,
          backupTimestamp: "2019-08-21T09:49:41.587Z"
        },
        {
          id: "255c7f72-5f5f-4c0c-8f1c-497f8e606ad2",
          workPlanCount: 142,
          workPlansBackedUp: 41,
          status: "ERROR",
          error: "Server error",
          backupTimestamp: "2019-08-20T10:29:41.587Z"
        }
      ]
    }),
    methods: {

      toJson(obj) {
        return JSON.stringify(obj, null, 4);
      },

      async restoreBackup(backupId) {
        if (backupId) {
          await this.instance.axios.post('actuator/restore?backupId=' + backupId)
          this.refreshData.next();
        } else {
          alert('error - no id')
        }
      },

      async createBackup(incrementalBkpId) {
          var params = '';
          if(incrementalBkpId){
              params = '?previous_backup='+incrementalBkpId;
          }
        await this.instance.axios.post(`actuator/backup`+params)
        this.refreshData.next();
      },

      async deleteBackup(backupId) {
        if (backupId) {
          await this.instance.axios.delete('actuator/backup/' + backupId)
          this.refreshData.next();
        } else {
          alert('error - no id')
        }
      },

      async fetchBackupData(sortBy, sortOrder) {
        var response = await this.instance.axios.get('actuator/backup', {
          headers: {'Accept': ['application/json']}
        });
        return response.data
      },

      async fetchRestoreData() {
        var response = await this.instance.axios.get('actuator/restore', {
          headers: {'Accept': ['application/json']},
          validateStatus: function (status) {
              return (status >= 200 && status < 300) || status===404;
          }
        });
        return response.data
      },

      createBackupsSubscription() {
        const vm = this;
        return this.refreshData.asObservable()
          .pipe(
            combineLatest(timer(0, 10000)),
            switchMap(() => {
              return vm.fetchBackupData();
            })
          )
          .subscribe({
            next: backupData => {
              backupData.forEach((data) => {
                data.formattedTimestamp = moment(data.backupTimestamp);
              });
              this.backupData = backupData;
            },
            error: error => {
              console.warn('Fetching backup data failed:', error);
              alert('Fetching backup data failed. ' + (error.message ? error.message : ''));
            }
          });
      },

      createRestoreSubscription() {
        const vm = this;
        return this.refreshData.asObservable()
          .pipe(
            combineLatest(timer(0, 10000)),
            switchMap(() => {
              return vm.fetchRestoreData();
            })
          )
          .subscribe({
            next: restoreData => {
              if(restoreData && !restoreData.restoreEndTimestamp && restoreData.status ==='IN_PROGRESS' && !!restoreData.workPlanCount){
                  this.restoreInProgress = data;
                  this.restoreInProgress._workPlansLeft = this.restoreInProgress.workPlanCount - this.restoreInProgress.workPlansRestored;
              }else {
                  this.restoreInProgress = {};
              }
            },
            error: error => {
              console.warn('Fetching restore data failed:', error);
              alert('Fetching restore data failed. ' + (error.message ? error.message : ''));
            }
          });
      },

      async subscribe() {
        if (!this.subscriptions.length) {
          this.subscriptions.push(await this.createBackupsSubscription());
          this.subscriptions.push(await this.createRestoreSubscription());
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
    .margin-top-1 {
        margin-top: 30px;
    }

    .margin-right{
      margin-right: 10px;
    }

  .line-height-1{
    line-height: 32px;
  }

  .line-height-2{
    line-height: 22px;
  }
</style>
