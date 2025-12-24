import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PatientRow } from '@/components/census/PatientRow';
import { PatientData, Specialty, PatientStatus, BedType } from '@/types';
import { render } from '../integration/setup';

describe('PatientRow Component', () => {
    const mockContext = {
        updatePatient: vi.fn(),
        updatePatientMultiple: vi.fn(),
        updateClinicalCrib: vi.fn(),
        updateClinicalCribMultiple: vi.fn()
    };

    const mockPatient: PatientData = {
        bedId: 'R1',
        patientName: 'Juan Pérez',
        rut: '12.345.678-9',
        age: '45',
        pathology: 'Neumonía',
        specialty: Specialty.MEDICINA,
        status: PatientStatus.ESTABLE,
        admissionDate: '2023-01-01',
        hasWristband: true,
        devices: ['VVP#1'],
        surgicalComplication: false,
        isUPC: false,
        isBlocked: false,
        bedMode: 'Cama',
        hasCompanionCrib: false
    };

    const mockBedDef = {
        id: 'R1',
        name: 'R1', // User confirmed name is R1
        type: BedType.UTI,
        isCuna: false
    };

    const mockOnAction = vi.fn();

    it('renders patient name and bed name correctly', () => {
        render(
            <table>
                <tbody>
                    <PatientRow
                        data={mockPatient}
                        bed={mockBedDef}
                        currentDateString="2023-01-01"
                        onAction={mockOnAction}
                        showCribControls={false}
                    />
                </tbody>
            </table>
        );

        // Name is in an input value
        expect(screen.getByDisplayValue(/Juan Pérez/)).toBeInTheDocument();
        // Bed name is rendered in a div
        expect(screen.getByText('R1')).toBeInTheDocument();
    });

    it('toggles UPC status when clicked', () => {
        render(
            <table>
                <tbody>
                    <PatientRow
                        data={mockPatient}
                        bed={mockBedDef}
                        currentDateString="2023-01-01"
                        onAction={mockOnAction}
                        showCribControls={false}
                    />
                </tbody>
            </table>,
            { contextValue: mockContext as any }
        );

        // UPC is a checkbox with title="UPC"
        const upcCheckbox = screen.getByTitle('UPC');
        fireEvent.click(upcCheckbox);

        expect(mockContext.updatePatient).toHaveBeenCalledWith('R1', 'isUPC', true);
    });

    it('calls updatePatient when status changes', () => {
        render(
            <table>
                <tbody>
                    <PatientRow
                        data={mockPatient}
                        bed={mockBedDef}
                        currentDateString="2023-01-01"
                        onAction={mockOnAction}
                        showCribControls={false}
                    />
                </tbody>
            </table>,
            { contextValue: mockContext as any }
        );

        const statusSelect = screen.getByDisplayValue(/Estable/);
        fireEvent.change(statusSelect, { target: { value: PatientStatus.GRAVE } });

        expect(mockContext.updatePatient).toHaveBeenCalledWith('R1', 'status', PatientStatus.GRAVE);
    });
});
