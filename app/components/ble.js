import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
import {inject as service} from '@ember/service';
import Device from '../classes/device';
import DeviceTracker from '../classes/devicetracker';

const POLLING_INTERVAL = 5000;

export default class BleComponent extends Component {

  //@service('ember-cordova/events') events;
  @service bluetooth;

  @tracked scanStatus;
  @tracked advertisingStatus;
  @tracked devices = [];
  @tracked distanceIntervalId;
  @tracked deviceTracker;

  constructor() {
    super(...arguments);
    this.deviceTracker = new DeviceTracker();
  }

  async handlePermissions() {
    bluetoothle.hasPermission((status) => {
      if (status.hasPermssion) {
      } else {
        bluetoothle.requestPermission(() => {}, () => {});
      }
    });
  }

  get advert() {
    return new Promise((resolve, reject) => {
      window.bluetoothle && window.bluetoothle.isAdvertising(resolve, reject);
    });
  }

  addDevice(scanObject) {

    let obj = this.devices.findBy('address',scanObject.address)

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
      this.addDevice(scanResult)
    }
  }

  processScanError = (scanResult) => {
    this.bluetooth.log({level:'error', msg:scanResult})
  }

  warnOnViolation() {
    if(!this.devices) {
      return;
    }
    const devicesInDistance = this.devices.filter(device => device.distance <= 2);
    this.deviceTracker.update(devicesInDistance, POLLING_INTERVAL);
    if (this.deviceTracker.isViolated(devicesInDistance)) {
      this.bluetooth.warn();
    }
  }

  @action
  startScan() {
    this.handlePermissions();

    let params = {
      services: [],
      allowDuplicates: true
    }

    this.bluetooth.startScan(this.processScan, this.processScanError, params)

    this.distanceIntervalId = setInterval(() => {
      this.warnOnViolation();
    }, POLLING_INTERVAL);
  }


  @action
  async stopScan() {
    clearInterval(this.distanceIntervalId);
    try {
      let result = await this.bluetooth.stopScan();
      this.scanStatus = result.status;
      this.devices = []; //reset the device list
      this.bluetooth.log({level:'info', msg:result.status});
    } catch (e) {
     this.bluetooth.log({level:'error', msg:e.status})
    }
  }
}
