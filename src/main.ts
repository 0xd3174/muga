import './style.css'

const programs = import.meta.glob('./entrants/*.json');
const programsNames = Object.keys(programs).map(v => {
  // @ts-ignore
  return [v, v.split('/').at(-1)];
});

// const app = document.querySelector<HTMLDivElement>('#app')!;
const select = document.querySelector<HTMLSelectElement>('.chooseProgram')!;

const table = document.querySelector<HTMLTableElement>('.entrants')!
const tableHead = document.createElement('thead'); table.appendChild(tableHead);
const tableBody = document.createElement('tbody'); table.appendChild(tableBody);

let goalC = false,
  originalC = false,
  budgetC = false;

const goal = document.querySelector<HTMLInputElement>('.goal')!,
  original = document.querySelector<HTMLInputElement>('.original')!,
  budget = document.querySelector<HTMLInputElement>('.budget')!;

goal.addEventListener('change', (_e: Event) => {
  goalC = goal.checked;
  select.dispatchEvent(new Event('change'));
});
original.addEventListener('change', (_e: Event) => {
  originalC = original.checked;
  select.dispatchEvent(new Event('change'));
});
budget.addEventListener('change', (_e: Event) => {
  budgetC = budget.checked;
  select.dispatchEvent(new Event('change'));
});


for (let programName of programsNames) {
  select.innerHTML += `<option value="${programName[0]}">${programName[1]!.split('.')[0]}</option>`
}

select.addEventListener('change', async (_e) => {
  tableHead.innerHTML = `
    <tr>
        <td>Номер</td>
        <td>СНИЛС</td>
        <td>Балл ЕГЭ</td>
        <td>Оригиналы?</td>
        <td>Приоритет</td>
        <td>Статус</td>
        <td>Компетенция</td>
        <td>Компенсация</td>
    <tr>
  `

  const program = await programs[select.value]();
  // @ts-ignore
  const entrants = program.default.sort((a: any, b: any) => b.total_mark - a.total_mark);

  tableBody.innerHTML = ''
  for (let entrant of entrants) {
    if (goalC && entrant.competition === 'Целевая квота') continue;
    if (originalC && !entrant.original) continue;
    if (budgetC && entrant.compensation !== 'бюджетная основа') continue;

    tableBody.innerHTML += `
      <tr>
        <td>${entrant.regnum}</td>
        <td>${entrant.snils}</td>
        <td>${entrant.total_mark}</td>
        <td>${entrant.original ? 'Да' : 'Нет'}</td>
        <td>${entrant.priority}</td>
        <td>${entrant.status}</td>
        <td>${entrant.competition}</td>
        <td>${entrant.compensation}</td>
      </tr>
    `
  }
});