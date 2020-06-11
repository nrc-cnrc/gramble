import { AfterViewInit, Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as jexcel from "jexcel";

@Component({
  selector: 'ngx-gramble',
  templateUrl: 'ngx-gramble.component.html',
  styles: [
  ]
})
export class NgxGrambleComponent implements AfterViewInit {
  @ViewChild("spreadsheet") spreadsheet: ElementRef;
  @Input() title = "GrambleSandbox";
  constructor() { }

  ngAfterViewInit() {
    jexcel(this.spreadsheet.nativeElement, {
      data: [[]],
      columns: [
        { type: "dropdown", width: 100, source: ["Y", "N"] },
        { type: "color", width: 100, render: "square" }
      ],
      minDimensions: [10, 10]
    });
  }

}
