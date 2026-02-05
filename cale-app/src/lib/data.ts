
export type Category = 'A2' | 'B1' | 'C1';

export interface Question {
  id: string;
  category: Category;
  text: string;
  options: string[];
  correctAnswer: number; // index of options
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  password?: string;
  isPro?: boolean;
  proExpiresAt?: string;
}

export interface ExamResult {
  id: string;
  userId: string;
  userName: string;
  category: Category;
  date: string;
  score: number;
  totalQuestions: number;
  failedQuestions: {
    questionId: string;
    userAnswer: number;
  }[];
}

const A2_REAL: Omit<Question, 'id' | 'category'>[] = [
  { text: "¿Cuál es el cilindraje máximo para la categoría A1?", options: ["100cc", "125cc", "150cc", "200cc"], correctAnswer: 1 },
  { text: "¿Qué indica la categoría A2 de licencia?", options: ["Solo motos de 125cc", "Motos de cualquier cilindraje", "Solo motos eléctricas", "Solo mototaxis"], correctAnswer: 1 },
  { text: "¿Es obligatorio el uso de casco para el acompañante?", options: ["No", "Solo en carretera", "Sí, siempre", "Solo si es niño"], correctAnswer: 2 },
  { text: "¿Qué tipo de casco es el más seguro?", options: ["Tipo 'bacín'", "Abierto", "Integral (cerrado)", "Sin certificación"], correctAnswer: 2 },
  { text: "¿Cuál es la profundidad mínima permitida para las llantas de moto?", options: ["1.6 mm", "1.0 mm", "0.5 mm", "2.0 mm"], correctAnswer: 1 },
  { text: "¿A qué hora inicia la obligación del uso de prendas reflectivas?", options: ["4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"], correctAnswer: 2 },
  { text: "¿Dónde debe transitar el motociclista si hay varios carriles?", options: ["Por el medio", "Por la derecha ocupando un carril", "Por la berma", "Por la izquierda"], correctAnswer: 1 },
  { text: "¿Es permitido adelantar por la derecha a otro vehículo?", options: ["Sí", "No, nunca", "Solo si hay espacio", "Solo si el otro va lento"], correctAnswer: 1 },
  { text: "¿Cuál es la distancia mínima de seguridad con otros vehículos?", options: ["5 metros", "10 metros", "30 metros (según velocidad)", "1 metro"], correctAnswer: 2 },
  { text: "¿Qué luz se debe llevar encendida siempre en la moto?", options: ["Altas", "Cruce o bajas", "Direccionales", "Exploradoras"], correctAnswer: 1 },
  { text: "¿Para qué sirve el freno delantero en una moto?", options: ["No sirve", "Es el que más frena", "Solo para emergencias", "Solo para parquear"], correctAnswer: 1 },
  { text: "¿Cuál es la proporción ideal de frenado (Delantero/Trasero)?", options: ["50/50", "30/70", "70/30", "10/90"], correctAnswer: 2 },
  { text: "¿Qué debe hacer si la llanta trasera derrapa al frenar?", options: ["Frenar más fuerte", "Soltar el freno trasero suavemente", "Gritar", "Soltar el manubrio"], correctAnswer: 1 },
  { text: "¿Cómo se debe tomar una curva?", options: ["Frenando adentro", "Acelerando a fondo al entrar", "Frenar antes y acelerar suavemente al salir", "Sin mirar"], correctAnswer: 2 },
  { text: "¿Qué indica una línea amarilla doble continua?", options: ["Se puede adelantar", "Prohibido adelantar en ambos sentidos", "Solo motos adelantan", "Es permitida"], correctAnswer: 1 },
  { text: "¿Qué significan las señales preventivas (Amarillas)?", options: ["Obligan", "Advierten de un peligro", "Informan distancias", "Indican prohibiciones"], correctAnswer: 1 },
  { text: "¿Qué significan las señales reglamentarias (Rojas/Blancas)?", options: ["Indican servicios", "Advierten peligro", "Son de cumplimiento obligatorio", "Solo sugerencias"], correctAnswer: 2 },
  { text: "¿Qué se debe revisar antes de iniciar un viaje (motos)?", options: ["Solo el pito", "Aceite, frenos, luces y llantas", "Nada", "Solo el espejito"], correctAnswer: 1 },
  { text: "¿Qué es el efecto 'punto ciego'?", options: ["Un tipo de luz", "Zonas donde el conductor no ve a otros", "Un daño en los ojos", "Una marca de llantas"], correctAnswer: 1 },
  { text: "¿Qué debe hacer si un perro se cruza en la vía?", options: ["Patearlo", "Intentar esquivarlo bruscamente", "Frenar progresivamente y mantener el equilibrio", "Acelerar"], correctAnswer: 2 },
  { text: "¿Cuál es el límite de velocidad en zonas residenciales?", options: ["30 km/h", "50 km/h", "60 km/h", "10 km/h"], correctAnswer: 0 },
  { text: "¿Cuál es el límite de velocidad en carreteras nacionales?", options: ["120 km/h", "80-100 km/h", "50 km/h", "200 km/h"], correctAnswer: 1 },
  { text: "¿Es permitido el zig-zag entre vehículos?", options: ["Sí", "No", "Solo si hay trancón", "Solo los domiciliarios"], correctAnswer: 1 },
  { text: "¿Qué documentos debe portar originales?", options: ["Propiedad y Licencia", "Solo fotocopias", "Ninguno", "Factura de compra"], correctAnswer: 0 },
  { text: "¿Qué cubre el SOAT?", options: ["Daños al vehículo", "Atención médica a víctimas", "Robo", "Rayones"], correctAnswer: 1 },
  { text: "¿Cada cuánto se hace la revisión técnico mecánica (motos nuevas)?", options: ["Cada año", "A los 2 años del registro inicial", "Cada 5 años", "Nunca"], correctAnswer: 1 },
  { text: "¿Qué indica la luz naranja parpadeante?", options: ["Pare", "Avance", "Prevención/Precaución", "Falla técnica"], correctAnswer: 2 },
  { text: "¿Cuándo se usa la luz alta?", options: ["En la ciudad siempre", "En carreteras oscuras si no viene nadie", "Para saludar", "Si está fundida la otra"], correctAnswer: 1 },
  { text: "¿Qué debe hacer ante una señal de Pare?", options: ["Bajar velocidad", "Detenerse totalmente por 3 segundos", "Pitar y seguir", "Mirar si hay policías"], correctAnswer: 1 },
  { text: "¿Cómo afecta la lluvia a la conducción?", options: ["No afecta", "Mejora el agarre", "Aumenta la distancia de frenado", "Se puede ir más rápido"], correctAnswer: 2 },
  { text: "¿Qué debe hacer si entra agua al motor?", options: ["Seguir andando", "Apagar inmediatamente", "Acelerar para secarlo", "Echarle aire"], correctAnswer: 1 },
  { text: "¿Para qué sirve el Kit de Carretera en motos?", options: ["No es obligatorio portarlo", "Para despincharse", "Es obligatorio por ley", "Solo para viajar"], correctAnswer: 0 },
  { text: "¿Qué indica el humo azul en el escape?", options: ["Estado perfecto", "Quema de aceite", "Falta de gasolina", "Exceso de aire"], correctAnswer: 1 },
  { text: "¿Qué indica el humo negro?", options: ["Aceite quemado", "Mala combustión (mucha gasolina)", "Agua en el motor", "Motor frío"], correctAnswer: 1 },
  { text: "¿Cuál es la función del aceite?", options: ["Limpiar espejos", "Lubricar y enfriar piezas internas", "Dar potencia", "Brillar la pintura"], correctAnswer: 1 },
  { text: "¿Qué ocurre si la cadena está muy floja?", options: ["Se rompe", "Se puede saltar y bloquear la rueda", "Mejora el cambio", "La moto corre más"], correctAnswer: 1 },
  { text: "¿Cuándo debe usar las direccionales?", options: ["Nunca", "Solo si hay otros carros", "Antes de cada giro o cambio de carril", "Después de girar"], correctAnswer: 2 },
  { text: "¿Qué indica el chaleco con placa?", options: ["Es obligatorio en ciertas ciudades/horarios", "Es para decorar", "Solo para mensajeros", "Prohibido"], correctAnswer: 0 },
  { text: "¿Qué hacer si la moto se queda sin gasolina?", options: ["Echarle agua", "Poner el grifo en posición Reserva", "Soplar el tanque", "Moverla"], correctAnswer: 1 },
  { text: "¿Cuál es el riesgo de conducir cansado?", options: ["Se llega más rápido", "Disminuyen los reflejos", "No hay riesgo", "Mejora la atención"], correctAnswer: 1 },
  { text: "¿Qué distancia debe dejar al adelantar un ciclista?", options: ["0.5 metros", "1.5 metros", "5 metros", "No importa"], correctAnswer: 1 },
  { text: "¿Qué hacer en un cruce ferroviario?", options: ["Correr para pasar", "Detenerse y mirar", "Pitar fuerte", "Seguir normal"], correctAnswer: 1 },
  { text: "¿Qué indica un semáforo en rojo y flecha verde?", options: ["Pare todo", "Siga en la dirección de la flecha", "Siga derecho", "Gire en U"], correctAnswer: 1 },
  { text: "¿Qué es el 'aquaplaning'?", options: ["Deportes acuáticos", "Pérdida de contacto con el suelo por agua", "Lavar la moto", "Navegar"], correctAnswer: 1 },
  { text: "¿Qué debe hacer si se pincha la rueda delantera?", options: ["Frenar a fondo", "Sujetar firme y frenar muy suave con el de atrás", "Saltar de la moto", "Acelerar"], correctAnswer: 1 },
  { text: "¿Qué indica la señal de prohibido parquear?", options: ["Se puede parar un momento", "Prohibido detener el vehículo", "Solo para camiones", "Permitido de noche"], correctAnswer: 1 },
  { text: "¿De qué color son las señales informativas?", options: ["Rojas", "Amarillas", "Azules o verdes", "Naranjas"], correctAnswer: 2 },
  { text: "¿Qué indica una señal naranja?", options: ["Zona escolar", "Obras en la vía", "Sitios turísticos", "Restaurantes"], correctAnswer: 1 },
  { text: "¿Cuál es la sanción por no tener SOAT?", options: ["Amonestación", "Multa de 30 salarios diarios e inmovilización", "Solo regaño", "No hay sanción"], correctAnswer: 1 },
  { text: "¿Qué significa conducir a la defensiva?", options: ["Pelear con otros", "Estar atento para evitar accidentes pese a otros", "Ir muy despacio", "Llevar un arma"], correctAnswer: 1 },
];

