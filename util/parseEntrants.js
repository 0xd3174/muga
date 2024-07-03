import {
  appendFileSync,
  writeFileSync,
  readdirSync,
  constants as fsconstants,
  mkdirSync,
  accessSync
} from "node:fs";
import { resolve, dirname } from "node:path";
import { rimraf } from "rimraf";

const BASE_API_URL = "https://urfu.ru/api/entrant/"
const OUTPUT_PATH = resolve(dirname(new URL(import.meta.url).pathname), "..", "src", "entrants");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function getEntrants(page, size) {
  let raw;

  try {
    raw = await fetch(`${BASE_API_URL}?page=${page}&size=${size}`);
  } catch (err) {
    console.log(err)
  }

  return raw.json();
}

async function writeToEntrants(list) {
  if (!list.page || !list.size) {
    console.log('Неизвестная ошибка!')
    process.exit(1)
  }

  for (let entrant of list.items) {
    for (let application of entrant.applications) {
      // Защита от недопустимых символов в названии ОП
      const programName = application.program.replace(/[\/\\\?\%\*\:\|\"\'><]/g, '');
      let programPath = resolve(OUTPUT_PATH, programName);
      // Защита от слишком длинных названий ОП
      if (programPath.length > 120) {
        programPath = programPath.slice(0, 120);
      }
      programPath += '.json';

      const entrantInfo = JSON.stringify({
        regnum: entrant.regnum,
        snils: entrant.snils,
        total_mark: application.total_mark,
        original: application.edu_doc_original,
        priority: application.priority,
        status: application.status,
        competition: application.competition,
        compensation: application.compensation
      });

      try {
        accessSync(programPath, fsconstants.F_OK);
        appendFileSync(programPath, "," + entrantInfo);
      } catch (err) {
        writeFileSync(programPath, '[' + entrantInfo);
      }
    }
  }

  // console.log("Обработана одна страница!")
}

async function main() {
  // Подготовка к записи файлов
  await rimraf(OUTPUT_PATH);
  mkdirSync(OUTPUT_PATH, { recursive: true });

  let entrantsAmount = await getEntrants(1, 5);

  if (!entrantsAmount.count) throw "Unknown error";

  entrantsAmount = entrantsAmount.count;
  const pagesNumber = Math.ceil(entrantsAmount / 100)

  for (let i = 1; i < pagesNumber+1; i++) {
    await sleep(1000 + getRandomNumber(0, 500));

    await writeToEntrants(await getEntrants(i, 100));
  }

  // Закрываем JSONы
  const tempFiles = readdirSync(OUTPUT_PATH);
  for (let file of tempFiles) {
    appendFileSync(resolve(OUTPUT_PATH, file), ']')
  }
}

main()