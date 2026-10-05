/**
 * Kavach BLE Service v2 – staged connection with full diagnostics (JavaScript)
 */

export const KAVACH_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
export const KAVACH_ALERT_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"

const BATTERY_SVC = "battery_service"
const GENERIC_ACC = "generic_access"

export const initialDiagnostics = {
  apiSupported: false,
  secureContext: false,
  deviceName: "—",
  deviceId: "—",
  gattExists: false,
  gattConnected: false,
  serviceFound: false,
  characteristicFound: false,
  notificationsStarted: false,
  serviceUuidRequested: KAVACH_SERVICE_UUID,
  characteristicUuidRequested: KAVACH_ALERT_CHAR_UUID,
  lastErrorName: "",
  lastErrorMessage: "",
  lastError: "",
  stage: "idle",
}

export function isWebBluetoothSupported() {
  return (
    typeof navigator !== "undefined" &&
    "bluetooth" in navigator &&
    window.isSecureContext
  )
}

export function getUnsupportedReason() {
  if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
    return "Web Bluetooth is not available in this browser. Use Chrome or Edge on desktop."
  }
  if (!window.isSecureContext) {
    return "Bluetooth requires a secure context (HTTPS or localhost)."
  }
  return ""
}

const ble = {
  log: (msg, ...args) =>
    console.log(
      "%c[Kavach BLE]",
      "color:#2EC4B6;font-weight:bold",
      msg,
      ...args,
    ),
  warn: (msg, ...args) => console.warn("[Kavach BLE]", msg, ...args),
  err: (msg, ...args) => console.error("[Kavach BLE]", msg, ...args),
}

const notificationListeners = new WeakSet()

export async function requestBluetoothDevice() {
  ble.log("Stage 1 — requestDevice() started")
  const bluetooth = navigator.bluetooth

  const device = await bluetooth.requestDevice({
    filters: [{ services: [KAVACH_SERVICE_UUID] }],
    optionalServices: [KAVACH_SERVICE_UUID],
  })
  ble.log("Stage 1 — device selected", { name: device.name, id: device.id })
  ble.log("Stage 1 — device.gatt exists:", !!device.gatt)
  return device
}

async function gattConnect(device) {
  ble.log("Stage 2 — device.gatt.connect()", {
    name: device.name,
    id: device.id,
  })
  ble.log("  gatt object exists:", !!device.gatt)

  if (!device.gatt) {
    throw Object.assign(
      new Error("This device does not expose a GATT server."),
      { name: "NotSupportedError" },
    )
  }

  ble.log("  gatt.connected before connect:", device.gatt.connected)
  let server
  try {
    server = await device.gatt.connect()
  } catch (error) {
    ble.err("Stage 2 ✗ GATT connect failed", error)
    throw error
  }
  ble.log("[BLE] device.name =", device.name)
  ble.log("[BLE] device.id =", device.id)
  ble.log("[BLE] device.gatt?.connected =", device.gatt.connected)
  ble.log("[BLE] server.connected =", server.connected)
  ble.log(
    "Stage 2 — gatt.connect() successful; server.connected:",
    server.connected,
  )

  if (!server.connected) {
    throw Object.assign(
      new Error(
        "GATT server reported disconnected immediately after connect().",
      ),
      { name: "NetworkError" },
    )
  }

  ble.log("Stage 2 ✓ GATT connected")
  return server
}

async function getKavachService(server, diag) {
  ble.log("Stage 3 — getting exact primary service")
  try {
    const svc = await server.getPrimaryService(KAVACH_SERVICE_UUID)
    ble.log("DIRECT SERVICE FOUND:", svc.uuid)
    diag.serviceFound = true
    return svc
  } catch (err) {
    const errName = err instanceof Error ? err.name : "UnknownError"
    const errorMessage = err instanceof Error ? err.message : String(err)
    ble.err("SERVICE DISCOVERY FAILED", {
      name: errName,
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
      expectedServiceUuid: KAVACH_SERVICE_UUID,
    })
    diag.serviceFound = false
    diag.lastErrorName = errName
    diag.lastErrorMessage = errorMessage
    diag.lastError = `SERVICE DISCOVERY FAILED - ${errName}: ${errorMessage}`
    throw err
  }
}

async function getKavachCharacteristic(service, diag) {
  ble.log("Stage 4 — getting exact characteristic")
  try {
    const chr = await service.getCharacteristic(KAVACH_ALERT_CHAR_UUID)
    ble.log("CHARACTERISTIC FOUND:", chr.uuid)
    diag.characteristicFound = true
    return chr
  } catch (err) {
    ble.warn("Stage 4 ✗ characteristic not found", err)
    diag.characteristicFound = false
    diag.lastErrorName = err instanceof Error ? err.name : "UnknownError"
    diag.lastErrorMessage = err instanceof Error ? err.message : String(err)
    diag.lastError = `Characteristic lookup ${
      err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    }`
    throw err
  }
}

