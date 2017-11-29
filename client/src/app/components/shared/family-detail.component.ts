// Angular
import { Component,
         Input, 
         OnChanges,
         SimpleChanges } from '@angular/core';

// App
import { DetailsService } from '../../services/details.service';
import { Family }         from '../../models/family.model';
import { Gene }           from '../../models/gene.model';
import { MicroTracks }    from '../../models/micro-tracks.model';

@Component({
  moduleId: module.id.toString(),
  selector: 'family-detail',
  template: `
    <h4>{{family.name}}</h4>
    <p><a href="#/multi/{{geneList}}">View genes in multi-alignment view</a></p>
    <p *ngIf="linkablePhylo"><a href="/chado_gene_phylotree_v2?family={{family.name}}&gene_name={{geneList}}">View genes in phylogram</a></p>
    <!-- it's here when legumemine is ready for it...
    <p ><a href="https://intermine.legumefederation.org/legumemine/bag.do?type=Gene&text={{geneListFormatted}}">Create gene list in LegumeMine</a></p>
    -->
    <!-- or, for the posted version...
    <form action="https://intermine.legumefederation.org/legumemine/bag.do" method="POST">
         <input type="hidden" name="type" value="Gene"/>
         <input type="hidden" name="text" value="{{geneListFormatted}}"/>
         <input type="submit" name="submit" value="Create gene list in LegumeMine"/>
    </form>
    -->
    <p>Genes:</p>
    <ul>
      <li *ngFor="let gene of genes">
        {{gene.name}}: {{gene.fmin}} - {{gene.fmax}}
      </li>
    </ul>
  `,
  styles: [ '' ]
})

export class FamilyDetailComponent implements OnChanges {
  @Input() family: Family;
  @Input() tracks: MicroTracks;

  genes: Gene[];
  geneList: string;
  geneListFormatted: string;
  
  linkablePhylo: boolean;
  

  constructor(private _detailsService: DetailsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.family !== undefined && this.tracks !== undefined) {
      this.genes = this.tracks.groups.reduce((l, group) => {
        let genes = group.genes.filter(g => {
          return (g.family.length > 0 && this.family.id.includes(g.family)) ||
            g.family == this.family.id;
        });
        l.push.apply(l, genes);
        return l;
      }, []);
      this.linkablePhylo = this.family.id != "" && new Set(this.genes.map(g => {
        return g.family;
      })).size == 1;
      this.geneList = this.genes.map(x => x.name).join(',');
      this.geneListFormatted = this.genes.map(x => x.name).join('%0A');
    }
  }
}
