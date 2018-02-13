/**
 * A message passing implementation of the Viterbi algorithm.
 * @param{MSAHMM} hmm - The HMM in which to find the most probable path.
 * @param{Array} seq - An ordered array of strings representing the sequence
 * for which a state path is to be computed.
 * return {Array} - An ordered array of state IDs describing the most sequence
 * path through the HMM.
 */
export function viterbi(hmm, seq) {
  const probs: any = {};
  const ptrs: any = {};
  for (const id in hmm.nodes) {
    if (hmm.nodes.hasOwnProperty(id)) {
      probs[id] = {};
      ptrs[id] = {};
    }
  }
  // a generic probability forward propagate function
  const propagate = (from, to, i) => {
    const currentProb = probs[to][i] || -Infinity;
    const currentPtr = ptrs[to][i]  || "";
    let candidate = probs[from][i - (+ !to.startsWith("d"))] +  // arithmetic HACK!
                      Math.log(hmm.getEdge(from, to));
    if (to.startsWith("m")) {
      candidate += Math.log(hmm.getNode(to).attr.emit(seq[i]));
    }
    if (candidate > currentProb ||
       (candidate === currentProb && from > currentPtr)) {
      probs[to][i] = candidate;
      ptrs[to][i]  = from;
    }
  };
  // recursively identifies the sequence's most probable path through the HMM
  const traceback = (id, i) => {
    if (id === "a") {
      return [id];
    }
    const ptr = ptrs[id][i];
    const path = traceback(ptr, i - (+ !id.startsWith("d")));  // arithmetic HACK!
    path.push(id);
    return path;
  };
  // seed start state
  const s = "a";
  probs[s][-1] = 0;  // = log(1)
  // propagate pre-sequence deletion probabilities
  let dj = "d0";
  propagate(s, dj, -1);
  for (let j = 1; j < hmm.numColumns; j++) {
    const djprev = dj;
    dj = "d" + j;
    propagate(djprev, dj, -1);
  }
  // compute one time transitions out of start state
  let ij = "i" + 0;
  const ilast = "i" + hmm.numColumns;
  propagate(s, ij, 0);
  let mj = "m" + 0;
  propagate(s, mj, 0);
  // propagate probabilities via Viterbi recurrence relation and message passing
  for (let i = 0; i < seq.length; i++) {
    for (let j = 0; j < hmm.numColumns; j++) {
      ij = "i" + j;
      dj = "d" + j;
      mj = "m" + j;
      // all transitions out of insertion j
      if (i > 0) {
        propagate(ij, ij, i);
        propagate(ij, mj, i);
      }
      propagate(ij, dj, i);
      if (j < hmm.numColumns - 1) {
        const djnext = "d" + (j + 1);
        const mjnext = "m" + (j + 1);
        // delete and merge transitions out of deletion j
        propagate(dj, djnext, i);
        propagate(dj, mjnext, i);
        // delete and merge transitions out of match j
        propagate(mj, djnext, i);
        propagate(mj, mjnext, i);
      }
      const ijnext = "i" + (j + 1);
      // insertion transition out of delete j
      propagate(dj, ijnext, i);
      // insertion transition out of match j
      propagate(mj, ijnext, i);
    }
    // insertion transition out of last transition
    if (i > 0) {
      propagate(ilast, ilast, i);
    }
  }
  // compute one time transitions out of start state
  const e = "z";
  propagate(dj, e, seq.length);
  propagate(ilast, e, seq.length);
  propagate(mj, e, seq.length);
  // follow the pointers from the end state to the start state to get the path
  const path = traceback(e, seq.length);
  path.probability = probs.z[seq.length];
  return path;
}
