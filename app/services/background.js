import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class BackgroundService extends Service {
  @service('ember-cordova/platform') platform;
  @service('ember-cordova/events') events;

  @tracked eventLog = [];
  @tracked backgroundMode;
  @tracked notificationInterval;

  constructor() {
    super(...arguments);
    const events = this.events;
    events.on('deviceready', this, 'onDeviceReady');
  }

  async onDeviceReady() {
    try {
      this.backgroundMode = cordova.plugins.backgroundMode;
      // when background mode has been activated
      this.backgroundMode.on('activate', this.onModeActivated);
      // when background mode has been deactivated
      this.backgroundMode.on('deactivate', this.onModeDeactivated);
      // cordova.plugins.backgroundMode.setDefaults({
      //   silent: false,
      //   color: 'F14F4D',
      // });
    } catch (e) {
      this.log({ msg: e });
    }
  }

  start() {
    this.backgroundMode.enable();
  }

  stop() {
    cordova.plugins.backgroundMode.disable();
    clearInterval(this.notificationInterval);
  }

  // Update badge once mode gets activated
  onModeActivated() {
    // console.log('onModeActivated');
    let counter = 0;

    cordova.plugins.backgroundMode.disableWebViewOptimizations();
    // cordova.plugins.backgroundMode.disableBatteryOptimizations();
    clearInterval(this.notificationInterval);

    this.notificationInterval = setInterval(() => {
      counter++;
      // cordova.plugins.notification.badge.set(counter);

      if (counter % 5 === 0) {
        // console.log('Running since ' + counter + ' sec');
        cordova.plugins.backgroundMode.configure({
          title: 'Spacer App',
          text: 'Running since ' + counter + ' sec',
        });
      }
    }, 1000);
  }

  isEnabled() {
    console.log(this.backgroundMode.isEnabled());
  }

  // Reset badge once deactivated
  onModeDeactivated() {
    // console.log('onModeDeactivated');
    // cordova.plugins.notification.badge.clear();
    clearInterval(this.notificationInterval);
  }

  log({ level = 'info', time = new Date(), msg = '' }) {
    let obj = { level, time, msg };
    this.eventLog = [obj, ...this.eventLog];
  }
}
