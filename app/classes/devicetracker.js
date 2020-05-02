const DEFAULT_TIME_LIMIT = 30000; // 10 sec

export default class DeviceTracker {

  constructor(initialDevices = {}) {
    this.trackedDevices = initialDevices;
  }

  update(devices, timeIncrement) {
    devices.forEach((device) => {
      const { address } = device;
      if (this.trackedDevices[address]) {
        this.trackedDevices[address] += timeIncrement;
      } else {
        this.trackedDevices[address] = timeIncrement;
      }
    });
  }

  isViolated(devices) {
    return !!devices.find((device) =>
      this.trackedDevices[device.address] > DEFAULT_TIME_LIMIT
    );
  }

}
