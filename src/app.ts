import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

enum SupportedFlag {
  OW = 'ow',
  GSUPPS = 'gsupps',
  HALO = 'halo'
}
// type SupportedFlag = 'ow' | 'gsupps' | 'halo';

type FilepathByFlag = Record<SupportedFlag, string>;
const chosenFilepathBySupportedFlags: FilepathByFlag = {
  'ow': '../../chosen/chosenOw.json',
  'gsupps': '../../chosen/chosenGsupps.json',
  'halo': '../../chosen/chosenHalo.json'
}

const listFilepathBySupportedFlags: FilepathByFlag = {
  'ow': '../../lists/overwatch2.txt',
  'gsupps': '../../lists/gsupps.txt',
  'halo': '../../lists/halo.txt'
}

const chosenFilepath = '../../chosen'

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
  const chosen: { [item: string]: number } = {};
  list.forEach((item) => {
    chosen[item] = 1;
  })

  const flag = getFlag();
  const chosenFilepath = chosenFilepathBySupportedFlags[flag];
  if (chosenFilepath) {
    const relativePath = getRelativePath(chosenFilepath);
    if (fs.existsSync(relativePath)) {
      try {
        const content = await fsp.readFile(relativePath);
        const chosenFromFile = JSON.parse(content.toString()) as any;
        Object.keys(chosen).forEach((key) => {
          if (chosenFromFile[key]) {
            chosen[key] = chosenFromFile[key]
          }
        })
      } catch (e) {
        console.log('Error while reading file: ', e);
      }
    } else {
      try {
        // TODO I can't get this to work. It just errors instead of creating the file
        const fileHandle = await fsp.open(relativePath, 'w');
        await fileHandle.writeFile(JSON.stringify(chosen));
        await fileHandle.close();
      } catch (e) {
        console.log('Error while creating chosen file', e);
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
    // TODO I can't get this to generate the file if it doesn't exist
    const fileHandle = await fsp.open(relativePath, 'w');
    await fileHandle.writeFile(JSON.stringify(chosen));
    await fileHandle.close();
  } catch (e) {
    console.log('Error while updating chosen', e);
  }
}

init();