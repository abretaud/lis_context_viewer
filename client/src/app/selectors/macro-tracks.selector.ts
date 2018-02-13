import { MacroTracks } from "../models/macro-tracks.model";

export const macroTracksSelector = (filter, order) => {
  return (state) => state
    .map(([macroTracks, filteredMicroTracks]) => {
      if (macroTracks !== undefined && filteredMicroTracks.groups.length > 0) {
        const query = filteredMicroTracks.groups[0];
        const chrs = filteredMicroTracks.groups.reduce((l, g, i) => {
          if (i > 0) {
            l.push(g.chromosome_name);
          }
          return l;
        }, []);
        const macro = Object.assign({}, macroTracks);
        macro.tracks = macro.tracks.filter((t) => {
          return (chrs.indexOf(t.chromosome) !== -1 && filter) || !filter;
        });
        macro.tracks.sort((a, b) => {
          const aIdx = chrs.indexOf(a.chromosome);
          const bIdx = chrs.indexOf(b.chromosome);
          if (!order || (aIdx === -1 && bIdx === -1)) {
            return a.chromosome.localeCompare(b.chromosome);
          } else if (aIdx === -1 && bIdx !== -1) {
            return Infinity;
          } else if (aIdx !== -1 && bIdx === -1) {
            return -Infinity;
          }
          return aIdx - bIdx;
        });
        return macro;
      }
      return macroTracks;
    });
};
