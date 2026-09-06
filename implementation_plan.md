# Plan de Integración: Sabí Auto Import Directo desde China (Alibaba B2B)

Este plan detalla la arquitectura y las modificaciones en el código de **Sabí** para permitir a los residentes de Aruba cotizar, asesorar e importar vehículos eléctricos (EV) e híbridos directamente desde fábricas/exportadores de China en Alibaba.

---

## 💡 Oportunidad y Contexto Estratégico en Aruba

1. **Beneficio Fiscal en Aruba (DVWA / Douane)**:
   - Los vehículos 100% Eléctricos (EV) pagan solo el **12% de derecho de aduana** en Aruba (comparado con el **39%** de vehículos a gasolina/diésel).
   - Impuesto de Frontera BBO: **7%**.
2. **Precios Disruptivos de Alibaba China**:
   - Modelos EV 2025 de 400km - 500km de autonomía cotizados entre **$9,000 y $16,000 USD FOB**.
   - El costo final desembarcado en Aruba (*Landed Cost*) se ubica entre **Afl. 27,000 y Afl. 38,000 AWG**, representando un ahorro del **40% a 50%** respecto a concesionarios locales.
3. **Modelo de Negocio Sabí**:
   - **Comisión transparente del 3% - 4% CIF** por asesoría y gestión de importación.
   - **Kit Obligatorio de Carga GB/T a CCS1/Type2** (Aruba utiliza el estándar americano/europeo de electrolineras como Elmar).
   - **Inspección de origen CCIC / SGS China** antes del embarque.

---

## 🛍️ Cambios Propuestos

### 1. Interfaz de Usuario (`index.html`)

#### [MODIFY] [index.html](file:///c:/Users/Amaury/Downloads/Sabi/index.html)
- **Selector de Origen en la Calculadora de Vehículos**:
  - Botones de selección de país: **🇺🇸 Subastas EE.UU. (Copart/IAAI)** vs **🇨🇳 Compra Directa China (Alibaba Direct B2B)**.
- **Campos del Formulario Dinámicos según Origen**:
  - *Cuando origen = China*:
    - Campo: **Precio FOB Alibaba ($USD)**.
    - Campo: **Flete Marítimo China → Barcadera, Aruba ($USD)** (Contenedor 20ft/40ft o Ro-Ro, por defecto ~$2,800 USD).
    - Opción: **Incluir Inspección Pre-embarque CCIC China** (Default: $250 USD).
    - Opción: **Incluir Adaptador Carga GB/T → CCS1/Type2** (Default: $350 USD).
- **Catálogo Destacado de EVs Chinos**:
  - En la pestaña de **Compra China**, agregar la sección **⚡ Destacados: Autos Eléctricos Chinos (Alibaba Direct)** con modelos pre-calculados (BYD Seagull, BYD Dolphin, Leapmotor T03/C10, Geely Galaxy E5).

---

### 2. Lógica de Negocio y Cálculo (`app_v3.js`)

#### [MODIFY] [app_v3.js](file:///c:/Users/Amaury/Downloads/Sabi/app_v3.js)
- **Actualizar `calculateVehicleImport()`**:
  - Aceptar el parámetro de origen (`usa` o `china`).
  - Si es China, calcular el CIF agregando FOB + Inspección CCIC + Flete Marítimo China-Barcadera + Seguro.
  - Aplicar la tasa arancelaria de EV (12%) o Híbrido (19%) sobre el CIF en AWG.
  - Sumar BBO (7%) y la comisión de Sabí (4%).
  - Sumar el Kit Adaptador de Carga GB/T.
- **Añadir Función de Selección Directa desde Catálogo China EV**:
  - Al hacer clic en "Cotizar Importación" en una tarjeta de vehículo de Alibaba, auto-completar el formulario de la calculadora con el precio FOB del auto.

---

## 🧪 Plan de Verificación

### Pruebas Automatizadas y de Consola
- Verificar la correcta ejecución de `calculateVehicleImport()` en la consola del navegador para un vehículo EV de $12,000 USD FOB desde China.
- Confirmar los desgloses:
  - CIF = $12,000 (FOB) + $250 (CCIC) + $2,800 (Ocean) = $15,050 USD (Afl. 27,090 AWG).
  - Aduana 12% EV = Afl. 3,250.80 AWG.
  - BBO 7% = Afl. 2,123.86 AWG.
  - Comisión Sabí 4% = Afl. 1,083.60 AWG.
  - Adaptador Carga GB/T = $350 USD (Afl. 630 AWG).
  - **Landed Total** en Aruba = **~Afl. 34,178 AWG** ($18,988 USD).

### Pruebas Manuales de UI/UX
- Seleccionar origen "China" en la pestaña Auto Import.
- Verificar que los campos cambien correctamente sin errores de JS.
- Probar el comportamiento responsive en móviles y escritorio.
