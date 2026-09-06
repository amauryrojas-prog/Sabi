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
    { category: "hybrid_vehicles", name: "Vehículos Híbridos", duty: 0.19 },
    { category: "regular_vehicles", name: "Vehículos Convencionales (Gasolina/Diesel)", duty: 0.32 },
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
    { id: "creche-imanoel", name: "Creche Imanoel", level: "creche", lang: "Papiamento", type: "Private", phone: "584-8833", maps: "https://maps.google.com/?q=12.4357,-69.9056", website: "", feeEnroll: 150, feeAirco: 0, uniformCost: 60, committee: 50, supplies: 120 },
    { id: "creche-noord", name: "Centro de Cuidado Infantil Shaba", level: "creche", lang: "Papiamento / Dutch", type: "Private", phone: "587-1234", maps: "https://maps.google.com/?q=12.5682,-70.0305", website: "https://www.childcarearuba.com", feeEnroll: 200, feeAirco: 0, uniformCost: 60, committee: 40, supplies: 150 },
    { id: "kleuter-monplaisir", name: "Mon Plaisir Kleuterschool", level: "kleuter", lang: "Dutch", type: "SPCOA", phone: "582-2775", maps: "https://maps.google.com/?q=12.5205,-70.0218", website: "https://www.monplaisirschool.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 60, supplies: 180 },
    { id: "kleuter-prikichi", name: "Kleuterschool Prikichi", level: "kleuter", lang: "Papiamento", type: "SKOA", phone: "585-6996", maps: "https://maps.google.com/?q=12.4981,-69.9691", website: "https://www.skoa.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 80, committee: 50, supplies: 180 },
    { id: "basisschool-sintanna", name: "Sint Anna School", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "587-1725", maps: "https://maps.google.com/?q=12.5699,-70.0289", website: "https://www.sintannaschool.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basisschool-arcoiris", name: "Arco Iris Basisschool", level: "basis", lang: "Papiamento", type: "SKOA", phone: "585-1122", maps: "https://maps.google.com/?q=12.4925,-69.9612", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basisschool-felipe-tromp", name: "Colegio Felipe B. Tromp", level: "basis", lang: "Dutch / Papiamento", type: "SKOA", phone: "587-2635", maps: "https://maps.google.com/?q=12.5667,-70.0167", website: "https://www.skoa.aw", feeEnroll: 275, feeAirco: 150, uniformCost: 100, committee: 75, supplies: 220 },
    { id: "basisschool-dps", name: "Commandeur Pieter Boer School", level: "basis", lang: "Dutch", type: "DPS", phone: "584-5412", maps: "https://maps.google.com/?q=12.4485,-69.9212", website: "https://www.dps.aw", feeEnroll: 250, feeAirco: 150, uniformCost: 100, committee: 50, supplies: 220 },
    { id: "mavo-filomena", name: "Filomena College MAVO", level: "secundario", lang: "Dutch", type: "SKOA", phone: "584-5330", maps: "https://maps.google.com/?q=12.4399,-69.9115", website: "https://www.filomenamavo.aw", feeEnroll: 350, feeAirco: 150, uniformCost: 120, committee: 100, supplies: 300 },
    { id: "havo-vwo-colegio", name: "Colegio Arubano (Oranjestad)", level: "secundario", lang: "Dutch", type: "Private", phone: "582-2005", maps: "https://maps.google.com/?q=12.5252,-70.0381", website: "https://www.colegioarubano.aw", feeEnroll: 450, feeAirco: 150, uniformCost: 150, committee: 150, supplies: 450 },
    { id: "epi-oranjestad", name: "EPI (Educacion Profesional Intermedio)", level: "secundario", lang: "Dutch / English", type: "DPS", phone: "525-8700", maps: "https://maps.google.com/?q=12.5322,-70.0256", website: "https://www.epiaruba.com", feeEnroll: 400, feeAirco: 150, uniformCost: 0, committee: 100, supplies: 500 },
    { id: "epb-sannicolas", name: "EPB San Nicolas (Educacion Profesional Basico)", level: "secundario", lang: "Papiamento / Dutch", type: "DPS", phone: "584-1211", maps: "https://maps.google.com/?q=12.4375,-69.9042", website: "https://www.epbaruba.com", feeEnroll: 300, feeAirco: 150, uniformCost: 120, committee: 75, supplies: 350 }
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
      { name: "Sendero Alto Vista (Oranjestad a Capilla)", type: "Ciclismo de Montaña / Senderismo", difficulty: "Fácil - Moderado", length: "4.5 km", desc: "Ruta de tierra con cactus y vistas costeras, ideal para correr o montar en bicicleta." },
      { name: "Parque Nacional Arikok (Sendero Conchi Pool)", type: "Senderismo Técnico", difficulty: "Difícil (Calor extremo)", length: "6.2 km (Ida/Vuelta)", desc: "Paso a través del bosque xerófilo de cactus hasta la Piscina Natural. Requiere agua abundante." },
      { name: "Sendero Daimari a Conchi", type: "Ciclismo de Montaña / Trail Running", difficulty: "Moderado", length: "3.8 km", desc: "Espectacular ruta costera sobre dunas y acantilados de piedra caliza." }
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
  boticas: [
    { week: "Esta semana", boticaNoord: "Botica di Servicio Noord (Tel: 586-4606)", boticaPlay: "Botica Eagle (Tel: 587-9011)", boticaSn: "Botica San Lucas (Tel: 584-5119)" },
    { week: "Siguiente semana", boticaNoord: "Botica Santa Cruz (Tel: 585-8028)", boticaPlay: "Botica Maria (Tel: 585-8108)", boticaSn: "Botica Aloe (Tel: 584-4606)" }
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
    }
  }
};