const B1_REAL: Omit<Question, 'id' | 'category'>[] = [
  { text: "¿Cuál es el límite permitido de alcohol para conductores de vehículos particulares de grado 0?", options: ["20-39 mg", "Mayor a 40 mg", "0 mg (Tolerancia cero)", "100 mg"], correctAnswer: 0 },
  { text: "¿A qué distancia se deben colocar los triángulos de prevención en ciudad?", options: ["10 metros", "15 metros", "30 metros", "50 metros"], correctAnswer: 1 },
  { text: "¿Cuál es la velocidad máxima en zonas residenciales?", options: ["30 km/h", "50 km/h", "60 km/h", "20 km/h"], correctAnswer: 0 },
  { text: "¿Qué indica el testigo de aceite en el tablero?", options: ["Falta gasolina", "Baja presión de aceite", "Motor caliente", "Falla de luces"], correctAnswer: 1 },
  { text: "¿Cuándo se debe realizar la primera revisión técnico-mecánica en un auto nuevo?", options: ["Cada año desde la compra", "A los 6 años de la fecha de matrícula inicial", "A los 2 años", "Nunca"], correctAnswer: 1 },
  { text: "¿Es obligatorio el uso de cinturón en los asientos traseros?", options: ["No", "Solo en carretera", "Sí, siempre", "Solo para niños"], correctAnswer: 2 },
  { text: "¿Qué indica una línea blanca continua en el borde de la vía?", options: ["Se puede adelantar", "Límite de la calzada", "Zona de parqueo", "Carril de bus"], correctAnswer: 1 },
  { text: "¿Cuál es la función del líquido refrigerante?", options: ["Limpiar vidrios", "Mantener la temperatura del motor", "Lubricar piezas", "Frenar mejor"], correctAnswer: 1 },
  { text: "¿Qué debe hacer si el pedal de freno se va al fondo?", options: ["Acelerar", "Bombear el pedal y usar freno de mano gradualmente", "Saltar del auto", "Poner neutro"], correctAnswer: 1 },
  { text: "¿Qué indica la señal de 'Piso Resbaladizo'?", options: ["Acelerar", "Disminuir velocidad y evitar maniobras bruscas", "Girar", "Frenar en seco"], correctAnswer: 1 },
  { text: "¿Cuál es la presión ideal de las llantas?", options: ["La que diga el vecino", "La indicada por el fabricante en el manual", "50 PSI siempre", "10 PSI"], correctAnswer: 1 },
  { text: "¿Qué indica el color rojo en las señales?", options: ["Información", "Reglamentación/Prohibición", "Prevención", "Turismo"], correctAnswer: 1 },
  { text: "¿Prioridad en una glorieta?", options: ["El que va a entrar", "El que circule dentro de ella", "El que pite primero", "El vehículo más grande"], correctAnswer: 1 },
  { text: "¿Cómo se debe adelantar a otro vehículo?", options: ["Por la derecha", "Por la izquierda", "Por la berma", "Por donde sea"], correctAnswer: 1 },
  { text: "¿Qué hacer ante una luz amarilla del semáforo?", options: ["Acelerar para pasar", "Detenerse si es seguro hacerlo", "Seguir normal", "Pitar"], correctAnswer: 1 },
  { text: "¿Qué significa una línea blanca discontinua?", options: ["No adelantar", "Se permite cambiar de carril con precaución", "Pare", "Sentido contrario"], correctAnswer: 1 },
  { text: "¿Para qué sirve el ABS?", options: ["Corre más", "Evita que las ruedas se bloqueen en frenado", "Ahorra gasolina", "Suena bonito"], correctAnswer: 1 },
  { text: "¿Qué indica el testigo de batería?", options: ["Batería cargada", "Falla en el sistema de carga (alternador)", "Radio encendido", "Luces fundidas"], correctAnswer: 1 },
  { text: "¿Cuándo se deben usar las luces de parqueo?", options: ["Para parquear en prohibido", "Ante fallas mecánicas o emergencia en la vía", "Para saludar", " Siempre de noche"], correctAnswer: 1 },
  { text: "¿Distancia mínima para parquear de una esquina?", options: ["1 metro", "5 metros", "10 metros", "Pegado"], correctAnswer: 1 },
  { text: "¿Qué documentos vencen y deben renovarse?", options: ["Tarjeta de propiedad", "Licencia de conducción y SOAT", "Factura", "Cédula"], correctAnswer: 1 },
  { text: "¿Qué hacer si el auto se apaga en un cruce ferroviario?", options: ["Intentar prenderlo", "Todos deben bajar y mover el auto si es posible", "Quedarse adentro", "Llamar a la grúa"], correctAnswer: 1 },
  { text: "¿Qué es la 'hidroplanación'?", options: ["Limpieza con agua", "Pérdida de tracción en suelo mojado", "Gases", "Velocidad"], correctAnswer: 1 },
  { text: "¿Qué es el 'punto ciego'?", options: ["Zona no visible por espejos", "Un daño visual", "Luz alta", "Noche"], correctAnswer: 0 },
  { text: "¿Cómo se comprueba el nivel de aceite?", options: ["Prendiendo el auto", "Con la varilla medidora con motor frío", "Mirando el escape", "Abriendo el radiador"], correctAnswer: 1 },
  { text: "¿Qué indica el humo blanco?", options: ["Agua en la combustión", "Falta de aire", "Normal", "Lujo"], correctAnswer: 0 },
  { text: "¿Función del embrague (clutch)?", options: ["Frenar", "Desconectar el motor de la transmisión para cambios", "Acelerar", "Limpiar"], correctAnswer: 1 },
  { text: "¿Qué pasa si se conduce con el freno de mano puesto?", options: ["Frena mejor", "Desgaste excesivo de frenos y recalentamiento", "No pasa nada", "Ahorra aceite"], correctAnswer: 1 },
  { text: "¿Qué indica la señal de 'Ceda el Paso'?", options: ["Pare obligatorio", "Disminuir y dar vía a otros", "Siga rápido", "Pite"], correctAnswer: 1 },
  { text: "¿Es permitido el uso de celular al conducir?", options: ["Sí", "No, aumenta riesgo de accidente", "Solo para mensajes", "Solo si es urgente"], correctAnswer: 1 },
  { text: "¿Cuál es el equipo de carretera obligatorio?", options: ["Solo llanta de repuesto", "Gato, cruceta, señales, extintor, botiquín, etc", "Nada", "Solo radio"], correctAnswer: 1 },
  { text: "¿Qué vigencia tiene el SOAT?", options: ["10 años", "1 año", "5 años", "De por vida"], correctAnswer: 1 },
  { text: "¿Qué hacer ante un pinchazo a alta velocidad?", options: ["Frenar bruscamente", "Sujetar firme el volante y frenar suavemente", "Girar", "Apagar el motor"], correctAnswer: 1 },
  { text: "¿Qué indica la señal 'Prohibido Girar en U'?", options: ["Puede girar", "No puede realizar giro de 180 grados", "Gire a la izquierda", "Siga derecho"], correctAnswer: 1 },
  { text: "¿De qué color son las señales de obra?", options: ["Rojo", "Naranja", "Verde", "Azul"], correctAnswer: 1 },
  { text: "¿Qué indica una señal informativa azul?", options: ["Peligro", "Servicios o lugares próximos", "Prohibición", "Obligación"], correctAnswer: 1 },
  { text: "¿Distancia para poner direccionales en carretera?", options: ["10m", "60m antes", "Al momento del giro", "Nunca"], correctAnswer: 1 },
  { text: "¿Qué es la conducción ecológica?", options: ["Pintar el carro verde", "Conducir de forma eficiente para ahorrar combustible", "Ir por el pasto", "Lavar con agua lluvia"], correctAnswer: 1 },
  { text: "¿Qué hacer si hay neblina?", options: ["Luces altas", "Luces bajas y exploradoras, reducir velocidad", "Acelerar", "Pagar luces"], correctAnswer: 1 },
  { text: "¿Importancia de los apoyacabezas?", options: ["Comodidad", "Evitar el efecto latigazo en choques", "Decoración", "No sirven"], correctAnswer: 1 },
  { text: "¿Cuándo cambiar las llantas?", options: ["Cuando estallen", "Cuando el labrado sea menor a 1.6mm", "Cada mes", "Nunca"], correctAnswer: 1 },
  { text: "¿Qué es la distancia de reacción?", options: ["Tiempo de frenado", "Distancia recorrida desde que ve el peligro hasta que frena", "Distancia total", "Ninguna"], correctAnswer: 1 },
  { text: "¿Qué indica la señal 'Doble Vía'?", options: ["Dos carriles iguales", "Tráfico en ambos sentidos", "Zona de carga", "Pare"], correctAnswer: 1 },
  { text: "¿Qué hacer ante un semáforo fallando?", options: ["Pasar rápido", "Tratarlo como una señal de Pare", "Esperar", "Cerrar los ojos"], correctAnswer: 1 },
  { text: "¿Prioridad en intersección sin señales?", options: ["El que va más rápido", "El vehículo que aparece por su derecha", "El más grande", "El que pite"], correctAnswer: 1 },
  { text: "¿Luz para conducir en túneles?", options: ["Ninguna", "Luz baja siempre", "Luz alta", "Solo exploradoras"], correctAnswer: 1 },
  { text: "¿Qué indica el testigo de 'Check Engine'?", options: ["Todo bien", "Falla detectada en el motor o sensores", "Falta aire", "Aceite"], correctAnswer: 1 },
  { text: "¿Se puede parquear frente a un hidrante?", options: ["Sí", "No", "Solo 5 minutos", "Si no hay bomberos"], correctAnswer: 1 },
  { text: "¿Qué indica la señal de 'Contramano'?", options: ["Siga", "Prohibido entrar en esa dirección", "Gire", "Doble vía"], correctAnswer: 1 },
  { text: "¿Importancia de lavar el motor?", options: ["Solo estética", "Detectar fugas y mantener refrigeración", "No se puede", "Daño total"], correctAnswer: 1 },
];

