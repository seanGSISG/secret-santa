export interface DrawParticipant {
  id: number;
  secondhand_preference: number;
}

export interface DrawAssignment {
  giver_id: number;
  receiver_id: number;
}

function shuffle<T>(values: readonly T[]): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function addCycle<T extends { id: number }>(participants: readonly T[], assignments: DrawAssignment[]): void {
  const shuffled = shuffle(participants);
  for (let index = 0; index < shuffled.length; index++) {
    assignments.push({
      giver_id: shuffled[index].id,
      receiver_id: shuffled[(index + 1) % shuffled.length].id,
    });
  }
}

export function createDrawAssignments(participants: readonly DrawParticipant[]): DrawAssignment[] {
  const secondhandGroup = participants.filter((participant) => participant.secondhand_preference === 1);
  const newGiftGroup = participants.filter((participant) => participant.secondhand_preference !== 1);
  const assignments: DrawAssignment[] = [];

  if (secondhandGroup.length === 1 && newGiftGroup.length === 1) {
    addCycle(participants, assignments);
    return assignments;
  }

  const singletonGroup = secondhandGroup.length === 1
    ? secondhandGroup
    : newGiftGroup.length === 1
      ? newGiftGroup
      : null;

  if (singletonGroup) {
    const largerGroup = singletonGroup === secondhandGroup ? newGiftGroup : secondhandGroup;
    if (largerGroup.length === 2) {
      addCycle([...singletonGroup, ...largerGroup], assignments);
      return assignments;
    }

    const shuffledLargerGroup = shuffle(largerGroup);
    const singleton = singletonGroup[0];
    const crossPoolParticipant = shuffledLargerGroup[0];
    assignments.push(
      { giver_id: singleton.id, receiver_id: crossPoolParticipant.id },
      { giver_id: crossPoolParticipant.id, receiver_id: singleton.id },
    );
    addCycle(shuffledLargerGroup.slice(1), assignments);
    return assignments;
  }

  if (secondhandGroup.length > 0 && newGiftGroup.length > 0) {
    addCycle(secondhandGroup, assignments);
    addCycle(newGiftGroup, assignments);
    return assignments;
  }

  addCycle(participants, assignments);
  return assignments;
}
