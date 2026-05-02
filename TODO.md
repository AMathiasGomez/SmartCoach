# Plan de Mejoras: Pantalla Detalle-Partido

## Análisis Actual
### Problemas identificados:
1. **Layout fijo** - Uso de anchos fijos (40%/60%) que no responden bien en móviles
2. **Cards desproporcionados** - Algunos elementos tienen tamaños inconsistentes
3. **Espaciado inconsistente** - Margins y paddings no siguen una escala uniforme
4. **Tabla no responsive** - La tabla de estadísticas excede el contenedor en pantallas pequeñas
5. **Sidebar no colapsable** - Ocupa espacio fijo en todas las pantallas
6. **Typografía inconsistente** - Mezcla de tamaños sin escala definida
7. **Cancha formación** - Grid fijo que no se adapta bien

## Plan de Mejoras CSS

### 1. Layout Responsive (Mobile-First)
- Usar CSS Grid y Flexbox con medidas relativas (fr, %, rem)
- Media queries para tablet (768px) y desktop (1024px)
- Sidebar colapsable en móvil con botón hamburger

### 2. Contenedores y Cards
- Max-width consistente (1200px)
- Border-radius uniforme (16px)
- Sombras consistentes usando CSS custom properties
- Gap uniforme de 1rem o 1.5rem

### 3. Tipografía
- Escala tipográfica usando rem
- Jerarquía clara: h1 (2rem), h2 (1.5rem), h3 (1.25rem)
- Peso consistente: 600-700 para headings

### 4. Tabla de Estadísticas
- Overflow-x con scroll en móvil
- Sticky header para scroll vertical
- Celdas con padding consistente

### 5. Marcador (CardPuntos)
- Layout más compacto y centrado
- Botones táctiles más grandes (mínimo 48px)
- Animaciones suaves

### 6. Formación Cancha
- Grid responsivo usando minmax()
- Círculos proporcionales al contenedor

### 7. Detalles Profesionales
- Transiciones y animaciones sutiles
- Estados hover/active consistentes
- Loading states para botones
- Micro-interacciones

## Archivos a modificar:
- `frontend/smartcoach-app/src/app/entrenador/partidos/detalle-partido/detalle-partido.css`
- `frontend/smartcoach-app/src/app/entrenador/partidos/detalle-partido/detalle-partido.html` (si es necesario)