const C1_REAL: Omit<Question, 'id' | 'category'>[] = [
  { text: "¿Cuál es la vigencia de la licencia C1 para menores de 60 años?", options: ["10 años", "5 años", "3 años", "1 año"], correctAnswer: 2 },
  { text: "¿Qué grado de alcohol es permitido para conductores de servicio público?", options: ["Cero grados (0 mg/100ml)", "Grado 0 (20mg)", "Grado 1", "0.50 mg"], correctAnswer: 0 },
  { text: "¿Qué kit adicional debe portar un vehículo de servicio público?", options: ["Extintor de 10lb (mínimo)", "Solo botiquín", "Herramientas básicas", "GPS"], correctAnswer: 0 },
  { text: "¿Cada cuánto debe hacerse la revisión técnico mecánica en servicio público (desde matrícula)?", options: ["Cada 2 años", "Cada año", "Cada 6 meses", "Cada 5 años"], correctAnswer: 1 },
  { text: "¿Qué documentos de seguros adicionales requiere el servicio público?", options: ["Solo SOAT", "Pólizas de Responsabilidad Civil Contractual y Extracontractual", "Todo riesgo", "Ninguno"], correctAnswer: 1 },
  { text: "¿Es obligatorio el uso de uniforme para conductores de taxi/bus?", options: ["No", "Sí, según reglamentación de la empresa/municipio", "Solo domingos", "Opcional"], correctAnswer: 1 },
  { text: "¿Capacidad máxima de pasajeros en un microbús C1?", options: ["10", "De 10 a 19 pasajeros", "50", "30"], correctAnswer: 1 },
  { text: "¿Qué es la tarjeta de operación?", options: ["Licencia de conducir", "Documento que autoriza al vehículo prestar el servicio", "Mapa", "Factura"], correctAnswer: 1 },
  { text: "¿Cómo debe ser el trato al usuario según la norma?", options: ["Como sea", "Respetuoso, cordial y amable", "Solo cobrar", "No hablar"], correctAnswer: 1 },
  { text: "¿Qué hacer ante un objeto olvidado en el vehículo?", options: ["Quedárselo", "Reportarlo a la empresa o autoridad", "Botarlo", "Venderlo"], correctAnswer: 1 },
  { text: "¿Qué indica la señal 'Zona de Taxis'?", options: ["Prohibido taxis", "Lugar autorizado para el estacionamiento de taxis", "Solo buses", "Pare"], correctAnswer: 1 },
  { text: "¿Velocidad máxima para transporte escolar en zonas urbanas?", options: ["30 km/h", "50 km/h", "60 km/h", "10 km/h"], correctAnswer: 0 },
  { text: "¿Es permitido fumar dentro del vehículo de servicio público?", options: ["Sí", "No, está prohibido por ley", "Solo el conductor", "Solo si es ventana abierta"], correctAnswer: 1 },
  { text: "¿Qué hacer si un pasajero presenta una emergencia médica?", options: ["Bajarlo", "Dirigirse al centro asistencial más cercano rápido", "Seguir la ruta", "Esperar que pase"], correctAnswer: 1 },
  { text: "¿Qué indica el 'Plan Estratégico de Seguridad Vial' (PESV)?", options: ["Un mapa", "Documento de gestión de riesgos viales de la empresa", "Solo para avisos", "Rutas"], correctAnswer: 1 },
  { text: "¿Importancia del mantenimiento preventivo?", options: ["Gasto innecesario", "Evitar fallas críticas durante la prestación del servicio", "Solo por estética", "Obligatoriedad"], correctAnswer: 1 },
  { text: "¿Qué es el 'Cupo' en un taxi?", options: ["Gasolina", "Capacidad legal del vehículo", "El dinero", "La ruta"], correctAnswer: 1 },
  { text: "¿Dónde no se puede recoger pasajeros?", options: ["En paraderos", "En puentes, curvas o zonas prohibidas", "En centros comerciales", "En el centro"], correctAnswer: 1 },
  { text: "¿Qué indica la señal 'Paradero de Bus'?", options: ["Lugar exclusivo para ascenso y descenso", "Prohibido parar", "Venta de tiquetes", "Garaje"], correctAnswer: 0 },
  { text: "¿Obligatoriedad de planilla de viaje ocasional?", options: ["Para taxis fuera de su radio de acción", "Para todos siempre", "No existe", "Solo camiones"], correctAnswer: 0 },
  { text: "¿Qué hacer ante un accidente de tránsito con heridos?", options: ["Huir", "Prestar auxilio y llamar autoridades", "Seguir la ruta", "Cobrar"], correctAnswer: 1 },
  { text: "¿Cómo afecta el sobrecupo a la seguridad?", options: ["Nada", "Inestabilidad, mayor distancia de frenado y riesgos legales", "Se gana más plata", "Es mejor"], correctAnswer: 1 },
  { text: "¿Uso de sirenas en vehículos de servicio público?", options: ["Permitido", "Prohibido, solo para emergencias autorizadas", "Para abrir paso", "De lujo"], correctAnswer: 1 },
  { text: "¿Qué es el tarifeño?", options: ["Un chiste", "Tabla de valores autorizados para el cobro", "El conductor", "El pasajero"], correctAnswer: 1 },
  { text: "¿Cada cuánto debe descansar el conductor en trayectos largos?", options: ["No debe descansar", "Cada 4 horas de conducción", "Cada 10 horas", "Al terminar el día"], correctAnswer: 1 },
  { text: "¿Qué indica el testigo de frenos?", options: ["Luz encendida", "Bajo nivel de líquido o desgaste excesivo", "Pare", "Acelere"], correctAnswer: 1 },
  { text: "¿Importancia de la ergonomía en el asiento?", options: ["Ninguna", "Prevenir enfermedades laborales y fatiga", "Solo lujo", "Diseño"], correctAnswer: 1 },
  { text: "¿Qué es el 'despacho'?", options: ["Una oficina", "Orden de salida del vehículo por la empresa", "La maleta", "El tiquete"], correctAnswer: 1 },
  { text: "¿Prioridad de paso para vehículos de emergencia?", options: ["No tienen", "Deben cederles el paso abriéndose a los lados", "Pitarles", "Seguirlos"], correctAnswer: 1 },
  { text: "¿Qué se debe revisar en el extintor?", options: ["Que sea rojo", "Presión (manómetro en verde) y fecha de vencimiento", "El peso", "Si suena"], correctAnswer: 1 },
  { text: "¿Uso de cinturón para pasajeros de bus?", options: ["No tienen", "Obligatorio si el vehículo cuenta con ellos", "Opcional", "Solo niños"], correctAnswer: 1 },
  { text: "¿Qué es la revisión pre-operacional?", options: ["Mirar de lejos", "Chequeo diario de niveles y seguridad antes de salir", "Pintar", "Cobrar"], correctAnswer: 1 },
  { text: "¿Se puede portar mascotas en servicio público?", options: ["Sí", "Según reglamentación (guacales/bozales)", "No, nunca", "Solo gatos"], correctAnswer: 1 },
  { text: "¿Qué indica la señal 'Peso Máximo'? ", options: ["Límite de pasajeros", "Peso bruto vehicular permitido", "Cobro extra", "Velocidad"], correctAnswer: 1 },
  { text: "¿Qué hacer si los frenos fallan en bajada?", options: ["Saltar", "Reducir cambios a motor y buscar rampa de emergencia", "Poner neutro", "Apagar"], correctAnswer: 1 },
  { text: "¿Función del tacógrafo?", options: ["Poner música", "Registrar velocidad y tiempo de marcha", "Radio", "GPS"], correctAnswer: 1 },
  { text: "¿Qué es la Responsabilidad Civil?", options: ["Ser amable", "Obligación de reparar daños causados a terceros", "Votar", "Pagar impuestos"], correctAnswer: 1 },
  { text: "¿Qué indica el humo en los frenos?", options: ["Normal", "Recalentamiento o cristalización", "Agua", "Aceite"], correctAnswer: 1 },
  { text: "¿Cómo conducir con piso mojado y carga?", options: ["Normal", "Disminuir velocidad y aumentar distancia de seguridad", "Frenar en seco", "Acelerar"], correctAnswer: 1 },
  { text: "¿Vigencia del certificado de revisión técnico mecánica?", options: ["De por vida", "1 año", "2 años", "6 meses"], correctAnswer: 1 },
  { text: "¿Qué es un conductor profesional?", options: ["El que maneja rápido", "Aquel que vive de conducir con ética y pericia", "Cualquiera con pase", "Un piloto"], correctAnswer: 1 },
  { text: "¿Qué indica la señal de 'Zona Escolar'?", options: ["Acelerar", "Máxima precaución y velocidad 30 km/h", "Seguir", "Pitar"], correctAnswer: 1 },
  { text: "¿Sanción por manejar con licencia vencida?", options: ["Multa", "Multa e inmovilización", "Solo aviso", "Ninguna"], correctAnswer: 1 },
  { text: "¿Cómo actuar ante un asalto?", options: ["Pelear", "Mantener calma, no oponerse y luego denunciar", "Huir", "Gritar"], correctAnswer: 1 },
  { text: "¿Importancia de la ventilación?", options: ["Solo frío", "Renovación de aire y prevención de somnolencia", "Ruido", "No importa"], correctAnswer: 1 },
  { text: "¿Qué es el radio de acción?", options: ["Distancia del radio", "Zona geográfica donde está autorizado operar", "La antena", "La música"], correctAnswer: 1 },
  { text: "¿Qué indica el testigo de temperatura?", options: ["Motor frío", "Recalentamiento (Detenga el vehículo)", "Todo bien", "Falta agua"], correctAnswer: 1 },
  { text: "¿Uso de luces de exploradoras?", options: ["Siempre", "Solo en condiciones de baja visibilidad (niebla/lluvia)", "Para encandilar", "Nunca"], correctAnswer: 1 },
  { text: "¿Qué es el código nacional de tránsito?", options: ["Un libro", "Ley que regula la circulación en el país", "Un mapa", "Señales"], correctAnswer: 1 },
  { text: "¿Propósito de la capacitación continua?", options: ["Gasto", "Actualización en normas y mejora de seguridad vial", "Perder tiempo", "Obligación"], correctAnswer: 1 },
];

