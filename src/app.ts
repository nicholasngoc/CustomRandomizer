import fsp from 'fs/promises';
import path from 'path';

type ChosenFileFormat = {
  [filenameFlag: string]: {
    [item: string]: number
  }
}

function getFilenameFlag(): string {
  try {
    // Note the third arg will be the list flag
    return process.argv[2];
  } catch (e) {
    console.log('Invalid args provided: ', e);
    throw e;
  }
}

const filenameFlag = getFilenameFlag();

function getRelativePath(_path: string) {
  return path.resolve(process.argv[1], _path);
}

const chosenFilepath = getRelativePath('../../chosen.json');

async function getList(): Promise<string[] | null> {
  const listFilePath = getRelativePath(`../../lists/${filenameFlag}.txt`);
  if (!listFilePath) {
    return null;
  }

  const list = await fsp.readFile(listFilePath, 'utf8');
  return list.split('\r\n')
}

async function getChosen(): Promise<ChosenFileFormat> {
  try {
    const fileHandle = await fsp.open(chosenFilepath, 'a+');
    const content = await fileHandle.readFile({ encoding: 'utf8' });
    await fileHandle.close();
    return content.toString() ? JSON.parse(content.toString()) : {};
  } catch (e) {
    console.log('Error getting chosen', e);
    throw e;
  }
}

async function init() {
  const list = await getList();
  if (!list) {
    return;
  }

  const chosen = await getChosen();
  const chosenForFilenameFlag = chosen[filenameFlag] ? chosen[filenameFlag] : {};
  const cards = [];
  list.forEach((listItem) => {
    if (!chosenForFilenameFlag[listItem]) {
      chosenForFilenameFlag[listItem] = 1
    }

    for (let i = 0; i < chosenForFilenameFlag[listItem]; i += 1) {
      cards.push(listItem);
    }
  })

  const randInt = Math.floor(Math.random() * cards.length);
  const theChosen = cards[randInt];
  console.log('I have chosen: ', theChosen);

  Object.keys(chosenForFilenameFlag).forEach((listItem) => {
    if (listItem === theChosen) {
      chosenForFilenameFlag[listItem] = 1;
    } else {
      chosenForFilenameFlag[listItem] += 1
    }
  });

  console.log('New Top 3 Cards:')
  const topThreeCards = list.sort((listItem) => chosenForFilenameFlag[listItem] ?? 0)
    .slice(0, 3)
    .map(listItem => `${listItem}${chosenForFilenameFlag[listItem] ? `: ${chosenForFilenameFlag[listItem]}` : ''}`);
  console.log(`[${topThreeCards.join(', ')}]`)

  chosen[filenameFlag] = chosenForFilenameFlag;
  try {
    // TODO I can't get this to generate the file if it doesn't exist
    const fileHandle = await fsp.open(chosenFilepath, 'w');
    await fileHandle.writeFile(JSON.stringify(chosen));
    await fileHandle.close();
  } catch (e) {
    console.log('Error while updating chosen', e);
  }
}

init();