/**
 * Kavach BLE Service  v2 – staged connection with full diagnostics
 *
 * CONNECTION STAGES (separated so we know exactly which fails)
 * ────────────────────────────────────────────────────────────
 * Stage 1  requestDevice()   → device chooser
 * Stage 2  device.gatt.connect()  → GATT server link (basic BLE)
 * Stage 3  getPrimaryService()    → Kavach custom service
 * Stage 4  getCharacteristic()    → alert channel
 * Stage 5  startNotifications()   → real-time alerts
 *
 * Stages 3-5 are required for a Kavach-ready connection.
 *
 * ────────────────────────────────────────────────────────────
 * nRF Connect ANDROID SETUP (BLE Peripheral mode)
 * ────────────────────────────────────────────────────────────
 *  1. Open nRF Connect → "GATT Server" tab (left drawer)
 *  2. Tap the "+" (Add server configuration)  → name it "Kavach"
 *  3. Add Service → Custom → UUID: 4fafc201-1fb5-459e-8fcc-c5c9c331914b
 *  4. Inside that service, Add Characteristic:
 *       UUID:        beb5483e-36e1-4688-b7f5-ea07361b26a8
 *       Properties:  READ + WRITE + NOTIFY
 *  5. Save configuration
 *  6. "Advertiser" tab → Add record → ADD Service UUID → paste the service UUID
 *  7. Tap ▶ (Start) on the Advertiser
 *  NOTE: Both GATT Server AND Advertiser must be running simultaneously.
 */

// ─── UUIDs ─────────────────────────────────────────────────────────────────
// To use a different hardware device, change only these two lines.
export const KAVACH_SERVICE_UUID            = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'
export const KAVACH_ALERT_CHAR_UUID         = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'

// Standard BLE UUIDs – widely supported, used to unlock Chrome's Pair button
const BATTERY_SVC  = 'battery_service'
const GENERIC_ACC  = 'generic_access'

// ─── Types ──────────────────────────────────────────────────────────────────
export type BleConnectionState =
  | 'unsupported'
  | 'disconnected'
  | 'selecting'
  | 'connecting'     // gatt.connect() in progress
  | 'connected'      // gatt.connect() succeeded (basic or full)
  | 'disconnecting'
  | 'error'

// Diagnostic snapshot – used by the debug panel
export interface BleDiagnostics {
  apiSupported: boolean
  secureContext: boolean
  deviceName: string
  deviceId: string
  gattExists: boolean
  gattConnected: boolean
  serviceFound: boolean
  characteristicFound: boolean
  notificationsStarted: boolean
  serviceUuidRequested: string
  characteristicUuidRequested: string
  lastErrorName: string
  lastErrorMessage: string
  lastError: string
  stage: string  // human-readable stage label
}

export const initialDiagnostics: BleDiagnostics = {
  apiSupported: false,
  secureContext: false,
  deviceName: '—',
  deviceId: '—',
  gattExists: false,
  gattConnected: false,
  serviceFound: false,
  characteristicFound: false,
  notificationsStarted: false,
  serviceUuidRequested: KAVACH_SERVICE_UUID,
  characteristicUuidRequested: KAVACH_ALERT_CHAR_UUID,
  lastErrorName: '',
  lastErrorMessage: '',
  lastError: '',
  stage: 'idle',
}

export interface BleDevice {
  id: string
  name: string
  hasKavachService: boolean
}

export interface BleConnectionResult {
  device: BleDevice
  server: BluetoothRemoteGATTServer
  alertCharacteristic: BluetoothRemoteGATTCharacteristic | null
}

// ─── Support check ──────────────────────────────────────────────────────────
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator && window.isSecureContext
}

export function getUnsupportedReason(): string {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    return 'Web Bluetooth is not available in this browser. Use Chrome or Edge on desktop.'
  }
  if (!window.isSecureContext) {
    return 'Bluetooth requires a secure context (HTTPS or localhost).'
  }
  return ''
}

