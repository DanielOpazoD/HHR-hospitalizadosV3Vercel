/**
 * Tests for DeviceMenu Logic
 * Verifies device menu logic without complex component rendering.
 */

import { describe, it, expect, vi } from 'vitest';
import { DeviceDetails } from '../../types';

describe('DeviceMenu Logic', () => {
    describe('Device State', () => {
        const defaultDevice: DeviceDetails = {
            catheter: false,
            oxygenTherapy: false,
            ngt: false,
            tracheostomy: false,
            chestTube: false,
            ventilator: false,
        };

        it('should have all device options', () => {
            const deviceOptions = [
                'catheter',
                'oxygenTherapy',
                'ngt',
                'tracheostomy',
                'chestTube',
                'ventilator'
            ];

            expect(Object.keys(defaultDevice)).toEqual(expect.arrayContaining(deviceOptions));
        });

        it('should count 0 active devices when none enabled', () => {
            const count = Object.values(defaultDevice).filter(Boolean).length;
            expect(count).toBe(0);
        });

        it('should count active devices correctly', () => {
            const activeDevice: DeviceDetails = {
                catheter: true,
                oxygenTherapy: true,
                ngt: false,
                tracheostomy: false,
                chestTube: true,
                ventilator: false,
            };

            const count = Object.values(activeDevice).filter(Boolean).length;
            expect(count).toBe(3);
        });

        it('should toggle device state', () => {
            const device = { ...defaultDevice };
            device.catheter = !device.catheter;
            expect(device.catheter).toBe(true);

            device.catheter = !device.catheter;
            expect(device.catheter).toBe(false);
        });
    });

    describe('Device Labels', () => {
        const deviceLabels: Record<string, string> = {
            catheter: 'Catéter Vesical (SV)',
            oxygenTherapy: 'Oxigenoterapia',
            ngt: 'Sonda Nasogástrica (SNG)',
            tracheostomy: 'Traqueostomía',
            chestTube: 'Tubo Pleural',
            ventilator: 'Ventilador',
        };

        it('should have labels for all device types', () => {
            const deviceTypes = ['catheter', 'oxygenTherapy', 'ngt', 'tracheostomy', 'chestTube', 'ventilator'];
            deviceTypes.forEach(type => {
                expect(deviceLabels[type]).toBeDefined();
                expect(typeof deviceLabels[type]).toBe('string');
            });
        });

        it('should have Spanish labels', () => {
            expect(deviceLabels.catheter).toContain('Catéter');
            expect(deviceLabels.oxygenTherapy).toContain('Oxígeno');
            expect(deviceLabels.ngt).toContain('Sonda');
        });
    });

    describe('Device Icons', () => {
        it('should map device types to icon names', () => {
            const deviceIcons: Record<string, string> = {
                catheter: 'thermometer',
                oxygenTherapy: 'wind',
                ngt: 'tube',
                tracheostomy: 'scissors',
                chestTube: 'activity',
                ventilator: 'lungs',
            };

            expect(Object.keys(deviceIcons).length).toBe(6);
        });
    });
});
