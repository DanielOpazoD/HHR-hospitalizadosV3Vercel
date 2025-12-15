import React, { useEffect, useRef, useState } from 'react';
import { LayoutList, BarChart2, FileJson, Upload, Settings, ClipboardList, MessageSquare, LogOut, FileSpreadsheet, ChevronDown, ShieldCheck, WifiOff, RefreshCw, Stethoscope } from 'lucide-react';
import clsx from 'clsx';
import { useDailyRecordContext } from '../context/DailyRecordContext';
import { useDemoMode } from '../context/DemoModeContext';
import { useRole } from '../context/RoleContext';
import { getRoleDisplayName, getVisibleModules, isAdmin } from '../utils/permissions';

export type ModuleType = 'CENSUS' | 'CUDYR' | 'NURSING_HANDOFF' | 'MEDICAL_HANDOFF' | 'REPORTS' | 'AUDIT' | 'WHATSAPP';
type ViewMode = 'REGISTER' | 'ANALYTICS';

interface NavbarProps {
  currentModule: ModuleType;
  setModule: (mod: ModuleType) => void;

  // Census specific controls
  censusViewMode: ViewMode;
  setCensusViewMode: (mode: ViewMode) => void;

  onPrint: () => void;
  onOpenBedManager: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSettings: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
  isFirebaseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModule,
  setModule,
  censusViewMode,
  setCensusViewMode,
  onPrint,
  onOpenBedManager,
  onExportJSON,
  onExportCSV,
  onImportJSON,
  onOpenSettings,
  userEmail,
  onLogout,
  isFirebaseConnected
}) => {
  const { record } = useDailyRecordContext();
  const { role } = useRole();
  const visibleModules = getVisibleModules(role);
  const isUserAdmin = isAdmin(role);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setIsMenuOpen(false);
  };

  const handleModuleChange = (mod: ModuleType) => {
    setModule(mod);
    if (mod === 'CENSUS') {
      setCensusViewMode('REGISTER');
    }
  };

  const NavTab = ({ module, label, icon: Icon }: { module: ModuleType, label: string, icon: any }) => (
    <button
      onClick={() => handleModuleChange(module)}
      className={clsx(
        "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium text-sm",
        currentModule === module
          ? "border-white text-white"
          : "border-transparent text-medical-200 hover:text-white hover:border-medical-400"
      )}
    >
      <Icon size={16} /> {label}
    </button>
  );

  // Menu item component
  const MenuItem = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button
      onClick={() => {
        onClick();
        setIsMenuOpen(false);
      }}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors text-left"
    >
      <Icon size={16} className="text-slate-500" />
      {label}
    </button>
  );

  // Module Color Map
  const getNavColor = () => {
    switch (currentModule) {
      case 'CENSUS': return 'bg-medical-900'; // Default Blue
      case 'CUDYR': return 'bg-teal-700';
      case 'NURSING_HANDOFF': return 'bg-indigo-700';
      case 'MEDICAL_HANDOFF': return 'bg-purple-700';
      case 'REPORTS': return 'bg-slate-700';
      case 'AUDIT': return 'bg-slate-800';
      case 'WHATSAPP': return 'bg-green-700';
      default: return 'bg-medical-900';
    }
  };

  return (
    <nav className={clsx(getNavColor(), "text-white shadow-md sticky top-0 z-50 print:hidden transition-colors duration-300")}>
      <div className="max-w-screen-2xl mx-auto px-4 flex flex-wrap gap-4 justify-between items-center">

        {/* Brand with Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 py-2 hover:opacity-90 transition-opacity"
          >
            <div className="bg-white/10 p-2 rounded-lg">
              <LayoutList size={24} className="text-medical-100" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold leading-tight">Hospital Hanga Roa</h1>
              <p className="text-xs text-medical-200">Gestión de Camas</p>
            </div>
            <ChevronDown size={16} className={clsx("text-medical-300 transition-transform ml-1", isMenuOpen && "rotate-180")} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />

              {/* Menu */}
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="py-1">
                  <MenuItem
                    icon={BarChart2}
                    label="Estadística"
                    onClick={() => {
                      if (currentModule !== 'CENSUS') {
                        setModule('CENSUS');
                        setCensusViewMode('ANALYTICS');
                      } else {
                        setCensusViewMode(censusViewMode === 'ANALYTICS' ? 'REGISTER' : 'ANALYTICS');
                      }
                    }}
                  />

                  {/* Shared/Available Reports */}
                  {visibleModules.includes('REPORTS') && (
                    <MenuItem
                      icon={FileSpreadsheet}
                      label="Reportes"
                      onClick={() => setModule('REPORTS')}
                    />
                  )}

                  {/* Admin Only Actions */}
                  {isUserAdmin && (
                    <>
                      <div className="h-px bg-slate-200 my-1" />
                      <MenuItem
                        icon={FileJson}
                        label="Exportar Respaldo (JSON)"
                        onClick={onExportJSON}
                      />
                      <MenuItem
                        icon={Upload}
                        label="Importar Respaldo"
                        onClick={handleImportClick}
                      />
                      <div className="h-px bg-slate-200 my-1" />
                      <MenuItem
                        icon={Settings}
                        label="Configuración"
                        onClick={onOpenSettings}
                      />
                      <div className="h-px bg-slate-200 my-1" />
                      <MenuItem
                        icon={ShieldCheck}
                        label="Auditoría"
                        onClick={() => handleModuleChange('AUDIT')}
                      />
                      <MenuItem
                        icon={MessageSquare}
                        label="WhatsApp"
                        onClick={() => handleModuleChange('WHATSAPP')}
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          <input type="file" ref={fileInputRef} className="hidden" accept=".json,.csv" onChange={onImportJSON} />
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex gap-1 overflow-x-auto self-end">
          {visibleModules.includes('CENSUS') && <NavTab module="CENSUS" label="Censo Diario" icon={LayoutList} />}
          {visibleModules.includes('CUDYR') && <NavTab module="CUDYR" label="CUDYR" icon={ClipboardList} />}
          {visibleModules.includes('NURSING_HANDOFF') && <NavTab module="NURSING_HANDOFF" label="Entrega Turno Enfermería" icon={MessageSquare} />}
          {visibleModules.includes('MEDICAL_HANDOFF') && <NavTab module="MEDICAL_HANDOFF" label="Entrega Turno Médica" icon={Stethoscope} />}
        </div>

        {/* User & Logout - Simplified */}
        <div className="flex items-center gap-4 py-2">

          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Demo Mode Badge */}
            {(() => {
              // Safe way to use hook inside component
              const { isActive } = useDemoMode();
              if (!isActive) return null;
              return (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-200 text-xs font-bold uppercase tracking-wider animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  MODO DEMO
                </div>
              );
            })()}

            {/* Offline Indicator */}
            {!isFirebaseConnected && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-red-200 text-xs font-bold uppercase tracking-wider">
                <WifiOff size={12} />
                OFFLINE
              </div>
            )}
          </div>

          {userEmail && onLogout && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm uppercase shadow-md focus:outline-none focus:ring-2 focus:ring-white/70"
                title={userEmail}
              >
                {userEmail.charAt(0)}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Usuario</p>
                    <p className="mt-1 font-semibold break-words text-slate-800">{userEmail}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Rol: <span className="font-semibold text-slate-800">{getRoleDisplayName(role)}</span>
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
