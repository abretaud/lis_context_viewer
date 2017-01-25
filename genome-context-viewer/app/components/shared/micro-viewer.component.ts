// Angular
import { AfterViewInit,
         Component,
         ElementRef,
         Input,
         OnChanges,
         OnDestroy,
         SimpleChanges,
         ViewChild }  from '@angular/core';
import { Observable } from 'rxjs/Observable';

// App
import { ContextMenuComponent } from './context-menu.component';
import { MicroTracks }          from '../../models/micro-tracks.model';

declare var d3: any;
declare var GCV: any;

@Component({
  moduleId: module.id,
  selector: 'micro-viewer',
  template: `
    <spinner [data]="tracks"></spinner>
    <div #microViewer>
      <context-menu #menu (saveImage)="saveImage()">
    </context-menu></div>
  `,
  styles: [ 'div { position: relative; }' ]
})

export class MicroViewerComponent implements AfterViewInit, OnChanges, OnDestroy {

  // inputs
  @Input() tracks: MicroTracks;
  @Input() colors: any;
  private _args;
  @Input()
  set args(args: Object) {
    this._args = Object.assign({}, args);
  }

  // view children

  @ViewChild('microViewer') el: ElementRef;
  @ViewChild('menu') contextMenu: ContextMenuComponent;

  // variables

  private _viewer = undefined;

  // Angular hooks

  ngAfterViewInit(): void {
    this._draw();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this._args.contextmenu = function (e, m) {
      this._showContextMenu(e, m);
    }.bind(this);
    this._args.click = function (e, m) {
      this._hideContextMenu(e, m);
    }.bind(this);
    this._draw();
  }

  ngOnDestroy(): void {
    this._destroy();
  }

  // private

  private _destroy(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
  }

  private _draw(): void {
    if (this.el !== undefined && this.tracks !== undefined) {
      this._destroy();
      this._viewer = new GCV.Viewer(
        this.el.nativeElement,
        this.colors,
        this.tracks,
        this._args
      );
    }
  }

  private _showContextMenu(e): void {
    e.preventDefault();
    this.contextMenu.show(e.layerX, e.layerY);
  }

  private _hideContextMenu(e): void {
    this.contextMenu.hide();
  }

  // public

  saveData(): void { }

  saveImage(): void {
    if (this._viewer !== undefined)
      this._viewer.save();
  }
}
