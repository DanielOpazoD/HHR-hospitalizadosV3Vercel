# Guía de Contribución

¡Gracias por tu interés en contribuir al Sistema de Gestión del Hospital Hanga Roa!

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Configuración del Entorno](#configuración-del-entorno)
- [Workflow de Desarrollo](#workflow-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Testing](#testing)
- [Convenciones de Commits](#convenciones-de-commits)
- [Pull Requests](#pull-requests)

---

## Código de Conducta

- Respeta a todos los colaboradores
- Mantén un ambiente profesional
- Protege la privacidad de los datos de pacientes
- No compartas credenciales ni datos sensibles

---

## Configuración del Entorno

### Requisitos

- Node.js 20.x+
- npm 9.x+
- Git
- VS Code (recomendado)

### Setup Inicial

```bash
# 1. Fork y clonar
git clone https://github.com/TU_USUARIO/hospital-hanga-roa.git
cd hospital-hanga-roa

# 2. Instalar dependencias
npm install

# 3. Crear rama de desarrollo
git checkout -b feature/tu-funcionalidad

# 4. Configurar entorno
cp .env.example .env
# Editar .env con tus credenciales

# 5. Iniciar desarrollo
npm run dev
```

### Extensiones de VS Code Recomendadas

- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense
- GitLens

---

## Workflow de Desarrollo

### 1. Crear una Rama Nueva

```bash
# Para nueva funcionalidad
git checkout -b feature/nombre-funcionalidad

# Para bug fix
git checkout -b fix/descripcion-bug

# Para documentación
git checkout -b docs/descripcion
```

### 2. Desarrollar

```bash
# Hacer cambios
# Testear localmente
npm test

# Verificar tipos
npx tsc --noEmit

# Probar build
npm run build
```

### 3. Commit y Push

```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/nombre-funcionalidad
```

### 4. Abrir Pull Request

- Ve a GitHub
- Abre Pull Request hacia `main`
- Describe tus cambios
- Espera review

---

## Estándares de Código

### TypeScript

```typescript
// ✅ BUENO: Tipos explícitos
function calculateOccupancy(beds: PatientData[]): number {
  return beds.filter(b => b.patientName).length;
}

//❌ MALO: Sin tipos
function calculateOccupancy(beds) {
  return beds.filter(b => b.patientName).length;
}
```

### React

```typescript
// ✅ BUENO: Functional components con tipos
interface Props {
  patientName: string;
  onSave: () => void;
}

export const PatientCard: React.FC<Props> = ({ patientName, onSave }) => {
  return <div>{patientName}</div>;
};

// ❌ MALO: Sin tipos
export const PatientCard = ({ patientName, onSave }) => {
  return <div>{patientName}</div>;
};
```

### Hooks

```typescript
// ✅ BUENO: useCallback para funciones
const handleSave = useCallback(() => {
  savePatient(data);
}, [data]);

// ❌ MALO: Recrear función en cada render
const handleSave = () => {
  savePatient(data);
};
```

### Naming Conventions

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| **Componentes** | PascalCase | `PatientRow.tsx` |
| **Hooks** | camelCase con `use` | `useDailyRecord.ts` |
| **Funciones** | camelCase | `calculateStats()` |
| **Constantes** | UPPER_SNAKE_CASE | `MAX_BEDS` |
| **Interfaces** | PascalCase | `PatientData` |
| **Types** | PascalCase | `ModuleType` |

### Estructura de Archivos

```typescript
// 1. Imports (ordenados)
import React from 'react';
import { useState } from 'react';
import { PatientData } from '../types';
import { calculateStats } from '../services';

// 2. Types/Interfaces
interface Props {
  //...
}

// 3. Componente
export const MyComponent: React.FC<Props> = (props) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Handlers
  const handleClick = () => {};
  
  // 6. Render
  return <div />;
};
```

---

## Testing

### Escribir Tests

```typescript
// tests/myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../services/myFunction';

describe('myFunction', () => {
  it('should return correct value', () => {
    expect(myFunction(input)).toBe(expected);
  });
  
  it('should handle edge case', () => {
    expect(myFunction(edgeCase)).toBe(expectedEdge);
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Un archivo específico
npm test -- tests/myFunction.test.ts

# Con coverage
npm test -- --coverage

# En modo watch
npm test -- --watch
```

### Cobertura Mínima

- **Nuevas funciones críticas**: 80%+
- **Helpers/utils**: 70%+
- **Componentes UI**: 50%+

---

## Convenciones de Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(scope): descripción

[cuerpo opcional]

[footer opcional]
```

### Tipos Permitidos

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat: add patient transfer module` |
| `fix` | Bug fix | `fix: correct bed count calculation` |
| `docs` | Documentación | `docs: update README with setup steps` |
| `style` | Formato (no afecta lógica) | `style: format patient row component` |
| `refactor` | Refactorización | `refactor: extract validation to separate file` |
| `test` | Tests | `test: add unit tests for permissions` |
| `chore` | Tareas de mantenimiento | `chore: update dependencies` |

### Ejemplos

```bash
# Bueno
git commit -m "feat: add discharge summary export"
git commit -m "fix: resolve infinite loop in sync"
git commit -m "docs: add JSDoc to calculateStats"

# Malo
git commit -m "changes"
git commit -m "fixed stuff"
git commit -m "wip"
```

---

## Pull Requests

### Checklist Pre-PR

- [ ] Código compila sin errores (`npx tsc --noEmit`)
- [ ] Tests pasan (`npm test`)
- [ ] Build exitoso (`npm run build`)
- [ ] No hay console.logs innecesarios
- [ ] Documentación actualizada (si aplica)
- [ ] Commits descriptivos

### Descripción de PR

```markdown
## Descripción
Breve descripción del cambio.

## Tipo de cambio
- [ ] Nueva funcionalidad
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentación

## Testing
- Describe cómo se probó
- Tests agregados/modificados

## Screenshots (si aplica)
![descripción](url)

## Checklist
- [ ] Tests pasan
- [ ] Código revisado
- [ ] Documentación actualizada
```

### Proceso de Review

1. **Automático**: GitHub Actions ejecuta tests
2. **Manual**: Reviewer revisa código
3. **Cambios**: Si se solicitan, hacer commits adicionales
4. **Aprobación**: Reviewer aprueba
5. **Merge**: Admin hace merge a main
6. **Deploy**: Automático a Vercel

---

## Arquitectura y Patrones

### Separación de Responsabilidades

```
View (UI) → Hook (Logic) → Service (Data) → Firebase
```

- **Views**: Solo renderizado, sin lógica de negocio
- **Hooks**: Orquestación, estado, lógica
- **Services**: Acceso a datos, cálculos

### Custom Hooks

```typescript
// hooks/useMyFeature.ts
export const useMyFeature = () => {
  const [state, setState] = useState();
  
  const doSomething = useCallback(() => {
    // lógica
  }, []);
  
  return { state, doSomething };
};
```

### Context para Estado Global

```typescript
// Solo para estado que necesita compartirse globalmente
const MyContext = createContext<ContextType | null>(null);

export const MyProvider: React.FC = ({ children }) => {
  const value = { /* ... */ };
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};
```

---

## Troubleshooting

### Error: "Cannot find module"

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: TypeScript

```bash
# Verificar tipos
npx tsc --noEmit

# Ver errores específicos
npx tsc --noEmit | grep "error TS"
```

### Tests Fallan

```bash
# Limpiar caché
npm test -- --clearCache

# Correr un test específico en modo watch
npm test -- tests/failing.test.ts --watch
```

---

## Recursos

- [Documentación React](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Docs](https://vitest.dev)
- [Firebase Docs](https://firebase.google.com/docs)

---

## Contacto

**Mantenedor**: Dr. Daniel Opazo  
**Email**: daniel.opazo@hospitalhangaroa.cl

Para preguntas sobre contribuciones, abre un Issue en GitHub.
