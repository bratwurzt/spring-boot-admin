/*
 * Copyright 2014-2018 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global SBA */
import statisticsEndpoint from './statistics-endpoint';
import backupEndpoint from './backup-endpoint';

SBA.use({
  install({viewRegistry}) {
    viewRegistry.addView({
      name: 'instances/advancedmetrics',
      parent: 'instances',
      path: 'statistics',
      component: statisticsEndpoint,
      label: 'Statistics',
      order: 10,
      isEnabled: ({instance}) => instance.hasEndpoint('advancedmetrics')
    });
  }
});

SBA.use({
  install({viewRegistry}) {
    viewRegistry.addView({
      name: 'instances/backup',
      parent: 'instances',
      path: 'backup',
      component: backupEndpoint,
      label: 'Backup',
      order: 11,
      isEnabled: ({instance}) => instance.hasEndpoint('backup')
    });
  }
});


// end::customization-ui-endpoint[]
