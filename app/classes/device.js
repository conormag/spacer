import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';
import { get } from '@ember/object'
import {inject as service} from '@ember/service';
import {ble} from 'advlib'

export default class Device {

  @service('ember-cordova/platform') platform;

  constructor(obj) {
    this.name = obj.name;
    this.address = obj.address;
    this.advertisement = obj.advertisement;
    this.createdAt = Date.now();
  }

  @tracked _rssiStates = A([]);


  set rssi(signalVal) {
    this._rssiStates.pushObject({
      signal: signalVal,
      time: Date.now()
    });
  }


  get rssi() {
    return this._rssiStates.length > 0 ?
      this._rssiStates.slice(-1)[0].signal : 0;
  }

  /*
  if time specified its average over last time seconds

  Update: I had originally got mean rssi but on further reading I think
          its more appropriate to get mode. will leave mean here for comparison
  */
  getAverageSignal(time) {
    const MAX_TIME = 15 * 60 * 1000; // 15 mins
    const forTime = time ? time * 1000 : MAX_TIME;
    const start = Date.now() - forTime;
    let validA = this._rssiStates.filter(el => el.time > start);
    let total =  validA.reduce((total, obj) => total + Number(obj.signal), 0);
    return total < 0 ? Math.ceil(total/validA.length) : 0;
  }

  get averageSignal() {
    return this.getAverageSignal(30);
  }

  /*
    rettrieves the mode of the signal over last <time> seconds
  */

  getModeSignal(time) {
    const MAX_TIME = 15 * 60 * 1000; // 15 mins
    const forTime = time ? time * 1000 : MAX_TIME;
    const start = Date.now() - forTime;
    let validA = this._rssiStates.filter(el => el.time > start);
    let mode = Object.values(
        validA.reduce((count, e) => {
          let signal = e.signal;
          if (!(signal in count)) {
            count[signal] = [0, signal];
          }
          count[signal][0]++;
          return count;
        }, {})
      ).reduce((a, v) => v[0] < a[0] ? a : v, [0, null])[1];

    return mode;
  }


  get modeSignal() {
    return this.getModeSignal(30);
  }

  get txPowerLevel() {
    if (this.advertisement.txPowerLevel) {
      return Number(this.advertisement.txPowerLevel) || 0;
    }

    function encodedStringToBytes(string) {
      var data = atob(string);
      var bytes = new Uint8Array(data.length);
      for (var i = 0; i < bytes.length; i++)
      {
        bytes[i] = data.charCodeAt(i);
      }
      return bytes;
    }

    function base64ToHex(str) {
      const raw = atob(str);
      let result = '';
      for (let i = 0; i < raw.length; i++) {
        const hex = raw.charCodeAt(i).toString(16);
        result += (hex.length === 2 ? hex : '0' + hex);
      }
      return result.toUpperCase();
    }
    

    // android decode the advertisement
    let uint8arr = encodedStringToBytes(this.advertisement);
    let asHex = base64ToHex(this.advertisement);

    var processedPacket = ble.data.process(asHex);

    let txPower = processedPacket.txPower ? Number(processedPacket.txPower.split('dBm')[0]) : 0;
    return txPower;
  }


  /*
  https://iotandelectronics.wordpress.com/2016/10/07/how-to-calculate-distance-from-the-rssi-value-of-the-ble-beacon/
  */
  get distance() {
    let N =2;
    let measuredPower = -65+this.txPowerLevel;
    // 65 seems to work well
    measuredPower = -65;
    let distance = Math.pow(10,( measuredPower - this.modeSignal)/(10 * N));
    return distance;
  }
  
}
