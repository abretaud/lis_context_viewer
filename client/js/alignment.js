'use strict'

/** The Alignment namespace. */
var Alignment = Alignment || {};


/**
  * Uses an accessor to compute a score by comparing the given elements.
  * @param {generic} a - The first element.
  * @param {generic} b - The second element.
  * @param {function} accessor - The accessor used to compare elements.
  * @param {object} scores - The contains the match and mismatch scores.
  * @return {int} - The computed score.
  */
Alignment._computeScore = function(a, b, accessor, scores) {
  a = accessor(a);
  b = accessor(b);
	if (a === b && a != '') {
		return scores.match;
	} return scores.mismatch;
}


/**
  * The Smith-Waterman algorithm.
  * @param {Array} sequence - The sequence to be aligned.
  * @param {Array} reference - The sequence to be aligned to.
  * @param {object} options - Optional parameters.
  * @return {Array} - The aligned sequences and score.
  */
Alignment.smithWaterman = function (sequence, reference, options) {

  /**
    * The alignment algorithm.
    * @param {Array} seq - The sequence being aligned to.
    * @param {Array} ref - The sequence being aligned.
    * @return {object} - The hidden iframe.
    */
  var align = function (seq, ref) {
    // initialize variables
    var rows = ref.length + 1,
        cols = seq.length + 1,
        a = Array.matrix(rows, cols, 0);
    var i = 0,
        j = 0;
    var choice = [0, 0, 0, 0];
    // populate the matrix
    var max = 0,
        iMax = 0,
        jMax = 0;
    for (i = 1; i < rows; i++) {
      for (j = 1; j < cols; j++) {
        choice[0] = 0;
        choice[1] = a[i - 1][j - 1] + Alignment._computeScore(
          ref[i - 1], seq[j - 1], options.accessor, options.scores
        );
        choice[2] = a[i - 1][j] + options.scores.gap;
        choice[3] = a[i][j - 1] + options.scores.gap;
        a[i][j] = choice.max();
        if (a[i][j] >= max) {
          max = a[i][j];
          iMax = i;
          jMax = j;
        }
      }
    }
    // traceback
    i = iMax;
    j = jMax;
    var diag, up, left,
        score = max,
        outRef = [],
        outSeq = [];
    while (i > 0 && j > 0) {
      score = a[i][j];
      if (score == 0) {
        break;
      }
      diag = a[i - 1][j - 1];
      up = a[i][j - 1];
      left = a[i - 1][j];
      if (score == diag + Alignment._computeScore(
        ref[i - 1], seq[j - 1], options.accessor, options.scores
      )) {
        outRef.unshift(clone(ref[i - 1]));
        outSeq.unshift(clone(seq[j - 1]));
        i -= 1;
        j -= 1;
      } else if (score == left + options.scores.gap) {
          outRef.unshift(clone(ref[i - 1]));
          outSeq.unshift(null);
          i -= 1;
      } else if (score == (up + options.scores.gap)) {
        outRef.unshift(null);
        outSeq.unshift(clone(seq[j - 1]));
        j -= 1;
		  } else {
      	break;
      }
    }
    while (j > 0) {
      outRef.unshift(null);
      outSeq.unshift(clone(seq[j - 1]));
      j -= 1;
    }
    return {sequence: outSeq, reference: outRef, score: max};
  }

  // parse optional parameters
  var options = options || {};
  options.accessor = options.accessor || function (e) { return e; };
  options.scores = options.scores || {};
  options.scores.match = options.scores.match || 5;
  options.scores.mismatch = options.scores.mismath = 0;
  options.scores.gap = options.scores.gap || -1;

  // perform forward and reverse alignments
	var forward = align(sequence, reference),
      reverseReference = reference.slice(0);
	reverseReference.reverse();
	var reverse = align(sequence, reverseReference);

  // output the highest scoring alignment
  var output;
	if (forward.score >= reverse.score) {
    output = forward
	} else {
    // clone each element in the array and flip the strand
    for (var i = 0; i < reverse.reference.length; i++) {
      if (reverse.reference[i] != null) {
        reverse.reference[i].strand = -1 * reverse.reference[i].strand;
      }
    }
    output = reverse;
  }
  return [[[output.sequence, output.reference]], output.score];
}


