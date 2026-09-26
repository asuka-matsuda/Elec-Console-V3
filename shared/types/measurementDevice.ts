/**
 * 測定機器（絶縁計・電圧計・検相器等）の型定義
 */

export type MeasurementDeviceCategory = 'megger' | 'voltmeter' | 'phaseDetector'

export interface MeasurementDevice {
  id: string
  category: MeasurementDeviceCategory
  maker: string
  model: string
  calibrationDate: string
  serialNumber: string
  note?: string
}

export interface SelectedMeasurementDevices {
  meggerId?: string
  voltmeterId?: string
  phaseDetectorId?: string
}

export interface MeasurementDevicesApiResponse {
  devices: MeasurementDevice[]
  selectedDeviceIds: SelectedMeasurementDevices
}
