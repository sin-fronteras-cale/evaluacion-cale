const fs = require('fs/promises');
const path = require('path');

const CATEGORIES = ['A2', 'B1', 'C1'];
const TARGET_PER_CATEGORY = 100;

const fillerPools = {
  A2: [
    {
      text: 'Velocidad maxima en zona escolar?',
      options: ['20 km/h', '30 km/h', '50 km/h', '60 km/h'],
      correctAnswer: 1
    },
    {
      text: 'Linea amarilla doble continua indica?',
      options: ['Adelantar permitido', 'Prohibido adelantar', 'Zona de parqueo', 'Carril exclusivo'],
      correctAnswer: 1
    },
    {
      text: 'Uso obligatorio del casco en moto?',
      options: ['Solo en carretera', 'Solo de noche', 'Siempre', 'Solo con pasajero'],
      correctAnswer: 2
    },
    {
      text: 'Distancia segura de seguimiento a 80 km/h?',
      options: ['5 m', '10 m', '30 m', '60 m'],
      correctAnswer: 2
    }
  ],
  B1: [
    {
      text: 'Velocidad maxima en zona residencial?',
      options: ['20 km/h', '30 km/h', '50 km/h', '60 km/h'],
      correctAnswer: 1
    },
    {
      text: 'Semaforo amarillo indica?',
      options: ['Acelerar', 'Detenerse si es seguro', 'Girar en U', 'Ignorar'],
      correctAnswer: 1
    },
    {
      text: 'Cinturon obligatorio en asientos traseros?',
      options: ['No', 'Solo en carretera', 'Si, siempre', 'Solo para ninos'],
      correctAnswer: 2
    },
    {
      text: 'Senal de Pare indica?',
      options: ['Disminuir velocidad', 'Detenerse completamente', 'Pitar y seguir', 'Girar sin parar'],
      correctAnswer: 1
    }
  ],
  C1: [
    {
      text: 'Velocidad maxima transporte escolar en zona urbana?',
      options: ['30 km/h', '40 km/h', '50 km/h', '60 km/h'],
      correctAnswer: 0
    },
    {
      text: 'Revision tecnico-mecanica servicio publico cada?',
      options: ['2 anos', '1 ano', '6 meses', '5 anos'],
      correctAnswer: 1
    },
    {
      text: 'Uso de uniforme en servicio publico es?',
      options: ['No', 'Si, segun reglamentacion', 'Solo domingos', 'Opcional'],
      correctAnswer: 1
    },
    {
      text: 'Senal de paradero de bus indica?',
      options: ['Ascenso y descenso', 'Prohibido parar', 'Venta de tiquetes', 'Garaje'],
      correctAnswer: 0
    }
  ]
};

const isValidQuestion = (q) => {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.id !== 'string' || typeof q.category !== 'string') return false;
  if (typeof q.text !== 'string' || !Array.isArray(q.options)) return false;
  if (typeof q.correctAnswer !== 'number') return false;
  if (q.options.length < 2) return false;
  if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) return false;
  return CATEGORIES.includes(q.category);
};

const normalizeQuestion = (q) => {
  return {
    id: String(q.id),
    category: q.category,
    text: String(q.text),
    options: q.options.map(String),
    correctAnswer: Number(q.correctAnswer)
  };
};

const generateFillers = (category, existingIds, count) => {
  const pool = fillerPools[category];
  const fillers = [];
  let index = 1;
  while (fillers.length < count) {
    const candidateId = `${category.toLowerCase()}-${index}`;
    if (!existingIds.has(candidateId)) {
      const base = pool[fillers.length % pool.length];
      fillers.push({
        id: candidateId,
        category,
        text: base.text,
        options: base.options,
        correctAnswer: base.correctAnswer
      });
    }
    index += 1;
  }
  return fillers;
};

const main = async () => {
  const filePath = path.join(__dirname, '..', 'data', 'questions.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  let parsed = [];
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    parsed = [];
  }

  const valid = Array.isArray(parsed) ? parsed.filter(isValidQuestion).map(normalizeQuestion) : [];

  const grouped = {};
  CATEGORIES.forEach((cat) => {
    grouped[cat] = valid.filter((q) => q.category === cat);
  });

  const finalQuestions = [];
  CATEGORIES.forEach((cat) => {
    const current = grouped[cat];
    const existingIds = new Set(current.map((q) => q.id));
    const needed = Math.max(0, TARGET_PER_CATEGORY - current.length);
    const fillers = needed > 0 ? generateFillers(cat, existingIds, needed) : [];
    finalQuestions.push(...current, ...fillers);
  });

  await fs.writeFile(filePath, JSON.stringify(finalQuestions, null, 2));
  console.log(`Saved ${finalQuestions.length} questions to ${filePath}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
