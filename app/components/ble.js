import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Device from '../classes/device';
import DeviceTracker from '../classes/devicetracker';

const POLLING_INTERVAL = 10000 / 2; // 10 sec
const MAX_DISTANCE = 2;
const PAUSE_TIME = 300000 / 5; // 5 mins
const SCAN_PARAMS = {
  services: [],
  allowDuplicates: true,
};

export default class BleComponent extends Component {
  //@service('ember-cordova/events') events;
  @service bluetooth;
  @service background;

  @tracked scanStatus;
  @tracked advertisingStatus;
  @tracked devices = [];
  @tracked distanceIntervalId;
  @tracked deviceTracker;
  @tracked isScanning = false;
  @tracked isPaused = false;
  @tracked pauseId;
  @tracked devicesInDistance = [];

  constructor() {
    super(...arguments);
    this.deviceTracker = new DeviceTracker();
  }

  async handlePermissions() {
    bluetoothle.hasPermission((status) => {
      if (status.hasPermssion) {
      } else {
        bluetoothle.requestPermission(
          () => {},
          () => {}
        );
      }
    });
  }

  get advert() {
    return new Promise((resolve, reject) => {
      window.bluetoothle && window.bluetoothle.isAdvertising(resolve, reject);
    });
  }

  addDevice(scanObject) {
    let obj = this.devices.findBy('address', scanObject.address);

    if (obj) {
      set(obj, 'rssi', scanObject.rssi);
      set(obj, 'name', scanObject.name);
    } else {
      let d = new Device(scanObject);
      set(d, 'rssi', scanObject.rssi);

      // need to re-bang the whole array for the observer to pick it up
      // check this out in ember octane docs
      this.devices = [...this.devices, d];
    }
  }

  processScan = (scanResult) => {
    this.scanStatus = scanResult.status;
    if (scanResult.status === 'scanResult') {
      this.addDevice(scanResult);
    }
  };

  processScanError = (scanResult) => {
    this.bluetooth.log({ level: 'error', msg: scanResult });
  };

  handleDevicesInDistance() {
    this.background.isEnabled();
    if (!this.devices) {
      return;
    }
    this.devicesInDistance = this.devices.filter(
      (device) => device.distance && device.distance <= MAX_DISTANCE
    );
    this.deviceTracker.update(this.devicesInDistance, POLLING_INTERVAL);
    const isWarnOn = this.deviceTracker.isViolated(this.devicesInDistance);
    if (isWarnOn) {
      this.bluetooth.warn();
    }

    this.devicesInDistance = this.devicesInDistance.map((device) => ({
      name: device.name || device.address,
      // distance: device.distance.toFixed(2),
      // timeInDanger: this.deviceTracker.devices[device.address].trackedTime,
    }));
    // console.table(this.devicesInDistance);
  }

  @action
  startScan() {
    this.background.start();
    this.isPaused = false;

    this.handlePermissions();
    this.bluetooth.startScan(
      this.processScan,
      this.processScanError,
      SCAN_PARAMS
    );

    this.distanceIntervalId = setInterval(() => {
      this.handleDevicesInDistance();
    }, POLLING_INTERVAL);
    this.isScanning = true;
  }

  @action
  async pauseScan() {
    try {
      await this.stopScan({ stopBackground: false });
      this.isScanning = true;
      this.isPaused = true;
      clearTimeout(this.pauseId);
      this.pauseId = setTimeout(() => this.startScan(), PAUSE_TIME);
    } catch (e) {
      this.bluetooth.log({ level: 'error', msg: e.status });
    }
  }

  @action
  async stopScan({ stopBackground = true } = {}) {
    clearInterval(this.distanceIntervalId);
    clearTimeout(this.pauseId);
    // console.log('stop bg', stopBackground);
    if (stopBackground) {
      this.background.stop();
    }
    this.isScanning = false;
    this.isPaused = false;
    try {
      let result = await this.bluetooth.stopScan();
      this.scanStatus = result.status;
      this.devices = []; //reset the device list
      this.bluetooth.log({ level: 'info', msg: result.status });
    } catch (e) {
      this.bluetooth.log({ level: 'error', msg: e.status });
    }
  }
}
