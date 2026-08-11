export function createDefaultCharacter(id) {
  return {
    id,
    name: '',
    resources: [
      {
        id: 'armor',
        name: 'Armor',
        valueType: 'marked',
        marked: 0,
        max: 3,
        slotShape: 'shield',
      },
      {
        id: 'hp',
        name: 'HP',
        valueType: 'marked',
        marked: 0,
        max: 6,
        slotShape: 'square',
      },
      {
        id: 'stress',
        name: 'Stress',
        valueType: 'marked',
        marked: 0,
        max: 6,
        slotShape: 'square',
      },
      {
        id: 'hope',
        name: 'Hope',
        valueType: 'available',
        current: 2,
        max: 6,
        slotShape: 'diamond',
      },
    ],
    customResources: [],
  }
}

export const defaultTracker = {
  version: 2,
  activeCharacterId: 'character-1',
  characters: [createDefaultCharacter('character-1')],
}
