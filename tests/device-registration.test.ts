import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockDevices = new Map()
let mockLastDeviceId = 0

// Mock contract functions
const deviceRegistration = {
  registerDevice: (name, description, hourlyRate) => {
    if (mockTxSender !== "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM") {
      return { error: 403 }
    }
    
    const newId = mockLastDeviceId + 1
    mockLastDeviceId = newId
    
    mockDevices.set(newId, {
      name,
      description,
      owner: mockTxSender,
      status: 1,
      hourlyRate,
      registrationDate: 100, // Mock block height
    })
    
    return { value: newId }
  },
  
  updateDeviceStatus: (deviceId, newStatus) => {
    if (!mockDevices.has(deviceId)) {
      return { error: 404 }
    }
    
    const device = mockDevices.get(deviceId)
    
    if (device.owner !== mockTxSender) {
      return { error: 403 }
    }
    
    if (newStatus > 2) {
      return { error: 400 }
    }
    
    device.status = newStatus
    mockDevices.set(deviceId, device)
    
    return { value: true }
  },
  
  getDevice: (deviceId) => {
    return mockDevices.get(deviceId) || null
  },
  
  isDeviceAvailable: (deviceId) => {
    const device = mockDevices.get(deviceId)
    return device ? device.status === 1 : false
  },
  
  getDeviceOwner: (deviceId) => {
    const device = mockDevices.get(deviceId)
    return device ? device.owner : null
  },
}

describe("Device Registration Contract", () => {
  beforeEach(() => {
    // Reset the mock state
    mockDevices.clear()
    mockLastDeviceId = 0
  })
  
  it("should register a new device", () => {
    const result = deviceRegistration.registerDevice(
        "MRI Scanner",
        "High-resolution magnetic resonance imaging device",
        100,
    )
    
    expect(result).toHaveProperty("value")
    expect(result.value).toBe(1)
    
    const device = deviceRegistration.getDevice(1)
    expect(device).not.toBeNull()
    expect(device.name).toBe("MRI Scanner")
    expect(device.status).toBe(1) // Active
  })
  
  it("should update device status", () => {
    // First register a device
    deviceRegistration.registerDevice("CT Scanner", "Computed tomography scanner", 80)
    
    // Update to maintenance status
    const result = deviceRegistration.updateDeviceStatus(1, 2)
    expect(result).toHaveProperty("value")
    expect(result.value).toBe(true)
    
    const device = deviceRegistration.getDevice(1)
    expect(device.status).toBe(2) // Maintenance
  })
  
  it("should check if device is available", () => {
    // Register a device
    deviceRegistration.registerDevice("Ultrasound", "Portable ultrasound machine", 50)
    
    // Device should be available by default
    expect(deviceRegistration.isDeviceAvailable(1)).toBe(true)
    
    // Set to maintenance
    deviceRegistration.updateDeviceStatus(1, 2)
    expect(deviceRegistration.isDeviceAvailable(1)).toBe(false)
  })
  
  it("should get device owner", () => {
    // Register a device
    deviceRegistration.registerDevice("X-Ray Machine", "Digital X-ray imaging system", 60)
    
    const owner = deviceRegistration.getDeviceOwner(1)
    expect(owner).toBe(mockTxSender)
  })
})