/** The Repeat algorithm by Durbin et al. */
Alignment.repeat = function (sequence, reference, options) {

  /**
    * The alignment algorithm.
    * @param {Array} seq - The sequence being aligned to.
    * @param {Array} ref - The sequence being aligned.
    * @return {object} - The hidden iframe.
    */
  var align = function (seq, ref) {
    // populate the matrix
    var rows = seq.length + 1,  // first item is at index 1
        cols = ref.length + 1,  // first item is at index 1
        a = Array.matrix(cols, rows, 0);
    var i; // cols
    var choice = [0, 0, 0, 0];
    for (i = 1; i < cols; i++) {  // first column is all 0's
      // handle unmatched regions and ends of matches
      var scores = a[i - 1].map(function (score, j) {
        return (j > 0) ? score - options.scores.threshold : score;
      });
      a[i][0] = scores.max();
      // handle starts of matches and extensions
      for (j = 1; j < rows; j++) {
        choice[0] = a[i][0];
        choice[1] = a[i - 1][j - 1] + Alignment._computeScore(
          ref[i - 1], seq[j - 1], options.accessor, options.scores
        );
        // adding because passed value should be negative
        choice[2] = a[i - 1][j] + options.scores.gap;
        choice[3] = a[i][j - 1] + options.scores.gap;
        a[i][j] = choice.max();
      }
    }
    var str = '';
    for (j = 0; j < rows; j++) {
      for (i = 0; i < cols; i++) {
        str += '\t' + a[i][j].toString();
      }
      str += '\n';
    }
    // traceback - make a track for each qualified path in the matrix   
    i = cols - 1;  // start in the extra cell
    var j = 0,  // rows
        alignments = [],
        index = -1,
        saving = false,
        totalScore = 0,
        subScore = 0,
        length = 0;
    while (!(i == 0 && j == 0)) {
      if (saving) {
        subScore += a[i][j];
      }
      if (j == 0) {
        if (saving && length < 2) {
          alignments.pop();
          index--;
          length = 0;
        } else if (saving) {
          totalScore += subScore;
        }
        saving = false;
        subScore = 0;
        var max = a[i].max();
        var jMax = a[i].lastIndexOf(max);
        // start a new alignment only if j is a match and the alignment's
        // score meets the threshold
        // TODO: why is the matrix not being used?
        if (jMax > 0 && i > 0 &&
        options.accessor(ref[i - 1]) === options.accessor(seq[jMax - 1]) &&
        max >= options.scores.threshold) {
          length = 1;
          saving = true;
          j = jMax;
          alignments.push([[], []]);
          index++;
          // pad seq with the genes not traversed by the alignment
          for (var k = seq.length - 1; k >= j; k--) {
            alignments[index][0].unshift(clone(seq[k]));
            alignments[index][1].unshift(null);
          }
          // add the starting match
          alignments[index][0].unshift(clone(seq[j - 1]));
          alignments[index][1].unshift(clone(ref[i - 1]));
        } else {
          // try starting an alignment in the next column
          i--;
        }
      } else if (i == 0) {
        j = 0;
      } else {
        // diag, up, left
        var scores = [a[i - 1][j - 1], a[i][j - 1], a[i - 1][j]];
        var max = scores.max();
        // stop alignment if a 0 cell was reached
        if (max == 0) {
          // add any missing genes to seq
          if (saving) {
            for (var k = j - 1; k > 0; k--) {
              alignments[index][0].unshift(clone(seq[k - 1]));
              alignments[index][1].unshift(null);
            }
          }
          // get ready for a new alignment
          i--;
          j = 0;
        } else {
          switch (scores.lastIndexOf(max)) {
            // diag
            case 0:
              j--;
              i--;
              // no alignments happen in the first row or column
              if (saving && j > 0 && i > 0) {
                alignments[index][0].unshift(clone(seq[j - 1]));
                alignments[index][1].unshift(clone(ref[i - 1]));
                length++;
              }
              break;
            // up
            case 1:
              j--;
              if (saving && j > 0) {
                alignments[index][0].unshift(clone(seq[j - 1]));
                alignments[index][1].unshift(null);
              }
              break;
            // left
            case 2:
              i--;
              if (saving && i > 0) {
                alignments[index][0].unshift(null);
                alignments[index][1].unshift(clone(ref[i - 1]));
              }
              break;
          }
        }
      }
    }
    if (saving && length < 2) {
      alignments.pop();
      index--;
      length = 0;
    } else if (saving) {
      totalScore += subScore;
    }
    return {alignments: alignments, score: totalScore};
  }

  // parse optional parameters
  var options = options || {};
  options.accessor = options.accessor || function (e) { return e; };
  options.scores = options.scores || {};
  options.scores.match = options.scores.match || 5;
  options.scores.mismatch = options.scores.mismath = 0;
  options.scores.gap = options.scores.gap || -1;
  options.scores.threshold = options.scores.threshold || 10;

  // perform forward and reverse alignments
	var forwards = align(sequence, reference),
      reverseReference = reference.slice(0);
	reverseReference.reverse();
	var reverses = align(sequence, reverseReference);

  // clone each object in the arrays and flip the strand for each selected gene
  var output = forwards.alignments;
  for (var i = 0; i < reverses.alignments.length; i++) {
    var a = reverses.alignments[i];
    for (var j = 0; j < a[1].length; j++) {
      if(a[1][j] != null) {
        a[1][j].strand = -1 * a[1][j].strand;
      }
    }
    output.push(a);
  }
	return [output, forwards.score + reverses.score];
}


