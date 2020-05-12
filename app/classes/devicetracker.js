const DEFAULT_TIME_LIMIT = 300000; // 5 mins

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
    this.removeExpired(devices);
  }

  removeExpired(devices) {
    const keysToRemove = Object.keys(this.trackedDevices).filter(
      (deviceAddress) =>
        !devices.find((device) => device.address === deviceAddress)
    );
    keysToRemove.forEach((key) => delete this.trackedDevices[key]);
  }

  isViolated(devices) {
    return !!devices.find(
      (device) =>
        this.trackedDevices[device.address].trackedTime > DEFAULT_TIME_LIMIT
    );
  }

  get devices() {
    return {
      ...this.trackedDevices,
    };
  }
}
