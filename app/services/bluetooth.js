import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import {inject as service} from '@ember/service';

export default class BluetoothService extends Service {

  @service('ember-cordova/platform') platform;
  @service('ember-cordova/events') events;

  @tracked eventLog = [];

  constructor() {
    super(...arguments);
    const events = this.events;
    events.on("deviceready", this, 'onDeviceReady');
  }

  onDeviceReady = async () => {
    let initParams = {
      "request": true,
      "statusReceiver": false,
      "restoreKey" : "spacer"      
    }

    let advertiseParams = {
      "services":["1234"], //iOS
      "service":"1234", //Android
      timeout: 0,


      "name":"spacer",
    };

    try {
      await this.initialize(initParams);

      await this.initializePeripheral({
        "request": true,
        "restoreKey": "SpacerApp"
      });

      await this.startAdvertising(advertiseParams);

      // this.initialize(initParams).then(result => {
      //   console.log('init:-', result);
      //   this.startAdvertising(advertiseParams).then(result2 => {
      //     console.log('advertise', result2)
      //     this.advertisingStatus = result2.status
      //   }).catch(e => console.log('ad err',e))
      // })
    } catch (e) {
      this.log({msg: e})
    }
  };


  initializePeripheral(params) {
    return new Promise((resolve, reject) => {
      window.bluetoothle && 
      window.bluetoothle.initialize(resolve, reject, params);
    }); 
  }

  initialize(params) {
    return new Promise((resolve) => {
      window.bluetoothle && 
      window.bluetoothle.initialize(resolve, params);
    }); 
  }

  startAdvertising(params) {
    return new Promise((resolve, reject) => {
      window.bluetoothle.startAdvertising(resolve, reject, params);
    }); 
  }

  stopScan() {
    return new Promise((resolve, reject) => {
      window.bluetoothle && window.bluetoothle.stopScan(resolve, reject);
    });    
  }

  startScan(fnSuccess, fnError, params) {
    //return new Promise((resolve, reject) => {
      window.bluetoothle && window.bluetoothle.startScan(fnSuccess, fnError, params);
    //});     
  }

  log({level = "info", time = new Date(), msg = ""}) {
    let obj = {level, time, msg}
    this.eventLog = [obj, ...this.eventLog]; 
  }

  warn() {
    if (this.platform.isIOS) {
      let fn = function() { navigator.vibrate(1000) }
      setTimeout(fn, 0);
      setTimeout(fn, 2000);
      setTimeout(fn, 4000);
    } else {
      navigator && navigator.vibrate([
        1000,1000,1000,1000,1000
      ]);
    }
  }
}