/**
  * Merges alignments and sets coordinates for the context viewer.
  * @param {object} data - The context viewer to be given coordinates.
  * @param {object} selected - The data groups selected to be merged.
  * @param {Array} alignments - The alignments to be merged.
  */
Alignment.merge = function (data, selected, alignments) {
  // initialize variables
  var n = data.groups.length,
      length = data.groups[0].genes.length;
  // update the context data with the alignment
  for (var k = 0; k < alignments.length; k++) {
    var queryCount = 0,
        preQuery = 0,
        insertionCount = 0,
        alignment = alignments[k],
        index = n + k;
    data.groups.push(selected[k]);
    data.groups[index].genes = [];
    for (var i = 0; i < alignment[0].length; i++) {
      // keep track of how many selected genes come before the query genes
      if (alignment[0][i] == null && queryCount == 0) {
        preQuery++;
      // it must be an insertion
      } else if (alignment[0][i] == null) {
        // position the genes that come after the query genes
        if (queryCount >= length) {
          alignment[1][i].x = queryCount++;
          alignment[1][i].y = k + 1;
          data.groups[index].genes.push(alignment[1][i]);
        // track how many genes were inserted
        } else {
          insertionCount++;
        }
      // a deletion
      } else if (alignment[1][i] == null) {
        queryCount++;
      // an alignment
      } else {
        // position the genes that came before the query
        if (preQuery > 0) {
          for (var j = 0; j < preQuery; j++) {
            alignment[1][j].x = -1 * (preQuery - (j + 1));
            alignment[1][j].y = k + 1;
            data.groups[index].genes.push(alignment[1][j]);
          }
          preQuery = 0;
        // position the genes that go between query genes
        } else if (insertionCount > 0) {
          var step = 1.0 / (insertionCount + 1);
          for (var j = i - insertionCount; j < i; j++) {
            if (alignment[1][j] != null) {
              alignment[1][j].x = queryCount + (step * (i - j)) - 1;
              alignment[1][j].y = k + 1;
              data.groups[index].genes.push(alignment[1][j]);
            }
          }
          insertionCount = 0;
        }
        alignment[1][i].x = queryCount++;
        alignment[1][i].y = k + 1;
        data.groups[index].genes.push(alignment[1][i]);
      }
    }
  }
}