const fs = require("fs/promises");

const read = async (type) => {
  switch (type) {
    case "professors":
      return JSON.parse(await fs.readFile("./data.json", "utf-8")).professors;

    case "rooms":
      return JSON.parse(await fs.readFile("./data.json", "utf-8")).rooms;

    case "curriculums":
      return JSON.parse(await fs.readFile("./data.json", "utf-8")).curriculums;

    default:
      return [];
  }
};

const getRandomTime = () => {
  const time_range = ["Morning", "Afternoon", "Evening"];
  return time_range[Math.floor(Math.random() * time_range.length)];
};

const getRandomDay = () => {
  const days = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
  return days[Math.floor(Math.random() * days.length)];
};

const calculateFitness = (schedules) => {
  let fitness = 0;
  const conflictSet = new Set();

  schedules.map((schedule, rowIndex, schedulesArr) => {
    const professor = schedule.professor;
    const room = schedule.room;

    /// double check if professor is qualified in the subject
    if (
      schedule.subject.expertise_required.some((exp) =>
        professor.expertise.includes(exp)
      )
    )
      fitness += 10;

    /// check if room availability is qualified according to the subject
    if (
      room.availability[schedule.day.toLowerCase()] === "Whole day" ||
      room.availability[schedule.day.toLowerCase()] ===
        schedule.time.toLowerCase()
    )
      fitness += 15;

    /// check if professor availability is qualified according to the subject
    if (
      professor.availability[schedule.day.toLowerCase()] === "Whole day" ||
      professor.availability[schedule.day.toLowerCase()] ===
        schedule.time.toLowerCase()
    )
      fitness += 15;

    /// check if schedule has conflict to other schedule
    const scheduleKey = `${schedule.day}_${schedule.time}_${schedule.room.room_no}`;
    if (conflictSet.has(scheduleKey)) {
    } else {
      conflictSet.add(scheduleKey);
      fitness += 60;
    }
  });

  return Math.abs(fitness / schedules.length);
};

const initialSchedule = (professors, rooms, curriculum) => {
  const schedule = [];
  const days = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
  const time_range = ["Morning", "Afternoon", "Evening"];

  let gym = rooms.filter((room) => room.gym === true);
  let lab = rooms.filter((room) => room.laboratory === true);
  let normalRoom = rooms.filter(
    (room) => room.gym !== true && room.laboratory !== true
  );

  for (let i = 0; i < curriculum.length; i++) {
    let qualifiedProfessor = professors.filter((prof) =>
      curriculum[i].expertise_required.some((exp) =>
        prof.expertise.includes(exp)
      )
    );

    let row = {
      professor:
        qualifiedProfessor[
          Math.floor(Math.random() * qualifiedProfessor.length)
        ],
      subject: curriculum[i],
      room: curriculum[i].required_gym
        ? gym[Math.floor(Math.random() * gym.length)]
        : curriculum[i].required_lab
        ? lab[Math.floor(Math.random() * gym.length)]
        : normalRoom[Math.floor(Math.random() * normalRoom.length)],
      time: time_range[Math.floor(Math.random() * time_range.length)],
      day: days[Math.floor(Math.random() * days.length)],
    };
    schedule.push(row);
  }
  return schedule;
};

const genetic = (
  professors,
  rooms,
  curriculum,
  populationSize,
  generations
) => {
  let population = [];
  const mutationChance = 0.1;

  const mutate = (schedules) => {
    const rowIndex = Math.floor(Math.random() * schedules.length);

    schedules[rowIndex].time = getRandomTime();
    schedules[rowIndex].day = getRandomDay();

    return schedules;
  };

  const selectParent = (population) => {
    const tournamentSize = 5;
    let bestParent = null;

    for (let i = 0; i < tournamentSize; i++) {
      const candidate =
        population[Math.floor(Math.random() * population.length)];

      if (!bestParent || candidate.fitness > bestParent.fitness) {
        bestParent = candidate;
      }
    }

    return bestParent;
  };

  const crossover = (parent1, parent2) => {
    const crossoverPoint = Math.floor(Math.random() * parent1.length);

    const childSchedule = [
      ...parent1.slice(0, crossoverPoint),
      ...parent2.slice(crossoverPoint),
    ];

    return childSchedule;
  };

  for (let _ = 0; _ < populationSize; _++) {
    population.push({
      schedule: initialSchedule(professors, rooms, curriculum),
      fitness: 0,
    });
  }

  for (let generation = 0; generation < generations; generation++) {
    population = population.map((individual) => ({
      schedule: individual.schedule,
      fitness: calculateFitness(individual.schedule),
    }));

    population.sort((a, b) => b.fitness - a.fitness);

    const newPopulation = [];

    while (newPopulation.length < population.length) {
      const parent1 = selectParent(population).schedule;
      const parent2 = selectParent(population).schedule;

      let child = crossover(parent1, parent2);

      if (Math.random() < mutationChance) {
        child = mutate(child);
      }

      newPopulation.push({
        schedule: child,
        fitness: calculateFitness(child),
      });

      population = newPopulation;
    }
  }

  return population[0];
};

(async () => {
  const professors = await read("professors");
  const rooms = await read("rooms");

  const curriculum = await read("curriculums");
  const CS_firstYear = await curriculum.CS_firstYear.firstSem;

  const sched = genetic(professors, rooms, CS_firstYear, 1000, 100000);
  console.dir(sched, { depth: null });
})();

module.exports = {
  calculateFitness,
};
