import { Component } from '@angular/core';
import { NgxGrambleService } from '@gramble/ngx-gramble';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ngx-gramble-examble';
  data$: Observable<{ [key: string]: string }[][]>;
  constructor(private grambleService: NgxGrambleService) {
    this.grambleService.loadFromURL('assets/test.csv')
    this.data$ = this.grambleService.gramble$.pipe(
      map(x => x.generate())
    )
  }
}
