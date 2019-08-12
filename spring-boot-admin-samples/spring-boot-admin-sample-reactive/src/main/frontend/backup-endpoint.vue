<template>

  <section class="section">
    <div class="container">
      <h1 class="title">{{ $t('custom.backup_endpoint.title') }}</h1>

      <table class="table">
        <thead>
        <tr>
          <th>{{ $t('custom.backup_endpoint.table.title.backupTimestamp') }}</th>
          <th>{{ $t('custom.backup_endpoint.table.title.status') }}</th>
          <th>{{ $t('custom.backup_endpoint.table.title.errorMsg') }}</th>
          <th>{{ $t('custom.backup_endpoint.table.title.actions') }}</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="bckp in backupData">
          <tr class="">
            <td v-text="bckp.backupFormattedTime"/>
            <td v-text="$t('custom.backup_endpoint.table.content.status.'+bckp.status)"/>
            <td v-text="bckp.error"/>
            <td>
                <span v-if="bckp.status === 'COMPLETED'">
                  <button @click="restoreBackup(bckp.id)">{{ $t('custom.backup_endpoint.start_restore') }}</button>
                  <a @click="deleteBackup(bckp.id)"> / {{ $t('custom.backup_endpoint.delete_backup') }}</a>
                </span>
            </td>
          </tr>
        </template>
        </tbody>
      </table>
      <button>{{ $t('custom.backup_endpoint.create_new_backup') }}</button>
    </div>
  </section>
</template>

<script>

  import {timer, BehaviorSubject} from 'rxjs';
  import {switchMap, combineLatest} from 'rxjs/operators';

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
      refreshData: new BehaviorSubject(null),
      mockData: [{
        id: 2342,
        workPlanCount: 146,
        workPlansBackedUp: 46,
        status: "IN_PROGRESS",
        error: null,
        backupTimestamp: (new Date()).toISOString()
      },
        {
          id: 234,
          workPlanCount: 147,
          workPlansBackedUp: 47,
          status: "COMPLETED",
          error: null,
          backupTimestamp: (new Date()).toISOString()
        },
        {
          id: 23224,
          workPlanCount: 148,
          workPlansBackedUp: 48,
          status: "ERROR",
          error: "Server error",
          backupTimestamp: (new Date()).toISOString()
        }]
    }),
    methods: {

      toJson(obj) {
        return JSON.stringify(obj, null, 4);
      },

      async restoreBackup(backupId) {
        if (backupId) {
          await this.instance.axios.post('https://thinkehr4.marand.si:8865/restore?backupId=' + backupId)
          this.refreshData.next();
        } else {
          alert('error - no id')
        }
      },

      async deleteBackup(backupId) {
        if (backupId) {
          await this.instance.axios.delete('https://thinkehr4.marand.si:8865/backup/' + backupId)
          this.refreshData.next();
        } else {
          alert('error - no id')
        }
      },

      async fetchBackupData(sortBy, sortOrder) {


        var backupUrl = 'https://thinkehr4.marand.si:8865/backup';

        var backupRes = await this.instance.axios.get(backupUrl, {
          headers: {'Accept': ['application/json']}
        });
        return backupRes;

        // return this.mockData
      },

      createStatsSubscription() {
        const vm = this;
        return this.refreshData.asObservable()
          .pipe(
            combineLatest(timer(0, 3000)),
            switchMap(() => {
              return vm.fetchBackupData();
            })
          )
          .subscribe({
            next: backupData => {
              backupData.forEach((data) => {
                let date = new Date(data.backupTimestamp);
                data.backupFormattedTime = date.getDate() + '-' + (date.getMonth() + 1).toString() + '-' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
                // data.backupFormattedTime = formatDate(new Date(data.backupTimestamp), 'dd-MM-yyyy hh:mm')
              })
              this.backupData = backupData;
            },
            error: error => {
              console.warn('Fetching data failed:', error);
              alert('Fetching data failed. ' + (error.message ? error.message : ''));
            }
          });
      },


      async subscribe() {
        if (!this.subscriptions.length) {
          this.subscriptions.push(await this.createStatsSubscription());
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
  //
  // var monthNames = [
  //   "January", "February", "March", "April", "May", "June", "July",
  //   "August", "September", "October", "November", "December"
  // ];
  // var dayOfWeekNames = [
  //   "Sunday", "Monday", "Tuesday",
  //   "Wednesday", "Thursday", "Friday", "Saturday"
  // ];
  //
  // function formatDate(date, patternStr) {
  //   if (!patternStr) {
  //     patternStr = 'M/d/yyyy';
  //   }
  //   var day = date.getDate(),
  //     month = date.getMonth(),
  //     year = date.getFullYear(),
  //     hour = date.getHours(),
  //     minute = date.getMinutes(),
  //     second = date.getSeconds(),
  //     miliseconds = date.getMilliseconds(),
  //     h = hour % 12,
  //     hh = twoDigitPad(h),
  //     HH = twoDigitPad(hour),
  //     mm = twoDigitPad(minute),
  //     ss = twoDigitPad(second),
  //     aaa = hour < 12 ? 'AM' : 'PM',
  //     EEEE = dayOfWeekNames[date.getDay()],
  //     EEE = EEEE.substr(0, 3),
  //     dd = twoDigitPad(day),
  //     M = month + 1,
  //     MM = twoDigitPad(M),
  //     MMMM = monthNames[month],
  //     MMM = MMMM.substr(0, 3),
  //     yyyy = year + "",
  //     yy = yyyy.substr(2, 2)
  //   ;
  //   // checks to see if month name will be used
  //   patternStr = patternStr
  //     .replace('hh', hh).replace('h', h)
  //     .replace('HH', HH).replace('H', hour)
  //     .replace('mm', mm).replace('m', minute)
  //     .replace('ss', ss).replace('s', second)
  //     .replace('S', miliseconds)
  //     .replace('dd', dd).replace('d', day)
  //
  //     .replace('EEEE', EEEE).replace('EEE', EEE)
  //     .replace('yyyy', yyyy)
  //     .replace('yy', yy)
  //     .replace('aaa', aaa);
  //   if (patternStr.indexOf('MMM') > -1) {
  //     patternStr = patternStr
  //       .replace('MMMM', MMMM)
  //       .replace('MMM', MMM);
  //   } else {
  //     patternStr = patternStr
  //       .replace('MM', MM)
  //       .replace('M', M);
  //   }
  //   return patternStr;
  // }
  //
  // function twoDigitPad(num) {
  //   return num < 10 ? "0" + num : num;
  // }

</script>

<style>

</style>
