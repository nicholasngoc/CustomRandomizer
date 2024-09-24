import fsp from 'fs/promises';

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

const CHOSEN_FILEPATH = './chosen.json';

async function getList(): Promise<string[] | null> {
  const listFilePath = `./lists/${filenameFlag}.txt`;
  if (!listFilePath) {
    return null;
  }

  const list = await fsp.readFile(listFilePath, 'utf8');
  return list.split('\r\n')
}

async function getChosen(): Promise<ChosenFileFormat> {
  try {
    const fileHandle = await fsp.open(CHOSEN_FILEPATH, 'a+');
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
  let cards = [];
  list.sort((listItem1, listItem2) => chosenForFilenameFlag[listItem2] - chosenForFilenameFlag[listItem1])
  .forEach((listItem, index) => {
    if (!chosenForFilenameFlag[listItem]) {
      chosenForFilenameFlag[listItem] = 1
    }

    const cardCount = index <= 3
      ? Math.pow(chosenForFilenameFlag[listItem], 2)
      : chosenForFilenameFlag[listItem];
    for (let i = 0; i < cardCount; i += 1) {
      cards.push(listItem);
    }
  })

  // Randomize cards
  cards = cards.sort(() => Math.floor(Math.random() * cards.length - (cards.length / 2)));

  const randInt = Math.floor(Math.random() * cards.length);
  const theChosen = cards[randInt];
  console.log('I have chosen: ', theChosen);

  const updatedChosenForFilenameFlag = {};
  list.forEach((listItem) => {
    if (listItem === theChosen || !chosenForFilenameFlag[listItem]) {
      updatedChosenForFilenameFlag[listItem] = 1;
    } else {
      updatedChosenForFilenameFlag[listItem] = chosenForFilenameFlag[listItem] + 1
    }
  });

  console.log('New Top 3 Cards:')
  const topThreeCards = list.sort((listItem1, listItem2) => updatedChosenForFilenameFlag[listItem2] - updatedChosenForFilenameFlag[listItem1])
    .slice(0, 3)
    .map(listItem => `${listItem}${updatedChosenForFilenameFlag[listItem] ? `: ${updatedChosenForFilenameFlag[listItem]}` : ''}`);
  console.log(`[${topThreeCards.join(', ')}]`)

  chosen[filenameFlag] = updatedChosenForFilenameFlag;
  try {
    const fileHandle = await fsp.open(CHOSEN_FILEPATH, 'w');
    await fileHandle.writeFile(JSON.stringify(chosen));
    await fileHandle.close();
  } catch (e) {
    console.log('Error while updating chosen', e);
  }
}

init();