// ─── Logging helper (console only, never shown to user) ─────────────────────
const ble = {
  log: (msg: string, ...args: unknown[]) => console.log('%c[Kavach BLE]', 'color:#2EC4B6;font-weight:bold', msg, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn('[Kavach BLE]', msg, ...args),
  err: (msg: string, ...args: unknown[]) => console.error('[Kavach BLE]', msg, ...args),
}

const notificationListeners = new WeakSet<BluetoothRemoteGATTCharacteristic>()

// ─── Stage 1: Device chooser ────────────────────────────────────────────────
export async function requestBluetoothDevice(): Promise<BluetoothDevice> {
  ble.log('Stage 1 — requestDevice() started')
  const bluetooth = navigator.bluetooth

  const device = await bluetooth.requestDevice({
    filters: [{ services: [KAVACH_SERVICE_UUID] }],
    optionalServices: [KAVACH_SERVICE_UUID],
  })
  ble.log('Stage 1 — device selected', { name: device.name, id: device.id })
  ble.log('Stage 1 — device.gatt exists:', !!device.gatt)
  return device
}

// ─── Stage 2: GATT connect (hard requirement) ───────────────────────────────
async function gattConnect(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer> {
  ble.log('Stage 2 — device.gatt.connect()', { name: device.name, id: device.id })
  ble.log('  gatt object exists:', !!device.gatt)

  if (!device.gatt) {
    throw Object.assign(new Error('This device does not expose a GATT server.'), { name: 'NotSupportedError' })
  }

  ble.log('  gatt.connected before connect:', device.gatt.connected)
  let server: BluetoothRemoteGATTServer
  try {
    server = await device.gatt.connect()
  } catch (error) {
    ble.err('Stage 2 ✗ GATT connect failed', error)
    throw error
  }
  ble.log('[BLE] device.name =', device.name)
  ble.log('[BLE] device.id =', device.id)
  ble.log('[BLE] device.gatt?.connected =', device.gatt.connected)
  ble.log('[BLE] server.connected =', server.connected)
  ble.log('Stage 2 — gatt.connect() successful; server.connected:', server.connected)

  if (!server.connected) {
    throw Object.assign(
      new Error('GATT server reported disconnected immediately after connect().'),
      { name: 'NetworkError' }
    )
  }

  ble.log('Stage 2 ✓ GATT connected')
  return server
}

// ─── Stage 3: Primary service ──────────────────────────────────────────────
async function getKavachService(
  server: BluetoothRemoteGATTServer,
  diag: BleDiagnostics
): Promise<BluetoothRemoteGATTService> {
  ble.log('Stage 3 — getting exact primary service')
  try {
    const svc = await server.getPrimaryService(KAVACH_SERVICE_UUID)
    ble.log('DIRECT SERVICE FOUND:', svc.uuid)
    diag.serviceFound = true
    return svc
  } catch (err: unknown) {
    const errName = err instanceof Error ? err.name : 'UnknownError'
    const errorMessage = err instanceof Error ? err.message : String(err)
    ble.err('SERVICE DISCOVERY FAILED', {
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

// ─── Stage 4: Characteristic ───────────────────────────────────────────────
async function getKavachCharacteristic(
  service: BluetoothRemoteGATTService,
  diag: BleDiagnostics
): Promise<BluetoothRemoteGATTCharacteristic> {
  ble.log('Stage 4 — getting exact characteristic')
  try {
    const chr = await service.getCharacteristic(KAVACH_ALERT_CHAR_UUID)
    ble.log('CHARACTERISTIC FOUND:', chr.uuid)
    diag.characteristicFound = true
    return chr
  } catch (err: unknown) {
    ble.warn('Stage 4 ✗ characteristic not found', err)
    diag.characteristicFound = false
    diag.lastErrorName = err instanceof Error ? err.name : 'UnknownError'
    diag.lastErrorMessage = err instanceof Error ? err.message : String(err)
    diag.lastError = `Characteristic lookup ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`
    throw err
  }
}

// ─── Main connect (orchestrates stages 2-4) ─────────────────────────────────
export async function connectGatt(
  device: BluetoothDevice,
  onDisconnect: EventListener,
  diag: BleDiagnostics,
  onDiagnostics?: (diagnostics: BleDiagnostics) => void
): Promise<BleConnectionResult> {
  const updateDiagnostics = (updates: Partial<BleDiagnostics>) => {
    Object.assign(diag, updates)
    onDiagnostics?.({ ...diag })
  }

  // Update diagnostics with device info (shown in debug panel)
  updateDiagnostics({
    deviceName: device.name || 'BLE Device',
    deviceId: device.id,
    gattExists: !!device.gatt,
    gattConnected: false,
    serviceFound: false,
    characteristicFound: false,
    notificationsStarted: false,
    serviceUuidRequested: KAVACH_SERVICE_UUID,
    characteristicUuidRequested: KAVACH_ALERT_CHAR_UUID,
    lastErrorName: '',
    lastErrorMessage: '',
    lastError: '',
    stage: 'connecting',
  })

  // Attach disconnect listener (remove first to prevent duplicates)
  device.removeEventListener('gattserverdisconnected', onDisconnect)
  device.addEventListener('gattserverdisconnected', onDisconnect)

  // ── Stage 2 (hard) ────────────────────────────────────────────────────────
  updateDiagnostics({ stage: 'gatt-connect' })
  let server: BluetoothRemoteGATTServer
  try {
    server = await gattConnect(device)
  } catch (error) {
    updateDiagnostics({
      gattConnected: false,
      stage: 'gatt-connect-failed',
      lastError: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    })
    throw error
  }
  updateDiagnostics({ gattConnected: server.connected, stage: 'gatt-connected' })

  // ── Stages 3-4 are required for the Kavach peripheral contract. ──────────
  const service = await getKavachService(server, diag)
  updateDiagnostics({
    serviceFound: true,
    stage: 'service-found',
  })
  const alertCharacteristic = await getKavachCharacteristic(service, diag)
  updateDiagnostics({
    characteristicFound: true,
    lastError: diag.lastError,
    stage: 'characteristic-found',
  })

  updateDiagnostics({ stage: 'fully-connected' })
  ble.log('Connection complete', {
    gatt: server.connected,
    hasKavachService: !!service,
    hasCharacteristic: !!alertCharacteristic,
  })

  return {
    device: { id: device.id, name: device.name || 'BLE Device', hasKavachService: !!service },
    server,
    alertCharacteristic,
  }
}

// ─── Characteristic helpers ─────────────────────────────────────────────────
export async function writePhoneNumber(
  characteristic: BluetoothRemoteGATTCharacteristic,
  phone: string
): Promise<void> {
  const data = new TextEncoder().encode(phone.replace(/\D/g, '').slice(0, 12))
  ble.log('Writing phone number to characteristic, bytes:', data.length)
  await characteristic.writeValueWithoutResponse(data)
  ble.log('Phone number written successfully')
}

export async function readAlertValue(
  characteristic: BluetoothRemoteGATTCharacteristic
): Promise<string> {
  ble.log('Reading characteristic value')
  const value = await characteristic.readValue()
  const message = new TextDecoder().decode(value)
  ble.log('Characteristic read successfully:', message)
  return message
}

export async function startAlertNotifications(
  characteristic: BluetoothRemoteGATTCharacteristic,
  onAlert: (message: string) => void,
  onStarted?: () => void
): Promise<void> {
  ble.log('Stage 5 — starting notifications')
  await characteristic.startNotifications()
  if (!notificationListeners.has(characteristic)) {
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic
      if (target.value) {
        const msg = new TextDecoder().decode(target.value)
        ble.log('Notification received:', msg)
        onAlert(msg)
      }
    })
    notificationListeners.add(characteristic)
  }
  onStarted?.()
  ble.log('NOTIFICATIONS STARTED')
  ble.log('Stage 5 ✓ notifications-ready')
}

export async function disconnectGatt(device: BluetoothDevice | null): Promise<void> {
  if (!device) return
  ble.log('Disconnecting GATT...', device.name)
  if (device.gatt?.connected) {
    device.gatt.disconnect()
  }
  ble.log('GATT disconnected')
}

// ─── Error classification ───────────────────────────────────────────────────
export function classifyBluetoothError(error: unknown): string {
  if (!(error instanceof Error)) return 'An unexpected error occurred. Please try again.'
  ble.err('Error:', error.name, '|', error.message)
  switch (error.name) {
    case 'NotFoundError':
      return 'No device was selected.'
    case 'AbortError':
      return 'Device selection was cancelled.'
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Bluetooth permission denied. Please allow access and try again.'
    case 'NetworkError':
      return (
        'GATT connection failed. In nRF Connect: make sure both the ' +
        'GATT Server AND Advertiser are running, and the device is nearby.'
      )
    case 'NotSupportedError':
      return 'This device does not expose a GATT server.'
    case 'InvalidStateError':
      return 'Bluetooth adapter error. Toggle Bluetooth off and on, then retry.'
    default:
      if (error.message?.toLowerCase().includes('gatt')) {
        return 'GATT error: ' + error.message
      }
      return error.message || 'Bluetooth connection failed. Please try again.'
  }
}
