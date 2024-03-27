const professors = [
  {
    name: "Jesse Apac",
    expertise: ["Science", "Math"],
    availability: {
      mon: "Afternoon",
      tues: "Morning",
      wed: "Not available",
      thurs: "Not available",
      fri: "Afternoon",
      sat: "Morning",
    },
  },
  {
    name: "Ayo Repaso",
    expertise: ["Science", "Filipino"],
    availability: {
      mon: "Afternoon",
      tues: "Morning",
      wed: "Not available",
      thurs: "Not available",
      fri: "Afternoon",
      sat: "Morning",
    },
  },
  {
    name: "Leenard Zarate",
    expertise: ["English", "Math"],
    availability: {
      mon: "Afternoon",
      tues: "Morning",
      wed: "Not available",
      thurs: "Not available",
      fri: "Afternoon",
      sat: "Morning",
    },
  },
];

const rooms = [
  {
    room_no: "12",
    availability: {
      mon: "Afternoon",
      tues: "Morning",
      wed: "Whole day",
      thurs: "Afternoon",
      fri: "Afternoon",
      sat: "Morning",
    },
  },
  {
    room_no: "13",
    availability: {
      mon: "Afternoon",
      tues: "Whole day",
      wed: "Whole day",
      thurs: "Whole day",
      fri: "Afternoon",
      sat: "Morning",
    },
  },
];

const days = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
const subjects = ["Science", "Math", "English", "Filipino"];

function InitializedSchedule(professors, rooms, subjects, days) {
  const schedule = [];
  const time_range = ["Morning", "Afternoon", "Evening"];
  for (let i = 0; i < subjects.length; i++) {
    let row = {
      professor: professors[Math.floor(Math.random() * professors.length)],
      subject: subjects[i],
      room: rooms[Math.floor(Math.random() * rooms.length)].room_no,
      time: time_range[Math.floor(Math.random() * time_range.length)],
      day: days[Math.floor(Math.random() * days.length)],
    };
    schedule.push(row);
  }
  return schedule;
}

function calculateFitness(schedule) {
  // BEST FIT IS 5 * Subject.length. ie 5 subject. best fit is 25
  let fitness = 0;
  schedule.forEach((sched, rowIndex, scheduleArray) => {
    const professor = professors.find((p) => p.name === sched.professor.name);
    const room = rooms.find((r) => r.room_no === sched.room);

    // BEST FIT SCORE IS 5

    const subjectWeight = 1.5;
    const professorWeight = 1.0;
    const roomWeight = 0.5;
    const noConflictWeight = 2.0;

    if (professor.expertise.includes(sched.subject)) fitness += subjectWeight;
    if (
      professor.availability[sched.day.toLowerCase()] === "Whole day" ||
      professor.availability[sched.day.toLowerCase()] === sched.time
    )
      fitness += professorWeight;
    if (
      room.availability[sched.day.toLowerCase()] === "Whole day" ||
      room.availability[sched.day.toLowerCase()] === sched.time
    )
      fitness += roomWeight;
    const consecutiveDayPenaltyWeight = 1.0;
    scheduleArray.forEach((otherSchedule, otherRowIndex) => {
      if (
        otherRowIndex !== rowIndex &&
        otherSchedule.professor.name === sched.professor.name &&
        otherSchedule.subject === sched.subject
      ) {
        const dayDifference = Math.abs(
          days.indexOf(sched.day) - days.indexOf(otherSchedule.day)
        );

        fitness -= consecutiveDayPenaltyWeight * dayDifference;
      }
    });

    const hasConflicts = scheduleArray.some(
      (otherSchedule, otherRowIndex) =>
        otherRowIndex !== rowIndex &&
        otherSchedule.day === sched.day &&
        otherSchedule.time === sched.time &&
        otherSchedule.room === sched.room
    );

    if (!hasConflicts) {
      fitness += noConflictWeight;
    }
  });

  return fitness;
}

function geneticAlgorithn() {
  const generations = 1000;
  const mutationChance = 0.1;

  let currentSchedule = InitializedSchedule(professors, rooms, subjects, days);

  for (let generation = 0; generation < generations; generation++) {
    let newSchedule = currentSchedule;
    if (Math.random() <= mutationChance)
      newSchedule = mutation(currentSchedule);
  }
}

function mutation(schedule) {
  // Mutate a random schedule entry
  const rowIndex = Math.floor(Math.random() * schedule.length);

  const mutatedSchedule = JSON.parse(JSON.stringify(schedule)); // Deep copy
  mutatedSchedule[rowIndex].time = getRandomTime();
  mutatedSchedule[rowIndex].day = getRandomDay();

  return mutatedSchedule;
}

function crossover(parent1, parent2) {
  // Select a random crossover point
  const crossoverPoint = Math.floor(Math.random() * parent1.length);

  // Create a new child schedule by combining the first part of parent1 with the second part of parent2
  const childSchedule = [
    ...parent1.slice(0, crossoverPoint),
    ...parent2.slice(crossoverPoint),
  ];

  return childSchedule;
}

function selectParent(population) {
  // This is a simple tournament selection; you can use other methods
  const tournamentSize = 5;
  let bestParent = null;

  for (let i = 0; i < tournamentSize; i++) {
    const randomIndex = Math.floor(Math.random() * population.length);
    const candidate = population[randomIndex];

    if (!bestParent || candidate.fitness > bestParent.fitness) {
      bestParent = candidate;
    }
  }

  return bestParent;
}

function getRandomTime() {
  const time_range = ["Morning", "Afternoon", "Evening"];
  return time_range[Math.floor(Math.random() * time_range.length)];
}

function getRandomDay() {
  const days = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
  return days[Math.floor(Math.random() * days.length)];
}

function geneticAlgorithm(populationSize, generations) {
  let population = [];

  // Initialize the population
  for (let i = 0; i < populationSize; i++) {
    population.push({
      schedule: InitializedSchedule(professors, rooms, subjects, days),
      fitness: 0,
    });
  }

  for (let generation = 0; generation < generations; generation++) {
    // Evaluate fitness for each individual in the population
    population = population.map((individual) => ({
      schedule: individual.schedule,
      fitness: calculateFitness(individual.schedule),
    }));

    // Sort the population by fitness (descending order)
    population.sort((a, b) => b.fitness - a.fitness);

    // Create a new population through selection, crossover, and mutation
    const newPopulation = [];
    while (newPopulation.length < populationSize) {
      const parent1 = selectParent(population).schedule;
      const parent2 = selectParent(population).schedule;

      const child = crossover(parent1, parent2);

      if (Math.random() < mutationChance) {
        mutation(child);
      }

      newPopulation.push({
        schedule: child,
        fitness: calculateFitness(child),
      });
    }

    population = newPopulation;
  }

  // Return the best schedule from the final population
  const bestSchedule = population[0];
  return bestSchedule;
}

// Example usage:
const mutationChance = 0.1;
const populationSize = 100;
const generations = 100;

const bestSchedule = geneticAlgorithm(populationSize, generations);
console.log("Best Schedule:");
console.dir(bestSchedule, { depth: null });
