const DEFAULT_TIME_LIMIT = 30000; // 30 sec
const RESET_TIME = 120000; // 2 mins

export default class DeviceTracker {
  constructor(initialDevices = {}) {
    this.trackedDevices = initialDevices;
  }

  update(devices, timeIncrement) {
    devices.forEach((device) => {
      const { address } = device;
      if (this.trackedDevices[address]) {
        this.trackedDevices[address] = {
          ...this.trackedDevices[address],
          trackedTime: this.trackedDevices[address].trackedTime + timeIncrement,
          lastUpdated: new Date(),
        };
      } else {
        this.trackedDevices[address] = {
          trackedTime: timeIncrement,
          lastUpdated: new Date(),
          created: new Date(),
        };
      }
    });
    this.removeExpired();
  }

  removeExpired() {
    const keysToRemove = Object.keys(this.trackedDevices).filter(
      (deviceAddress) =>
        new Date().getTime() - this.trackedDevices[deviceAddress].lastUpdated.getTime() > RESET_TIME
    );
    keysToRemove.forEach((key) => delete this.trackedDevices[key]);
  }

  isViolated(devices) {
    return !!devices.find(
      (device) =>
        this.trackedDevices[device.address].trackedTime > DEFAULT_TIME_LIMIT
    );
  }
}
