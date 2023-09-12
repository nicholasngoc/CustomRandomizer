import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const chosenFilepathBySupportedFlags = {
  'ow': '../../chosen/chosenOw.json',
  'gsupps': '../../chosen/chosenGsupps.json'
}

const listFilepathBySupportedFlags = {
  'ow': '../../lists/overwatch2.txt',
  'gsupps': '../../lists/gsupps.txt'

}

function getFlag(): string {
  try {
    // Note the third arg will be the list flag
    return process.argv[2];
  } catch (e) {
    console.log('Invalid args provided: ', e);
    throw e;
  }
}

function getRelativePath(_path: string) {
  return path.resolve(process.argv[1], _path);
}

async function getList(): Promise<string[] | null> {
  const flag = getFlag();
  const listFilePath = listFilepathBySupportedFlags[flag];
  if (!listFilePath) {
    return null;
  }

  const relativePath = getRelativePath(listFilePath);
  const list = await fsp.readFile(relativePath, 'utf8');
  return list.split('\r\n')
}

async function getChosen(list: string[]): Promise<{ [item: string]: number }> {
  let chosen: { [item: string]: number } = {};
  const flag = getFlag();
  const chosenFilepath = chosenFilepathBySupportedFlags[flag];
  if (chosenFilepath) {
    const relativePath = getRelativePath(chosenFilepath);
    if (fs.existsSync(relativePath)) {
      try {
        const content = await fsp.readFile(relativePath);
        chosen = JSON.parse(content.toString()) as any;
      } catch (e) {
        console.log('Error while reading file: ', e);
      }
    } else {
      list.forEach((item) => {
        chosen[item] = 1;
      })

      try {
        await fsp.writeFile(relativePath, JSON.stringify(chosen))
      } catch (e) {
        console.log('Error while writing file', e);
      }
    }
  }

  return chosen;
}

async function init() {
  const list = await getList();
  if (!list) {
    return;
  }

  const chosen = await getChosen(list);
  const cards = [];
  Object.keys(chosen).forEach((choice) => {
    for (let i = 0; i < chosen[choice]; i += 1) {
      cards.push(choice);
    }
  })
  const randInt = Math.floor(Math.random() * cards.length);
  const theChosen = cards[randInt];
  console.log('I have chosen: ', theChosen);

  Object.keys(chosen).forEach((choice) => {
    if (choice === theChosen) {
      chosen[choice] = 1;
    } else {
      chosen[choice] += 1
    }
  });

  const flag = getFlag();
  const chosenFilepath = chosenFilepathBySupportedFlags[flag];
  const relativePath = getRelativePath(chosenFilepath);
  try {
    await fsp.writeFile(relativePath, JSON.stringify(chosen))
  } catch (e) {
    console.log('Error while writing file', e);
  }
}

init();