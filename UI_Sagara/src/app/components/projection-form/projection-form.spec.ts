import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectionFormComponent } from './projection-form';

describe('ProjectionFormComponent', () => {
  let component: ProjectionFormComponent;
  let fixture: ComponentFixture<ProjectionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
