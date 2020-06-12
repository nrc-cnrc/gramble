import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgxGrambleModule } from '@gramble/ngx-gramble';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgxGrambleModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
