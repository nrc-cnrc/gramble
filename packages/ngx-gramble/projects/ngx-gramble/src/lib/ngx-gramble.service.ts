import { Injectable } from '@angular/core';
import { ClientSideProject, fromURLAsync } from '@gramble/gramble';
import { from, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NgxGrambleService {
  gramble$ = new Subject<ClientSideProject>();
  constructor() { }
  loadFromURL(url: string) {
    from(fromURLAsync(url))
      .pipe(take(1))
      .subscribe((x) => this.gramble$.next(x));
  }
}
