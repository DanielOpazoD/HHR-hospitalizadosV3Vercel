/**
 * Clinical Constants
 * Medical devices, specialties, statuses, and clinical options
 */

import { Specialty, PatientStatus } from '../types';

// Specialty and Status Options (filtered)
export const SPECIALTY_OPTIONS = Object.values(Specialty).filter(s => s !== '');
export const STATUS_OPTIONS = Object.values(PatientStatus).filter(s => s !== '');

// Admission Origins
export const ADMISSION_ORIGIN_OPTIONS: string[] = ['CAE', 'APS', 'Urgencias', 'Pabellón', 'Otro'];
export type AdmissionOrigin = 'CAE' | 'APS' | 'Urgencias' | 'Pabellón' | 'Otro';

// Medical Devices
export const DEVICE_OPTIONS: string[] = ['VVP', 'CVC', 'LA', 'CUP', 'VMNI', 'CNAF', 'VMI'];
export type DeviceType = 'VVP' | 'CVC' | 'LA' | 'CUP' | 'VMNI' | 'CNAF' | 'VMI';

// Evacuation/Transfer Methods
export const EVACUATION_METHODS: string[] = [
    'Avión comercial',
    'Aerocardal',
    'Avión FACH'
];
export type EvacuationMethod = 'Avión comercial' | 'Aerocardal' | 'Avión FACH';

// Receiving Centers for Transfers
export const RECEIVING_CENTERS: string[] = [
    'Hospital Salvador',
    'Instituto Nacional del Tórax',
    'Hospital Tisné',
    'Hospital Dr. Luis Calvo Mackenna',
    'Extrasistema',
    'Otro'
];
export type ReceivingCenter = 'Hospital Salvador' | 'Instituto Nacional del Tórax' | 'Hospital Tisné' | 'Hospital Dr. Luis Calvo Mackenna' | 'Extrasistema' | 'Otro';
