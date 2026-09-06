// Sabí Super-App - Aruba Directory & Utilities Static Database
// Contiene todos los datos de servicios, directorios, aduanas, escuelas y deportes para funcionamiento 100% offline.

const SABI_DATA = {
  // Emergencias (Click-to-Call + Coordenadas de GPS para Google Maps)
  emergencies: [
    { id: "police-central", name: "Cuerpo Policial (Polis Central)", subtitle: "Línea Central de Emergencia", phone: "111", maps: "https://maps.google.com/?q=12.5186,-70.0358", icon: "🚨" },
    { id: "police-noord", name: "Precinto Noord / Shaba", subtitle: "Estación de Policía Noord", phone: "587-0009", maps: "https://maps.google.com/?q=12.5694,-70.0315", icon: "👮" },
    { id: "police-oranjestad", name: "Precinto Oranjestad", subtitle: "Estación de Policía Central", phone: "582-4000", maps: "https://maps.google.com/?q=12.5222,-70.0352", icon: "👮" },
    { id: "police-sannicolas", name: "Precinto San Nicolas", subtitle: "Estación de Policía San Nicolas", phone: "584-5000", maps: "https://maps.google.com/?q=12.4333,-69.9083", icon: "👮" },
    { id: "police-santacruz", name: "Precinto Santa Cruz", subtitle: "Estación de Policía Santa Cruz", phone: "585-4710", maps: "https://maps.google.com/?q=12.4994,-69.9675", icon: "👮" },
    { id: "fire-central", name: "Brandweer Aruba (Bomberos Central)", subtitle: "Línea Central de Emergencia", phone: "911", maps: "https://maps.google.com/?q=12.5539,-70.0158", icon: "🚒" },
    { id: "fire-tankiflip", name: "Bomberos Tanki Flip", subtitle: "Estación de Bomberos Noord", phone: "582-1108", maps: "https://maps.google.com/?q=12.5539,-70.0158", icon: "👨‍🚒" },
    { id: "fire-sannicolas", name: "Bomberos San Nicolas", subtitle: "Estación de Bomberos San Nicolas", phone: "584-5555", maps: "https://maps.google.com/?q=12.4397,-69.9125", icon: "👨‍🚒" },
    { id: "hospital", name: "Horacio Oduber Hospital", subtitle: "Urgencias / Despacho Central", phone: "527-4000", maps: "https://maps.google.com/?q=12.5369,-70.0547", icon: "🏥" },
    { id: "medical-imasan", name: "Centro Medico Imasan (San Nicolas)", subtitle: "Atención Médica de Urgencia", phone: "524-8833", maps: "https://maps.google.com/?q=12.4347,-69.9102", icon: "🩺" }
  ],

  // Directorio Gubernamental y Salud
  government: [
    {
      id: "azv",
      name: "AZV (Algemene Ziektekosten Verzekering)",
      subtitle: "Seguro Médico General de Aruba",
      desc: "Validación de póliza, consultas de cobertura de medicamentos y trámites de pacientes en el exterior.",
      phone: "527-7600",
      link: "https://www.azv.aw",
      maps: "https://maps.google.com/?q=12.5158,-70.0244",
      icon: "🛡️"
    },
    {
      id: "svb-ao",
      name: "SVB - Reportar Día de Enfermedad (AO)",
      subtitle: "Procesamiento Automático de AO",
      desc: "Llamada directa para reportar incapacidad laboral y enlaces para validación del estado del trámite en línea.",
      phone: "527-2700",
      link: "https://www.svbaruba.org",
      maps: "https://maps.google.com/?q=12.5202,-70.0278",
      icon: "🤒"
    },
    {
      id: "svb-pensions",
      name: "SVB - Pensiones (AOV / AWW)",
      subtitle: "Seguro de Vejez y Viudez",
      desc: "Consulta y subsidios familiares de jubilación de vejez (AOV) y pensiones para viudas y huérfanos (AWW).",
      phone: "527-2727",
      link: "https://www.svbaruba.org/pensiones",
      maps: "https://maps.google.com/?q=12.5202,-70.0278",
      icon: "👵"
    },
    {
      id: "siad",
      name: "SIAD (Departamento de Impuestos)",
      subtitle: "Impuestos de Aruba (Departamento de Belasting)",
      desc: "Declaración de ingresos, BBO/BAVP/BAZV fiscal, registro de vehículos y pago de tasas fiscales locales.",
      phone: "524-9000",
      link: "https://www.impuesto.aw",
      maps: "https://maps.google.com/?q=12.5181,-70.0211",
      icon: "💵"
    },
    {
      id: "censo",
      name: "Censo (Registro Civil)",
      subtitle: "Oficina de Registro de Población",
      desc: "Trámite de actas de nacimiento, pasaporte holandés, registro de domicilio y certificaciones de soltería.",
      phone: "522-5300",
      link: "https://www.censo.aw",
      maps: "https://maps.google.com/?q=12.5165,-70.0275",
      icon: "📇"
    },
    {
      id: "dimas",
      name: "DIMAS (Inmigración)",
      subtitle: "Permisos de Residencia y Trabajo",
      desc: "Trámites de visados, permisos de trabajo para expatriados, extensiones de estadía turística e integración.",
      phone: "522-1500",
      link: "https://www.dimasaruba.aw",
      maps: "https://maps.google.com/?q=12.5236,-70.0401",
      icon: "✈️"
    },
    {
      id: "dao",
      name: "DAO (Departamento de Trabajo)",
      subtitle: "Asuntos Laborales y Contratos",
      desc: "Mediación en disputas laborales, consultas de derechos del trabajador, despidos y regulaciones de contratos.",
      phone: "523-7720",
      link: "https://www.daoaruba.com",
      maps: "https://maps.google.com/?q=12.5255,-70.0298",
      icon: "💼"
    },
    {
      id: "web",
      name: "WEB Aruba N.V.",
      subtitle: "Servicio de Agua Potable y Energía",
      desc: "Atención al cliente para contratos de agua, reportes de fugas principales en la red y pago de facturas.",
      phone: "525-4600",
      link: "https://www.webaruba.com",
      maps: "https://maps.google.com/?q=12.5085,-69.9982",
      icon: "💧"
    },
    {
      id: "elmar",
      name: "N.V. Elmar",
      subtitle: "Compañía de Electricidad de Aruba",
      desc: "Reporte de apagones, solicitud de nuevos medidores eléctricos, alumbrado público y consultas de facturación.",
      phone: "523-7100",
      link: "https://www.elmar.aw",
      maps: "https://maps.google.com/?q=12.5194,-70.0094",
      icon: "⚡"
    },
    {
      id: "dip",
      name: "DIP (Directie Infrastructuur en Planning)",
      subtitle: "Planificación de Infraestructura y Terrenos",
      desc: "Gestión de solicitudes de terrenos fiscales (erfpacht), permisos de construcción y planificación del uso del suelo en Aruba.",
      phone: "527-7100",
      link: "https://www.dip.aw",
      maps: "https://maps.google.com/?q=12.5065,-70.0125",
      icon: "🗺️"
    }
  ],

  // Matriz de Importación de la Aduana de Aruba (Douane Aruba)
  customsTariffs: [
    { category: "clothing", name: "Ropa y Calzado", duty: 0.06 },
    { category: "laptops", name: "Laptops, Computadoras y Tablets", duty: 0.12 },
    { category: "phones", name: "Smartphones y Accesorios", duty: 0.12 },
    { category: "electronics", name: "Televisores, Audio y Cámaras", duty: 0.12 },
    { category: "auto_parts", name: "Repuestos y Accesorios de Auto", duty: 0.22 },
    { category: "appliances", name: "Electrodomésticos (Nevera, Microondas, etc.)", duty: 0.22 },
    { category: "ev_vehicles", name: "Vehículos 100% Eléctricos (EV)", duty: 0.12 },
    { category: "hybrid_vehicles", name: "Vehículos Híbridos (HEV/PHEV)", duty: 0.19 },
    { category: "regular_vehicles", name: "Vehículos Convencionales (Gasolina/Diesel)", duty: 0.39 },
    { category: "perfumes", name: "Cosméticos, Perfumería y Belleza", duty: 0.22 },
    { category: "toys", name: "Juguetes y Consolas de Videojuegos", duty: 0.12 },
    { category: "general", name: "Mercancía General / Otros", duty: 0.12 }
  ],

  // Matriz de Precios de Couriers de Miami a Aruba
  couriers: [
    {
      id: "ezone",
      name: "E-Zone (Aerocargo)",
      type: "Local / Miami Address",
      baseFee: 4.50,         // Cargo fijo de manejo
      ratePerLb: 3.20,       // Tarifa por libra
      volumetric: false,     // E-Zone cobra por peso real estándar
      deliveryDays: "4-6 días hábiles",
      link: "https://www.ezone.aw"
    },
    {
      id: "aeropost",
      name: "Aeropost",
      type: "Local / Miami Address",
      baseFee: 5.00,
      ratePerLb: 3.50,
      volumetric: false,     // Cobra por peso real mayormente
      deliveryDays: "3-5 días hábiles",
      link: "https://www.aeropost.com"
    },
    {
      id: "dhl",
      name: "DHL Express",
      type: "Courier Express Courier",
      baseFee: 15.00,
      ratePerLb: 6.80,
      volumetric: true,      // DHL aplica fórmula volumétrica: L*W*H/139
      deliveryDays: "1-2 días hábiles (Urgente)",
      link: "https://www.dhl.com.aw"
    },
    {
      id: "fedex",
      name: "FedEx International",
      type: "Courier Express Courier",
      baseFee: 14.50,
      ratePerLb: 6.50,
      volumetric: true,      // L*W*H/139
      deliveryDays: "2-3 días hábiles",
      link: "https://www.fedex.com/aw"
    },
    {
      id: "ups",
      name: "UPS Worldwide",
      type: "Courier Express Courier",
      baseFee: 16.00,
      ratePerLb: 7.00,
      volumetric: true,      // L*W*H/139
      deliveryDays: "2-3 días hábiles",
      link: "https://www.ups.com/aw"
    }
  ],

  // Guía Educativa (Escuelas de Aruba)
  schools: [
    // ── CRECHE / CUIDADO INFANTIL (Privado) ──────────────────────────────────
    { id: "creche-imanoel", name: "Creche Imanoel", level: "creche", lang: "Papiamento", type: "Private", phone: "584-8833", maps: "https://maps.google.com/?q=Creche+Imanoel+Aruba", website: "", feeEnroll: 150, feeAirco: 0, uniformCost: 60, committee: 50, supplies: 120 },
    { id: "creche-shaba", name: "Centro de Cuidado Infantil Shaba", level: "creche", lang: "Papiamento / Dutch", type: "Private", phone: "587-1234", maps: "https://maps.google.com/?q=Shaba+Childcare+Aruba", website: "", feeEnroll: 200, feeAirco: 0, uniformCost: 60, committee: 40, supplies: 150 },

    // ── KLEUTER / PREPARATORIO — DPS ────────────────────────────────────────
    { id: "kleuter-arcoiris-dps", name: "Arco Iris Kleuterschool", level: "kleuter", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Arco+Iris+Kleuterschool+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 70, committee: 30, supplies: 160 },
    { id: "kleuter-conrado", name: "Colegio Conrado Coronel (Kleuter)", level: "kleuter", lang: "Papiamento / Dutch", type: "DPS", phone: "585-1560", maps: "https://maps.google.com/?q=Colegio+Conrado+Coronel+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 70, committee: 30, supplies: 160 },
    { id: "kleuter-pieterboer", name: "Commandeur Pieter Boer Kleuterschool", level: "kleuter", lang: "Dutch", type: "DPS", phone: "584-5412", maps: "https://maps.google.com/?q=Commandeur+Pieter+Boer+Kleuterschool+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 70, committee: 30, supplies: 160 },
    { id: "kleuter-washington", name: "Scol Preparatorio y Basico Washington", level: "kleuter", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Scol+Washington+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 70, committee: 30, supplies: 160 },
    { id: "kleuter-kudawecha", name: "Scol Primario Kudawecha (Kleuter)", level: "kleuter", lang: "Papiamento", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Scol+Kudawecha+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 70, committee: 30, supplies: 160 },
    { id: "kleuter-amalia", name: "Prinses Amalia Kleuter- en Basisschool", level: "kleuter", lang: "Dutch / Papiamento", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Prinses+Amalia+School+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 70, committee: 30, supplies: 160 },

    // ── KLEUTER / PREPARATORIO — SKOA ───────────────────────────────────────
    { id: "kleuter-agnes", name: "Agnes Kleuterschool", level: "kleuter", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Agnes+Kleuterschool+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-anglo", name: "Anglo Kleuterschool", level: "kleuter", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Anglo+Kleuterschool+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-ayo", name: "Ayo Kleuterschool", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Ayo+Kleuterschool+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-imelda", name: "Imelda Kleuterschool", level: "kleuter", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Imelda+Kleuterschool+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-jacinta", name: "Jacinta Kleuterschool", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Jacinta+Kleuterschool+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-rayodisolo", name: "Rayo di Solo Kleuterschool", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Rayo+di+Solo+Kleuterschool+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-aurora", name: "Scol Preparatorio Aurora", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Scol+Preparatorio+Aurora+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-cacique-aterima", name: "Scol Preparatorio Cacique Aterima", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Scol+Cacique+Aterima+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-cayena", name: "Scol Preparatorio Cayena", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Scol+Cayena+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-kukwisa", name: "Scol Preparatorio Kukwisa", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Scol+Kukwisa+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-nosparaiso", name: "Scol Preparatorio Nos Paraiso", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Scol+Nos+Paraiso+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-promepaso", name: "Scol Preparatorio Prome Paso", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Scol+Prome+Paso+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-tarcisius", name: "Scol Preparatorio Tarcisius", level: "kleuter", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Scol+Tarcisius+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-sintjan", name: "Sint Jan Kleuterschool", level: "kleuter", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Sint+Jan+Kleuterschool+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "kleuter-trupial", name: "Trupial Kleuterschool", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Trupial+Kleuterschool+Aruba", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },

    // ── KLEUTER / PREPARATORIO — SPCOA / SOAZA / SVEOA ─────────────────────
    { id: "kleuter-zinzendorf", name: "Graf von Zinzendorf Kleuterschool", level: "kleuter", lang: "Dutch / Papiamento", type: "SPCOA", phone: "582-0005", maps: "https://maps.google.com/?q=Graf+Zinzendorf+School+Aruba", website: "http://spcoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 55, supplies: 180 },
    { id: "kleuter-monplaisir", name: "Mon Plaisir Kleuterschool", level: "kleuter", lang: "Dutch", type: "SPCOA", phone: "582-2775", maps: "https://maps.google.com/?q=Mon+Plaisir+School+Aruba", website: "http://spcoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 60, supplies: 180 },
    { id: "kleuter-andrews", name: "J.N. Andrews Kleuterschool", level: "kleuter", lang: "Dutch / Papiamento", type: "SOAZA", phone: "585-8000", maps: "https://maps.google.com/?q=JN+Andrews+School+Aruba", website: "", feeEnroll: 220, feeAirco: 120, uniformCost: 75, committee: 45, supplies: 170 },
    { id: "kleuter-faithrevival", name: "Faith Revival Kleuterschool", level: "kleuter", lang: "Papiamento / Dutch", type: "SVEOA", phone: "585-2700", maps: "https://maps.google.com/?q=Faith+Revival+School+Aruba", website: "", feeEnroll: 220, feeAirco: 120, uniformCost: 75, committee: 45, supplies: 170 },

    // ── BASICO / PRIMARIA — DPS ──────────────────────────────────────────────
    { id: "basis-conrado", name: "Colegio Conrado Coronel", level: "basis", lang: "Papiamento / Dutch", type: "DPS", phone: "585-1560", maps: "https://maps.google.com/?q=Colegio+Conrado+Coronel+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 100, committee: 40, supplies: 200 },
    { id: "basis-hilario", name: "Colegio Hilario Angela", level: "basis", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Colegio+Hilario+Angela+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 100, committee: 40, supplies: 200 },
    { id: "basis-xander", name: "Scol Basico Xander Bogaerts", level: "basis", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Scol+Basico+Xander+Bogaerts+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 100, committee: 40, supplies: 200 },
    { id: "basis-reinabeatrix", name: "Scol Reina Beatrix", level: "basis", lang: "Dutch / Papiamento", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Scol+Reina+Beatrix+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 100, committee: 40, supplies: 200 },
    { id: "basis-washington", name: "Scol Preparatorio y Basico Washington", level: "basis", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Scol+Washington+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 100, committee: 40, supplies: 200 },
    { id: "basis-kudawecha", name: "Scol Primario Kudawecha", level: "basis", lang: "Papiamento", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Scol+Kudawecha+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 100, committee: 40, supplies: 200 },
    { id: "basis-amalia", name: "Prinses Amalia Basisschool", level: "basis", lang: "Dutch / Papiamento", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Prinses+Amalia+Basisschool+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 100, uniformCost: 100, committee: 40, supplies: 200 },

    // ── BASICO / PRIMARIA — SKOA ─────────────────────────────────────────────
    { id: "basis-cacique-macuarima", name: "Cacique Macuarima School", level: "basis", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Cacique+Macuarima+School+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-bonbini", name: "Colegio Bon Bini", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Bon+Bini+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-cristorey", name: "Colegio Cristo Rey", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Cristo+Rey+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-felipe-tromp", name: "Colegio Felipe B. Tromp", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "587-2635", maps: "https://maps.google.com/?q=Colegio+Felipe+Tromp+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-bonifacius", name: "Colegio Frère Bonifacius", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Frere+Bonifacius+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-laurawernet", name: "Colegio Laura Wernet-Paskel", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Laura+Wernet+Paskel+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-oraubao", name: "Colegio Ora Ubao", level: "basis", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Ora+Ubao+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-kranwinkel", name: "Colegio Pastoor Kranwinkel", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Pastoor+Kranwinkel+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-sagrado", name: "Colegio Sagrado Curason", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Sagrado+Curason+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-sanhose", name: "Colegio San Hose", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+San+Hose+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-santafamia", name: "Colegio Santa Famia", level: "basis", lang: "Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Santa+Famia+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-santafilomena", name: "Colegio Santa Filomena", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Santa+Filomena+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-santateresita", name: "Colegio Santa Teresita", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+Santa+Teresita+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-mariagoretti", name: "Maria Goretti School", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Maria+Goretti+School+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-maria", name: "Maria School", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Maria+School+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-olvfatima", name: "O.L.V. Fatima College", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=OLV+Fatima+College+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-piusx", name: "Pius X School", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Pius+X+School+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-rosario", name: "Rosario College", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Rosario+College+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-aloysius", name: "Sint Aloysius School", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Sint+Aloysius+School+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-sintanna", name: "Sint Annaschool", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "587-1725", maps: "https://maps.google.com/?q=Sint+Anna+School+Noord+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-sintmichael", name: "Sint Michaël School", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Sint+Michael+School+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-dominicus", name: "St. Dominicus College", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=St+Dominicus+College+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-franciscus", name: "St. Franciscus College", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=St+Franciscus+College+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-paulus", name: "Sint Paulus School", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Sint+Paulus+School+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basis-sintrosa", name: "Sint Rosa College", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Sint+Rosa+College+Aruba", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },

    // ── BASICO / PRIMARIA — SPCOA / SVEOA ───────────────────────────────────
    { id: "basis-zinzendorf", name: "Graf von Zinzendorf Basisschool", level: "basis", lang: "Dutch / Papiamento", type: "SPCOA", phone: "582-0005", maps: "https://maps.google.com/?q=Graf+Zinzendorf+School+Aruba", website: "http://spcoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 100, committee: 60, supplies: 210 },
    { id: "basis-monplaisir", name: "Mon Plaisir School", level: "basis", lang: "Dutch / Papiamento", type: "SPCOA", phone: "582-2775", maps: "https://maps.google.com/?q=Mon+Plaisir+School+Aruba", website: "http://spcoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 100, committee: 60, supplies: 210 },
    { id: "basis-faithrevival", name: "Faith Revival School", level: "basis", lang: "Papiamento / Dutch", type: "SVEOA", phone: "585-2700", maps: "https://maps.google.com/?q=Faith+Revival+School+Aruba", website: "", feeEnroll: 220, feeAirco: 120, uniformCost: 90, committee: 50, supplies: 190 },

    // ── SECUNDARIO — MAVO ────────────────────────────────────────────────────
    { id: "mavo-abdeveer", name: "Abraham de Veer School (MAVO)", level: "secundario", lang: "Dutch / Papiamento", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Abraham+de+Veer+School+Aruba", website: "https://www.dps.aw", feeEnroll: 300, feeAirco: 150, uniformCost: 120, committee: 80, supplies: 280 },
    { id: "mavo-juliana", name: "Juliana School (MAVO)", level: "secundario", lang: "Dutch / Papiamento", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Juliana+School+Aruba", website: "https://www.dps.aw", feeEnroll: 300, feeAirco: 150, uniformCost: 120, committee: 80, supplies: 280 },
    { id: "mavo-ceque", name: "Ceque College (MAVO)", level: "secundario", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Ceque+College+Aruba", website: "https://www.dps.aw", feeEnroll: 300, feeAirco: 150, uniformCost: 120, committee: 80, supplies: 280 },
    { id: "mavo-sanantonio", name: "Colegio San Antonio (MAVO)", level: "secundario", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+San+Antonio+Aruba", website: "https://www.skoa.aw", feeEnroll: 350, feeAirco: 150, uniformCost: 120, committee: 100, supplies: 300 },
    { id: "mavo-sanaugustin", name: "Colegio San Augustin (MAVO)", level: "secundario", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Colegio+San+Augustin+Aruba", website: "https://www.skoa.aw", feeEnroll: 350, feeAirco: 150, uniformCost: 120, committee: 100, supplies: 300 },
    { id: "mavo-filomena", name: "Filomena College (MAVO)", level: "secundario", lang: "Dutch / Papiamento", type: "SKOA", phone: "584-5330", maps: "https://maps.google.com/?q=Filomena+College+Aruba", website: "https://www.skoa.aw", feeEnroll: 350, feeAirco: 150, uniformCost: 120, committee: 100, supplies: 300 },
    { id: "mavo-lasalle", name: "La Salle College (MAVO)", level: "secundario", lang: "Dutch / Papiamento", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=La+Salle+College+Aruba", website: "https://www.skoa.aw", feeEnroll: 350, feeAirco: 150, uniformCost: 120, committee: 100, supplies: 300 },
    { id: "mavo-maria", name: "Maria College (MAVO)", level: "secundario", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Maria+College+Aruba", website: "https://www.skoa.aw", feeEnroll: 350, feeAirco: 150, uniformCost: 120, committee: 100, supplies: 300 },
    { id: "mavo-johnwesley", name: "John Wesley College (MAVO)", level: "secundario", lang: "Dutch / Papiamento", type: "SPCOA", phone: "582-0005", maps: "https://maps.google.com/?q=John+Wesley+College+Aruba", website: "http://spcoa.aw", feeEnroll: 320, feeAirco: 150, uniformCost: 120, committee: 90, supplies: 290 },
    { id: "mavo-monplaisir", name: "Mon Plaisir College (MAVO)", level: "secundario", lang: "Dutch / Papiamento", type: "SPCOA", phone: "582-2775", maps: "https://maps.google.com/?q=Mon+Plaisir+College+Aruba", website: "http://spcoa.aw", feeEnroll: 320, feeAirco: 150, uniformCost: 120, committee: 90, supplies: 290 },

    // ── SECUNDARIO — HAVO / VWO ──────────────────────────────────────────────
    { id: "havo-colegio-arubano", name: "Colegio Arubano (HAVO/VWO)", level: "secundario", lang: "Dutch", type: "Private", phone: "582-2005", maps: "https://maps.google.com/?q=Colegio+Arubano+Oranjestad+Aruba", website: "https://www.colegioarubano.aw", feeEnroll: 450, feeAirco: 150, uniformCost: 150, committee: 150, supplies: 450 },
    { id: "havo-nigel-matthew", name: "Colegio Nigel Matthew (HAVO/VWO - San Nicolas)", level: "secundario", lang: "Dutch / Papiamento", type: "DPS", phone: "584-1200", maps: "https://maps.google.com/?q=Colegio+Nigel+Matthew+San+Nicolas+Aruba", website: "https://www.dps.aw", feeEnroll: 350, feeAirco: 150, uniformCost: 130, committee: 100, supplies: 380 },
    { id: "havo-monplaisir-havo", name: "Mon Plaisir College (HAVO/VWO)", level: "secundario", lang: "Dutch / Papiamento", type: "SPCOA", phone: "582-2775", maps: "https://maps.google.com/?q=Mon+Plaisir+College+HAVO+Aruba", website: "http://spcoa.aw", feeEnroll: 380, feeAirco: 150, uniformCost: 130, committee: 110, supplies: 380 },

    // ── SECUNDARIO — EPB / EPI / SPO ─────────────────────────────────────────
    { id: "epb-hato", name: "EPB Hato (Educacion Profesional Basico)", level: "secundario", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=EPB+Hato+Aruba", website: "https://www.dps.aw", feeEnroll: 300, feeAirco: 150, uniformCost: 120, committee: 75, supplies: 350 },
    { id: "epb-sannicolas", name: "EPB San Nicolas (Educacion Profesional Basico)", level: "secundario", lang: "Papiamento / Dutch", type: "DPS", phone: "584-1211", maps: "https://maps.google.com/?q=EPB+San+Nicolas+Aruba", website: "https://www.dps.aw", feeEnroll: 300, feeAirco: 150, uniformCost: 120, committee: 75, supplies: 350 },
    { id: "epi-oranjestad", name: "EPI (Educacion Profesional Intermedio)", level: "secundario", lang: "Dutch / English / Papiamento", type: "DPS", phone: "525-8700", maps: "https://maps.google.com/?q=EPI+Aruba+Oranjestad", website: "https://www.epiaruba.com", feeEnroll: 400, feeAirco: 150, uniformCost: 0, committee: 100, supplies: 500 },

    // ── EDUCACION ESPECIAL ────────────────────────────────────────────────────
    { id: "special-emma", name: "Emmaschool (Educacion Special)", level: "basis", lang: "Dutch / Papiamento", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Emmaschool+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 0, uniformCost: 80, committee: 0, supplies: 150 },
    { id: "special-dornasol", name: "Scol Basico Dornasol (Educacion Special)", level: "basis", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Scol+Dornasol+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 0, uniformCost: 80, committee: 0, supplies: 150 },
    { id: "special-pasopafuturo", name: "Scol Paso pa Futuro (Educacion Special)", level: "basis", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=Scol+Paso+pa+Futuro+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 0, uniformCost: 80, committee: 0, supplies: 150 },
    { id: "special-spo", name: "Scol Practico pa Ofishi (SPO)", level: "secundario", lang: "Papiamento / Dutch", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=SPO+Aruba", website: "https://www.dps.aw", feeEnroll: 0, feeAirco: 0, uniformCost: 100, committee: 0, supplies: 200 },
    { id: "special-caiquetio", name: "Scol Caiquetio (Educacion Special - SKOA)", level: "basis", lang: "Papiamento / Dutch", type: "SKOA", phone: "582-1400", maps: "https://maps.google.com/?q=Scol+Caiquetio+Aruba", website: "https://www.skoa.aw", feeEnroll: 0, feeAirco: 0, uniformCost: 80, committee: 0, supplies: 150 },
    { id: "special-dununman", name: "Scol Dununman (Educacion Special - SVGA)", level: "basis", lang: "Papiamento / Dutch", type: "Private", phone: "585-0000", maps: "https://maps.google.com/?q=Scol+Dununman+Aruba", website: "", feeEnroll: 0, feeAirco: 0, uniformCost: 80, committee: 0, supplies: 150 },

    // ── SUPERIOR / UNIVERSITARIO ─────────────────────────────────────────────
    { id: "ipa", name: "Instituto Pedagogico Arubano (IPA)", level: "secundario", lang: "Dutch / Papiamento", type: "DPS", phone: "528-3400", maps: "https://maps.google.com/?q=IPA+Aruba", website: "https://www.ea.aw", feeEnroll: 500, feeAirco: 0, uniformCost: 0, committee: 0, supplies: 600 },
    { id: "ua", name: "University of Aruba (UA)", level: "secundario", lang: "Dutch / English", type: "Private", phone: "526-2200", maps: "https://maps.google.com/?q=University+of+Aruba", website: "https://www.ua.aw", feeEnroll: 2500, feeAirco: 0, uniformCost: 0, committee: 0, supplies: 800 },

    // ── ESCUELAS PRIVADAS ─────────────────────────────────────────────────────
    { id: "private-isa", name: "International School of Aruba (ISA)", level: "basis", lang: "English", type: "Private", phone: "583-5240", maps: "https://maps.google.com/?q=International+School+Aruba", website: "https://www.isaschool.com", feeEnroll: 1500, feeAirco: 0, uniformCost: 200, committee: 200, supplies: 500 },
    { id: "private-schakel", name: "De Schakel Aruba", level: "basis", lang: "Dutch / Papiamento", type: "Private", phone: "582-4700", maps: "https://maps.google.com/?q=De+Schakel+Aruba", website: "", feeEnroll: 400, feeAirco: 150, uniformCost: 120, committee: 80, supplies: 250 }
  ],

  // Administraciones Educativas de Aruba
  administrations: {
    skoa: {
      name: "SKOA (Stichting Katholiek Onderwijs Aruba)",
      desc: "Fundación de Educación Católica de Aruba. Administra la mayoría de los jardines de infancia, escuelas primarias y secundarias católicas de la isla.",
      phone: "582-1400",
      website: "https://www.skoa.aw",
      address: "Vondellaan 2, Oranjestad",
      maps: "https://maps.google.com/?q=SKOA+Aruba+Vondellaan"
    },
    spcoa: {
      name: "SPCOA (Stichting Protestant Christelijk Onderwijs Aruba)",
      desc: "Fundación de Educación Cristiana Protestante de Aruba. Administra escuelas basadas en valores protestantes.",
      phone: "582-0005",
      website: "http://spcoa.aw",
      address: "Spinozastraat 11, Oranjestad",
      maps: "https://maps.google.com/?q=SPCOA+Aruba+Spinozastraat"
    },
    dps: {
      name: "DPS (Dienst Publieke Scholen)",
      desc: "Servicio de Escuelas Públicas de Aruba. Organismo gubernamental que administra todas las escuelas públicas (no sectarias) de la isla.",
      phone: "528-3400",
      website: "https://www.dps.aw",
      address: "Cumana 69, Oranjestad",
      maps: "https://maps.google.com/?q=DPS+Aruba+Cumana"
    },
    private: {
      name: "Administración Privada / Independiente",
      desc: "Instituciones gestionadas de forma independiente o por juntas directivas privadas.",
      phone: "N/A (Contacto individual)",
      website: "",
      address: "Contacto directo con cada institución",
      maps: ""
    }
  },

  // Directorio de Deportes & Ocio (Clubes, Complejos y Senderos)
  sports: {
    clubs: [
      { id: "club-litleleague", name: "Aruba Little League Baseball", discipline: "Béisbol / Softball", target: "Niños y Jóvenes (5-18 años)", contact: "582-1234", maps: "https://maps.google.com/?q=12.5215,-70.0125", icon: "⚾" },
      { id: "club-rca", name: "RCA Youth Soccer Academy (Solito)", discipline: "Fútbol Academy", target: "Todas las edades (4+)", contact: "583-3450", maps: "https://maps.google.com/?q=12.5312,-70.0245", icon: "⚽" },
      { id: "club-beachtennis", name: "Aruba Beach Tennis Club (Tropicana)", discipline: "Beach Tennis", target: "Principiantes, Adultos y Pro", contact: "586-1212", maps: "https://maps.google.com/?q=12.5456,-70.0512", icon: "🎾" },
      { id: "club-windsurf", name: "Vela Windsurf & Kitesurf Center", discipline: "Windsurf / Kitesurf", target: "Cursos y Renta de Equipos", contact: "586-0955", maps: "https://maps.google.com/?q=12.5785,-70.0458", icon: "🏄" },
      { id: "club-roly", name: "Pisina Olimpico Roly Bisslik (Savana)", discipline: "Natación Olímpica & Waterpolo", target: "Club de Natación", contact: "584-8188", maps: "https://maps.google.com/?q=12.4612,-69.9634", icon: "🏊" }
    ],
    facilities: [
      { id: "fac-guillermo", name: "Complejo Guillermo Próspero Trinidad", location: "Dakota, Oranjestad", type: "Público (Fútbol / Atletismo)", contact: "582-1100", maps: "https://maps.google.com/?q=12.5186,-70.0152", icon: "🏟️" },
      { id: "fac-frans", name: "Complejo Frans Figaroa", location: "Noord", type: "Público (Fútbol, Baloncesto, Pistas)", contact: "587-5650", maps: "https://maps.google.com/?q=12.5712,-70.0294", icon: "🏟️" },
      { id: "fac-centro-sn", name: "Centro Deportivo San Nicolas", location: "San Nicolas", type: "Multiuso (Fútbol / Gimnasio)", contact: "584-6011", maps: "https://maps.google.com/?q=12.4412,-69.9078", icon: "🏋️" },
      { id: "fac-joe", name: "Joe Laveist Sport Park", location: "San Nicolas", type: "Público (Béisbol / Softbol / Atletismo)", contact: "584-2525", maps: "https://maps.google.com/?q=12.4356,-69.9142", icon: "🏟️" },
      { id: "fac-padel-street", name: "Street Padel Aruba (Privado)", location: "Shaba, Noord", type: "Alquiler de Canchas de Padel", contact: "592-7777", maps: "https://maps.google.com/?q=12.5662,-70.0322", icon: "🎾" }
    ],
    trails: [
      { id: "trail-alto-vista", name: "Sendero Alto Vista (Oranjestad a Capilla)", type: "Ciclismo de Montaña / Senderismo", difficulty: "Fácil - Moderado", length: "4.5 km", desc: "Ruta de tierra con cactus y vistas costeras, ideal para correr o montar en bicicleta." },
      { id: "trail-arikok", name: "Parque Nacional Arikok (Sendero Conchi Pool)", type: "Senderismo Técnico", difficulty: "Difícil (Calor extremo)", length: "6.2 km (Ida/Vuelta)", desc: "Paso a través del bosque xerófilo de cactus hasta la Piscina Natural. Requiere agua abundante." },
      { id: "trail-daimari", name: "Sendero Daimari a Conchi", type: "Ciclismo de Montaña / Trail Running", difficulty: "Moderado", length: "3.8 km", desc: "Espectacular ruta costera sobre dunas y acantilados de piedra caliza." }
    ]
  },

  // Clasificados Iniciales del Marketplace (Demostración)
  marketplace: [
    {
      id: "ad-1",
      category: "trabajo",
      title: "Recepcionista Bilingüe (Hotel Palm Beach)",
      price: 2400, // Salario estimado AWG/mes
      desc: "Se busca recepcionista para hotel boutique. Fluidez requerida en Papiamento, Inglés y Español. Experiencia en atención al cliente es un plus.",
      contact: "593-1111",
      date: "2026-06-10",
      user: "Palm Beach Resort N.V.",
      sponsored: true,
      cpcBid: 0.80,
      clicks: 12,
      image: "https://images.unsplash.com/photo-1521737711867-e3b904737d88?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: false
    },
    {
      id: "ad-2",
      category: "vehiculos",
      title: "Toyota Yaris 2022 - Automático",
      price: 18500, // AWG
      desc: "Toyota Yaris en excelentes condiciones, único dueño, 45,000 km, aire acondicionado frío, mantenimientos al día en Garage Cordia. Precio negociable.",
      contact: "594-2222",
      date: "2026-06-11",
      user: "Miguel Croes",
      sponsored: false,
      cpcBid: 0.00,
      clicks: 0,
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: true
    },
    {
      id: "ad-3",
      category: "joyeria",
      title: "Reloj Rolex Datejust 36 - Acero y Oro",
      price: 15400, // AWG
      desc: "Reloj Rolex Datejust de 36mm en acero y oro amarillo de 18 quilates. Esfera color champaña con diamantes. Caja y papeles originales, excelente estado.",
      contact: "593-1111",
      date: "2026-06-12",
      user: "Joyas Aruba",
      sponsored: true,
      cpcBid: 1.20,
      clicks: 10,
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: true
    },
    {
      id: "ad-4",
      category: "trabajo",
      title: "Electricista Industrial para Planta WEB",
      price: 3800, // AWG/mes
      desc: "Se solicita electricista calificado con certificación EPI Técnico o equivalente. Experiencia mínima de 3 años en sistemas de media y alta tensión.",
      contact: "525-4601",
      date: "2026-06-09",
      user: "WEB Aruba",
      sponsored: false,
      cpcBid: 0.00,
      clicks: 0,
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: false
    },
    {
      id: "ad-5",
      category: "alquileres",
      title: "Estudio amueblado en Noord (Servicios incluidos)",
      price: 1200, // AWG/mes
      desc: "Alquiler a largo plazo. Apartamento estudio para una persona sola en Noord. Incluye agua, electricidad, Wi-Fi de alta velocidad y aire acondicionado.",
      contact: "599-4444",
      date: "2026-06-12",
      user: "Sandra Kelly",
      sponsored: false,
      cpcBid: 0.00,
      clicks: 0,
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: false
    },
    {
      id: "ad-6",
      category: "electronica",
      title: "iPhone 15 Pro Max 256GB - Titanio Natural",
      price: 1650, // AWG
      desc: "iPhone 15 Pro Max de 256GB en color Titanio Natural. Libre de fábrica para cualquier operador, condición de batería 98%, incluye cable original y protector.",
      contact: "597-5555",
      date: "2026-06-13",
      user: "Celulares Aruba",
      sponsored: true,
      cpcBid: 1.00,
      clicks: 15,
      image: "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: true
    },
    {
      id: "ad-7",
      category: "ropa",
      title: "Gafas de Sol Ray-Ban Aviator - Nuevas",
      price: 280, // AWG
      desc: "Gafas Ray-Ban Aviator Classic originales con montura dorada y lentes verdes G-15. Completamente nuevas, en su caja con estuche y folleto de autenticidad.",
      contact: "594-7777",
      date: "2026-06-14",
      user: "Óptica Central",
      sponsored: false,
      cpcBid: 0.00,
      clicks: 0,
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: true
    },
    {
      id: "ad-8",
      category: "hogar",
      title: "Juego de Muebles de Sala Modernos",
      price: 1200, // AWG
      desc: "Sofá seccional de 3 piezas en color gris oscuro. Cojines de alta densidad muy cómodos, tela resistente a las manchas. Excelente estado, 1 año de uso.",
      contact: "598-8888",
      date: "2026-06-15",
      user: "Karla Ruiz",
      sponsored: false,
      cpcBid: 0.00,
      clicks: 0,
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: true
    },
    {
      id: "ad-serv-1",
      category: "servicios_hogar",
      title: "Plomero y Electricista Certificado (24/7)",
      price: 65,
      desc: "Servicios de fontanería, reparación de fugas, instalación de calentadores de agua y fallas eléctricas. Cobertura en toda la isla. Servicios de emergencia de noche.",
      contact: "594-9988",
      date: "2026-06-15",
      user: "Juan Kelly Services",
      sponsored: true,
      cpcBid: 0.90,
      clicks: 5,
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: false
    },
    {
      id: "ad-serv-2",
      category: "servicios_salud",
      title: "Corte y Color Profesional a Domicilio",
      price: 85,
      desc: "Servicio de peluquería, balayage, keratina y manicura en la comodidad de tu hogar. Higiene garantizada. Reserva tu cita por WhatsApp.",
      contact: "592-3344",
      date: "2026-06-16",
      user: "Elena Beauticians",
      sponsored: false,
      cpcBid: 0.00,
      clicks: 0,
      image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: false
    },
    {
      id: "ad-serv-3",
      category: "servicios_tecnicos",
      title: "Soporte Técnico de Computadoras y Celulares",
      price: 45,
      desc: "Reparación de pantallas de iPhone, cambio de batería, formateo de Windows/Mac, eliminación de virus y optimización de velocidad. Trabajo con garantía de 30 días.",
      contact: "594-7722",
      date: "2026-06-17",
      user: "Noord Tech Hub",
      sponsored: true,
      cpcBid: 0.70,
      clicks: 8,
      image: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=400&q=80",
      deliveryEnabled: false
    }
  ],

  // Farmacias de Turno Semanales de Aruba (Botica na Warda)
  // Directorio real de Boticas de Aruba (Fuente: AZV - Algemene Ziektekosten Verzekering)
  // Teléfono y dirección oficiales verificados.
  boticasDirectorio: {
    "Aloë": { phone: "584-4606", address: "Pos Chikito 83" },
    "Dakota": { phone: "588-7364", address: "Avenida Milio Croes 45" },
    "Del Pueblo": { phone: "582-1253", address: "Caya G.F. Croes 48" },
    "Eagle": { phone: "640-8443", address: "Caya Punta Brabo 17" },
    "Seroe Preto": { phone: "640-8443", address: "Weg Seroe Preto 25" },
    "Paradera": { phone: "588-6638", address: "Paradera 27" },
    "St. Anna": { phone: "586-4010", address: "Noord 41 B-C" },
    "St. Cruz": { phone: "585-8028", address: "Santa Cruz 54 A" },
    "Oduber": { phone: "582-1780", address: "Caya G.F. Croes 103" },
    "4 Centro Medico": { phone: "584-5794", address: "Bernhardstraat 55" }
  },

  // Calendario oficial mensual de Boticas de Turno (Botica na Warda)
  // Fuente: Inspectie Volksgezondheid Aruba (iva.aw) - actualizado manualmente
  // cada mes a partir del calendario PNG que publica IVA, ya que no existe
  // una fuente de datos estructurada (API/HTML) para hacer scraping automático.
  // Formato: { from: "YYYY-MM-DD", to: "YYYY-MM-DD", primary: "...", secondary: "..." }
  boticasCalendario: [
    // JUNIO 2026
    { from: "2026-06-01", to: "2026-06-04", primary: "St. Cruz", secondary: "4 Centro Medico" },
    { from: "2026-06-05", to: "2026-06-11", primary: "Oduber", secondary: "Seroe Preto" },
    { from: "2026-06-12", to: "2026-06-18", primary: "Eagle", secondary: "4 Centro Medico" },
    { from: "2026-06-19", to: "2026-06-25", primary: "Oduber", secondary: "Aloë" },
    { from: "2026-06-26", to: "2026-06-30", primary: "Paradera", secondary: "4 Centro Medico" },
    // JULIO 2026
    { from: "2026-07-01", to: "2026-07-02", primary: "Paradera", secondary: "4 Centro Medico" },
    { from: "2026-07-03", to: "2026-07-09", primary: "St. Anna", secondary: "Seroe Preto" },
    { from: "2026-07-10", to: "2026-07-16", primary: "Eagle", secondary: "4 Centro Medico" },
    { from: "2026-07-17", to: "2026-07-23", primary: "Oduber", secondary: "Aloë" },
    { from: "2026-07-24", to: "2026-07-30", primary: "Dakota", secondary: "4 Centro Medico" },
    { from: "2026-07-31", to: "2026-07-31", primary: "Del Pueblo", secondary: "Seroe Preto" },
    // AGOSTO 2026
    { from: "2026-08-01", to: "2026-08-06", primary: "Del Pueblo", secondary: "Seroe Preto" },
    { from: "2026-08-07", to: "2026-08-13", primary: "Eagle", secondary: "4 Centro Medico" },
    { from: "2026-08-14", to: "2026-08-20", primary: "Oduber", secondary: "Aloë" },
    { from: "2026-08-21", to: "2026-08-27", primary: "St. Cruz", secondary: "4 Centro Medico" },
    { from: "2026-08-28", to: "2026-08-31", primary: "Oduber", secondary: "Seroe Preto" },
    // SEPTIEMBRE 2026
    { from: "2026-09-01", to: "2026-09-06", primary: "Oduber", secondary: "Seroe Preto" },
    { from: "2026-09-07", to: "2026-09-10", primary: "Eagle", secondary: "4 Centro Medico" },
    { from: "2026-09-11", to: "2026-09-17", primary: "Oduber", secondary: "Aloë" },
    { from: "2026-09-18", to: "2026-09-24", primary: "Paradera", secondary: "4 Centro Medico" },
    { from: "2026-09-25", to: "2026-09-30", primary: "St. Anna", secondary: "Seroe Preto" },
    // OCTUBRE 2026
    { from: "2026-10-01", to: "2026-10-01", primary: "St. Anna", secondary: "Seroe Preto" },
    { from: "2026-10-02", to: "2026-10-08", primary: "Eagle", secondary: "4 Centro Medico" },
    { from: "2026-10-09", to: "2026-10-15", primary: "Oduber", secondary: "Aloë" },
    { from: "2026-10-16", to: "2026-10-22", primary: "Dakota", secondary: "4 Centro Medico" },
    { from: "2026-10-23", to: "2026-10-29", primary: "Oduber", secondary: "Seroe Preto" },
    { from: "2026-10-30", to: "2026-10-31", primary: "Eagle", secondary: "4 Centro Medico" },
    // NOVIEMBRE 2026
    { from: "2026-11-01", to: "2026-11-05", primary: "Eagle", secondary: "4 Centro Medico" },
    { from: "2026-11-06", to: "2026-11-12", primary: "Oduber", secondary: "Aloë" },
    { from: "2026-11-13", to: "2026-11-19", primary: "St. Cruz", secondary: "4 Centro Medico" },
    { from: "2026-11-20", to: "2026-11-26", primary: "Oduber", secondary: "Seroe Preto" },
    { from: "2026-11-27", to: "2026-11-30", primary: "Eagle", secondary: "4 Centro Medico" },
    // DICIEMBRE 2026
    { from: "2026-12-01", to: "2026-12-03", primary: "Eagle", secondary: "4 Centro Medico" },
    { from: "2026-12-04", to: "2026-12-10", primary: "Del Pueblo", secondary: "4 Centro Medico" },
    { from: "2026-12-11", to: "2026-12-17", primary: "Paradera", secondary: "4 Centro Medico" },
    { from: "2026-12-18", to: "2026-12-24", primary: "St. Anna", secondary: "Seroe Preto" },
    { from: "2026-12-25", to: "2026-12-31", primary: "Eagle", secondary: "Aloë" }
  ],

  // Tabla Histórica de Ajustes de Precios del Combustible (Regulado por el Gobierno de Aruba)
  fuelPrices: [
    { date: "Junio 2026", gasoline: "2.68", diesel: "2.14", kerosene: "1.92", change: "+0.05 AWG" },
    { date: "Mayo 2026", gasoline: "2.63", diesel: "2.18", kerosene: "1.88", change: "-0.10 AWG" },
    { date: "Abril 2026", gasoline: "2.73", diesel: "2.22", kerosene: "1.95", change: "+0.08 AWG" }
  ],

  // Datos de Comercio y Negocios (Cruceros, Aeropuerto Reina Beatrix y Ocupación)
  comercio: {
    cruises: [
      { date: "Hoy", ship: "Monarch of the Seas", passengers: 2750, port: "Puerto de Oranjestad", time: "07:00 - 16:00" },
      { date: "Hoy", ship: "Celebrity Equinox", passengers: 2850, port: "Puerto de Oranjestad", time: "08:00 - 20:00" },
      { date: "Mañana", ship: "Adventure of the Seas", passengers: 3110, port: "Puerto de Oranjestad", time: "07:30 - 18:00" },
      { date: "Esta Semana", ship: "Oceania Riviera", passengers: 1250, port: "Puerto de Oranjestad", time: "09:00 - 17:00" }
    ],
    flightsToday: {
      totalArrivals: 28,
      passengers: 5600,
      usMarketPct: 78
    },
    occupancyRates: {
      noord: 89, // % Noord (Palm Beach / Eagle Beach)
      oranjestad: 78, // % Oranjestad
      sannicolas: 82 // % San Nicolas (Secrets Hotel)
    },
    lodgingOccupancy: {
      resorts: 86,          // Hoteles Resorts
      allInclusive: 91,     // Hoteles Todo Incluidos
      condos: 74,           // Condos
      villas: 68,           // Villas
      boutiqueApts: 79      // Apartamentos Boutique
    },
    nearbyBusinesses: {
      noord: [
        { name: "Gianni's Ristorante", type: "🍽️ Restauración", phone: "586-2244", dist: "45m" },
        { name: "Super Food Plaza", type: "🛍️ Comercio General", phone: "583-9300", dist: "95m" },
        { name: "Paseo Herencia Mall", type: "🏢 Centro Comercial", phone: "586-3535", dist: "80m" }
      ],
      oranjestad: [
        { name: "Renaissance Mall", type: "🛍️ Tiendas Premium", phone: "583-6000", dist: "30m" },
        { name: "The West Deck", type: "🍽️ Restaurante de Playa", phone: "582-4667", dist: "75m" },
        { name: "Aruba Aloe Store", type: "🌿 Cuidado Personal", phone: "588-3222", dist: "60m" }
      ],
      sannicolas: [
        { name: "Charlie's Bar", type: "🍺 Bar Histórico", phone: "584-5086", dist: "50m" },
        { name: "Kamini's Kitchen", type: "🍽️ Restaurante Local", phone: "584-1234", dist: "85m" },
        { name: "Baby Beach Snack", type: "🍔 Cafetería de Playa", phone: "584-9999", dist: "90m" }
      ]
    },
    // Base de datos extendida para la nueva sub-pestaña "Llegadas"
    arrivalsDb: {
      vuelos: {
        today: [
          { flightNo: "AA 1028", airline: "American Airlines", origin: "Miami (MIA)", time: "11:45 AM", status: "Landed", terminal: "Terminal U.S." },
          { flightNo: "DL 561", airline: "Delta Air Lines", origin: "Atlanta (ATL)", time: "12:30 PM", status: "Landed", terminal: "Terminal U.S." },
          { flightNo: "B6 1421", airline: "JetBlue Airways", origin: "New York (JFK)", time: "01:15 PM", status: "On Time", terminal: "Terminal U.S." },
          { flightNo: "UA 788", airline: "United Airlines", origin: "Newark (EWR)", time: "02:10 PM", status: "On Time", terminal: "Terminal U.S." },
          { flightNo: "KL 773", airline: "KLM", origin: "Amsterdam (AMS)", time: "03:45 PM", status: "On Time", terminal: "Terminal Int." },
          { flightNo: "PY 462", airline: "Surinam Airways", origin: "Paramaribo (PBM)", time: "04:30 PM", status: "Delayed", terminal: "Terminal Int." },
          { flightNo: "AV 092", airline: "Avianca", origin: "Bogotá (BOG)", time: "05:15 PM", status: "On Time", terminal: "Terminal Int." },
          { flightNo: "AD 981", airline: "Aruba Airlines", origin: "Bonaire (BON)", time: "06:40 PM", status: "On Time", terminal: "Terminal Int." }
        ],
        weekly: [
          { day: "Lunes", flightNo: "AA 1028", airline: "American Airlines", origin: "Miami (MIA)", time: "11:45 AM", status: "Landed" },
          { day: "Martes", flightNo: "DL 345", airline: "Delta Air Lines", origin: "Boston (BOS)", time: "01:20 PM", status: "On Time" },
          { day: "Miércoles", flightNo: "B6 821", airline: "JetBlue Airways", origin: "Fort Lauderdale (FLL)", time: "02:10 PM", status: "On Time" },
          { day: "Jueves", flightNo: "UA 1908", airline: "United Airlines", origin: "Houston (IAH)", time: "03:30 PM", status: "On Time" },
          { day: "Viernes", flightNo: "LH 542", airline: "Lufthansa", origin: "Frankfurt (FRA)", time: "04:15 PM", status: "On Time" },
          { day: "Sábado", flightNo: "AA 2204", airline: "American Airlines", origin: "Charlotte (CLT)", time: "12:15 PM", status: "On Time" },
          { day: "Sábado", flightNo: "DL 561", airline: "Delta Air Lines", origin: "Atlanta (ATL)", time: "12:30 PM", status: "On Time" },
          { day: "Sábado", flightNo: "WG 287", airline: "Sunwing", origin: "Toronto (YYZ)", time: "02:50 PM", status: "On Time" },
          { day: "Domingo", flightNo: "KL 773", airline: "KLM", origin: "Amsterdam (AMS)", time: "03:45 PM", status: "On Time" },
          { day: "Domingo", flightNo: "AV 092", airline: "Avianca", origin: "Bogotá (BOG)", time: "05:15 PM", status: "On Time" }
        ],
        monthly: [
          { period: "Semana 1", flightNo: "Llegadas de EE.UU.", airline: "American/Delta/JetBlue", origin: "Varios (EE.UU.)", avgLoad: "92% capacidad", totalWeekly: "108 vuelos" },
          { period: "Semana 2", flightNo: "Llegadas de Europa", airline: "KLM/TUI/Lufthansa", origin: "Amsterdam/Frankfurt", avgLoad: "88% capacidad", totalWeekly: "18 vuelos" },
          { period: "Semana 3", flightNo: "Llegadas de Sudamérica", airline: "Avianca/Copa/Wingo", origin: "Bogotá/Panamá/Medellín", avgLoad: "84% capacidad", totalWeekly: "35 vuelos" },
          { period: "Semana 4", flightNo: "Llegadas del Caribe", airline: "Aruba Airlines/Divi Divi", origin: "Curazao/Bonaire/Santo Domingo", avgLoad: "75% capacidad", totalWeekly: "42 vuelos" }
        ]
      },
      cruceros: {
        today: [
          { ship: "Monarch of the Seas", cruiseLine: "Royal Caribbean", passengers: 2750, port: "Terminal de Cruceros 1", time: "07:00 - 16:00", status: "Docked" },
          { ship: "Celebrity Equinox", cruiseLine: "Celebrity Cruises", passengers: 2850, port: "Terminal de Cruceros 2", time: "08:00 - 20:00", status: "Docked" }
        ],
        weekly: [
          { day: "Lunes", ship: "Monarch of the Seas", cruiseLine: "Royal Caribbean", passengers: 2750, port: "Terminal 1", time: "07:00 - 16:00", status: "Completed" },
          { day: "Martes", ship: "Adventure of the Seas", cruiseLine: "Royal Caribbean", passengers: 3110, port: "Terminal 2", time: "07:30 - 18:00", status: "Expected" },
          { day: "Miércoles", ship: "Oceania Riviera", cruiseLine: "Oceania Cruises", passengers: 1250, port: "Terminal 1", time: "09:00 - 17:00", status: "Expected" },
          { day: "Viernes", ship: "Disney Fantasy", cruiseLine: "Disney Cruise Line", passengers: 4000, port: "Terminal 2", time: "06:00 - 15:00", status: "Expected" },
          { day: "Sábado", ship: "Carnival Horizon", cruiseLine: "Carnival Cruises", passengers: 3960, port: "Terminal 1", time: "08:00 - 18:00", status: "Expected" }
        ],
        monthly: [
          { period: "Junio 1-7", ship: "Total barcos: 5", cruiseLine: "Royal Caribbean / Disney / Oceania", passengers: 15070, avgStay: "9.5 horas", ecoImpact: "Est. $1.8M AWG" },
          { period: "Junio 8-14", ship: "Total barcos: 6", cruiseLine: "Celebrity / Carnival / NCL", passengers: 18120, avgStay: "10.2 horas", ecoImpact: "Est. $2.2M AWG" },
          { period: "Junio 15-21", ship: "Total barcos: 4", cruiseLine: "MSC Cruises / Princess Cruises", passengers: 12800, avgStay: "8.8 horas", ecoImpact: "Est. $1.5M AWG" },
          { period: "Junio 22-30", ship: "Total barcos: 7", cruiseLine: "Royal Caribbean / Holland America", passengers: 21300, avgStay: "9.9 horas", ecoImpact: "Est. $2.6M AWG" }
        ]
      }
    },
    // Base de datos de Bienes Raíces y Hub de Referencias de Sabí (Real Estate Referral Hub)
    realEstateDb: {
      listings: [
        {
          id: "re-001",
          sellerType: "agent",
          sellerName: "Sarah de Remax Aruba",
          agencyName: "RE/MAX Advantage Aruba",
          title: "Luxury Beachfront Villa Malmok",
          propertyType: "villa",
          priceUsd: 1250000,
          bedrooms: 4,
          bathrooms: 4.5,
          areaSqm: 420,
          location: "Malmok",
          desc: "Espectacular villa frente al mar en Malmok Beach. Piscina infinita, finos acabados europeos y excelente potencial de alquiler vacacional.",
          imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
          agentCommissionPct: 4.0,
          sabiReferralFeeType: "pct_of_commission",
          sabiReferralFeeValue: 15.0, // 15% de $50,000 = $7,500 USD de Referral Fee para Sabí Hub
          estimatedSabiFee: 7500,
          status: "available"
        },
        {
          id: "re-002",
          sellerType: "direct_owner",
          sellerName: "Henk van der Meer (Propietario)",
          agencyName: "Venta Directa por Dueño (FSBO)",
          title: "Moderno Condominio en Palm Beach",
          propertyType: "condo",
          priceUsd: 385000,
          bedrooms: 2,
          bathrooms: 2,
          areaSqm: 110,
          location: "Palm Beach",
          desc: "Apartamento a minutos de las playas de Palm Beach y la zona hotelera de alto nivel. Complejo privado con piscina y seguridad 24/7.",
          imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
          agentCommissionPct: 0,
          sabiReferralFeeType: "pct_of_price",
          sabiReferralFeeValue: 1.5, // 1.5% de $385,000 = $5,775 USD para Sabí Hub
          estimatedSabiFee: 5775,
          status: "available"
        },
        {
          id: "re-003",
          sellerType: "agent",
          sellerName: "Carlos Gómez (Coldwell Banker)",
          agencyName: "Coldwell Banker Aruba",
          title: "Casa Familiar Residencial en Noord",
          propertyType: "house",
          priceUsd: 295000,
          bedrooms: 3,
          bathrooms: 2,
          areaSqm: 180,
          location: "Noord",
          desc: "Hermosa propiedad residencial cerca de escuelas, supermercados y a 5 minutos de Eagle Beach. Jardín amplio y terraza techada.",
          imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
          agentCommissionPct: 4.0,
          sabiReferralFeeType: "flat_fee",
          sabiReferralFeeValue: 2000, // $2,000 USD Flat Fee
          estimatedSabiFee: 2000,
          status: "available"
        }
      ],
      ambassadorProgram: {
        splitPolicyPct: 50, // 50% para Sabí, 50% para el embajador local (amigo de la playa/taxi)
        totalReferralsPaidAwg: 45800,
        activeAmbassadors: 124
      }
    }
  },

  // Rentas Vacacionales y Staycations ("Sabí Stays")
  vacationRentals: [
    {
      id: "stay-001",
      ownerId: "owner-01",
      ownerName: "Maria Kock",
      ownerPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      title: "🌴 Studio Anexo Independiente en Noord (Malmok)",
      propertyType: "annex_studio",
      district: "Noord",
      address: "Malmokweg 14, Noord, Aruba",
      nightlyRateUsd: 95.00,
      localStaycationDiscountPct: 30.00, // 30% descuento -> $66.50 USD (~120 AWG)
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1.0,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
      ],
      icalFeedUrl: "https://calendar.google.com/calendar/ical/sample_malmok_studio/public/basic.ics",
      rating: 4.9,
      reviewsCount: 38,
      amenities: ["Piscina Compartida", "WiFi 500Mbps", "Aire Acondicionado", "Cocineta", "Estacionamiento Gratis"],
      autoCleaningService: true,
      description: "Estudio anexo privado en casa familiar en Malmok. Ideal para parejas de turistas o residentes que buscan un staycation tranquilo cerca de la playa."
    },
    {
      id: "stay-002",
      ownerId: "owner-02",
      ownerName: "Jan & Ellen van der Berg",
      ownerPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      title: "🏡 Eagle Beach Coral Villa con Piscina Privada",
      propertyType: "entire_home",
      district: "Noord",
      address: "Bubali 45, Noord, Aruba",
      nightlyRateUsd: 220.00,
      localStaycationDiscountPct: 25.00, // $165 USD (~297 AWG)
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2.0,
      images: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"
      ],
      icalFeedUrl: "https://calendar.google.com/calendar/ical/sample_eagle_villa/public/basic.ics",
      rating: 4.95,
      reviewsCount: 64,
      amenities: ["Piscina Privada", "BBQ Grill", "Smart TV", "Cocina Completa", "Lavadora/Secadora"],
      autoCleaningService: true,
      description: "Espectacular villa familiar a 3 minutos de Eagle Beach. Totalmente equipada con parrilla BBQ y jardín caribeño."
    },
    {
      id: "stay-003",
      ownerId: "owner-03",
      ownerName: "Kevin Tromp",
      ownerPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      title: "🌆 Oranjestad Downtown Executive Loft",
      propertyType: "apartment",
      district: "Oranjestad",
      address: "Wilhelminastraat 88, Oranjestad, Aruba",
      nightlyRateUsd: 130.00,
      localStaycationDiscountPct: 25.00, // $97.50 USD (~175 AWG)
      maxGuests: 3,
      bedrooms: 1,
      bathrooms: 1.5,
      images: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
      ],
      icalFeedUrl: "https://calendar.google.com/calendar/ical/sample_oranjestad_loft/public/basic.ics",
      rating: 4.88,
      reviewsCount: 22,
      amenities: ["Ubicación Central", "Gimnasio", "Balcón Urbano", "Escritorio Trabajo", "AC Central"],
      autoCleaningService: true,
      description: "Loft contemporáneo en el centro histórico de Oranjestad. Perfecto para ejecutivos, contratistas o nómadas digitales."
    },
    {
      id: "stay-004",
      ownerId: "owner-04",
      ownerName: "Shanella Arends",
      ownerPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
      title: "🎨 San Nicolas Sunrise Beach Cottage & Anexo",
      propertyType: "entire_home",
      district: "San Nicolas",
      address: "Zeewijk 12, San Nicolas, Aruba",
      nightlyRateUsd: 110.00,
      localStaycationDiscountPct: 35.00, // $71.50 USD (~128 AWG)
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1.0,
      images: [
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
      ],
      icalFeedUrl: "https://calendar.google.com/calendar/ical/sample_sannicolas_cottage/public/basic.ics",
      rating: 4.92,
      reviewsCount: 19,
      amenities: ["Cerca de Baby Beach", "Hamacas", "Jardín Tropical", "Pet Friendly", "WiFi HD"],
      autoCleaningService: true,
      description: "Encantadora casa de playa en la capital del arte mural de Aruba. A minutos de Baby Beach y Rodgers Beach."
    }
  ]
};