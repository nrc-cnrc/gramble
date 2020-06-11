import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxGrambleComponent } from './ngx-gramble.component';

describe('NgxGrambleComponent', () => {
  let component: NgxGrambleComponent;
  let fixture: ComponentFixture<NgxGrambleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgxGrambleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxGrambleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
