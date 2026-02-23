import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Cleaning up and fixing Supertaxis evaluation...');

    // Delete questions associated with Supertaxis evaluations first to avoid issues
    // (though cascade should handle it, let's be explicit if needed)
    await prisma.question.deleteMany({
        where: {
            OR: [
                { category: 'supertaxis' },
                { evaluationId: 'supertaxis' },
                { evaluation: { name: 'Supertaxis' } }
            ]
        }
    });

    // Delete evaluations named Supertaxis
    await prisma.evaluation.deleteMany({
        where: { name: 'Supertaxis' }
    });

    // Create the "official" one with fixed ID
    const evaluation = await prisma.evaluation.create({
        data: {
            id: 'supertaxis',
            name: 'Supertaxis',
            description: 'EVALUACIÓN – POLÍTICAS INTERNAS SUPERTAXIS',
            durationMinutes: 15,
            questionCount: 15,
            isActive: true,
            companyTag: 'supertaxis',
        }
    });

    console.log(`Created Evaluation: ${evaluation.name} with ID: ${evaluation.id}`);

    const questions = [
        { text: '¿Cuál es el objetivo principal de la Política SG-SST (PLT-SST-001)?', options: ['Reducir costos operativos', 'Identificar, evaluar y controlar peligros para proteger la vida', 'Incrementar productividad', 'Mejorar imagen corporativa'], correctAnswer: 1 },
        { text: 'Según la Política de Alcohol y SPA, está prohibido:', options: ['Consumir alcohol solo en la jornada laboral', 'Consumir energizantes antes de conducir', 'Presentarse bajo efectos de alcohol o sustancias psicoactivas', 'Fumar únicamente en la cabina'], correctAnswer: 2 },
        { text: 'El incumplimiento de la Política de Alcohol y SPA puede generar:', options: ['Advertencia verbal', 'Multa económica externa', 'Terminación de la relación laboral o contractual', 'Ninguna consecuencia'], correctAnswer: 2 },
        { text: 'El uso del chaleco reflectivo es obligatorio cuando:', options: ['El conductor lo considere necesario', 'Hay inspección policial', 'Se atiende una falla mecánica en ruta', 'Se está en oficina'], correctAnswer: 2 },
        { text: 'En la Política de Emergencias, todos los trabajadores deben:', options: ['Esperar instrucciones sin intervenir', 'Participar activamente en simulacros', 'Solo reportar al final del año', 'Actuar individualmente sin plan'], correctAnswer: 1 },
        { text: 'Antes de iniciar la marcha, el conductor debe verificar que:', options: ['El pasajero pagó', 'Todos los ocupantes tengan el cinturón abrochado', 'El GPS esté encendido', 'El celular esté cargado'], correctAnswer: 1 },
        { text: 'Según la Política de Riesgo Público, se debe:', options: ['Tomar atajos en zonas solitarias', 'Detenerse en cualquier lugar', 'Adoptar actitud preventiva y evitar zonas de alto riesgo', 'Priorizar rapidez sobre seguridad'], correctAnswer: 2 },
        { text: 'Las paradas obligatorias deben realizarse en:', options: ['Lugares desolados para evitar tráfico', 'Sitios seguros, poblados y con presencia de autoridades', 'Zonas oscuras', 'Lugares no autorizados'], correctAnswer: 1 },
        { text: 'Está prohibido transportar acompañantes en la cabina porque:', options: ['Reduce espacio', 'Es incómodo', 'Puede generar distracción y aumentar riesgo', 'No hay suficiente ventilación'], correctAnswer: 2 },
        { text: 'El Plan Estratégico de Seguridad Vial (PESV) se basa en el ciclo:', options: ['Inicio – Fin', 'Orden – Control', 'Planear – Hacer – Verificar – Actuar', 'Supervisar – Castigar'], correctAnswer: 2 },
        { text: 'El máximo de conducción permitido por jornada es de:', options: ['10 horas', '12 horas', '8 horas', '6 horas'], correctAnswer: 2 },
        { text: 'Después de 4 horas continuas de conducción se debe:', options: ['Continuar sin pausa', 'Hacer pausa activa mínima de 15 minutos', 'Cambiar de ruta', 'Apagar el GPS'], correctAnswer: 1 },
        { text: 'Mientras el vehículo está en movimiento está prohibido:', options: ['Ajustar el aire', 'Usar teléfono móvil y manos libres', 'Mirar espejos', 'Encender luces'], correctAnswer: 1 },
        { text: 'En zona urbana general el límite máximo de velocidad es de:', options: ['30 km/h', '50 km/h', '60 km/h', '80 km/h'], correctAnswer: 1 },
        { text: 'Se debe reducir la velocidad a 30 km/h cuando:', options: ['La vía está despejada', 'Se conduce de día', 'Hay lluvia, baja visibilidad o concentración de personas', 'El vehículo está vacío'], correctAnswer: 2 }
    ];

    let i = 1;
    for (const q of questions) {
        await prisma.question.create({
            data: {
                id: `supertaxis-${i}`,
                category: 'supertaxis',
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                evaluationId: 'supertaxis'
            }
        });
        i++;
    }

    console.log('Successfully fixed Supertaxis evaluation.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