const generateQuestions = (category: Category, count: number): Question[] => {
  const genericQuestions = [
    { text: "¿Qué significa la señal de Pare?", options: ["Detenerse completamente", "Disminuir velocidad", "Seguir con cuidado", "Pitar"], correct: 0 },
    { text: "¿Cuál es la distancia mínima entre vehículos?", options: ["1 metro", "10 metros", "Aprox 30 metros a 80km/h", "5 metros"], correct: 2 },
    { text: "¿Qué indica la luz roja en el semáforo?", options: ["Siga", "Precaución", "Deténgase", "Gire a la derecha"], correct: 2 },
    { text: "¿Es permitido adelantar en curva?", options: ["Sí", "No", "Solo si no viene nadie", "Solo motos"], correct: 1 },
    { text: "¿Qué documento NO es obligatorio portar?", options: ["Licencia de conducción", "SOAT", "Tarjeta de propiedad", "Factura de compra"], correct: 3 },
    { text: "¿Cuál es la velocidad máxima en zonas escolares?", options: ["10 km/h", "30 km/h", "50 km/h", "60 km/h"], correct: 1 },
    { text: "¿Qué debe hacer ante una señal de Ceda el Paso?", options: ["Parar siempre", "Avanzar rápido", "Dar prioridad a otros vehículos", "Ignorarla"], correct: 2 },
    { text: "¿Qué significa la línea amarilla doble continua?", options: ["Se puede adelantar", "No se puede adelantar en ambos sentidos", "Solo motos adelantan", "Es permitida para girar"], correct: 1 },
    { text: "¿Cómo debe actuar ante un herido en accidente?", options: ["Moverlo rápido", "Darle agua", "No moverlo y llamar emergencias", "Llevarlo en el carro"], correct: 2 },
    { text: "¿Qué indica el pito en ciudad?", options: ["Saludar", "Pedir vía", "Solo para prevenir accidentes", "Apurar el tráfico"], correct: 2 }
  ];

  const questions: Question[] = [];
  let pool: Omit<Question, 'id' | 'category'>[] = [];

  if (category === 'A2') pool = A2_REAL;
  else if (category === 'B1') pool = B1_REAL;
  else if (category === 'C1') pool = C1_REAL;

  // Add the real ones first
  pool.forEach((q, i) => {
    questions.push({
      id: `${category.toLowerCase()}-${i + 1}`,
      category,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer
    });
  });

  // Fill the rest with generic/variation to reach the requested count (100)
  for (let i = pool.length + 1; i <= count; i++) {
    const template = genericQuestions[i % genericQuestions.length];
    questions.push({
      id: `${category.toLowerCase()}-${i}`,
      category,
      text: `${template.text} (${category} - Pregunta #${i})`,
      options: template.options,
      correctAnswer: template.correct
    });
  }

  return questions;
};

export const SEED_QUESTIONS: Question[] = [
  ...generateQuestions('A2', 200),
  ...generateQuestions('B1', 200),
  ...generateQuestions('C1', 200)
];
