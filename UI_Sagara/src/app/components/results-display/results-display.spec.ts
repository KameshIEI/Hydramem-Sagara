import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsDisplay } from './results-display';

describe('ResultsDisplay', () => {
  let component: ResultsDisplay;
  let fixture: ComponentFixture<ResultsDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