export async function connectGatt(device, onDisconnect, diag, onDiagnostics) {
  const updateDiagnostics = (updates) => {
    Object.assign(diag, updates)
    onDiagnostics?.({ ...diag })
  }

  updateDiagnostics({
    deviceName: device.name || "BLE Device",
    deviceId: device.id,
    gattExists: !!device.gatt,
    gattConnected: false,
    serviceFound: false,
    characteristicFound: false,
    notificationsStarted: false,
    serviceUuidRequested: KAVACH_SERVICE_UUID,
    characteristicUuidRequested: KAVACH_ALERT_CHAR_UUID,
    lastErrorName: "",
    lastErrorMessage: "",
    lastError: "",
    stage: "connecting",
  })

  device.removeEventListener("gattserverdisconnected", onDisconnect)
  device.addEventListener("gattserverdisconnected", onDisconnect)

  updateDiagnostics({ stage: "gatt-connect" })
  let server
  try {
    server = await gattConnect(device)
  } catch (error) {
    updateDiagnostics({
      gattConnected: false,
      stage: "gatt-connect-failed",
      lastError:
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error),
    })
    throw error
  }
  updateDiagnostics({
    gattConnected: server.connected,
    stage: "gatt-connected",
  })

  const service = await getKavachService(server, diag)
  updateDiagnostics({
    serviceFound: true,
    stage: "service-found",
  })
  const alertCharacteristic = await getKavachCharacteristic(service, diag)
  updateDiagnostics({
    characteristicFound: true,
    lastError: diag.lastError,
    stage: "characteristic-found",
  })

  updateDiagnostics({ stage: "fully-connected" })
  ble.log("Connection complete", {
    gatt: server.connected,
    hasKavachService: !!service,
    hasCharacteristic: !!alertCharacteristic,
  })

  return {
    device: {
      id: device.id,
      name: device.name || "BLE Device",
      hasKavachService: !!service,
    },
    server,
    alertCharacteristic,
  }
}

export async function writePhoneNumber(characteristic, phone) {
  const data = new TextEncoder().encode(phone.replace(/\D/g, "").slice(0, 12))
  ble.log("Writing phone number to characteristic, bytes:", data.length)
  await characteristic.writeValueWithoutResponse(data)
  ble.log("Phone number written successfully")
}

export async function readAlertValue(characteristic) {
  ble.log("Reading characteristic value")
  const value = await characteristic.readValue()
  const message = new TextDecoder().decode(value)
  ble.log("Characteristic read successfully:", message)
  return message
}

export async function startAlertNotifications(
  characteristic,
  onAlert,
  onStarted,
) {
  ble.log("Stage 5 — starting notifications")
  await characteristic.startNotifications()
  if (!notificationListeners.has(characteristic)) {
    characteristic.addEventListener("characteristicvaluechanged", (event) => {
      const target = event.target
      if (target?.value) {
        const msg = new TextDecoder().decode(target.value)
        ble.log("Notification received:", msg)
        onAlert(msg)
      }
    })
    notificationListeners.add(characteristic)
  }
  onStarted?.()
  ble.log("NOTIFICATIONS STARTED")
  ble.log("Stage 5 ✓ notifications-ready")
}

export async function disconnectGatt(device) {
  if (!device) return
  ble.log("Disconnecting GATT...", device.name)
  if (device.gatt?.connected) {
    device.gatt.disconnect()
  }
  ble.log("GATT disconnected")
}

export function classifyBluetoothError(error) {
  if (!(error instanceof Error))
    return "An unexpected error occurred. Please try again."
  ble.err("Error:", error.name, "|", error.message)
  switch (error.name) {
    case "NotFoundError":
      return "No device was selected."
    case "AbortError":
      return "Device selection was cancelled."
    case "NotAllowedError":
    case "SecurityError":
      return "Bluetooth permission denied. Please allow access and try again."
    case "NetworkError":
      return (
        "GATT connection failed. In nRF Connect: make sure both the " +
        "GATT Server AND Advertiser are running, and the device is nearby."
      )
    case "NotSupportedError":
      return "This device does not expose a GATT server."
    case "InvalidStateError":
      return "Bluetooth adapter error. Toggle Bluetooth off and on, then retry."
    default:
      if (error.message?.toLowerCase().includes("gatt")) {
        return "GATT error: " + error.message
      }
      return error.message || "Bluetooth connection failed. Please try again."
  }
}
