import { TestBed } from '@angular/core/testing';

import { NgxGrambleService } from './ngx-gramble.service';

describe('NgxGrambleService', () => {
  let service: NgxGrambleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGrambleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
